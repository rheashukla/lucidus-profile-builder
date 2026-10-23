import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Shell } from './components/Shell';
import { Hub } from './screens/Hub';
import { Placeholder } from './screens/Placeholder';
import { Setup } from './screens/Setup';

function ProjectRoutes() {
  const { tab } = useParams();
  const titles: Record<string, [string, number]> = {
    brief: ['Brief', 3], rubric: ['Rubric', 3], checkpoints: ['Checkpoints', 5], growth: ['Growth', 5],
    upload: ['Checkpoints', 4], feedback: ['Feedback', 4], review: ['Final Review', 5],
  };
  const t = titles[tab || ''];
  if (!t) return <Navigate to="brief" replace />;
  return <Placeholder title={t[0]} phase={t[1]} />;
}

export function App() {
  const nav = useNavigate();
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/new/:step" element={<Setup onGenerate={() => nav('/generating')} />} />
        <Route path="/generating" element={<Placeholder title="Working On It" phase={3} />} />
        <Route path="/p/:id/:tab/*" element={<ProjectRoutes />} />
        <Route path="/p/:id" element={<Navigate to="brief" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
