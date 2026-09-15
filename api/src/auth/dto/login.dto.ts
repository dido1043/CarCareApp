import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecret', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
