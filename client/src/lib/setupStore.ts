import { useCallback, useEffect, useState } from 'react';
import type { Inputs, Mode } from '@shared/types';

export interface Draft extends Omit<Inputs, 'strongest'> {
  strongest: string | null;
  furthest?: number; // furthest step index reached, for the answers panel
}

const KEY = 'pb-setup';

export function detectCountry(): string {
  try {
    const loc = (navigator.languages && navigator.languages[0]) || navigator.language;
    const r = new Intl.Locale(loc).maximize().region;
    return r ? new Intl.DisplayNames(['en'], { type: 'region' }).of(r) || '' : '';
  } catch { return ''; }
}

export const blankDraft = (): Draft => ({
  subjects: [], powers: [], strongest: null, career: null, college: '', degree: '',
  country: detectCountry(), weeks: 2, sdgs: [], mode: 'Beginner' as Mode,
});

function load(): Draft {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...blankDraft(), ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return blankDraft();
}

export function clearSetup() {
  try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

/** Setup answers live in sessionStorage until submitted, so a refresh keeps them. */
export function useSetup() {
  const [draft, setDraft] = useState<Draft>(load);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* storage unavailable */ }
  }, [draft]);
  const patch = useCallback((p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p })), []);
  return { draft, patch, reset: () => setDraft(blankDraft()) };
}

/** Index is 0-based (0 = Subjects). */
export function stepValid(k: number, d: Draft): boolean {
  switch (k) {
    case 0: return d.subjects.length >= 1 && d.subjects.length <= 3;
    case 1: return d.powers.length >= 2 && d.powers.length <= 4 && !!d.strongest && d.powers.includes(d.strongest);
    case 5: return d.sdgs.length >= 1 && d.sdgs.length <= 2;
    case 6: return !!d.mode;
    default: return true; // career, college/degree/country and time can't block
  }
}

export function firstInvalidStep(d: Draft): number {
  for (let k = 0; k < 7; k++) if (!stepValid(k, d)) return k;
  return 7;
}

export function invalidMessage(k: number, d: Draft): string {
  return ({
    0: 'Pick at least 1 subject.',
    1: d.powers.length < 2 ? 'Pick at least 2 superpowers.' : 'Mark your strongest.',
    5: 'Pick at least 1 goal.',
  } as Record<number, string>)[k] || '';
}

export function statusLine(k: number, d: Draft): string {
  if (!stepValid(k, d)) return invalidMessage(k, d);
  const counts: Record<number, [number, number]> = { 0: [d.subjects.length, 3], 1: [d.powers.length, 4], 5: [d.sdgs.length, 2] };
  if (counts[k]) return `${counts[k][0]} of ${counts[k][1]} picked`;
  if (k === 2 || k === 3) return 'You can skip this step.';
  return '';
}
