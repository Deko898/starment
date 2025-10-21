import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '@starment/core';
import type { RequestUser } from '@starment/shared';
import { ProfileResponse } from './models/profile-response.model';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller({ path: 'profile', version: '1' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /** 🔹 Get current user's profile (fan or creator) */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated user’s profile data' })
  @ApiExtraModels(ProfileResponse)
  @ApiOkResponse({
    description: 'Returns the full profile of the authenticated user.',
    schema: { $ref: getSchemaPath(ProfileResponse) },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT' })
  async getMyProfile(@CurrentUser() user: RequestUser): Promise<ProfileResponse> {
    return this.profileService.getCreatorProfile(user.id);
  }
}
