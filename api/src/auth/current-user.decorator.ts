import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthUser,
} from './types/auth-user.type.js';

/**
 * Resolves the caller identity that {@link AuthGuard} attached to the request.
 * Routes using it must be guarded, otherwise no user is present.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('No authenticated user on request');
    }

    return request.user;
  },
);
