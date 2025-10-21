import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatorStatus, OnboardingStatus } from '@starment/shared';

import { CreatorProfileWithRelations } from '.';

export class CreatorProfile {
  @ApiProperty({ example: 'John Smith', nullable: true })
  legal_name!: string | null;

  @ApiProperty({ example: 'instagram', nullable: true })
  largest_following_platform!: string | null;

  @ApiProperty({ example: 'john_insta', nullable: true })
  social_handle!: string | null;

  @ApiProperty({ example: 25000, nullable: true })
  follower_count!: number | null;
}

export class CreatorCommercial {
  @ApiProperty({
    example: 'not_started',
    enum: OnboardingStatus,
    nullable: true,
  })
  onboarding_status!: string | null;

  @ApiProperty({
    example: 'pending_review',
    enum: CreatorStatus,
    nullable: true,
  })
  creator_status!: string | null;
}

export class ProfileResponse {
  @ApiProperty({ example: '28eb6369-fe59-4d85-a083-fad1d01a483e' })
  id!: string;

  @ApiProperty({ example: 'creator', enum: ['fan', 'creator'] })
  user_type!: string;

  @ApiProperty({ example: 'user', enum: ['user', 'admin'] })
  role!: string;

  @ApiProperty({ example: 'John Creator' })
  display_name!: string;

  @ApiPropertyOptional({ example: 'Content creator and travel vlogger.' })
  bio?: string;

  @ApiProperty({ example: 'US' })
  country_code!: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-12' })
  date_of_birth?: string;

  @ApiPropertyOptional({ type: CreatorProfile })
  creator_profile?: CreatorProfile;

  @ApiPropertyOptional({ type: CreatorCommercial })
  creator_commercial?: CreatorCommercial;

  static fromDb(row: CreatorProfileWithRelations): ProfileResponse {
    const profile = new ProfileResponse();
    Object.assign(profile, row);

    // Supabase returns relations as arrays, extract first element
    if (row.creator_profile?.[0]) {
      profile.creator_profile = row.creator_profile[0];
    }
    if (row.creator_commercial?.[0]) {
      profile.creator_commercial = row.creator_commercial[0];
    }

    return profile;
  }
}
