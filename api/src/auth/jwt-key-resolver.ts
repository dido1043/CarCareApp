import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

/** Resolves the Supabase public signing key for a given token header. */
export const JWT_KEY_RESOLVER = Symbol('JWT_KEY_RESOLVER');

/**
 * Supabase signs access tokens with rotating ES256 keys published as a JWKS.
 * The set is fetched once and cached, so verification stays local to the
 * process; a refetch only happens when a token presents an unseen key id.
 */
export const jwtKeyResolverProvider: Provider = {
  provide: JWT_KEY_RESOLVER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): JWTVerifyGetKey =>
    createRemoteJWKSet(
      new URL(configService.getOrThrow<string>('supabase.jwksUrl')),
      {
        cacheMaxAge: 10 * 60 * 1000,
        cooldownDuration: 30 * 1000,
      },
    ),
};
