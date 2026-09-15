import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { createLocalJWKSet } from 'jose';
import { AuthService } from '../../src/auth/auth.service.js';
import {
  foreignPrivateKey,
  signAccessToken,
  TEST_ANON_KEY,
  TEST_AUDIENCE,
  TEST_ISSUER,
  TEST_SUPABASE_URL,
  TEST_USER_ID,
  testJwks,
} from '../support/tokens.js';

const configValues: Record<string, string> = {
  'supabase.jwtIssuer': TEST_ISSUER,
  'supabase.jwtAudience': TEST_AUDIENCE,
  'supabase.url': TEST_SUPABASE_URL,
  'supabase.anonKey': TEST_ANON_KEY,
};

const configService = {
  getOrThrow: (key: string): string => {
    const value = configValues[key];
    if (value === undefined) {
      throw new Error(`Unexpected config key: ${key}`);
    }
    return value;
  },
} as unknown as ConfigService;

describe('AuthService', () => {
  const service = new AuthService(createLocalJWKSet(testJwks), configService);

  describe('extractBearerToken', () => {
    it('reads the token from a well formed header', () => {
      expect(service.extractBearerToken('Bearer abc.def.ghi')).toBe(
        'abc.def.ghi',
      );
    });

    it('accepts the scheme case-insensitively', () => {
      expect(service.extractBearerToken('bearer abc')).toBe('abc');
    });

    it.each([
      ['missing header', undefined],
      ['empty header', ''],
      ['scheme only', 'Bearer'],
      ['wrong scheme', 'Token abc'],
      ['no scheme', 'abc.def.ghi'],
      ['extra segments', 'Bearer abc def'],
    ])('rejects %s', (_label, header) => {
      expect(service.extractBearerToken(header)).toBeNull();
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the identity carried by a valid token', async () => {
      const token = await signAccessToken();

      await expect(service.verifyAccessToken(token)).resolves.toEqual({
        id: TEST_USER_ID,
        email: 'driver@example.com',
        role: 'authenticated',
      });
    });

    it.each([
      ['a malformed token', async () => 'not-a-jwt'],
      [
        'a token signed by a key outside the JWKS',
        () => signAccessToken({ signingKey: foreignPrivateKey }),
      ],
      [
        'a token referencing an unknown key id',
        () => signAccessToken({ kid: 'some-other-kid' }),
      ],
      [
        'an expired token',
        () => {
          const past = Math.floor(Date.now() / 1000) - 3600;
          return signAccessToken({ issuedAt: past, expiresAt: past + 60 });
        },
      ],
      [
        'a token from another issuer',
        () => signAccessToken({ issuer: 'https://evil.example.com/auth/v1' }),
      ],
      [
        'a token for another audience',
        () => signAccessToken({ audience: 'anon' }),
      ],
      ['a token without a subject', () => signAccessToken({ sub: null })],
    ])('rejects %s', async (_label, makeToken) => {
      const token = await makeToken();

      await expect(service.verifyAccessToken(token)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an HS256 token even if it is otherwise well formed', async () => {
      const { SignJWT } = await import('jose');
      const hsToken = await new SignJWT({ role: 'authenticated' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(TEST_USER_ID)
        .setIssuer(TEST_ISSUER)
        .setAudience(TEST_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode('a-shared-secret-value-0123456789'));

      await expect(service.verifyAccessToken(hsToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
