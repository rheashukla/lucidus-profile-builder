import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CAREERS, COLLEGES, DEGREES, MODES, POWERS, SDGS, SUBJECTS, TIMELINE, type Group } from '@shared/data';
import { Button, IconButton } from '../components/Button';
import { Icon } from '../components/Icon';
import { usePage } from '../components/ShellContext';
import { useToast } from '../components/Toast';
import { PAL } from '../lib/palette';
import { firstInvalidStep, invalidMessage, statusLine, stepValid, useSetup, type Draft } from '../lib/setupStore';
import { STEPS } from '../lib/steps';
import { useViewport } from '../lib/useViewport';
import s from './Setup.module.css';

type Patch = (p: Partial<Draft>) => void;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function Chip({ label, on, dim, strong, onClick }: { label: string; on: boolean; dim?: boolean; strong?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cx(s.chip, on && !strong && s.chipOn, dim && s.chipDim, strong && on && s.chipStrong)}>
      {on && <Icon name={strong ? 'star' : 'check'} size={16} fill={strong} />}
      <span>{label}</span>
    </button>
  );
}

function ChipGroups({ groups, picked, max, onToggle }: { groups: Group[]; picked: string[]; max: number; onToggle: (v: string) => void }) {
  return (
    <div className={s.stack}>
      {groups.map((g, gi) => (
        <div key={g.name} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="group" aria-label={g.name}>
          <span className={s.groupHead}><span className={s.dot} style={{ background: PAL[gi % PAL.length].solid }} />{g.name}</span>
          <div className={s.chips}>
            {g.items.map((x) => {
              const on = picked.includes(x);
              return <Chip key={x} label={x} on={on} dim={!on && picked.length >= max} onClick={() => onToggle(x)} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CareerStep({ d, patch }: { d: Draft; patch: Patch }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const groups = CAREERS.map((g, gi) => ({ ...g, gi, items: g.items.filter((x) => !query || x.toLowerCase().includes(query)) })).filter((g) => g.items.length);
  const pickedGroup = CAREERS.find((g) => d.career && g.items.includes(d.career))?.name ?? null;
  const [open, setOpen] = useState<string | null>(pickedGroup);
  const exploring = d.career === 'Still exploring';
  return (
    <div className={s.stack}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label className={s.search}>
          <span className="sr-only">Search careers</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search careers" />
          <Icon name="search" size={22} color="var(--purple-15)" />
        </label>
        <button type="button" aria-pressed={exploring} className={cx(s.chip, exploring && s.chipOn)} style={{ flexShrink: 0, fontSize: 13 }}
          onClick={() => patch({ career: exploring ? null : 'Still exploring' })}>
          <Icon name="explore" size={16} /><span>Still exploring</span>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map((g) => {
          const isOpen = !!query || open === g.name;
          const pick = g.items.find((x) => x === d.career);
          return (
            <div key={g.name} className={cx(s.acc, isOpen && s.accOpen, !!pick && s.accPicked)}>
              <button type="button" className={s.accHead} aria-expanded={isOpen} onClick={() => setOpen(isOpen && !query ? null : g.name)}>
                <span className={s.dot} style={{ background: PAL[g.gi % PAL.length].solid }} />
                <span className={s.accName}>
                  {g.name}
                  {pick && <span className={s.accPick}><Icon name="check_circle" size={16} fill />{pick}</span>}
                </span>
                <span className={s.accCount}>{g.items.length}{query ? (g.items.length === 1 ? ' match' : ' matches') : ' careers'}</span>
                <span className={s.accChev}><Icon name="expand_more" size={22} /></span>
              </button>
              {isOpen && (
                <div className={s.accBody}>
                  {g.items.map((x) => <Chip key={x} label={x} on={d.career === x} onClick={() => patch({ career: d.career === x ? null : x })} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!groups.length && <p className={s.muted}>No careers match that search. Try another word, or pick Still exploring.</p>}
    </div>
  );
}

const ALL_COLLEGES = COLLEGES.flatMap((g) => g.items.map((label) => ({ label, region: g.name })));

function CollegeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const q = value.trim().toLowerCase();
  const sugs = ALL_COLLEGES.filter((c) => !q || c.label.toLowerCase().includes(q)).slice(0, 6);
  const exact = ALL_COLLEGES.some((c) => c.label.toLowerCase() === q);
  const show = open && sugs.length > 0 && !exact;
  const pick = (v: string) => { onChange(v); setOpen(false); setActive(-1); };
  return (
    <div className={s.fieldWrap} style={{ zIndex: show ? 9 : undefined }}>
      <label className={s.label} htmlFor="college">College</label>
      <div className={s.field}>
        <Icon name="school" size={22} color="var(--purple-15)" />
        <input id="college" role="combobox" aria-expanded={show} aria-controls="college-list" aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `college-${active}` : undefined}
          value={value} placeholder="Start typing a college name" autoComplete="off"
          onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!show) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, sugs.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(sugs[active].label); }
            else if (e.key === 'Escape') setOpen(false);
          }} />
        {value && <IconButton icon="close" label="Clear college" size={20} onMouseDown={(e) => e.preventDefault()} onClick={() => onChange('')} />}
      </div>
      {show && (
        <div id="college-list" role="listbox" className={s.listbox}>
          {sugs.map((c, k) => (
            <button key={c.label} id={`college-${k}`} type="button" role="option" aria-selected={k === active} tabIndex={-1}
              className={cx(s.option, k === active && s.optionActive)} onMouseDown={(e) => { e.preventDefault(); pick(c.label); }}>
              <span>{c.label}</span><span className={s.region}>{c.region}</span>
            </button>
          ))}
        </div>
      )}
      <span className={s.help}>Not on the list? Type the full name and keep going.</span>
    </div>
  );
}

function DegreeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  const groups = [{ name: 'None', items: [['No degree picked yet', '']] }, ...DEGREES.map((g) => ({ name: g.name, items: g.items.map((x) => [x, x]) }))];
  return (
    <div ref={ref} className={s.fieldWrap} style={{ zIndex: open ? 9 : undefined }}>
      <span className={s.label} id="degree-label">Degree</span>
      <button type="button" className={s.field} aria-haspopup="listbox" aria-expanded={open} aria-labelledby="degree-label degree-value" onClick={() => setOpen((o) => !o)}>
        <Icon name="workspace_premium" size={22} color="var(--purple-15)" />
        <span id="degree-value" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? '#fff' : 'rgba(255,255,255,.55)' }}>
          {value || 'No degree picked yet'}
        </span>
        <span className={s.accChev} style={{ width: 40, height: 40 }}>
          <Icon name="expand_more" size={22} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms var(--ease)' }} />
        </span>
      </button>
      {open && (
        <div role="listbox" aria-labelledby="degree-label" className={s.listbox}>
          {groups.map((g) => (
            <div key={g.name} role="group" aria-label={g.name} style={{ display: 'flex', flexDirection: 'column' }}>
              <span className={s.optGroup}>{g.name}</span>
              {g.items.map(([label, val]) => (
                <button key={label} type="button" role="option" aria-selected={value === val}
                  className={cx(s.option, value === val && s.optionOn)} onClick={() => { onChange(val); setOpen(false); }}>
                  <span style={{ flex: 1 }}>{label}</span>
                  {value === val && <Icon name="check_circle" size={20} fill color="var(--green-30)" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollegeStep({ d, patch }: { d: Draft; patch: Patch }) {
  return (
    <div className={s.stack}>
      <CollegeField value={d.college} onChange={(college) => patch({ college })} />
      <DegreeField value={d.degree} onChange={(degree) => patch({ degree })} />
      <div className={s.fieldWrap}>
        <label className={s.label} htmlFor="country">Country</label>
        <div className={s.field} style={{ paddingRight: 18 }}>
          <Icon name="public" size={22} color="var(--purple-15)" />
          <input id="country" value={d.country} placeholder="Where you live" autoComplete="country-name" onChange={(e) => patch({ country: e.target.value })} />
        </div>
        <span className={s.help} style={{ fontSize: 13 }}>Detected from your browser. Change it if it's wrong.</span>
      </div>
    </div>
  );
}

function TimeStep({ d, patch }: { d: Draft; patch: Patch }) {
  return (
    <div className={s.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }} role="radiogroup" aria-label="Time">
      {([1, 2, 3, 4] as const).map((w) => {
        const t = TIMELINE[w], on = d.weeks === w;
        return (
          <button key={w} type="button" role="radio" aria-checked={on} className={cx(s.card, on && s.cardOn)} onClick={() => patch({ weeks: w })}>
            <span style={{ fontSize: 22, fontWeight: 600 }}>{w} {w > 1 ? 'Weeks' : 'Week'}</span>
            <span className={s.cpChip}><Icon name="flag" size={16} color="var(--orange-40)" />{t.cps.length} checkpoints</span>
            <span className={s.small}>{[...t.cps.map((x) => `Day ${x}`), `Final Day ${t.final}`].join(' · ')}</span>
            {on && <Icon name="check_circle" size={22} fill color="var(--green-30)" className={s.check} />}
          </button>
        );
      })}
    </div>
  );
}

function SdgStep({ d, onToggle }: { d: Draft; onToggle: (n: number) => void }) {
  return (
    <div className={s.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
      {SDGS.map((name, k) => {
        const n = k + 1, on = d.sdgs.includes(n), P = PAL[k % PAL.length];
        return (
          <button key={n} type="button" aria-pressed={on} className={cx(s.card, on && s.cardOn, !on && d.sdgs.length >= 2 && s.cardDim)}
            style={{ minHeight: 110, gap: 10, padding: 16, borderRadius: 24 }} onClick={() => onToggle(n)}>
            <span className={s.sdgNum} style={{ background: P.solid, color: P.on, boxShadow: `0 6px 14px -6px ${P.glow}` }}>{n}</span>
            <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{name}</span>
            {on && <Icon name="check_circle" size={22} fill color="var(--green-30)" className={s.check} />}
          </button>
        );
      })}
    </div>
  );
}

function ModeStep({ d, patch }: { d: Draft; patch: Patch }) {
  return (
    <div className={s.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }} role="radiogroup" aria-label="Mode">
      {MODES.map((m, mi) => {
        const on = d.mode === m.id, P = PAL[[2, 1, 0][mi]];
        return (
          <button key={m.id} type="button" role="radio" aria-checked={on} className={cx(s.card, on && s.cardOn)}
            style={{ padding: 22, gap: 10, borderRadius: 24 }} onClick={() => patch({ mode: m.id })}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ width: 48, height: 48, borderRadius: 18, background: P.solid, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-6deg)', boxShadow: `0 10px 20px -8px ${P.glow}` }}>
                <Icon name={['school', 'explore', 'rocket_launch'][mi]} size={24} />
              </span>
              <Icon name={on ? 'check_circle' : 'radio_button_unchecked'} size={24} fill={on} color={on ? 'var(--green-30)' : 'rgba(255,255,255,.35)'} />
            </span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{m.id}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-15)' }}>{m.hint}</span>
            <span style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--purple-10)' }}>{m.desc}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 6 }}>
              {m.rows.map(([k, v]) => <span key={k} className={s.modeRow}><span className={s.modeKey}>{k}</span><span className={s.modeVal}>{v}</span></span>)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className={s.segs} aria-hidden="true">
      {STEPS.map((_, k) => <span key={k} className={cx(s.seg, k < step && s.segDone, k === step && s.segCur)} />)}
    </div>
  );
}

export function Setup({ onGenerate }: { onGenerate: (d: Draft) => void }) {
  const params = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const vp = useViewport();
  const { draft: d, patch } = useSetup();
  const step = Math.min(7, Math.max(1, Number(params.step) || 1)) - 1;
  const valid = stepValid(step, d);
  const status = statusLine(step, d);
  const first = firstInvalidStep(d);

  const toggle = (key: 'subjects' | 'powers', v: string, max: number) => {
    const arr = d[key];
    if (arr.includes(v)) {
      const next = arr.filter((x) => x !== v);
      patch({ [key]: next, ...(key === 'powers' && d.strongest === v ? { strongest: next[0] || null } : {}) });
    } else if (arr.length >= max) toast(`You can pick up to ${max}. Remove one first.`);
    else patch({ [key]: [...arr, v], ...(key === 'powers' && !d.strongest ? { strongest: v } : {}) });
  };
  const toggleSdg = (n: number) => {
    if (d.sdgs.includes(n)) patch({ sdgs: d.sdgs.filter((x) => x !== n) });
    else if (d.sdgs.length >= 2) toast('You can pick up to 2. Remove one first.');
    else patch({ sdgs: [...d.sdgs, n] });
  };

  const next = () => {
    if (!valid) return toast(invalidMessage(step, d));
    if (step < 6) nav(`/new/${step + 2}`);
    else onGenerate(d);
  };
  const back = () => (step === 0 ? nav('/') : nav(`/new/${step}`));
  const nextLabel = step === 6 ? 'Generate My Brief' : 'Continue';
  const nextIcon = step === 6 ? 'auto_awesome' : 'arrow_forward';

  usePage('New Project', { label: nextLabel, icon: nextIcon, onClick: next, softDisabled: !valid, hint: status });
  useEffect(() => { window.scrollTo(0, 0); if (step > (d.furthest ?? 0)) patch({ furthest: step }); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => [
    d.subjects.join(', '),
    d.powers.map((x) => (x === d.strongest ? `${x} (strongest)` : x)).join(', '),
    d.career || '',
    [d.college, d.degree].filter(Boolean).join(' · '),
    `${d.weeks} ${d.weeks > 1 ? 'weeks' : 'week'}`,
    d.sdgs.map((n) => `SDG ${n} · ${SDGS[n - 1]}`).join(', '),
    d.mode,
  ], [d]);

  // Can't skip ahead past an unfinished step.
  if (step > first) return <Navigate to={`/new/${first + 1}`} replace />;

  const [, title, sub] = STEPS[step];
  return (
    <>
      {vp.mobile && (
        <div className={s.wizHead}>
          <IconButton icon="arrow_back" label="Back" onClick={back} />
          <Progress step={step} />
          <span className={s.stepCount}>Step {step + 1} of 7</span>
        </div>
      )}
      <section className={s.page}>
        <div className={s.col}>
          {!vp.mobile && (
            <div className={s.progress}>
              <IconButton icon="arrow_back" label="Back" onClick={back} />
              <Progress step={step} />
              <span className={s.stepCount}>Step {step + 1} of 7</span>
            </div>
          )}
          <h1 className={s.h1}>{title}</h1>
          <p className={s.sub}>{sub}</p>
          {status && (
            <div className={s.chipRow}>
              <span className={cx(s.state, !valid && s.stateBad)} role="status">
                <Icon name={valid ? 'check_circle' : 'info'} size={18} fill />{status}
              </span>
            </div>
          )}

          <div className={s.options}>
            {step === 0 && <ChipGroups groups={SUBJECTS} picked={d.subjects} max={3} onToggle={(v) => toggle('subjects', v, 3)} />}
            {step === 1 && (
              <div className={s.stack}>
                {d.powers.length > 0 && (
                  <div className={s.strongBox} role="radiogroup" aria-label="Your strongest superpower">
                    <span className={s.strongHead}><Icon name="star" size={20} fill color="var(--orange-40)" />Tap your strongest</span>
                    <div className={s.chips}>
                      {d.powers.map((x) => (
                        <button key={x} type="button" role="radio" aria-checked={d.strongest === x}
                          className={cx(s.chip, d.strongest === x && s.chipStrong)} onClick={() => patch({ strongest: x })}>
                          {d.strongest === x && <Icon name="star" size={16} fill color="var(--orange-40)" />}<span>{x}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <ChipGroups groups={POWERS} picked={d.powers} max={4} onToggle={(v) => toggle('powers', v, 4)} />
              </div>
            )}
            {step === 2 && <CareerStep d={d} patch={patch} />}
            {step === 3 && <CollegeStep d={d} patch={patch} />}
            {step === 4 && <TimeStep d={d} patch={patch} />}
            {step === 5 && <SdgStep d={d} onToggle={toggleSdg} />}
            {step === 6 && <ModeStep d={d} patch={patch} />}
          </div>

          {!vp.mobile && (
            <div className={s.bottomBar}>
              <Button variant="secondary" leadingIcon="arrow_back" onClick={back}>Back</Button>
              <span className={s.bottomStatus}>{status}</span>
              <Button icon={nextIcon} softDisabled={!valid} onClick={next}>{nextLabel}</Button>
            </div>
          )}
        </div>

        {!vp.mobile && (
          <aside className={s.aside}>
            <div className={s.answers}>
              <div className={s.answersHead}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Your Answers</h3>
                <span className={s.pct}>{Math.round((step / 7) * 100)}%</span>
              </div>
              {STEPS.map(([label], k) => {
                const done = k !== step && k < Math.max(step, d.furthest ?? 0) && stepValid(k, d);
                const reachable = k <= first;
                return (
                  <button key={label} type="button" className={cx(s.ans, k === step && s.ansCur)} aria-current={k === step ? 'step' : undefined}
                    onClick={() => (reachable ? nav(`/new/${k + 1}`) : toast('Finish the earlier steps first.'))}>
                    <Icon name={done ? 'check_circle' : k === step ? 'radio_button_checked' : 'radio_button_unchecked'} size={22} fill={done}
                      color={done ? 'var(--green-30)' : k === step ? '#fff' : 'rgba(255,255,255,.35)'} />
                    <span className={s.ansText}>
                      <span className={s.ansLabel}>{label}</span>
                      <span className={s.ansVal} style={{ color: summary[k] ? '#fff' : 'var(--purple-15)' }}>
                        {summary[k] || (k === 2 || k === 3 ? 'Optional' : 'Not picked yet')}
                      </span>
                    </span>
                    {done && <Icon name="edit" size={18} color="var(--purple-15)" />}
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </section>
    </>
  );
}
