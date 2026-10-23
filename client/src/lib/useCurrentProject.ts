import { useQuery } from '@tanstack/react-query';
import { useMatch } from 'react-router-dom';
import { listProjects } from './api';

const LAST = 'pb-last-project';

export function rememberProject(id: string) {
  try { localStorage.setItem(LAST, id); } catch { /* storage unavailable */ }
}

/** The project the nav focuses on: the one in the URL, else the last opened, else the most recent. */
export function useCurrentProject() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const match = useMatch('/p/:id/*');
  let last: string | null = null;
  try { last = localStorage.getItem(LAST); } catch { /* storage unavailable */ }
  const id = match?.params.id || last;
  const current = projects.find((p) => p.id === id) || projects[0] || null;
  return { projects, current, isLoading, inProject: !!match };
}
