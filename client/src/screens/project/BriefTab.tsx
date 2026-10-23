import { cut } from '@shared/text';
import { Icon } from '../../components/Icon';
import type { PState } from '../../lib/projectState';
import { Card, H2, SourceLink } from './common';
import s from './Project.module.css';

export function BriefTab({ ps }: { ps: PState }) {
  const b = ps.project.brief;
  const mode = ps.project.inputs.mode;
  const stepsLabel = { Beginner: 'Step By Step', Intermediate: 'Milestones', Advanced: 'Outcomes' }[mode];
  const per = Math.floor(200 / Math.max(b.deliverableList.length, 1));
  return (
    <div className={s.stack}>
      {b.lede.trim() && (
        <Card>
          <p className={s.p}>{cut(b.lede, 300)}</p>
          {b.ledeSource && <SourceLink url={b.ledeSource.url} publisher={b.ledeSource.publisher} />}
        </Card>
      )}
      <Card>
        <H2 icon="help" iconColor="var(--orange-40)" iconBg="rgba(255,255,255,.1)" size={20}>The Problem</H2>
        <p className={s.p} style={{ lineHeight: 1.5 }}>{cut(b.problem, 300)}</p>
        {mode === 'Intermediate' && b.problemOptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Potential Starting Points</h3>
            {b.problemOptions.map((o) => <div key={o} className={s.option}>{o}</div>)}
          </div>
        )}
      </Card>
      <Card>
        <H2 icon="diversity_3" iconColor="var(--green-30)">Who Benefits</H2>
        <p className={s.p}>{cut(b.beneficiary, 100)}</p>
      </Card>
      <Card>
        <H2 icon="construction" iconColor="var(--purple-10)">What You'll Make</H2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {b.deliverableList.map((d) => <li key={d} className={s.bullet}><span className={s.dot} /><span className={s.p}>{cut(d, per)}</span></li>)}
        </ul>
      </Card>
      {b.steps.length > 0 && (
        <Card style={{ gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <h2 className={s.h2}>{stepsLabel}</h2>
            <span className={s.pill}>{b.steps.length} steps</span>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {b.steps.map((x, k) => {
              const title = cut(x.title, 60);
              return (
                <li key={k} className={s.stepRow}>
                  <div className={s.stepRail}>
                    <span className={s.stepNum} aria-hidden="true">{k + 1}</span>
                    {k < b.steps.length - 1 && <span className={s.stepLine} />}
                  </div>
                  <div className={s.stepText}>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--purple-10)' }}>{cut(x.detail, 200 - title.length)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
      {b.research.length > 0 && (
        <Card>
          <h2 className={s.h2} style={{ fontWeight: 700 }}>Research Starting Points</h2>
          {b.research.map((r, k) => (
            <div key={k} className={s.source}>
              <Icon name="menu_book" size={22} color="var(--blue-40)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--purple-5)' }}>{r.title}</span>
                <SourceLink url={r.url} publisher={r.publisher} />
              </div>
            </div>
          ))}
        </Card>
      )}
      <Card>
        <H2 icon="school" iconColor="var(--green-50)" iconBg="var(--green-10)" size={19}>Why It Fits You</H2>
        <p className={s.p} style={{ fontSize: 14 }}>{cut(b.programFit, 200)}</p>
      </Card>
    </div>
  );
}
