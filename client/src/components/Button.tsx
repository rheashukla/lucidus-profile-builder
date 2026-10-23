import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import s from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;            // trailing icon
  leadingIcon?: string;
  full?: boolean;
  small?: boolean;
  softDisabled?: boolean;   // looks disabled but still fires onClick (to show a hint)
  children: ReactNode;
}

export function Button({ variant = 'primary', icon, leadingIcon, full, small, softDisabled, className, children, ...rest }: Props) {
  const cls = [s.btn, s[variant], full && s.full, small && s.sm, className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} aria-disabled={softDisabled || undefined} {...rest}>
      {leadingIcon && <Icon name={leadingIcon} size={20} />}
      <span>{children}</span>
      {icon && <Icon name={icon} size={20} />}
    </button>
  );
}

export function IconButton({ icon, label, size = 22, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; size?: number }) {
  return (
    <button type="button" aria-label={label} title={label} className={[s.iconBtn, className].filter(Boolean).join(' ')} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}
