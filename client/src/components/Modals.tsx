import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, deleteProject, listProjects } from '../lib/api';
import { Modal, ModalBadge } from './Modal';
import { Button } from './Button';
import { Icon } from './Icon';
import { useToast } from './Toast';

const h2 = { margin: 0, fontSize: 22, fontWeight: 700 } as const;
const body = { margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--purple-10)' } as const;

export function ProjectsSheet({ currentId, onClose }: { currentId?: string; onClose: () => void }) {
  const nav = useNavigate();
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  return (
    <Modal label="My Projects" onClose={onClose}>
      <h2 style={{ ...h2, fontWeight: 600 }}>My Projects</h2>
      {projects.map((p) => {
        const active = p.id === currentId;
        return (
          <button key={p.id} type="button" onClick={() => { onClose(); nav(`/p/${p.id}/brief`); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 24, border: 0,
              cursor: 'pointer', textAlign: 'left', minHeight: 56,
              background: active ? 'var(--card-light)' : 'rgba(255,255,255,.08)', boxShadow: active ? 'inset 0 0 0 2px var(--green-30)' : 'none',
            }}>
            <Icon name={active ? 'folder_open' : 'folder'} size={22} color="var(--purple-15)" />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
              <span style={{ fontSize: 12, color: 'var(--purple-15)' }}>
                {p.status === 'complete' ? 'Completed' : active ? 'Open Now' : 'In Progress'} · {p.done} / {p.total} checkpoints
              </span>
            </span>
            {active && <Icon name="check_circle" size={22} fill color="var(--green-30)" />}
          </button>
        );
      })}
      <Button variant="secondary" leadingIcon="add" full onClick={() => { onClose(); nav('/new/1'); }}>New Project</Button>
    </Modal>
  );
}

export function DeleteModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const del = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); onClose(); nav('/'); toast('Project deleted.'); },
    onError: () => toast('Could not delete the project. Try again.'),
  });
  return (
    <Modal label="Delete This Project?" onClose={onClose}>
      <ModalBadge icon="delete" bg="#ffecec" color="var(--red)" />
      <h2 style={h2}>Delete This Project?</h2>
      <p style={body}>This removes this project's brief, uploads and feedback. Your other projects stay. It can't be undone.</p>
      <Button variant="danger" full disabled={del.isPending} onClick={() => del.mutate()}>Delete Project</Button>
      <Button variant="secondary" full onClick={onClose}>Keep My Project</Button>
    </Modal>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SaveModal({ mode, onClose }: { mode: 'save' | 'return'; onClose: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const ok = EMAIL_RE.test(email.trim());
  const send = useMutation({
    mutationFn: () => api('/auth/magic-link', { method: 'POST', json: { email: email.trim() } }),
    onSuccess: () => setSent(true),
    onError: () => toast('Could not send the link. Try again.'),
  });
  const title = mode === 'return' ? 'Continue On Another Device' : 'Save Your Progress';
  if (sent) {
    return (
      <Modal label="Check Your Inbox" onClose={onClose}>
        <ModalBadge icon="mark_email_read" bg="var(--green-10)" color="var(--green-50)" />
        <h2 style={h2}>Check Your Inbox</h2>
        <p style={body}>We sent a sign-in link to <b style={{ color: '#fff' }}>{email.trim()}</b>. It works once and expires in 15 minutes.</p>
        <button type="button" onClick={() => setSent(false)} style={{
          border: 0, background: 'none', padding: '12px 0', fontSize: 13, fontWeight: 800, letterSpacing: '.1em',
          textTransform: 'uppercase', color: 'var(--green-30)', cursor: 'pointer', alignSelf: 'center', minHeight: 44,
        }}>Use A Different Email</button>
      </Modal>
    );
  }
  return (
    <Modal label={title} onClose={onClose}>
      <ModalBadge icon="mail" bg="rgba(255,255,255,.14)" color="var(--purple-10)" />
      <h2 style={h2}>{title}</h2>
      <p style={body}>
        {mode === 'return'
          ? "Enter the email you saved your project with. We'll send you a sign-in link."
          : "Your project already saves on this device. Add your email and we'll send a link so you can come back from any device. We only use it for sign-in."}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); if (!ok) return toast('Enter a valid email address.'); send.mutate(); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="sr-only" htmlFor="save-email">Email</label>
        <input id="save-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
          style={{ height: 54, padding: '0 20px', borderRadius: 999, border: 0, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', fontSize: 16, color: '#fff' }} />
        <Button type="submit" full icon="send" softDisabled={!ok || send.isPending}>Send Link</Button>
      </form>
    </Modal>
  );
}
