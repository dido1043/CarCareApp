import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { jwtKeyResolverProvider } from './jwt-key-resolver.js';

@Module({
  providers: [jwtKeyResolverProvider, AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
