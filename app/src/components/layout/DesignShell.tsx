import type { LucideIcon } from 'lucide-react';
import { Bell, LoaderCircle, LogOut, Search, ShieldCheck, Sigma, User } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useProgress } from '../../hooks/useProgress';
import { useAuth } from '../../hooks/useAuth';
import { getReviewQueueItems, getValidationLogs } from '../../lib/uiData';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function BrandLockup({
  subtitle = 'Knowledge Base',
  compact = false,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-[0_10px_20px_rgba(20,75,184,0.25)]">
        <Sigma className="h-4 w-4" />
      </div>
      <div className={compact ? 'hidden sm:block' : 'block'}>
        <div className="text-sm font-bold tracking-[-0.02em] text-text-100">Olympiad Hub</div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-text-500">{subtitle}</div>
      </div>
    </Link>
  );
}

export function SearchField({
  placeholder,
  value,
  onChange,
  onSubmit,
  className,
}: {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex h-10 min-w-[220px] items-center rounded-[4px] border border-base-500 bg-base-600 px-3',
        className,
      )}
    >
      <Search className="mr-3 h-4 w-4 text-text-500" />
      <input
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="w-full bg-transparent text-sm text-text-200 placeholder:text-text-500 focus:outline-none"
      />
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          className="ml-3 inline-flex h-7 items-center rounded-[4px] bg-primary-500 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-400"
        >
          Go
        </button>
      ) : null}
    </div>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  to?: string;
  tone: 'blue' | 'amber' | 'rose';
}

function getSectionLabel(pathname: string) {
  if (pathname === '/') {
    return 'Dashboard';
  }
  if (pathname === '/subjects') {
    return 'Subjects';
  }
  if (pathname.startsWith('/subjects/')) {
    return 'Subject Overview';
  }
  if (pathname.startsWith('/topics/')) {
    return 'Topic';
  }
  if (pathname.startsWith('/entries/')) {
    return 'Entry';
  }
  if (pathname.startsWith('/problems/')) {
    return 'Problem';
  }
  if (pathname === '/search') {
    return 'Search';
  }
  if (pathname === '/review-queue') {
    return 'Review Queue';
  }
  if (pathname === '/study') {
    return 'Study Mode';
  }
  if (pathname === '/progress') {
    return 'Progress';
  }
  if (pathname === '/login') {
    return 'Authentication';
  }
  if (pathname === '/import') {
    return 'Import Workspace';
  }
  if (pathname === '/errors') {
    return 'Validation Feed';
  }
  return 'Knowledge Base';
}

function notificationToneClass(tone: NotificationItem['tone']) {
  if (tone === 'rose') {
    return 'border-rose-500/25 bg-rose-950/20 text-rose-300';
  }
  if (tone === 'amber') {
    return 'border-warning-500/25 bg-warning-900/15 text-warning-400';
  }
  return 'border-primary-500/25 bg-primary-900/20 text-primary-300';
}

export function TopNavShell({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions,
  className,
  contentClassName,
}: {
  searchPlaceholder: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useProgress();
  const { isConfigured, isLoading, user, isAdmin, signOut } = useAuth();
  const [draftQuery, setDraftQuery] = useState(searchValue ?? '');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const sectionLabel = getSectionLabel(location.pathname);
  const reviewQueue = getReviewQueueItems(state);
  const validationLogs = getValidationLogs();

  useEffect(() => {
    setDraftQuery(searchValue ?? '');
  }, [searchValue]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname, location.search]);

  const notifications: NotificationItem[] = [];

  if (reviewQueue.length > 0) {
    notifications.push({
      id: 'review',
      title: 'Review queue',
      detail: `${reviewQueue.length} item${reviewQueue.length === 1 ? '' : 's'} scheduled for review.`,
      to: '/review-queue',
      tone: reviewQueue.some((item) => item.tone === 'rose') ? 'rose' : 'amber',
    });
  }

  if (isAdmin && validationLogs.length > 0) {
    notifications.push({
      id: 'validation',
      title: 'Validation issues',
      detail: `${validationLogs.length} schema issue${validationLogs.length === 1 ? '' : 's'} detected in content/.`,
      to: '/errors',
      tone: 'rose',
    });
  }

  if (isConfigured && !isLoading && !user) {
    notifications.push({
      id: 'auth',
      title: 'Sign in available',
      detail: 'Sign in to sync progress and unlock admin tools.',
      to: '/login',
      tone: 'blue',
    });
  }

  const handleSearchSubmit = () => {
    const normalizedQuery = draftQuery.trim();
    const params = new URLSearchParams();
    const activeType = location.pathname === '/search' ? new URLSearchParams(location.search).get('type') : null;

    if (normalizedQuery) {
      params.set('q', normalizedQuery);
    }
    if (activeType && activeType !== 'all') {
      params.set('type', activeType);
    }

    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <header
      className={cx(
        'sticky top-0 z-30 border-b border-base-600 bg-base-700/95 backdrop-blur-md',
        className,
      )}
    >
      <div
        className={cx(
          'mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-6 py-3',
          contentClassName,
        )}
      >
        <div className="flex min-w-0 items-center gap-8">
          <BrandLockup compact subtitle={sectionLabel} />
        </div>
        <div className="flex min-w-0 items-center gap-4">
          <SearchField
            placeholder={searchPlaceholder}
            value={draftQuery}
            onChange={(value) => {
              setDraftQuery(value);
              onSearchChange?.(value);
            }}
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex sm:w-[280px]"
          />
          {actions ?? (
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((previous) => !previous)}
                  aria-expanded={notificationsOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-base-500 bg-base-600 text-text-300 transition-colors hover:text-text-100"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 ? (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
                      {notifications.length}
                    </span>
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-[320px] rounded-[8px] border border-base-600 bg-base-800 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-text-100">Notifications</div>
                      <span className="text-xs text-text-500">{notifications.length}</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="rounded-[8px] border border-base-600 bg-base-900/50 px-3 py-4 text-sm text-text-400">
                        No notifications right now.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notification) =>
                          notification.to ? (
                            <Link
                              key={notification.id}
                              to={notification.to}
                              onClick={() => setNotificationsOpen(false)}
                              className={cx(
                                'block rounded-[8px] border px-3 py-3 transition-colors hover:border-base-500',
                                notificationToneClass(notification.tone),
                              )}
                            >
                              <div className="text-sm font-semibold">{notification.title}</div>
                              <div className="mt-1 text-xs leading-5 text-current/80">{notification.detail}</div>
                            </Link>
                          ) : (
                            <div
                              key={notification.id}
                              className={cx('rounded-[8px] border px-3 py-3', notificationToneClass(notification.tone))}
                            >
                              <div className="text-sm font-semibold">{notification.title}</div>
                              <div className="mt-1 text-xs leading-5 text-current/80">{notification.detail}</div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              {!isConfigured ? (
                <span className="inline-flex h-10 items-center rounded-[8px] border border-base-500 bg-base-600/60 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-400">
                  Offline
                </span>
              ) : isLoading ? (
                <span className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-base-500 bg-base-600/60 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-400">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Auth
                </span>
              ) : user ? (
                <>
                  {isAdmin ? (
                    <span className="hidden items-center gap-2 rounded-[8px] border border-success-500/30 bg-success-900/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-success-400 sm:inline-flex">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin
                    </span>
                  ) : null}
                  <div className="hidden max-w-[220px] truncate rounded-[8px] border border-base-500 bg-base-600/60 px-3 py-2 text-sm text-text-200 sm:block">
                    {user.email}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void signOut();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-base-500 bg-base-600 px-3 text-sm font-medium text-text-200 transition-colors hover:text-text-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-primary-500/30 bg-primary-900/40 px-4 text-sm font-semibold text-primary-400 transition-colors hover:border-primary-400/50 hover:text-primary-300"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppTopNav({
  searchPlaceholder = 'Search theorems, problems, topics...',
  searchValue,
  onSearchChange,
  actions,
  className,
  contentClassName,
}: {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <TopNavShell
      searchPlaceholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={actions}
      className={className}
      contentClassName={contentClassName}
    />
  );
}

export function SidebarNavLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 rounded-[4px] px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-900/40 text-primary-400'
            : 'text-text-400 hover:bg-base-600/60 hover:text-text-200',
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Surface({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cx(
        'rounded-[8px] border border-base-600 bg-base-900/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'rose' | 'slate';
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    blue: 'border-primary-500/30 bg-primary-900/40 text-primary-400',
    green: 'border-success-500/30 bg-success-900/25 text-success-400',
    amber: 'border-warning-500/30 bg-warning-900/25 text-warning-500',
    rose: 'border-rose-500/30 bg-rose-950/30 text-rose-400',
    slate: 'border-base-500 bg-base-600/70 text-text-400',
  };

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-primary-500" />
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-text-100">{title}</h2>
      </div>
      {subtitle ? <p className="text-sm text-text-400">{subtitle}</p> : null}
    </div>
  );
}

export function InitialAvatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex h-12 w-12 items-center justify-center rounded-xl border border-base-500 bg-base-600 text-sm font-bold text-text-200',
        className,
      )}
    >
      {initials}
    </div>
  );
}
