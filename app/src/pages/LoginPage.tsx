import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppTopNav, Surface } from '../components/layout/DesignShell';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'sign-in' | 'sign-up';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured, isLoading, user, isAdmin, signIn, signUp } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('erichuang.shangjing@outlook.com');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, navigate, redirectTo, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      if (mode === 'sign-in') {
        const { error } = await signIn(email, password);
        if (error) {
          throw error;
        }
        navigate(redirectTo, { replace: true });
      } else {
        const { data, error } = await signUp(email, password);
        if (error) {
          throw error;
        }

        setMessage(
          data.session
            ? 'Account created and signed in.'
            : 'Account created. Check your email if confirmation is required before signing in.',
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-700 text-text-100">
      <AppTopNav searchPlaceholder="Search knowledge..." />
      <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-[1120px] flex-col justify-center gap-8 px-6 py-10 lg:flex-row lg:items-center">
        <div className="max-w-[520px] space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-900/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Supabase Auth
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-[-0.05em] text-text-100">
            Sign in to sync progress and unlock admin tools.
          </h1>
          <p className="text-base leading-7 text-text-400">
            Authentication is handled by Supabase. Admin access is granted server-side through the profile setup, not by trusting the browser.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Surface className="p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-text-500">Progress sync</div>
              <div className="mt-3 text-sm leading-6 text-text-300">
                Signed-in accounts can sync the local progress snapshot to Supabase when enabled.
              </div>
            </Surface>
            <Surface className="p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-text-500">Admin scope</div>
              <div className="mt-3 text-sm leading-6 text-text-300">
                Your email becomes admin from the database trigger in `supabase/setup.sql`.
              </div>
            </Surface>
          </div>
        </div>

        <Surface className="w-full max-w-[420px] p-6">
          {!isConfigured ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-text-100">Supabase not configured</h2>
              <p className="text-sm leading-6 text-text-400">
                Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your local `.env` and GitHub secrets.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 rounded-[8px] bg-base-600/60 p-1">
                {([
                  ['sign-in', 'Sign In'],
                  ['sign-up', 'Create Account'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-semibold transition-colors ${
                      mode === value
                        ? 'bg-primary-500 text-white'
                        : 'text-text-400 hover:text-text-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-300" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-[8px] border border-base-500 bg-base-900/60 px-4 text-sm text-text-100 placeholder:text-text-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-300" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-[8px] border border-base-500 bg-base-900/60 px-4 text-sm text-text-100 placeholder:text-text-500 focus:outline-none"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                {message ? (
                  <div className="rounded-[8px] border border-success-500/30 bg-success-900/15 px-4 py-3 text-sm text-success-400">
                    {message}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-[8px] border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-primary-500 text-sm font-bold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Working...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-5 text-sm text-text-500">
                {user ? (
                  <span>
                    Signed in as {user.email}
                    {isAdmin ? ' (admin).' : '.'}
                  </span>
                ) : (
                  <span>
                    After account creation, sign in with <strong className="text-text-300">erichuang.shangjing@outlook.com</strong> to receive admin access from the database setup.
                  </span>
                )}
              </div>
            </>
          )}

          <div className="mt-6 border-t border-base-600 pt-4 text-sm text-text-500">
            <Link to={redirectTo} className="font-medium text-primary-400">
              Return without signing in
            </Link>
          </div>
        </Surface>
      </main>
    </div>
  );
}
