import Constants from 'expo-constants';

/**
 * Only `EXPO_PUBLIC_*` variables reach the bundle, and everything here is
 * public by design: the API base URL and the Supabase anon key. Service-role
 * keys must never appear in this file or anywhere else in the client.
 */

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object') return undefined;
  const value = (extra as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy client/.env.example to client/.env and fill it in, ` +
        'then restart the Expo dev server.',
    );
  }
  return value;
}

/** Physical devices cannot reach the host's `localhost`. */
const DEFAULT_API_URL = 'http://localhost:3030/api/v1';

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_URL ?? readExtra('apiBaseUrl') ?? DEFAULT_API_URL,
  supabaseUrl: required(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? readExtra('supabaseUrl'),
  ),
  supabaseAnonKey: required(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? readExtra('supabaseAnonKey'),
  ),
  /** Request timeout for every API call, in milliseconds. */
  apiTimeoutMs: 15_000,
} as const;
