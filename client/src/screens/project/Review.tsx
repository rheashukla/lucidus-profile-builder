import { Navigate, useNavigate } from 'react-router-dom';
import type { Level } from '@shared/types';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { usePage } from '../../components/ShellContext';
import { useViewport } from '../../lib/useViewport';
import { levelsOf } from '../../lib/projectState';
import { Card, LevelChip, Segs } from './common';
import { ProjectGate } from './ProjectGate';
import { useProject } from './useProject';
import s from './Project.module.css';

export function Review() {
  const { ps, id, isFetching } = useProject();
  const nav = useNavigate();
  const vp = useViewport();
  const back = () => nav(`/p/${id}/brief`);
  usePage('Final Review', { label: 'Back To Project', icon: 'arrow_forward', onClick: back });

  if (ps && !ps.review) {
    if (isFetching) return <p role="status" style={{ padding: 40, textAlign: 'center', color: 'var(--purple-15)' }}>Loading your review…</p>;
    return <Navigate to={`/p/${id}/checkpoints`} replace />;
  }
  const r = ps?.review;
  const firstLv = ps && r ? (ps.cps[0] ? levelsOf(ps.cps[0]) : r.criteria.map((c) => c.level)) as Level[] : [];
  const moved = r ? r.criteria.filter((c, ci) => c.level > firstLv[ci]).length : 0;
  const lists = r ? [
    { title: 'Improvements Across Checkpoints', icon: 'trending_up', color: 'var(--green-30)', items: r.improvements },
    { title: 'Where You Went Off-Brief', icon: 'alt_route', color: 'var(--orange-40)', items: r.deviations },
    { title: 'What Could Be Better', icon: 'lightbulb', color: 'var(--purple-15)', items: r.couldBeBetter },
  ] : [];
  return (
    <ProjectGate>
      {ps && r && (
        <section className={s.page}>
          <div className={s.col} style={{ gap: 16 }}>
            <div style={{
              position: 'relative', overflow: 'hidden', padding: 28, borderRadius: 32, display: 'flex', flexDirection: 'column', gap: 14,
              background: 'radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 70%, #fff, transparent), radial-gradient(360px 220px at 100% 0%, rgba(255,200,21,.32), transparent), var(--card-dark)',
            }}>
              <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px 0 8px', borderRadius: 999, background: 'rgba(255,200,21,.18)', color: 'var(--yellow-50)', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                <Icon name="emoji_events" size={18} fill />Project Complete
              </span>
              <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.02em', textWrap: 'balance' }}>{r.headline}</h1>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--purple-10)' }}>{r.story}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{moved}</span>
                <span style={{ fontSize: 18, color: 'var(--purple-15)' }}>/ 4 criteria moved up</span>
              </div>
              {!vp.mobile && (
                <div className={s.btnRow}>
                  <Button onClick={back}>Back To Project</Button>
                  <Button variant="secondary" leadingIcon="add" onClick={() => nav('/new/1')}>Start A New Project</Button>
                </div>
              )}
            </div>
            <h2 className={s.h2} style={{ fontWeight: 700, marginTop: 8 }}>Checkpoint 1 To Final</h2>
            {r.criteria.map((c, ci) => (
              <Card key={c.criterion} style={{ padding: 20, gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{c.criterion}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-label={`From ${firstLv[ci]} to ${c.level}`}>
                    <LevelChip level={firstLv[ci]} /><Icon name="arrow_forward" size={18} color="var(--purple-15)" /><LevelChip level={c.level} />
                  </span>
                </div>
                <Segs level={c.level} from={firstLv[ci]} height={8} />
                <span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--purple-5)' }}>{c.summary}</span>
              </Card>
            ))}
            {lists.filter((l) => l.items.length).map((l) => (
              <Card key={l.title} style={{ padding: 22 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 19, fontWeight: 700 }}><Icon name={l.icon} size={24} color={l.color} />{l.title}</h2>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {l.items.map((it) => (
                    <li key={it} style={{ display: 'flex', gap: 12, fontSize: 15, lineHeight: 1.55, color: 'var(--purple-5)' }}>
                      <span style={{ width: 6, height: 6, marginTop: 9, flexShrink: 0, borderRadius: 999, background: 'var(--purple-15)' }} />{it}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            {vp.mobile && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button type="button" className={s.textBtn} onClick={() => nav('/new/1')}>Start A New Project</button>
              </div>
            )}
          </div>
        </section>
      )}
    </ProjectGate>
  );
}
