import { envSchema, type Env } from './validation.js';

export interface AppConfig {
  nodeEnv: Env['NODE_ENV'];
  port: number;
  isProduction: boolean;
  database: {
    url: string;
  };
  supabase: {
    url: string;
    /** Issuer embedded in Supabase-issued access tokens. */
    jwtIssuer: string;
    /** Audience Supabase assigns to signed-in (non-anonymous) users. */
    jwtAudience: string;
    /** Public signing keys; tokens are ES256, so no shared secret is needed. */
    jwksUrl: string;
  };
}

export function configuration(): AppConfig {
  const env = envSchema.parse(process.env);
  const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, '');

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    isProduction: env.NODE_ENV === 'production',
    database: {
      url: env.DATABASE_URL,
    },
    supabase: {
      url: supabaseUrl,
      jwtIssuer: `${supabaseUrl}/auth/v1`,
      jwtAudience: 'authenticated',
      jwksUrl: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    },
  };
}
