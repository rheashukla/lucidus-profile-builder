import { LEVELS } from '@shared/data';
import type { Level } from '@shared/types';
import { LV } from '../../lib/palette';
import type { PState } from '../../lib/projectState';
import { LevelChip } from './common';
import s from './Project.module.css';

export function RubricTab({ ps }: { ps: PState }) {
  return (
    <div className={s.stack}>
      {ps.project.brief.rubric.map((r, ci) => {
        const cur = ps.latest ? ps.latest[ci] : -1;
        return (
          <section key={r.criterion} className={[s.card, s.rubricCard].join(' ')} aria-labelledby={`crit-${ci}`}>
            <div className={s.rubricHead}>
              <span className={s.num} aria-hidden="true">{ci + 1}</span>
              <h3 id={`crit-${ci}`} style={{ flex: 1, margin: 0, fontSize: 20, fontWeight: 600, minWidth: 160 }}>
                {r.criterion.charAt(0).toUpperCase() + r.criterion.slice(1)}
              </h3>
              {cur >= 0 && <LevelChip level={cur as Level} prefix="Now: " />}
            </div>
            <div className={s.levels}>
              {r.levels.map((t, li) => {
                const on = li === cur;
                return (
                  <div key={li} className={s.level} aria-current={on || undefined}
                    style={on ? { background: 'rgba(255,255,255,.18)', boxShadow: `inset 0 0 0 2px ${LV[li].light}` } : undefined}>
                    <span className={s.levelName} style={{ color: LV[li].light }}>{LEVELS[li]}{on ? ' · You are here' : ''}</span>
                    <span className={s.levelText}>{t}</span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
