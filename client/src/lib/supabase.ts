import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env } from './env';
import { secureStorage } from './secureStorage';

/**
 * Supabase owns authentication end to end: it issues the access token, refreshes
 * it, and persists the session to the keychain. The NestJS API only ever
 * verifies the token it is handed, so the client never sees a password again
 * after the sign-in call.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar for Supabase to read a session out of.
    detectSessionInUrl: false,
  },
});

/**
 * Supabase refreshes tokens on a timer, which the OS suspends in the
 * background. Pausing and resuming with the app keeps that timer honest.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
