import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Get,
  Res,
  UseGuards,
} from '@nestjs/common';

import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  authSuccessResponse,
  forgotPasswordApiBody,
  generalMessageResponseSchema,
  loginApiBody,
  logoutApiBody,
  refreshTokenApiBody,
  refreshTokenResponseSchema,
  registerApiBody,
  registerResponseSchema,
  resetPasswordApiBody,
  verifyOtpApiBody,
  verifyOtpResponseSchema,
} from './auth.swagger.js';

import { AuthService } from './auth.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { registerSchema, RegisterDto } from './dto/register.js';

import { loginSchema, LoginDto } from './dto/login.js';

import { RefreshTokenDto, refreshTokenSchema } from './dto/refresh.token.js';

import type { Request, Response } from 'express';

import {
  ForgotPasswordDto,
  forgotPasswordSchema,
} from './dto/forgot.password.js';

import { VerifyDto, verifyOtpSchema } from './dto/verify.otp.js';

import { ResetPasswordDto, resetPasswordSchema } from './dto/reset.password.js';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

type GoogleUser = {
  googleId: string;
  email?: string;
  name?: string;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user as GoogleUser);

    const frontendUrl = this.configService.get<string>(
      'GOOGLE_FRONTEND_URL',
      'http://localhost:5173',
    );

    const data = result.data as {
      access_token: string;
      refresh_token: string;
    };

    const params = new URLSearchParams({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registrasi pengguna baru',
  })
  @ApiBody(registerApiBody)
  @ApiResponse(registerResponseSchema)
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal',
  })
  @ApiResponse({
    status: 409,
    description: 'Username, email, atau nomor telepon sudah terdaftar',
  })
  register(
    @Body(new ZodValidationPipe(registerSchema))
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login menggunakan username, email, atau nomor telepon',
  })
  @ApiBody(loginApiBody)
  @ApiResponse(authSuccessResponse)
  @ApiResponse({
    status: 401,
    description: 'Username, email, nomor telepon, atau password salah',
  })
  login(
    @Body(new ZodValidationPipe(loginSchema))
    dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.authService.login(dto, req.ip ?? 'unknown');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token menggunakan refresh token',
  })
  @ApiBody(refreshTokenApiBody)
  @ApiResponse(refreshTokenResponseSchema)
  @ApiResponse({
    status: 401,
    description:
      'Refresh token tidak valid, reuse terdeteksi, atau sudah kadaluarsa',
  })
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(dto);
  }

  @Post('forgot')
  @ApiOperation({
    summary: 'Permintaan OTP reset password melalui email',
  })
  @ApiBody(forgotPasswordApiBody)
  @ApiResponse(generalMessageResponseSchema)
  @ApiResponse({
    status: 429,
    description: 'Terlalu banyak permintaan reset password',
  })
  forgot(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    dto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.forgot(dto, req.ip ?? 'unknown');
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi OTP reset password',
  })
  @ApiBody(verifyOtpApiBody)
  @ApiResponse(verifyOtpResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'OTP tidak valid atau sudah kadaluarsa',
  })
  @ApiResponse({
    status: 429,
    description: 'Terlalu banyak percobaan OTP',
  })
  verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema))
    dto: VerifyDto,
    @Req() req: Request,
  ) {
    return this.authService.verifyOtp(dto, req.ip ?? 'unknown');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password menggunakan resetToken',
  })
  @ApiBody(resetPasswordApiBody)
  @ApiResponse(generalMessageResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Reset token tidak valid atau sudah kadaluarsa',
  })
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema))
    dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout akun dan revoke session',
  })
  @ApiBody(logoutApiBody)
  @ApiResponse(generalMessageResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Refresh token tidak valid',
  })
  logout(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    dto: RefreshTokenDto,
  ) {
    return this.authService.logout(dto);
  }
}
