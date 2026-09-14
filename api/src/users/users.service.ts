import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { UserProfileDto } from './dto/user-profile.dto.js';

@Injectable()
export class UsersService {
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
}
