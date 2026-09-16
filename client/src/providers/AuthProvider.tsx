import { authApi, type Credentials, type SignUpResult } from '@/api/auth';
import { setAuthTokenProvider, setUnauthorizedHandler } from '@/api/client';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True until the stored session has been read back from the keychain. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (credentials: Credentials) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  /**
   * The API client asks for a token per request rather than holding one, so a
   * token refreshed by Supabase mid-session is picked up without re-wiring.
   */
  useEffect(() => {
    setAuthTokenProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
    return () => setAuthTokenProvider(async () => null);
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  /**
   * A rejected token means the cached data belongs to a session that no longer
   * exists; clearing it stops a stale garage flashing up behind the login form.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void supabase.auth.signOut();
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const signIn = useCallback(async (credentials: Credentials) => {
    const next = await authApi.signIn(credentials);
    setSession(next);
  }, []);

  const signUp = useCallback(async (credentials: Credentials) => {
    const result = await authApi.signUp(credentials);
    if (result.session) setSession(result.session);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await authApi.signOut();
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  const sendPasswordReset = useCallback(async (email: string) => {
    await authApi.sendPasswordReset(email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isAuthenticated: session !== null,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
    }),
    [session, isLoading, signIn, signUp, signOut, sendPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
