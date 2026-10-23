import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3400);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">{msg}</div>
      {msg && (
        <div aria-hidden="true" style={{
          position: 'fixed', top: 'var(--toast-top, 76px)', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          maxWidth: 'calc(100% - 32px)', width: 'max-content', padding: '10px 18px', borderRadius: 999,
          background: 'var(--purple-80)', color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center',
          boxShadow: 'var(--shadow-overlay)', animation: 'pbIn 300ms var(--ease) both',
        }}>{msg}</div>
      )}
    </Ctx.Provider>
  );
}
