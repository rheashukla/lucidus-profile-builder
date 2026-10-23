import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LEVELS } from '@shared/data';
import type { Level, ProjectDetail } from '@shared/types';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { usePage } from '../../components/ShellContext';
import { useToast } from '../../components/Toast';
import { rateSubmission } from '../../lib/api';
import { useViewport } from '../../lib/useViewport';
import { Bubble, Card, LevelChip, Segs } from './common';
import { ProjectGate } from './ProjectGate';
import { useProject } from './useProject';
import s from './Project.module.css';
import u from './Upload.module.css';

export function Feedback() {
  const { n: nParam } = useParams();
  const { ps, id, isFetching } = useProject();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const vp = useViewport();
  const n = Number(nParam);
  const sub = ps?.cps.find((x) => x.n === n);
  const prev = ps?.cps.find((x) => x.n === n - 1);
  const isLatest = !!ps && n === ps.doneN;
  const cta = isLatest && !ps!.finalDone && ps!.doneN >= ps!.N ? 'Back To Project: Final Up Next' : 'Back To Project';
  const back = () => nav(`/p/${id}/growth`);

  const rate = useMutation({
    mutationFn: (r: number) => rateSubmission(sub!.id, r),
    onSuccess: ({ submission, xp }) => {
      qc.setQueryData<ProjectDetail>(['project', id], (d) => d && ({
        ...d, project: { ...d.project, xp }, submissions: d.submissions.map((x) => (x.id === submission.id ? submission : x)),
      }));
      toast('Thanks. This helps us improve feedback.');
    },
    onError: (e: Error) => toast(e.message),
  });

  usePage('Feedback', { label: cta, icon: 'arrow_forward', onClick: back });

  if (ps && !sub) {
    if (isFetching) return <p role="status" style={{ padding: 40, textAlign: 'center', color: 'var(--purple-15)' }}>Loading your feedback…</p>;
    return <Navigate to={`/p/${id}/checkpoints`} replace />;
  }
  const fb = sub?.feedback;
  const avg = fb ? Math.round(fb.criteria.reduce((a, c) => a + c.level, 0) / 4) : 0;
  const rating = sub?.rating ?? null;
  return (
    <ProjectGate>
      {ps && sub && fb && (
        <section className={s.page}>
          <div className={s.col} style={{ gap: 16 }}>
            <span className={s.meta} style={{ alignSelf: 'flex-start' }}><Icon name="auto_awesome" size={18} color="var(--purple-10)" /><span>Checkpoint {n} Feedback</span></span>
            <h1 className={u.h1}>Here's Where You Are</h1>
            <Bubble>{fb.summary}</Bubble>
            <span style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, padding: '6px 12px 6px 8px', borderRadius: 999, background: 'var(--green-10)', fontSize: 13, fontWeight: 800, color: 'var(--green-60)' }}>
              <Icon name="insights" size={18} />Mostly {LEVELS[avg]}
            </span>
            {fb.criteria.map((c, ci) => {
              const pl = prev?.feedback?.criteria[ci]?.level;
              return (
                <Card key={c.criterion} style={{ padding: 22, gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 className={s.h2} style={{ flex: 1, fontSize: 19, fontWeight: 700, minWidth: 160 }}>{c.criterion}</h2>
                    <LevelChip level={c.level} />
                    {pl !== undefined && c.level > pl && <span className={s.up}><Icon name="arrow_upward" size={16} />Up from {LEVELS[pl]}</span>}
                  </div>
                  <Segs level={c.level as Level} height={8} />
                  <div style={{ display: 'flex', gap: 12 }}><Icon name="visibility" size={22} color="var(--purple-15)" /><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>What we saw</span><span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--purple-5)' }}>{c.evidence}</span></div></div>
                  <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 20, background: 'rgba(255,255,255,.1)' }}><Icon name="arrow_forward" size={22} color="var(--green-30)" /><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>Next step</span><span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--purple-5)' }}>{c.next}</span></div></div>
                  <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 20, background: 'rgba(255,255,255,.14)' }}><Icon name="help" size={22} color="var(--purple-10)" /><div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>Think about</span><span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--purple-5)' }}>{c.question}</span></div></div>
                </Card>
              );
            })}
            <Card style={{ padding: 22 }}>
              <h2 className={s.h2} id="rate-label" style={{ fontSize: 19, fontWeight: 700 }}>How Useful Was This Feedback?</h2>
              <div role="radiogroup" aria-labelledby="rate-label" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((r) => {
                  const on = rating === r;
                  return (
                    <button key={r} type="button" role="radio" aria-checked={on} disabled={rate.isPending}
                      onClick={() => rate.mutate(r)}
                      style={{ width: 52, height: 52, borderRadius: 999, border: 0, fontSize: 17, fontWeight: 800, cursor: 'pointer', color: '#fff',
                        background: on ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.08)', boxShadow: on ? 'inset 0 0 0 2px var(--green-30)' : 'inset 0 0 0 1px rgba(255,255,255,.18)' }}>
                      {r}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: 13, color: 'var(--purple-15)' }}>1 is not useful, 5 is very useful.{rating == null ? ' Rating earns 20 XP.' : ''}</span>
            </Card>
            {!vp.mobile && <div><Button icon="arrow_forward" onClick={back}>{cta}</Button></div>}
          </div>
        </section>
      )}
    </ProjectGate>
  );
}
