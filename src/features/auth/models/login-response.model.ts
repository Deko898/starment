import { ApiProperty } from '@nestjs/swagger';
import { Role, UserType } from '@starment/shared';

export class LoginResponse {
  @ApiProperty({ example: 'd2c51f9b-85f1-4a7b-bf40-8e85b91d6a6b' })
  user_id!: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: 'System-level role of the user',
  })
  role!: Role;

  @ApiProperty({
    enum: UserType,
    example: UserType.FAN,
    description: 'Business persona (fan or creator)',
  })
  user_type!: UserType;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived JWT access token',
  })
  access_token!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Long-lived refresh token for session renewal',
  })
  refresh_token!: string;

  @ApiProperty({ example: 3600, description: 'Access token expiry in seconds' })
  expires_in!: number;
}
