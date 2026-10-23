import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Inputs } from '@shared/types';
import { Busy, withMinDelay } from '../components/Busy';
import { usePage } from '../components/ShellContext';
import { useToast } from '../components/Toast';
import { createProject } from '../lib/api';
import { clearSetup, firstInvalidStep, useSetup } from '../lib/setupStore';
import { rememberProject } from '../lib/useCurrentProject';

export function Generating() {
  const { draft } = useSetup();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const started = useRef(false);
  const ready = firstInvalidStep(draft) >= 7;
  usePage('Working On It', null);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const { furthest: _f, ...rest } = draft;
    const inputs = { ...rest, strongest: rest.strongest! } as Inputs;
    withMinDelay(createProject(inputs, 7))
      .then(({ project, fallback }) => {
        clearSetup();
        rememberProject(project.id);
        qc.invalidateQueries({ queryKey: ['projects'] });
        nav(`/p/${project.id}/brief`, { replace: true });
        if (fallback) toast('AI is unavailable right now, so this is a sample brief.');
      })
      .catch((e: Error) => { toast(e.message); nav('/new/7', { replace: true }); });
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <Navigate to={`/new/${Math.min(firstInvalidStep(draft), 6) + 1}`} replace />;
  return <Busy kind="brief" />;
}
