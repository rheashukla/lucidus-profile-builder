import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ProjectSummary } from '@shared/types';
import { Button, IconButton } from '../components/Button';
import { Icon } from '../components/Icon';
import { usePage, useShell } from '../components/ShellContext';
import { useCurrentProject } from '../lib/useCurrentProject';
import { getMe } from '../lib/api';
import { useToast } from '../components/Toast';
import { useViewport } from '../lib/useViewport';
import s from './Hub.module.css';

const HOW = [
  ['edit_note', 'Tell us about you', 'Seven short questions: subjects, superpowers, career, college, time, a global goal and how much guidance you want.', 'var(--purple-30)', 'var(--purple-10)'],
  ['description', 'Get your brief', 'A project brief and rubric built from your answers, tied to a real UN goal.', 'var(--orange-40)', 'var(--orange-10)'],
  ['flag', 'Check in 2–3 times', 'Upload progress at each checkpoint and get feedback against your rubric.', 'var(--green-50)', 'var(--green-10)'],
] as const;

function ProjectCard({ p, open }: { p: ProjectSummary; open: boolean }) {
  const nav = useNavigate();
  const { openModal } = useShell();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const done = p.status === 'complete';
  const pct = Math.round((p.done / p.total) * 100);
  const go = () => nav(`/p/${p.id}/brief`);

  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [menu]);

  return (
    <div className={s.card} onClick={go}>
      <div className={s.cardTop}>
        <span className={[s.status, done ? s.statusDone : open ? s.statusOpen : ''].join(' ')}>
          <Icon name={done ? 'check_circle' : open ? 'radio_button_checked' : 'pending'} size={15} fill />
          {done ? 'Completed' : open ? 'Open Now' : 'In Progress'}
        </span>
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
          <IconButton icon="more_horiz" label="Project options" aria-expanded={menu} aria-haspopup="menu"
            style={{ background: 'rgba(255,255,255,.12)', color: 'var(--purple-10)' }} onClick={() => setMenu((m) => !m)} />
          {menu && (
            <div className={s.menu} role="menu">
              <button type="button" role="menuitem" className={s.menuItem} autoFocus
                onClick={() => { setMenu(false); openModal({ kind: 'delete', id: p.id }); }}>
                <Icon name="delete" size={20} />Delete Project
              </button>
            </div>
          )}
        </div>
      </div>
      <h3 className={s.cardTitle}>{p.title}</h3>
      <div className={s.meta}>
        {p.projectType && <span className={s.typeChip}><Icon name="category" size={15} color="var(--purple-10)" />{p.projectType}</span>}
        <span>{p.weeks} {p.weeks > 1 ? 'weeks' : 'week'} · {p.mode}</span>
      </div>
      <div className={s.progress}>
        <div className={s.progRow}><span>Checkpoints</span><span className={s.frac}>{p.done} / {p.total}</span></div>
        <span className={s.track}><span className={s.bar} style={{ width: `${Math.max(4, pct)}%` }} /></span>
      </div>
      <Button small icon="arrow_forward" className={s.cardBtn} onClick={(e) => { e.stopPropagation(); go(); }}>
        {done ? 'View Project' : 'Continue'}
      </Button>
    </div>
  );
}

const SIGNIN_MSG: Record<string, string> = {
  ok: 'Saved. You can sign in from any device for 90 days.',
  used: 'That link was already used. Send yourself a new one.',
  expired: 'That link expired. Send yourself a new one.',
  invalid: "That link didn't work. Send yourself a new one.",
};

/** Shows the result of a magic-link sign-in (the server redirects to /?signin=…). */
function useSignInResult() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  useEffect(() => {
    const r = params.get('signin');
    if (!r) return;
    const merged = Number(params.get('merged') || 0);
    toast(r === 'ok' && merged ? `Welcome back. ${merged} project${merged > 1 ? 's were' : ' was'} added to your account.` : SIGNIN_MSG[r] || SIGNIN_MSG.invalid);
    qc.invalidateQueries();
    setParams({}, { replace: true });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function Hub() {
  useSignInResult();
  const { openModal } = useShell();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const nav = useNavigate();
  const vp = useViewport();
  const { projects, current } = useCurrentProject();
  const has = projects.length > 0;
  const resume = projects.find((p) => p.id === current?.id && p.status !== 'complete') || projects.find((p) => p.status !== 'complete') || current;
  const cta = has && resume
    ? { label: 'Resume My Project', onClick: () => nav(`/p/${resume.id}/brief`) }
    : { label: 'Start My Project', onClick: () => nav('/new/1') };
  const guide = has ? "You're so close. Pick up where you left off." : "Hi! Seven quick questions and you'll have a project built around you.";

  usePage('Portfolio Builder', { label: cta.label, icon: 'arrow_forward', onClick: cta.onClick });

  return (
    <section className={s.page}>
      <div className={s.col}>
        <div className={s.hero}>
          <span className={s.eyebrow}><Icon name="auto_awesome" size={16} />Portfolio Project</span>
          <h1 style={{ fontWeight: 600 }}>Build A Project That Proves Your Fit</h1>
          <p className={s.heroText}>Tell us what you love and where you want to study. You'll get a 1–4 week project brief, a clear rubric, and feedback at every checkpoint.</p>
          <div className={s.chips}>
            <span className={s.chip}><Icon name="schedule" size={18} />1–4 weeks</span>
            <span className={s.chip}><Icon name="flag" size={18} />2–3 checkpoints</span>
            <span className={s.chip}><Icon name="tune" size={18} />3 guidance modes</span>
          </div>
          <p className={s.guide}>{guide}</p>
          <div className={s.ctaRow}>
            {!vp.mobile && <Button icon="arrow_forward" onClick={cta.onClick}>{cta.label}</Button>}
            {me && !me.user.email && (
              <button type="button" className={s.textLink} onClick={() => openModal({ kind: 'return' })}>Continue On Another Device</button>
            )}
          </div>
        </div>

        {has && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className={s.sectionHead}>
              <h2 className={s.h2}>My Projects</h2>
              <span className={s.count}>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className={s.grid}>
              {projects.map((p) => <ProjectCard key={p.id} p={p} open={p.id === current?.id} />)}
              <button type="button" className={s.newTile} onClick={() => nav('/new/1')}>
                <span className={s.newPlus}><Icon name="add" size={28} /></span>
                <span className={s.newTitle}>New Project</span>
                <span className={s.newSub}>Start another brief from scratch.</span>
              </button>
            </div>
          </div>
        )}

        <div className={s.how}>
          <h2 className={s.h2}>How It Works</h2>
          <p className={s.howSub}>Three stages, at your own pace.</p>
          {HOW.map(([icon, title, text, bg, ring], k) => (
            <div key={title} className={s.howRow}>
              <div className={s.howRail}>
                <span className={s.howNode} style={{ background: bg, boxShadow: `0 0 0 4px ${ring}` }}><Icon name={icon} size={22} /></span>
                {k < HOW.length - 1 && <span className={s.howLine} />}
              </div>
              <div className={s.howText}><span className={s.howTitle}>{title}</span><span className={s.howBody}>{text}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
