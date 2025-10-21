import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
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

import { AuthJwtGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterCreatorDto, RegisterDto } from './dto';
import { LoginResponse } from './models';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 🔹 Register a new user */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register with email/password' })
  @ApiExtraModels(LoginResponse)
  @ApiOkResponse({
    description:
      'Returns a message if verification required, or a login session if auto-confirmed.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(LoginResponse) },
        {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Account created. Please check your email to confirm your account.',
            },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid signup attempt' })
  async register(@Body() dto: RegisterDto): Promise<LoginResponse | { message: string }> {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('register/creator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a creator (with extended profile info)' })
  @ApiExtraModels(LoginResponse)
  @ApiOkResponse({
    description:
      'Returns a message if verification required, or a login session if auto-confirmed.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(LoginResponse) },
        {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Account created. Please check your email to confirm your account.',
            },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid signup attempt' })
  async registerCreator(
    @Body() dto: RegisterCreatorDto,
  ): Promise<LoginResponse | { message: string }> {
    return this.authService.registerCreator(dto);
  }

  /** 🔹 Login existing user */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email/password' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto.email, dto.password);
  }

  /** 🔹 Refresh expired access token */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token with refresh_token' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<LoginResponse> {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthJwtGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Logout' })
  @ApiOkResponse({ description: 'User successfully logged out' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT' })
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    return this.authService.logout(user.jwt);
  }
}
