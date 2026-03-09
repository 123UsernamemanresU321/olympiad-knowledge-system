import { ShieldAlert } from 'lucide-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppTopNav, Surface } from '../layout/DesignShell';
import { useAuth } from '../../hooks/useAuth';

export function RequireAdmin() {
  const location = useLocation();
  const { isConfigured, isLoading, isProfileLoading, user, isAdmin } = useAuth();

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-base-700 text-text-100">
        <AppTopNav searchPlaceholder="Search..." />
        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[720px] items-center justify-center px-6">
          <Surface className="w-full p-8 text-center">
            <div className="text-lg font-semibold text-text-100">Checking account permissions...</div>
          </Surface>
        </main>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-base-700 text-text-100">
        <AppTopNav searchPlaceholder="Search..." />
        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[720px] items-center justify-center px-6">
          <Surface className="w-full p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-950/30 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-text-100">Supabase auth is not configured</h1>
            <p className="mt-3 text-sm leading-6 text-text-400">
              Add your Supabase project URL and anon key to the app environment before using admin routes.
            </p>
          </Surface>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-base-700 text-text-100">
        <AppTopNav searchPlaceholder="Search..." />
        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[720px] items-center justify-center px-6">
          <Surface className="w-full p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-950/30 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-text-100">Admin access required</h1>
            <p className="mt-3 text-sm leading-6 text-text-400">
              This route is available only to accounts marked as admin in Supabase profiles.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-primary-500 px-6 text-sm font-bold text-white transition-colors hover:bg-primary-400"
            >
              Return to dashboard
            </Link>
          </Surface>
        </main>
      </div>
    );
  }

  return <Outlet />;
}
