/** Trim to `max` characters at the last word break and append "…". */
export function cut(s: unknown, max: number): string {
  const str = String(s ?? '').trim();
  if (str.length <= max) return str;
  const t = str.slice(0, max - 1);
  // If the cut lands on a word boundary keep the whole last word; otherwise back up to the last space.
  const sp = /\s/.test(str[max - 1]) ? t.length : t.lastIndexOf(' ');
  return t.slice(0, sp > 0 ? sp : t.length).replace(/[,;:.\s]+$/, '') + '…';
}
