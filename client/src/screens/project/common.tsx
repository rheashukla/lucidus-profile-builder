import type { CSSProperties, ReactNode } from 'react';
import { LEVELS } from '@shared/data';
import type { Level } from '@shared/types';
import { Icon } from '../../components/Icon';
import { LV } from '../../lib/palette';
import s from './Project.module.css';

export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={[s.card, className].filter(Boolean).join(' ')} style={style}>{children}</div>;
}

export function H2({ icon, iconColor, iconBg, children, size = 22 }: { icon?: string; iconColor?: string; iconBg?: string; children: ReactNode; size?: number }) {
  return (
    <span className={s.h2Row}>
      {icon && <span className={s.h2Icon} style={{ color: iconColor, background: iconBg }}><Icon name={icon} size={22} /></span>}
      <h2 className={s.h2} style={{ fontSize: size }}>{children}</h2>
    </span>
  );
}

export const LevelChip = ({ level, short, prefix }: { level: Level; short?: boolean; prefix?: string }) => (
  <span className={s.lvChip} style={{ background: LV[level].chip, color: LV[level].fg }}>
    {prefix}{short ? ['Beg.', 'Dev.', 'Prof.', 'Exem.'][level] : LEVELS[level]}
  </span>
);

/** Four segments filled up to `level`; `from` shades the part reached earlier. */
export function Segs({ level, from, height = 6 }: { level: Level; from?: Level; height?: number }) {
  return (
    <div className={s.segs} role="img" aria-label={`${LEVELS[level]}, level ${level + 1} of 4`}>
      {[0, 1, 2, 3].map((k) => (
        <span key={k} className={s.seg} style={{
          height, background: from !== undefined && k <= Math.min(from, level) ? 'var(--purple-15)' : k <= level ? LV[level].solid : undefined,
        }} />
      ))}
    </div>
  );
}

export function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className={s.bubbleRow}>
      <span className={s.bubbleAvatar}><img src="/logomark.svg" alt="" width={34} height={34} /></span>
      <div className={s.bubble}>{children}</div>
    </div>
  );
}

export const isHttp = (u?: string | null) => !!u && /^https?:\/\//i.test(u);

export function SourceLink({ url, publisher }: { url: string; publisher: string }) {
  if (!isHttp(url)) return null;
  return (
    <a className={s.link} href={url} target="_blank" rel="noopener noreferrer">
      <span>{publisher || 'Source'} · Check this link</span><Icon name="open_in_new" size={16} />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
