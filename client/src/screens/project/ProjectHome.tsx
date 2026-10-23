import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { SDGS } from '@shared/data';
import { Button, IconButton } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { usePage, useShell } from '../../components/ShellContext';
import { useViewport } from '../../lib/useViewport';
import type { PState } from '../../lib/projectState';
import { BriefTab } from './BriefTab';
import { RubricTab } from './RubricTab';
import { CheckpointsTab } from './CheckpointsTab';
import { GrowthTab, growthColumns } from './GrowthTab';
import { useProject } from './useProject';
import { ProjectGate } from './ProjectGate';
import s from './Project.module.css';

const TABS = [['brief', 'Brief'], ['rubric', 'Rubric'], ['checkpoints', 'Checkpoints'], ['growth', 'Growth']] as const;
type Tab = (typeof TABS)[number][0];

function ProjectMenu({ id }: { id: string }) {
  const { openModal } = useShell();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <IconButton icon="more_horiz" label="Project options" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className={s.menu} role="menu">
          <button type="button" role="menuitem" autoFocus className={s.menuItem} onClick={() => { setOpen(false); openModal({ kind: 'delete', id }); }}>
            <Icon name="delete" size={20} />Delete Project
          </button>
        </div>
      )}
    </div>
  );
}

export function HeaderCard({ ps, tab }: { ps: PState; tab: Tab | null }) {
  const vp = useViewport();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const p = ps.project, b = p.brief;
  const expanded = !vp.mobile || open;
  const meta = [
    ...(b.projectType ? [{ icon: 'category', label: b.projectType }] : []),
    { icon: 'signal_cellular_alt', label: p.inputs.mode },
    { icon: 'schedule', label: `${p.inputs.weeks} ${p.inputs.weeks > 1 ? 'weeks' : 'week'}` },
    { icon: 'flag', label: `${ps.N} checkpoints` },
    ...p.inputs.sdgs.map((n) => ({ icon: 'public', label: `SDG ${n} · ${SDGS[n - 1]}` })),
  ];
  const secondary = tab === 'rubric'
    ? { label: 'Read Brief', icon: 'menu_book', to: 'brief' }
    : { label: 'View Rubric', icon: 'checklist', to: 'rubric' };
  const tabTitle = tab ? TABS.find(([t]) => t === tab)![1] : 'Brief';
  return (
    <div className={[s.card, s.head].join(' ')}>
      <div className={s.headTop}>
        <span className={s.eyebrow}>{vp.mobile ? `Project · ${tabTitle}` : 'Your Project Brief'}</span>
        {vp.mobile && (
          <button type="button" className={s.toggle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span>{open ? 'Less' : 'Details'}</span>
            <Icon name="expand_more" size={20} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms var(--ease)' }} />
          </button>
        )}
        <ProjectMenu id={p.id} />
      </div>
      <h1 className={s.title} style={vp.mobile && !open ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}>{b.title}</h1>
      {expanded && (
        <>
          <p className={s.p} style={{ lineHeight: 1.55, color: 'var(--purple-10)' }}>{b.oneLiner}</p>
          <ul className={s.metaRow} style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Project details">
            {meta.map((m) => <li key={m.label} className={s.meta}><Icon name={m.icon} size={18} color="var(--purple-10)" /><span>{m.label}</span></li>)}
          </ul>
        </>
      )}
      <div className={[s.prog, vp.mobile && !open && s.progFlat].filter(Boolean).join(' ')}>
        <div className={s.progRow}><span>Project Progress</span><span className={s.progFrac}>{ps.doneSteps} / {ps.total} · {ps.pct}%</span></div>
        <span className={s.track} role="progressbar" aria-label="Project progress" aria-valuenow={ps.pct} aria-valuemin={0} aria-valuemax={100}>
          <span className={s.bar} style={{ width: `${Math.max(3, ps.pct)}%` }} />
        </span>
      </div>
      {!vp.mobile && (
        <div className={s.btnRow}>
          <Button icon={ps.nextUp.icon} onClick={() => nav(`/p/${p.id}/${ps.nextUp.to}`)}>{ps.nextUp.cta}</Button>
          <Button variant="secondary" leadingIcon={secondary.icon} onClick={() => nav(`/p/${p.id}/${secondary.to}`)}>{secondary.label}</Button>
        </div>
      )}
    </div>
  );
}

function Aside({ ps }: { ps: PState }) {
  const nav = useNavigate();
  const base = `/p/${ps.project.id}`;
  const rated = ps.cps.filter((x) => x.rating).length;
  const journey = [
    ...ps.project.brief.checkpoints.map((c, k) => ({ k, title: `Checkpoint ${k + 1}`, sub: c.title, day: ps.tl.cps[k], view: `${base}/feedback/${k + 1}` })),
    { k: ps.N, title: 'Final Submission', sub: 'Your finished work', day: ps.tl.final, view: `${base}/review` },
  ];
  return (
    <aside className={s.aside} aria-label="Project overview">
      <div className={s.card} style={{ padding: 10, gap: 0 }}>
        <div className={s.nextHero}>
          <img src="/logomark.svg" alt="" width={72} height={72} style={{ position: 'absolute', right: 12, top: 10 }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className={s.cpEyebrow}>{ps.nextUp.eyebrow}</span>
            <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>{ps.nextUp.title}</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 10px 10px' }}>
          {ps.nextUp.day !== null && (
            <span className={s.meta} style={{ alignSelf: 'flex-start' }}><Icon name="event" size={18} color="var(--purple-10)" /><span>Suggested {ps.date(ps.nextUp.day)} · Day {ps.nextUp.day}</span></span>
          )}
          <Button full icon={ps.nextUp.icon} onClick={() => nav(`${base}/${ps.nextUp.to}`)}>{ps.nextUp.cta}</Button>
        </div>
      </div>
      <div className={s.card} style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Your Progress</h2>
          <Link to={`${base}/growth`} className={s.textBtn}>View All</Link>
        </div>
        {[['Checkpoints done', `${ps.doneN} / ${ps.N}`], ['Feedback rated', String(rated)], ['Final review', ps.review ? 'Done' : 'Not yet'], ['XP', String(ps.project.xp)]].map(([k, v]) => (
          <div key={k} className={s.statRow}><span style={{ color: 'var(--purple-10)' }}>{k}</span><span className={s.statVal}>{v}</span></div>
        ))}
      </div>
      <div className={s.card} style={{ padding: 20, gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Your Journey</h2>
          <Link to={`${base}/checkpoints`} className={s.textBtn}>View All</Link>
        </div>
        {journey.map((j, idx) => {
          const st = ps.status(j.k);
          const go = st === 'done' ? j.view : st === 'current' ? `${base}/upload` : null;
          return (
            <div key={j.k} style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button type="button" aria-label={`${j.title}: ${st === 'done' ? 'complete' : st === 'current' ? 'start' : 'locked'}`} disabled={!go}
                  className={[s.node, st === 'done' && s.nodeDone, st === 'current' && s.nodeCur].filter(Boolean).join(' ')}
                  style={{ border: 0, padding: 0, cursor: go ? 'pointer' : 'default' }} onClick={() => go && nav(go)}>
                  <Icon name={st === 'done' ? 'check' : st === 'current' ? 'play_arrow' : 'lock'} size={20} fill />
                </button>
                {idx < journey.length - 1 && <span className={[s.line, st === 'done' && s.lineDone].filter(Boolean).join(' ')} style={{ margin: '6px 0' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0 18px' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{j.title}</span>
                <span style={{ fontSize: 13, color: 'var(--purple-10)', lineHeight: 1.4 }}>{j.sub}</span>
                <span style={{ fontSize: 12, color: 'var(--purple-15)' }}>Suggested {ps.date(j.day)} · Day {j.day}</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function TabRow({ ps, tab }: { ps: PState; tab: Tab }) {
  const cols = growthColumns(ps, true).length;
  const badges: Partial<Record<Tab, string>> = {
    checkpoints: ps.finalDone ? '' : String(ps.total - ps.doneSteps),
    growth: cols ? String(cols) : '',
  };
  return (
    <nav className={s.tabRow} aria-label="Project sections">
      {TABS.map(([id, label]) => (
        <Link key={id} to={`/p/${ps.project.id}/${id}`} className={[s.tab, tab === id && s.tabOn].filter(Boolean).join(' ')} aria-current={tab === id ? 'page' : undefined}>
          <span>{label}</span>{badges[id] && <span className={s.badge}>{badges[id]}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function ProjectHome() {
  const { tab } = useParams();
  const vp = useViewport();
  const nav = useNavigate();
  const { ps, id } = useProject();
  const t = (TABS.find(([x]) => x === tab)?.[0] ?? null) as Tab | null;
  const title = t ? TABS.find(([x]) => x === t)![1] : '';
  usePage(title, ps ? { label: ps.nextUp.cta, icon: ps.nextUp.icon, onClick: () => nav(`/p/${id}/${ps.nextUp.to}`) } : null);

  if (!t) return <Navigate to={`/p/${id}/brief`} replace />;
  return (
    <ProjectGate>
      {ps && (
        <section className={s.page}>
          <div className={s.col}>
            <HeaderCard ps={ps} tab={t} />
            {vp.tabRow && <TabRow ps={ps} tab={t} />}
            {t === 'brief' && <BriefTab ps={ps} />}
            {t === 'rubric' && <RubricTab ps={ps} />}
            {t === 'checkpoints' && <CheckpointsTab ps={ps} />}
            {t === 'growth' && <GrowthTab ps={ps} />}
          </div>
          {!vp.mobile && <Aside ps={ps} />}
        </section>
      )}
    </ProjectGate>
  );
}
