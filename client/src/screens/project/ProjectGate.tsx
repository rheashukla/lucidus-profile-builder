import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from './useProject';

/** Loading and not-found states shared by every project screen. */
export function ProjectGate({ children }: { children: ReactNode }) {
  const { isLoading, error } = useProject();
  if (isLoading) {
    return <p role="status" style={{ padding: 40, textAlign: 'center', color: 'var(--purple-15)' }}>Loading your project…</p>;
  }
  if (error) {
    return (
      <section style={{ maxWidth: 560, margin: '40px auto', padding: '0 16px' }}>
        <div style={{ background: 'var(--card-dark)', borderRadius: 32, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>We Couldn't Find That Project</h1>
          <p style={{ color: 'var(--purple-10)' }}>It may have been deleted, or it belongs to another account.</p>
          <Link to="/">Back To Portfolio</Link>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}
