import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Non-sensitive projection of the verified access token. */
export class UserProfileDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Supabase Auth user id (JWT `sub` claim)',
  })
  id: string;

  @ApiPropertyOptional({ format: 'email' })
  email?: string;

  @ApiPropertyOptional({ example: 'authenticated' })
  role?: string;
}
