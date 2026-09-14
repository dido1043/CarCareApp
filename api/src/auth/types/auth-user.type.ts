import type { Request } from 'express';
import type { JWTPayload } from 'jose';

/**
 * Subset of the claims Supabase puts in an access token.
 * Only the claims the backend actually relies on are modelled.
 */
export interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
}

/** Identity of the caller, derived solely from a verified access token. */
export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
