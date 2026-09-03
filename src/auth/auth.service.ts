import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { randomInt, randomUUID } from 'crypto';

import { UsersService } from '../users/users.service.js';
import { successResponse } from '../common/helpers/response.helper.js';

import {
  comparePassword,
  hashPassword,
} from '../common/helpers/password.helper.js';

import { type RegisterDto } from './dto/register.js';
import { type LoginDto } from './dto/login.js';
import { type RefreshTokenDto } from './dto/refresh.token.js';
import { type ForgotPasswordDto } from './dto/forgot.password.js';
import { type VerifyDto } from './dto/verify.otp.js';
import { type ResetPasswordDto } from './dto/reset.password.js';

import { RedisService } from '../common/redis/redis.service.js';
import { MailService } from '../common/mail/mail.service.js';

import { LoginRateLimitService } from './services/login-rate-limit.service.js';
import { ForgotRateLimitService } from './services/forgot-rate-limit.service.js';
import { OtpRateLimitService } from './services/otp-rate-limit.service.js';

import type { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly loginRateLimitService: LoginRateLimitService,
    private readonly forgotRateLimitService: ForgotRateLimitService,
    private readonly otpRateLimitService: OtpRateLimitService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await hashPassword(dto.password);

    const user = await this.usersService.createUser({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
    });

    void this.mailService
      .sendWelcomeEmail(user.email, user.username)
      .catch((error) => {
        this.logger.error(
          `Welcome email gagal dikirim: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });

    return successResponse(user, 'User berhasil didaftarkan');
  }

  async login(dto: LoginDto, ip: string) {
    const identifier = dto.identifier.trim();

    const user =
      await this.usersService.findByIdentifierWithPassword(identifier);

    if (!user) {
      await this.loginRateLimitService.handleFailure(identifier, ip);

      throw new UnauthorizedException(
        'Username, email, nomor telepon, atau password salah',
      );
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);

    if (!isPasswordValid) {
      await this.loginRateLimitService.handleFailure(identifier, ip);

      throw new UnauthorizedException(
        'Username, email, nomor telepon, atau password salah',
      );
    }

    await this.loginRateLimitService.resetUsername(identifier);

    /*
     * Access Token
     *
     * Hanya menyimpan identity user.
     * Role dan permission tidak disimpan di JWT.
     */
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
      } satisfies JwtPayload,
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_EXPIRES_IN',
        ) as StringValue,
      },
    );

    /*
     * Refresh Token Family
     */
    const familyId = randomUUID();

    /*
     * Unique JTI untuk refresh token
     */
    const refreshTokenJti = randomUUID();

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        jti: refreshTokenJti,
        familyId,
      },
      {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>(
          'jwt.refreshExpiresIn',
        ) as StringValue,
      },
    );

    const ttl = 7 * 24 * 60 * 60;

    /*
     * Simpan session/family
     */
    await this.redisService.set(`family:${familyId}`, `active:${user.id}`, ttl);

    /*
     * Simpan refresh token
     */
    await this.redisService.set(
      `refresh:${refreshTokenJti}`,
      `active:${user.id}:${familyId}`,
      ttl,
    );

    /*
     * Track session berdasarkan user.
     *
     * Digunakan saat revoke seluruh session user.
     */
    await this.redisService.sAdd(
      `user_sessions:${user.id}`,
      `family:${familyId}`,
      `refresh:${refreshTokenJti}`,
    );

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      'Login berhasil',
    );
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      /*
       * Verify signature dan expiration refresh token.
       */
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        jti: string;
        familyId: string;
      }>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });

      /*
       * Pastikan claim security tersedia.
       */
      if (!payload.jti || !payload.familyId) {
        throw new UnauthorizedException('Refresh token tidak valid');
      }

      const familyKey = `family:${payload.familyId}`;

      /*
       * Ambil status session/family.
       */
      const family = await this.redisService.get(familyKey);

      if (!family) {
        throw new UnauthorizedException(
          'Session tidak valid atau sudah kadaluarsa',
        );
      }

      /*
       * Family sudah direvoke.
       */
      if (family.startsWith('revoked:')) {
        throw new UnauthorizedException('Session sudah dicabut');
      }

      const oldKey = `refresh:${payload.jti}`;

      /*
       * Cek refresh token.
       */
      const session = await this.redisService.get(oldKey);

      if (!session) {
        throw new UnauthorizedException(
          'Refresh token tidak valid atau sudah kadaluarsa',
        );
      }

      /*
       * Token lama sudah revoked.
       *
       * Berarti kemungkinan terjadi reuse.
       */
      if (session.startsWith('revoked:')) {
        await this.redisService.set(
          familyKey,
          `revoked:${payload.sub}`,
          7 * 24 * 60 * 60,
        );

        throw new UnauthorizedException('Refresh token reuse detected');
      }

      /*
       * Pastikan user masih ada.
       */
      const user = await this.usersService.findById(payload.sub);

      /*
       * Claim refresh token secara atomik.
       *
       * Kalau request lain lebih dulu berhasil
       * claim token yang sama, request ini dianggap reuse.
       */
      const claimed = await this.redisService.setIfNotExists(
        oldKey,
        `revoked:${user.id}`,
        7 * 24 * 60 * 60,
      );

      if (!claimed) {
        await this.redisService.set(
          familyKey,
          `revoked:${payload.sub}`,
          7 * 24 * 60 * 60,
        );

        throw new UnauthorizedException('Refresh token reuse detected');
      }

      /*
       * Generate access token baru.
       *
       * Minimal payload: sub.
       */
      const newAccessToken = await this.jwtService.signAsync(
        {
          sub: user.id,
        } satisfies JwtPayload,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as StringValue,
        },
      );

      /*
       * Generate JTI baru.
       */
      const newJti = randomUUID();

      /*
       * Generate refresh token baru.
       *
       * Family ID tetap sama.
       */
      const newRefreshToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          jti: newJti,
          familyId: payload.familyId,
        },
        {
          secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
          expiresIn: this.configService.getOrThrow<string>(
            'jwt.refreshExpiresIn',
          ) as StringValue,
        },
      );

      const ttl = 7 * 24 * 60 * 60;

      /*
       * Simpan refresh token baru.
       */
      await this.redisService.set(
        `refresh:${newJti}`,
        `active:${user.id}:${payload.familyId}`,
        ttl,
      );

      /*
       * Track refresh token baru.
       */
      await this.redisService.sAdd(
        `user_sessions:${user.id}`,
        `refresh:${newJti}`,
      );

      return successResponse(
        {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        },
        'Token berhasil diperbarui',
      );
    } catch (error) {
      /*
       * Jangan bungkus ulang UnauthorizedException.
       */
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Refresh token tidak valid atau sudah kadaluarsa',
      );
    }
  }

  async forgot(dto: ForgotPasswordDto, ip: string) {
    await this.forgotRateLimitService.handleRequest(dto.email, ip);

    const user = await this.usersService.findByEmail(dto.email);

    /*
     * Generic response untuk mencegah
     * user enumeration.
     */
    if (!user) {
      this.logger.warn('Password reset requested for unknown email');

      return successResponse(
        null,
        'Jika email terdaftar, OTP reset password akan dikirim',
      );
    }

    const otp = randomInt(100000, 1000000).toString();

    const hashedOtp = await hashPassword(otp);

    const expiresInMinutes = 10;
    const ttl = expiresInMinutes * 60;
    const otpKey = `otp:${user.email}`;

    await this.otpRateLimitService.reset(user.email);

    await this.redisService.set(otpKey, hashedOtp, ttl);

    try {
      await this.mailService.sendResetPasswordOtp({
        to: user.email,
        otp,
        expiresInMinutes,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send password reset OTP',
        error instanceof Error ? error.stack : String(error),
      );

      /*
       * OTP gagal dikirim → jangan biarkan
       * OTP tetap aktif.
       */
      await this.redisService.del(otpKey);

      throw error;
    }

    return successResponse(
      null,
      'Jika email terdaftar, OTP reset password akan dikirim',
    );
  }

  async verifyOtp(dto: VerifyDto, ip: string) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('OTP tidak valid atau sudah kadaluarsa');
    }

    const otpKey = `otp:${user.email}`;

    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      throw new UnauthorizedException('OTP tidak valid atau sudah kadaluarsa');
    }

    const isOtpValid = await comparePassword(dto.otp.toString(), storedOtp);

    if (!isOtpValid) {
      await this.otpRateLimitService.handleAttempt(user.email, ip);

      throw new UnauthorizedException('OTP tidak valid atau sudah kadaluarsa');
    }

    /*
     * OTP valid → buat reset token.
     */
    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        purpose: 'password-reset',
      },
      {
        secret: this.configService.getOrThrow<string>('jwt.resetSecret'),
        expiresIn: '10m',
      },
    );

    /*
     * OTP single-use.
     */
    await this.redisService.del(otpKey);

    await this.otpRateLimitService.reset(user.email);

    return successResponse(
      {
        resetToken,
      },
      'OTP berhasil diverifikasi',
    );
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: {
      sub: number;
      purpose: string;
    };

    /*
     * Verify reset token.
     */
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: number;
        purpose: string;
      }>(dto.resetToken, {
        secret: this.configService.getOrThrow<string>('jwt.resetSecret'),
      });
    } catch {
      throw new UnauthorizedException(
        'Reset token tidak valid atau sudah kadaluarsa',
      );
    }

    /*
     * Pastikan token memang untuk
     * password reset.
     */
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Reset token tidak valid');
    }

    /*
     * Pastikan user masih ada.
     */
    const user = await this.usersService.findById(payload.sub);

    /*
     * Hash password baru.
     */
    const hashedPassword = await hashPassword(dto.newPassword);

    /*
     * Update password.
     */
    await this.usersService.updatePassword(user.id, hashedPassword);

    /*
     * Password berubah →
     * semua session lama dicabut.
     */
    await this.revokeAllUserSessions(user.id);

    return successResponse(null, 'Password berhasil direset');
  }

  async logout(dto: RefreshTokenDto) {
    try {
      /*
       * Verify refresh token.
       */
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        jti: string;
        familyId: string;
      }>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });

      if (!payload.jti || !payload.familyId) {
        throw new UnauthorizedException('Refresh token tidak valid');
      }

      const familyKey = `family:${payload.familyId}`;

      /*
       * Pastikan family masih ada.
       */
      const family = await this.redisService.get(familyKey);

      if (!family) {
        throw new UnauthorizedException(
          'Session tidak valid atau sudah kadaluarsa',
        );
      }

      /*
       * Revoke seluruh family.
       */
      await this.redisService.set(
        familyKey,
        `revoked:${payload.sub}`,
        7 * 24 * 60 * 60,
      );

      return successResponse(null, 'Logout berhasil');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }

  /*
   * Hapus seluruh session user.
   */
  private async revokeAllUserSessions(userId: number): Promise<void> {
    const sessionSetKey = `user_sessions:${userId}`;

    const keys = await this.redisService.sMembers(sessionSetKey);

    if (keys.length === 0) {
      return;
    }

    await Promise.all(keys.map((key) => this.redisService.del(key)));

    await this.redisService.del(sessionSetKey);
  }
}
