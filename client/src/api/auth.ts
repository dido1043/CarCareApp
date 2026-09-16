import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Authentication goes straight to Supabase rather than through the NestJS
 * `/auth/login` endpoint. The API's endpoint exists so Swagger can mint a token;
 * the mobile client needs the full session — refresh token included — which only
 * the Supabase SDK manages for us.
 */

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpResult {
  session: Session | null;
  /** True when the project has email confirmation on and no session was issued. */
  requiresEmailConfirmation: boolean;
}

export const authApi = {
  async signIn({ email, password }: Credentials): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Sign-in returned no session');
    return data.session;
  },

  async signUp({ email, password }: Credentials): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return {
      session: data.session,
      requiresEmailConfirmation: data.session === null,
    };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};
