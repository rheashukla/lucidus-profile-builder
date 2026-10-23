import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import type { PState } from '../../lib/projectState';
import s from './Project.module.css';

const STATUS = {
  done: { label: 'Complete', dot: 'var(--green-50)', bg: 'linear-gradient(90deg, var(--green-50), var(--green-40))' },
  current: { label: 'In Progress', dot: 'var(--orange-40)', bg: 'linear-gradient(180deg, #5E35F1 0%, #24A57F 100%)' },
  locked: { label: 'Locked', dot: 'var(--purple-15)', bg: 'linear-gradient(90deg, rgba(255,255,255,.14), rgba(255,255,255,.06))' },
} as const;

export function CheckpointsTab({ ps }: { ps: PState }) {
  const nav = useNavigate();
  const base = `/p/${ps.project.id}`;
  const items = [
    ...ps.project.brief.checkpoints.map((c, k) => ({
      k, eyebrow: `Checkpoint ${k + 1} · Suggested Day ${ps.tl.cps[k]}`, date: ps.date(ps.tl.cps[k]), title: c.title, goal: c.goal, bring: c.bring,
      view: `${base}/feedback/${k + 1}`, viewLabel: 'View Feedback',
    })),
    {
      k: ps.N, eyebrow: `Final · Suggested Day ${ps.tl.final}`, date: ps.date(ps.tl.final), title: 'Final Submission',
      goal: 'Submit your finished work and a short reflection. Your final review compares every checkpoint with this.',
      bring: ['Finished work', 'Reflection'], view: `${base}/review`, viewLabel: 'View Final Review',
    },
  ];
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Checkpoints">
      {items.map((it, idx) => {
        const st = ps.status(it.k);
        const S = STATUS[st];
        const isFinal = it.k === ps.N;
        const prevLabel = idx === 0 ? 'your brief' : isFinal ? 'your last checkpoint' : `Checkpoint ${idx}`;
        return (
          <li key={it.k} className={s.journeyRow}>
            <div className={s.rail} aria-hidden="true">
              <span className={[s.node, st === 'done' && s.nodeDone, st === 'current' && s.nodeCur].filter(Boolean).join(' ')}>
                <Icon name={st === 'done' ? 'check' : st === 'current' ? (isFinal ? 'flag' : 'play_arrow') : isFinal ? 'flag' : 'lock'} size={20} fill />
              </span>
              {idx < items.length - 1 && <span className={[s.line, st === 'done' && s.lineDone].filter(Boolean).join(' ')} />}
            </div>
            <div className={[s.cpCard, st === 'current' && s.cpCur, st === 'locked' && s.cpLocked].filter(Boolean).join(' ')}>
              <div className={s.cpTop}>
                <span className={s.cpEyebrow}>{it.eyebrow}</span>
                <span className={s.status} style={{ background: S.bg }}><span className={s.statusDot} style={{ background: S.dot }} />{S.label}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{it.title}</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--purple-10)' }}>{it.goal}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--purple-15)' }}><Icon name="event" size={16} />Suggested {it.date}</span>
              {it.bring.length > 0 && st !== 'done' && (
                <div className={s.tags} aria-label="What to bring">
                  {it.bring.map((b) => <span key={b} className={s.tag}><Icon name="attach_file" size={16} color="var(--purple-15)" />{b}</span>)}
                </div>
              )}
              {st === 'current' && (
                <Button icon={isFinal ? 'flag' : 'upload'} style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => nav(`${base}/upload`)}>Start</Button>
              )}
              {st === 'done' && (
                <Button variant="secondary" small leadingIcon="menu_book" style={{ alignSelf: 'flex-start' }} onClick={() => nav(it.view)}>{it.viewLabel}</Button>
              )}
              {st === 'locked' && <span className={s.lockNote}><Icon name="lock" size={18} />Unlocks after {prevLabel}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
