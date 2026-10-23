import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { FileRef } from '@shared/types';
import { Button, IconButton } from '../../components/Button';
import { Busy, withMinDelay } from '../../components/Busy';
import { Icon } from '../../components/Icon';
import { usePage } from '../../components/ShellContext';
import { useToast } from '../../components/Toast';
import { saveDraft, submitWork, uploadFiles } from '../../lib/api';
import { useViewport } from '../../lib/useViewport';
import type { PState } from '../../lib/projectState';
import { Bubble, Card } from './common';
import { ProjectGate } from './ProjectGate';
import { useProject } from './useProject';
import s from './Project.module.css';
import u from './Upload.module.css';

const MIN_NOTE = 20;
const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = 'image/*,video/*,audio/*,application/pdf';

interface Item { id: string; name: string; type: string; size: number; pct: number; state: 'uploading' | 'done' | 'error'; ref?: FileRef; thumb?: string; abort?: AbortController; error?: string }

const fmtSize = (b: number) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const fileIcon = (t: string) => (t.startsWith('image/') ? 'image' : t.startsWith('video/') ? 'movie' : t.startsWith('audio/') ? 'graphic_eq' : t === 'application/pdf' ? 'picture_as_pdf' : 'description');

function UploadForm({ ps }: { ps: PState }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const vp = useViewport();
  const id = ps.project.id;
  const isFinal = ps.doneN >= ps.N;
  const n = isFinal ? 0 : ps.doneN + 1;
  const draft = ps.drafts.find((d) => d.n === n);
  const cp = ps.project.brief.checkpoints[ps.doneN];

  const [note, setNote] = useState(draft?.note ?? '');
  const [link, setLink] = useState(draft?.link ?? '');
  const [items, setItems] = useState<Item[]>(() => (draft?.files ?? []).map((f) => ({ id: f.key, name: f.name, type: f.type, size: f.size, pct: 100, state: 'done', ref: f })));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const noteLen = note.trim().length;
  const uploading = items.some((i) => i.state === 'uploading');
  const ready = noteLen >= MIN_NOTE && !uploading;
  const hint = noteLen < MIN_NOTE ? `${MIN_NOTE - noteLen} more characters to go` : uploading ? 'Wait for your files to finish uploading.' : 'Feedback will ask questions, not rewrite your work.';
  const refs = useMemo(() => items.filter((i) => i.state === 'done' && i.ref).map((i) => i.ref!), [items]);

  // Autosave the unsent upload so a refresh or another device keeps it.
  const refsKey = refs.map((r) => r.key).join('|');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { saveDraft(id, n, { note, link, files: refs }).catch(() => {}); }, 800);
    return () => clearTimeout(t);
  }, [note, link, refsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => items.forEach((i) => i.thumb && URL.revokeObjectURL(i.thumb)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const patchItem = (iid: string, p: Partial<Item>) => setItems((list) => list.map((x) => (x.id === iid ? { ...x, ...p } : x)));

  const addFiles = (list: File[]) => {
    const room = MAX_FILES - items.length;
    if (list.length > room) toast(`You can add up to ${MAX_FILES} files.`);
    const ok = list.slice(0, Math.max(0, room)).filter((f) => f.size <= MAX_BYTES);
    if (ok.length < Math.min(list.length, room)) toast('Some files are over 20 MB and were skipped.');
    for (const f of ok) {
      const iid = crypto.randomUUID();
      const abort = new AbortController();
      setItems((l) => [...l, { id: iid, name: f.name, type: f.type, size: f.size, pct: 0, state: 'uploading', abort, thumb: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined }]);
      uploadFiles([f], (pct) => patchItem(iid, { pct: Math.min(pct, 99) }), abort.signal)
        .then(([ref]) => patchItem(iid, { pct: 100, state: 'done', ref, abort: undefined }))
        .catch((e: Error) => { if (!abort.signal.aborted) patchItem(iid, { state: 'error', error: e.message }); });
    }
  };

  const remove = (it: Item) => {
    it.abort?.abort();
    if (it.thumb) URL.revokeObjectURL(it.thumb);
    setItems((l) => l.filter((x) => x.id !== it.id));
  };

  const submit = async () => {
    if (noteLen < MIN_NOTE) return toast('Add a short note about what you did (20+ characters).');
    if (uploading) return toast('Wait for your files to finish uploading.');
    setBusy(true);
    try {
      const r = await withMinDelay(submitWork(id, { note: note.trim(), link: link.trim(), files: refs }));
      // Navigate first so this form doesn't remount for the next checkpoint while data refreshes.
      if (r.kind === 'review') nav(`/p/${id}/review`, { replace: true });
      else nav(`/p/${id}/feedback/${r.submission.n}`, { replace: true });
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      if (r.fallback) toast(r.kind === 'review' ? 'AI is unavailable right now, so this is a sample review.' : 'AI is unavailable right now, so this is sample feedback.');
    } catch (e) {
      setBusy(false);
      toast((e as Error).message);
    }
  };

  usePage('Checkpoints', busy ? null : { label: isFinal ? 'Get Final Review' : 'Get Feedback', icon: 'arrow_forward', onClick: submit, softDisabled: !ready, hint });

  if (busy) return <Busy kind={isFinal ? 'final' : 'feedback'} />;

  const eyebrow = isFinal ? `Final Submission · Suggested ${ps.date(ps.tl.final)}` : `Checkpoint ${n} of ${ps.N} · Suggested ${ps.date(ps.tl.cps[ps.doneN])}`;
  const bring = isFinal ? [] : cp?.bring ?? [];
  return (
    <section className={s.page}>
      <div className={s.col}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!vp.mobile && <IconButton icon="arrow_back" label="Back to project" onClick={() => nav(`/p/${id}/checkpoints`)} />}
          <span className={s.meta}><Icon name="flag" size={18} color="var(--orange-40)" /><span>{eyebrow}</span></span>
        </div>
        <h1 className={u.h1}>{isFinal ? 'Submit Your Finished Work' : cp?.title}</h1>
        <Bubble>{isFinal ? 'Upload your finished work and reflect on how it changed. Your final review reads every checkpoint too.' : cp?.goal}</Bubble>

        {bring.length > 0 && (
          <Card>
            <h2 className={s.h2} style={{ fontSize: 19, fontWeight: 700 }}>What To Bring</h2>
            {bring.map((b) => <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--purple-5)' }}><Icon name="check_circle" size={20} color="var(--green-30)" />{b}</span>)}
          </Card>
        )}

        <Card>
          <h2 className={s.h2} style={{ fontSize: 19, fontWeight: 700 }}>Files</h2>
          <label className={u.drop}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}>
            <input ref={inputRef} type="file" multiple accept={ACCEPT} className="sr-only"
              onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
            <span className={u.dropIcon}><Icon name="upload_file" size={28} /></span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Add Files</span>
            <span style={{ fontSize: 13, color: 'var(--purple-15)' }}>Images, video, audio or PDF. Up to 20 MB each, 10 files.</span>
          </label>
          {items.length > 0 && (
            <ul className={u.files} aria-label="Files">
              {items.map((it) => (
                <li key={it.id} className={u.file}>
                  {it.thumb
                    ? <span className={u.thumb} style={{ backgroundImage: `url(${it.thumb})` }} />
                    : <span className={u.thumb}><Icon name={fileIcon(it.type)} size={22} color="var(--purple-10)" /></span>}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className={u.fileName}>{it.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--purple-15)', flexShrink: 0 }}>{it.state === 'error' ? 'Failed' : `${it.pct}%`}</span>
                    </div>
                    <span className={u.fileTrack} role="progressbar" aria-label={`Uploading ${it.name}`} aria-valuenow={it.pct} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ display: 'block', height: '100%', width: `${it.pct}%`, borderRadius: 999, transition: 'width 200ms linear',
                        background: it.state === 'error' ? 'var(--red)' : it.state === 'done' ? 'var(--green-40)' : 'linear-gradient(90deg, var(--purple-30), var(--blue-40))' }} />
                    </span>
                    <span style={{ fontSize: 12, color: it.state === 'error' ? '#ffb4b4' : 'var(--purple-15)' }}>
                      {it.state === 'error' ? it.error : `${it.state === 'done' ? 'Uploaded' : 'Uploading'} · ${fmtSize(it.size)}`}
                    </span>
                  </div>
                  {it.state === 'done' && <Icon name="check_circle" size={22} fill color="var(--green-30)" />}
                  <IconButton icon="close" label={`Remove ${it.name}`} size={20} onClick={() => remove(it)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className={s.h2} style={{ fontSize: 19, fontWeight: 700 }}><label htmlFor="up-link">Link <span style={{ fontWeight: 400, fontSize: 15, color: 'var(--purple-15)' }}>(optional)</span></label></h2>
          <div className={u.field}>
            <Icon name="link" size={22} color="var(--purple-15)" />
            <input id="up-link" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Google Doc, Drive folder, website, video" />
          </div>
        </Card>

        <Card style={{ gap: 10 }}>
          <h2 className={s.h2} style={{ fontSize: 19, fontWeight: 700 }}><label htmlFor="up-note">Your Note</label></h2>
          <p id="up-note-label" style={{ margin: 0, fontSize: 14, color: 'var(--purple-15)' }}>
            {isFinal ? 'What are you most proud of, and what would you do differently?' : 'What did you do, and what changed since last time?'}
          </p>
          <textarea id="up-note" className={u.note} rows={6} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby="up-note-label up-note-hint"
            placeholder={isFinal ? 'Tell the story of your project in your own words.' : 'Describe what you made, what you tried, and anything you are unsure about.'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={u.fileTrack} style={{ flex: 1 }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (noteLen / MIN_NOTE) * 100)}%`, borderRadius: 999, background: noteLen >= MIN_NOTE ? 'var(--green-40)' : 'var(--orange-40)', transition: 'width 200ms' }} />
            </span>
            <span id="up-note-hint" style={{ fontSize: 13, color: 'var(--purple-15)' }} aria-live="polite">{hint}</span>
          </div>
        </Card>

        {!vp.mobile && (
          <div className={s.btnRow}>
            <Button icon="arrow_forward" softDisabled={!ready} onClick={submit}>{isFinal ? 'Get Final Review' : 'Get Feedback'}</Button>
            <Button variant="secondary" onClick={() => nav(`/p/${id}/checkpoints`)}>Cancel</Button>
          </div>
        )}
      </div>
      {!vp.mobile && (
        <aside className={s.aside}>
          <div className={s.card} style={{ padding: 22, gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>How Feedback Works</h2>
            {[['checklist', 'Judged against your four rubric criteria.'], ['help', 'Asks questions. It never rewrites your work.'], ['draw', 'Drafts and messy work count. Process matters.'], ['visibility', 'Your note, link and file names are read, plus up to 5 images or PDFs.']].map(([icon, text]) => (
              <span key={icon} style={{ display: 'flex', gap: 12, fontSize: 14, lineHeight: 1.5, color: 'var(--purple-10)' }}><Icon name={icon} size={22} />{text}</span>
            ))}
          </div>
        </aside>
      )}
    </section>
  );
}

export function Upload() {
  const { ps, id } = useProject();
  return (
    <ProjectGate>
      {ps && (ps.finalDone ? <Navigate to={`/p/${id}/review`} replace /> : <UploadForm key={`${ps.doneN}`} ps={ps} />)}
    </ProjectGate>
  );
}
