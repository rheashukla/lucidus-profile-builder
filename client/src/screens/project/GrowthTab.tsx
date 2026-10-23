import { CRITERIA } from '@shared/data';
import type { Level } from '@shared/types';
import { Icon } from '../../components/Icon';
import { useViewport } from '../../lib/useViewport';
import { levelsOf, type PState } from '../../lib/projectState';
import { Bubble, LevelChip, Segs } from './common';
import s from './Project.module.css';

/** Growth is computed client-side from levels already stored with each feedback and the review. No AI. */
export function growthColumns(ps: PState, wide: boolean) {
  const cols = ps.cps.map((x) => ({ h: wide ? `Checkpoint ${x.n}` : `CP ${x.n}`, lv: levelsOf(x) as Level[] }));
  if (ps.review) cols.push({ h: 'Final', lv: ps.review.criteria.map((c) => c.level) });
  return cols;
}

export function growthSummary(cols: { lv: Level[] }[]) {
  if (cols.length < 2) return 'This is your starting point. Check in again to see what moves.';
  const first = cols[0], last = cols[cols.length - 1];
  const moved = CRITERIA.filter((_, ci) => last.lv[ci] > first.lv[ci]).length;
  return `${moved} of 4 criteria have moved up at least one level since Checkpoint 1.`;
}

export function GrowthTab({ ps }: { ps: PState }) {
  const { width } = useViewport();
  const cols = growthColumns(ps, width >= 820);
  if (!cols.length) {
    return <Bubble>After Checkpoint 1, you'll see your level on each rubric criterion and how it changes each time you check in.</Bubble>;
  }
  const first = cols[0], last = cols[cols.length - 1];
  return (
    <div className={s.stack}>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--purple-10)' }}>{growthSummary(cols)}</p>
      <div className={s.tiles}>
        {CRITERIA.map((c, ci) => {
          const l = last.lv[ci], delta = l - first.lv[ci];
          return (
            <div key={c} className={[s.card, s.cardLight, s.tile].join(' ')}>
              <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{c}</span>
              <Segs level={l} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <LevelChip level={l} />
                {cols.length > 1 && delta > 0 && <span className={s.up}><Icon name="arrow_upward" size={16} />+{delta}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className={[s.card, s.gridWrap].join(' ')}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px 12px', margin: '-12px -8px' }}>
          <caption className="sr-only">Level per criterion at each checkpoint</caption>
          <thead>
            <tr>
              <th scope="col" className={s.gridHead} style={{ textAlign: 'left', minWidth: 110 }}>Criterion</th>
              {cols.map((col) => <th key={col.h} scope="col" className={s.gridHead} style={{ textAlign: 'left' }}>{col.h}</th>)}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c, ci) => (
              <tr key={c}>
                <th scope="row" style={{ fontSize: 14, fontWeight: 700, textAlign: 'left' }}>{c}</th>
                {cols.map((col) => <td key={col.h}><LevelChip level={col.lv[ci]} short={width < 820} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
