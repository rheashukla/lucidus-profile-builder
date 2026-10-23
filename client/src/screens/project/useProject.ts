import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getProject } from '../../lib/api';
import { projectState } from '../../lib/projectState';
import { rememberProject } from '../../lib/useCurrentProject';

export function useProject() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id), enabled: !!id });
  useEffect(() => { if (q.data) rememberProject(id); }, [id, q.data]);
  return { id, ...q, ps: q.data ? projectState(q.data) : null };
}
