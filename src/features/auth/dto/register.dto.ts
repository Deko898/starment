import { ApiProperty } from '@nestjs/swagger';
import { SocialPlatform } from '@starment/shared';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the new user',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Password (min. 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterCreatorDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'John Creator' })
  @IsString()
  display_name!: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  legal_name!: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  country_code!: string;

  @ApiProperty({ example: '+15551234567' })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({ example: '1990-05-12' })
  @IsDateString()
  date_of_birth!: string;

  @ApiProperty({ enum: SocialPlatform, example: SocialPlatform.INSTAGRAM })
  @IsEnum(SocialPlatform)
  largest_following_platform!: SocialPlatform;

  @ApiProperty({ example: 'john_insta' })
  @IsString()
  social_handle!: string;

  @ApiProperty({ example: 25000 })
  @IsInt()
  @Min(0)
  follower_count!: number;
}
