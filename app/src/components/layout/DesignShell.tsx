import type { LucideIcon } from 'lucide-react';
import { Bell, Search, Sigma, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

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
  className,
}: {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
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
        readOnly={!onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-text-200 placeholder:text-text-500 focus:outline-none"
      />
    </div>
  );
}

interface TopNavItem {
  label: string;
  to: string;
}

export const APP_NAV_ITEMS: TopNavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Subjects', to: '/subjects' },
  { label: 'Search', to: '/search' },
  { label: 'Review Queue', to: '/review-queue' },
  { label: 'Progress', to: '/progress' },
  { label: 'Import', to: '/import' },
];

export function TopNavShell({
  navItems,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions,
  className,
  contentClassName,
}: {
  navItems: TopNavItem[];
  searchPlaceholder: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
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
        <div className="flex items-center gap-8">
          <BrandLockup compact />
          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'text-sm font-medium transition-colors',
                    isActive ? 'text-text-200' : 'text-text-400 hover:text-text-200',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex min-w-0 items-center gap-4">
          <SearchField
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
            className="hidden sm:flex sm:w-[280px]"
          />
          {actions ?? (
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-base-500 bg-base-600 text-text-300 transition-colors hover:text-text-100">
                <Bell className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-900/60 text-text-100 transition-colors hover:border-primary-400/50">
                <User className="h-4 w-4" />
              </button>
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
      navItems={APP_NAV_ITEMS}
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
