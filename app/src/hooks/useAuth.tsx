import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type AuthProfile,
  fetchProfile,
  getCurrentSession,
  isSupabaseConfigured,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  supabase,
} from '../lib/supabase';

interface AuthContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => ReturnType<typeof signInWithPassword>;
  signUp: (email: string, password: string) => ReturnType<typeof signUpWithPassword>;
  signOut: () => ReturnType<typeof signOut>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;

    void getCurrentSession()
      .then((nextSession) => {
        if (!active) {
          return;
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      })
      .catch((error) => {
        console.error('Failed to load Supabase session.', error);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    let active = true;
    setIsProfileLoading(true);

    void fetchProfile(user.id)
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch((error) => {
        console.error('Failed to load Supabase profile.', error);
        if (active) {
          setProfile(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        isConfigured: isSupabaseConfigured,
        isLoading,
        isProfileLoading,
        session,
        user,
        profile,
        isAdmin: Boolean(profile?.is_admin),
        signIn: signInWithPassword,
        signUp: signUpWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
