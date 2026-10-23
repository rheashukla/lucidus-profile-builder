import type { ProjectSummary } from '@shared/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init || {};
  const res = await fetch('/api' + path, {
    credentials: 'same-origin',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    ...rest,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'Something went wrong.');
  return data as T;
}

export interface Me { user: { id: string; email: string | null } }

export const getMe = () => api<Me>('/me');
export const listProjects = () => api<ProjectSummary[]>('/projects');
export const deleteProject = (id: string) => api<null>(`/projects/${id}`, { method: 'DELETE' });
