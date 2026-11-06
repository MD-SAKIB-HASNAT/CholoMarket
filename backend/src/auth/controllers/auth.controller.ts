import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, type AuthUser, CurrentUser, RolesGuard } from 'src/auth';
import {
  RequestOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from 'src/auth/dto/auth.dto';
import { AuthService } from 'src/auth/services/auth.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Sends a 6-digit code by SMS. In development the code is returned as `devCode`. */
  @HttpCode(200)
  @Post('otp/request')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return {
      message: 'Auth created successfully',
      result: await this.auth.requestOtp(dto.phone),
    };
  }

  /** Logs in (creating the account on first login) and returns a JWT. */
  @HttpCode(200)
  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return {
      message: 'Verify otp completed successfully',
      result: await this.auth.verifyOtp(dto),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return {
      message: 'Auth fetched successfully',
      result: await this.auth.me(user.id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch('me')
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return {
      message: 'Auth updated successfully',
      result: await this.auth.updateProfile(user.id, dto),
    };
  }
}
