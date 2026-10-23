import type { DraftRow, FileRef, ProjectDetail, ProjectRow, ProjectSummary, Inputs, SubmissionRow, Review } from '@shared/types';

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
export const getProject = (id: string) => api<ProjectDetail>(`/projects/${id}`);
export const deleteProject = (id: string) => api<null>(`/projects/${id}`, { method: 'DELETE' });
export const createProject = (inputs: Inputs, setupSteps: number) =>
  api<{ project: ProjectRow; fallback: boolean }>('/projects', { method: 'POST', json: { ...inputs, setupSteps } });
export const saveDraft = (id: string, n: number, d: { note: string; link: string; files: FileRef[] }) =>
  api<DraftRow>(`/projects/${id}/draft/${n}`, { method: 'PUT', json: d });
export const submitWork = (id: string, d: { note: string; link?: string; files: FileRef[] }) =>
  api<{ kind: 'feedback' | 'review'; submission: SubmissionRow; review?: Review; fallback: boolean }>(`/projects/${id}/submissions`, { method: 'POST', json: d });
export const rateSubmission = (id: string, rating: number) =>
  api<{ submission: SubmissionRow; xp: number }>(`/submissions/${id}/rating`, { method: 'POST', json: { rating } });

/** Multipart upload with progress (fetch has no upload progress, so this uses XHR). */
export function uploadFiles(files: File[], onProgress: (pct: number) => void, signal?: AbortSignal): Promise<FileRef[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    files.forEach((f) => form.append('files', f, f.name));
    xhr.open('POST', '/api/uploads');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
      ? resolve(xhr.response as FileRef[])
      : reject(new ApiError(xhr.status, (xhr.response && xhr.response.error) || 'Upload failed.')));
    xhr.onerror = () => reject(new ApiError(0, 'Upload failed. Check your connection.'));
    xhr.onabort = () => reject(new ApiError(0, 'Upload cancelled.'));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}
