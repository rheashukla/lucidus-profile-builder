import { createContext, useContext, useEffect } from 'react';

export interface DockAction {
  label: string;
  icon?: string;
  onClick: () => void;
  softDisabled?: boolean;
  hint?: string;
}

export type ModalKind = { kind: 'projects' } | { kind: 'save' } | { kind: 'return' } | { kind: 'delete'; id: string };

export interface ShellApi {
  setPage: (p: { title: string; dock: DockAction | null }) => void;
  openModal: (m: ModalKind) => void;
}

export const ShellCtx = createContext<ShellApi>({ setPage: () => {}, openModal: () => {} });
export const useShell = () => useContext(ShellCtx);

/** Screens call this to set the header title and the mobile sticky primary button. */
export function usePage(title: string, dock: DockAction | null) {
  const { setPage } = useShell();
  const key = dock ? [dock.label, dock.icon, dock.softDisabled, dock.hint].join('|') : '';
  useEffect(() => { setPage({ title, dock }); }, [title, key]); // eslint-disable-line react-hooks/exhaustive-deps
}
