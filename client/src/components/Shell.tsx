import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../lib/api';
import { useViewport } from '../lib/useViewport';
import { useCurrentProject } from '../lib/useCurrentProject';
import { STEPS } from '../lib/steps';
import { Icon } from './Icon';
import { Button, IconButton } from './Button';
import { ShellCtx, type DockAction, type ModalKind } from './ShellContext';
import { ProjectsSheet, DeleteModal, SaveModal } from './Modals';
import s from './Shell.module.css';

const TABS = [
  ['brief', 'Brief', 'description'],
  ['rubric', 'Rubric', 'checklist'],
  ['checkpoints', 'Checkpoints', 'flag'],
  ['growth', 'Growth', 'monitoring'],
] as const;

interface NavItemProps { to?: string; onClick?: () => void; icon: string; label: string; on?: boolean; done?: boolean; indent?: boolean; badge?: string; collapsed?: boolean }

function NavItem({ to, onClick, icon, label, on, done, indent, badge, collapsed }: NavItemProps) {
  const cls = [s.navItem, indent && s.indent, on && s.on, done && s.done].filter(Boolean).join(' ');
  const body = (
    <>
      <Icon name={icon} size={indent ? 20 : 22} fill={on || done} className={s.navIcon} />
      {!collapsed && <span className={s.navLabel}>{label}</span>}
      {!collapsed && badge && <span className={s.navBadge}>{badge}</span>}
    </>
  );
  if (to) return <Link to={to} className={cls} title={label} aria-current={on ? 'page' : undefined} onClick={onClick}>{body}</Link>;
  return <button type="button" className={cls} title={label} onClick={onClick}>{body}</button>;
}

export function Shell({ children }: { children: ReactNode }) {
  const vp = useViewport();
  const nav = useNavigate();
  const loc = useLocation();
  const { projects, current, inProject } = useCurrentProject();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const [page, setPageState] = useState<{ title: string; dock: DockAction | null }>({ title: '', dock: null });
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const setPage = useCallback((p: { title: string; dock: DockAction | null }) => setPageState(p), []);
  const api = useMemo(() => ({ setPage, openModal: setModal }), [setPage]);

  const setupMatch = useMatch('/new/:step');
  const creating = !!setupMatch || loc.pathname === '/generating';
  const setupStep = setupMatch ? Number(setupMatch.params.step) || 1 : 0;
  const tabMatch = useMatch('/p/:id/:tab/*');
  const routeTab = tabMatch?.params.tab;
  const onHub = loc.pathname === '/';

  const email = me?.user.email || null;
  const initials = email ? email[0].toUpperCase() : 'ME';
  const cpLeft = current && current.status !== 'complete' ? String(Math.max(0, current.total - current.done)) : '';

  const close = () => setDrawer(false);
  const tabOn = (id: string) => inProject && (routeTab === id
    || (id === 'checkpoints' && (routeTab === 'upload' || routeTab === 'feedback'))
    || (id === 'growth' && routeTab === 'review'));

  const navBody = (isCollapsed: boolean) => (
    <>
      <div className={s.sideTop}>
        <Link to="/" className={s.brand} aria-label="Portfolio Builder home" onClick={close}>
          <span className={s.logo}><img src="/logomark.svg" alt="" width={26} height={26} /></span>
        </Link>
        {vp.sidebar && (
          <IconButton icon={isCollapsed ? 'left_panel_open' : 'left_panel_close'} label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            size={20} style={{ color: 'var(--purple-15)' }} onClick={() => setCollapsed((c) => !c)} />
        )}
      </div>
      <nav aria-label="Main" className={s.group}>
        <NavItem to="/" icon="folder_special" label="Portfolio Builder" on={onHub} collapsed={isCollapsed} onClick={close} />
      </nav>
      <div className={s.group}>
        {!isCollapsed && <span className={s.groupLabel}>My Projects</span>}
        {projects.map((p) => {
          const active = inProject && current?.id === p.id;
          return (
            <div key={p.id} className={s.group}>
              <NavItem to={`/p/${p.id}/brief`} icon={active ? 'folder_open' : 'folder'} label={p.title || 'Untitled Project'} collapsed={isCollapsed} onClick={close} />
              {active && TABS.map(([id, label, icon]) => (
                <NavItem key={id} indent to={`/p/${p.id}/${id}`} icon={icon} label={label} on={tabOn(id)} collapsed={isCollapsed}
                  badge={id === 'checkpoints' ? `${p.done}/${p.total}` : undefined} onClick={close} />
              ))}
              {active && p.status === 'complete' && (
                <NavItem indent to={`/p/${p.id}/review`} icon="emoji_events" label="Final Review" on={routeTab === 'review'} collapsed={isCollapsed} onClick={close} />
              )}
            </div>
          );
        })}
        <NavItem icon="add_circle" label="New Project" on={creating} collapsed={isCollapsed}
          onClick={() => { close(); if (!creating) nav('/new/1'); }} />
        {creating && STEPS.map(([label], k) => (
          <NavItem key={label} indent icon={k + 1 < setupStep ? 'check_circle' : `counter_${k + 1}`} label={label} on={setupStep === k + 1} collapsed={isCollapsed}
            done={k + 1 < setupStep} onClick={() => { close(); if (setupMatch) nav(`/new/${k + 1}`); }} />
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button type="button" className={s.identity} onClick={() => setModal({ kind: 'save' })} aria-label="Account and saving">
        <span className={s.avatar}>{initials}</span>
        {!isCollapsed && (
          <span className={s.idText}>
            <span className={s.idName}>{email ? email.split('@')[0] : 'Student'}</span>
            <span className={s.idSub}>{email ? `Saved to ${email}` : 'Saved on this device'}</span>
          </span>
        )}
      </button>
    </>
  );

  const showTabBar = vp.mobile && !!current && !creating;
  const showMobileProj = vp.mobile && !!current && !creating;
  const dock = vp.mobile ? page.dock : null;
  const dockHeight = (dock ? 76 + (dock.hint ? 24 : 0) : 0) + (showTabBar ? 68 : 0);

  return (
    <ShellCtx.Provider value={api}>
      <div className={s.bg} aria-hidden="true" />
      <div className={s.stars} aria-hidden="true" />
      <div className={s.app}>
        {vp.sidebar && <aside className={[s.sidebar, collapsed && s.collapsed].filter(Boolean).join(' ')}>{navBody(collapsed)}</aside>}
        {!vp.sidebar && !vp.mobile && drawer && (
          <>
            <div className={s.scrim} onClick={close} />
            <aside className={[s.sidebar, s.drawer].join(' ')}>{navBody(false)}</aside>
          </>
        )}
        <div className={s.main}>
          {!(vp.mobile && setupMatch) && <header className={s.header}>
            {!vp.mobile && !vp.sidebar && <IconButton icon="menu" label="Menu" onClick={() => setDrawer((d) => !d)} />}
            {vp.mobile
              ? <Link to="/" className={s.homeLogo} aria-label="Home"><img src="/logomark.svg" alt="" width={24} height={24} /></Link>
              : <h2 className={s.pageTitle}>{page.title}</h2>}
            {showMobileProj ? (
              <button type="button" className={s.projSwitch} aria-label="Switch project" onClick={() => setModal({ kind: 'projects' })}>
                <Icon name="folder_open" size={18} color="var(--purple-15)" />
                <span className={s.projSwitchTitle}>{current!.title}</span>
                <Icon name="unfold_more" size={20} />
              </button>
            ) : <div className={s.spacer} />}
            {!vp.mobile && !email && !!current && vp.width - (vp.sidebar ? 272 : 0) >= 900 && (
              <Button variant="secondary" leadingIcon="mail" onClick={() => setModal({ kind: 'save' })}>Save Progress</Button>
            )}
            {(vp.mobile || !vp.sidebar) && (
              <button type="button" className={[s.avatar, s.headAvatar].join(' ')} aria-label="Account" onClick={() => setModal({ kind: 'save' })}>
                {initials}
                {email && <Icon name="check_circle" size={14} fill color="var(--green-50)" style={{ position: 'absolute', right: -3, bottom: -3, background: 'rgba(255,255,255,.08)', borderRadius: 999 }} />}
              </button>
            )}
          </header>}
          <main className={s.content}>{children}</main>
          {vp.mobile && <div style={{ flexShrink: 0, height: dockHeight ? dockHeight + 8 : 0 }} />}
        </div>
      </div>

      {vp.mobile && (dock || showTabBar) && (
        <div className={s.dock}>
          {dock && (
            <div className={s.dockCta}>
              {dock.hint && <span className={s.dockHint}>{dock.hint}</span>}
              <Button full icon={dock.icon} softDisabled={dock.softDisabled} onClick={dock.onClick}>{dock.label}</Button>
            </div>
          )}
          {showTabBar && (
            <nav className={s.tabBar} aria-label="Project">
              {([['home', 'Home', 'home'], ...TABS] as const).map(([id, label, icon]) => {
                const on = id === 'home' ? onHub : tabOn(id);
                const to = id === 'home' ? '/' : `/p/${current!.id}/${id}`;
                return (
                  <Link key={id} to={to} className={[s.tab, on && s.tabOn].filter(Boolean).join(' ')} aria-current={on ? 'page' : undefined}>
                    <span className={s.tabPill}><Icon name={icon} size={22} fill={on} /></span>
                    <span>{label}</span>
                    {id === 'checkpoints' && cpLeft && <span className={s.tabBadge} aria-label={`${cpLeft} remaining`}>{cpLeft}</span>}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      )}

      {modal?.kind === 'projects' && <ProjectsSheet currentId={current?.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'delete' && <DeleteModal id={modal.id} onClose={() => setModal(null)} />}
      {(modal?.kind === 'save' || modal?.kind === 'return') && <SaveModal mode={modal.kind} onClose={() => setModal(null)} />}
    </ShellCtx.Provider>
  );
}
