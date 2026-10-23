import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';
import s from './Modal.module.css';

export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className={s.backdrop} onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <IconButton icon="close" label="Close" size={20} className={s.close} onClick={onClose} />
        {children}
      </div>
    </div>
  );
}

/** Round icon badge used at the top of modals. */
export function ModalBadge({ icon, bg, color }: { icon: string; bg: string; color: string }) {
  return (
    <span style={{ width: 52, height: 52, borderRadius: 999, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 28 }}>{icon}</span>
    </span>
  );
}
