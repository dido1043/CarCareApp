import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { jwtKeyResolverProvider } from './jwt-key-resolver.js';

@Module({
  controllers: [AuthController],
  providers: [jwtKeyResolverProvider, AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
