import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import { Hub } from './screens/Hub';
import { Setup } from './screens/Setup';
import { Generating } from './screens/Generating';
import { ProjectHome } from './screens/project/ProjectHome';
import { Upload } from './screens/project/Upload';
import { Feedback } from './screens/project/Feedback';
import { Review } from './screens/project/Review';

export function App() {
  const nav = useNavigate();
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/new/:step" element={<Setup onGenerate={() => nav('/generating')} />} />
        <Route path="/generating" element={<Generating />} />
        <Route path="/p/:id/upload" element={<Upload />} />
        <Route path="/p/:id/feedback/:n" element={<Feedback />} />
        <Route path="/p/:id/review" element={<Review />} />
        <Route path="/p/:id/:tab" element={<ProjectHome />} />
        <Route path="/p/:id" element={<Navigate to="brief" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
