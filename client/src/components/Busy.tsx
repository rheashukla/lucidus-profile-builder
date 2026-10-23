import { useEffect, useState } from 'react';
import { Icon } from './Icon';

const BUSY = {
  brief: ['Building Your Brief', ['Reading your inputs', 'Finding a real beneficiary', 'Writing your rubric', 'Setting your checkpoints']],
  feedback: ['Reviewing Your Checkpoint', ['Reading your upload', 'Checking it against the rubric', 'Comparing with last time', 'Writing your next steps']],
  final: ['Preparing Your Final Review', ['Reading every checkpoint', 'Comparing with your brief', 'Measuring your growth', 'Writing your final review']],
} as const;

export const MIN_BUSY_MS = 2500;
const STEP_MS = 1700;

/** Runs `task` but resolves no sooner than the minimum loading time. */
export const withMinDelay = <T,>(task: Promise<T>) =>
  Promise.all([task, new Promise((r) => setTimeout(r, MIN_BUSY_MS))]).then(([v]) => v);

export function Busy({ kind }: { kind: keyof typeof BUSY }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, 3)), STEP_MS);
    return () => clearInterval(t);
  }, []);
  const [title, steps] = BUSY[kind];
  const pct = Math.round(((idx + 0.6) / 4) * 100);
  return (
    <section style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: '28px 16px 64px' }} aria-busy="true">
      <div style={{
        maxWidth: 640, margin: '0 auto', padding: '32px 28px', borderRadius: 32, display: 'flex', flexDirection: 'column', gap: 20,
        background: 'radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 70%, #fff, transparent), radial-gradient(2px 2px at 82% 22%, #fff, transparent), var(--card-dark)',
      }}>
        <img src="/logomark.svg" alt="" width={72} height={72} style={{ alignSelf: 'center', animation: 'pbBob 2s ease-in-out infinite' }} />
        <h1 style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', textWrap: 'balance' }}>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress"
            style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--track)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 999, background: 'var(--green-30)', transition: 'width 600ms var(--ease)' }} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--green-30)' }}>{pct}%</span>
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }} aria-live="polite">
          {steps.map((label, k) => (
            <li key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 999, fontSize: 15, fontWeight: 700,
              background: k === idx ? 'rgba(255,255,255,.1)' : 'transparent', color: k <= idx ? '#fff' : 'var(--purple-15)', opacity: k <= idx ? 1 : 0.6, transition: 'all 300ms',
            }}>
              <Icon name={k < idx ? 'check_circle' : k === idx ? 'pending' : 'radio_button_unchecked'} size={20} fill={k < idx}
                color={k < idx ? 'var(--green-30)' : k === idx ? 'var(--yellow-50)' : 'var(--purple-15)'} />
              {label}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
