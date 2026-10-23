import type { CSSProperties } from 'react';

interface Props { name: string; size?: number; fill?: boolean; color?: string; style?: CSSProperties; className?: string }

export function Icon({ name, size = 20, fill, color, style, className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded${fill ? ' fill' : ''}${className ? ' ' + className : ''}`}
      style={{ fontSize: size, width: size, height: size, color, flexShrink: 0, ...style }}
    >
      {name}
    </span>
  );
}
