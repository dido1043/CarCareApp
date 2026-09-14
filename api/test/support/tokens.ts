import { exportJWK, generateKeyPair, type JSONWebKeySet, SignJWT } from 'jose';

export const TEST_SUPABASE_URL = 'https://test-project.supabase.co';
export const TEST_ISSUER = `${TEST_SUPABASE_URL}/auth/v1`;
export const TEST_AUDIENCE = 'authenticated';
export const TEST_KID = 'test-signing-key';
export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';

const projectKeyPair = await generateKeyPair('ES256', { extractable: true });
const foreignKeyPair = await generateKeyPair('ES256', { extractable: true });

/** Stands in for the JWKS Supabase publishes for the project. */
export const testJwks: JSONWebKeySet = {
  keys: [
    {
      ...(await exportJWK(projectKeyPair.publicKey)),
      alg: 'ES256',
      kid: TEST_KID,
    },
  ],
};

/** A key that is not in the published JWKS, for forged-token tests. */
export const foreignPrivateKey = foreignKeyPair.privateKey;

interface TokenOptions {
  sub?: string | null;
  email?: string;
  role?: string;
  issuer?: string;
  audience?: string;
  issuedAt?: number;
  expiresAt?: number;
  signingKey?: CryptoKey;
  kid?: string;
}

/** Mints a Supabase-shaped ES256 token so tests need no real Supabase project. */
export async function signAccessToken(
  options: TokenOptions = {},
): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const {
    sub = TEST_USER_ID,
    email = 'driver@example.com',
    role = 'authenticated',
    issuer = TEST_ISSUER,
    audience = TEST_AUDIENCE,
    issuedAt = nowInSeconds,
    expiresAt = nowInSeconds + 3600,
    signingKey = projectKeyPair.privateKey,
    kid = TEST_KID,
  } = options;

  let builder = new SignJWT({ email, role })
    .setProtectedHeader({ alg: 'ES256', kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt);

  if (sub !== null) {
    builder = builder.setSubject(sub);
  }

  return builder.sign(signingKey);
}

export const testSupabaseConfig = () => ({
  supabase: {
    url: TEST_SUPABASE_URL,
    jwtIssuer: TEST_ISSUER,
    jwtAudience: TEST_AUDIENCE,
    jwksUrl: `${TEST_SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  },
});
