import { Link } from 'react-router-dom';
import { usePage } from '../components/ShellContext';

/** Stand-in for screens built in later phases. */
export function Placeholder({ title, phase }: { title: string; phase: number }) {
  usePage(title, null);
  return (
    <section style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ background: 'var(--card-dark)', borderRadius: 32, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
        <p style={{ color: 'var(--purple-10)' }}>This screen is built in Phase {phase}.</p>
        <Link to="/">Back To Portfolio</Link>
      </div>
    </section>
  );
}
