import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { PrismaService } from '../database/prisma.service.js';
import { UserProfileDto } from './dto/user-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Built from the verified token only — never from client-supplied input —
   * so a caller cannot ask for somebody else's profile.
   */
  getProfile(user: AuthUser): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Supabase Auth owns the identity in `auth.users`; this database only keeps
   * an application-side profile row. Nothing copies one across on sign-up, so
   * the row is created on first use instead — any write that points at
   * `users.id` through a foreign key must call this first.
   */
  async ensureProvisioned(user: AuthUser): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email },
      update: { email: user.email },
    });
  }
}
