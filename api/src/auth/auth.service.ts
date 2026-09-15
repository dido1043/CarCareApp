import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { LoginResponseDto } from './dto/login-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { JWT_KEY_RESOLVER } from './jwt-key-resolver.js';
import type { AuthUser, SupabaseJwtPayload } from './types/auth-user.type.js';

const BEARER_SCHEME = /^Bearer$/i;

/**
 * Owns every detail of how a Supabase access token is validated.
 * Business modules depend on {@link AuthUser} only, so the verification
 * strategy can change here without touching them.
 */
@Injectable()
export class AuthService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly supabaseUrl: string;
  private readonly anonKey: string;

  constructor(
    @Inject(JWT_KEY_RESOLVER) private readonly keyResolver: JWTVerifyGetKey,
    configService: ConfigService,
  ) {
    this.issuer = configService.getOrThrow<string>('supabase.jwtIssuer');
    this.audience = configService.getOrThrow<string>('supabase.jwtAudience');
    this.supabaseUrl = configService.getOrThrow<string>('supabase.url');
    this.anonKey = configService.getOrThrow<string>('supabase.anonKey');
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const url = `${this.supabaseUrl}/auth/v1/token?grant_type=password`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.anonKey,
      },
      body: JSON.stringify({ email: dto.email, password: dto.password }),
    });

    if (!res.ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  /** Pulls the raw token out of an `Authorization: Bearer <token>` header. */
  extractBearerToken(authorizationHeader: string | undefined): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);

    if (!scheme || !BEARER_SCHEME.test(scheme) || !token || rest.length > 0) {
      return null;
    }

    return token;
  }

  /**
   * Verifies signature, expiry, issuer and audience against Supabase's cached
   * public keys. No network call is made on the hot path once keys are cached.
   */
  async verifyAccessToken(token: string): Promise<AuthUser> {
    let payload: SupabaseJwtPayload;

    try {
      const result = await jwtVerify<SupabaseJwtPayload>(
        token,
        this.keyResolver,
        {
          algorithms: ['ES256'],
          issuer: this.issuer,
          audience: this.audience,
        },
      );
      payload = result.payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new UnauthorizedException('Access token has no subject claim');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
