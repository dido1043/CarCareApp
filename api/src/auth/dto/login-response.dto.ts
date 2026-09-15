import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token — paste this into the Authorize dialog' })
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ description: 'Seconds until the access token expires' })
  expiresIn: number;

  @ApiProperty({ example: 'bearer' })
  tokenType: string;
}
