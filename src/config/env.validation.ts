import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  HOST: z.string().default('localhost'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),

  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  JWT_RESET_SECRET: z.string().min(32),

  DATABASE_URL: z.string().startsWith('postgresql://'),

  REDIS_URL: z.string().startsWith('redis://'),

  RESEND_API_KEY: z.string().startsWith('re_'),

  MAIL_FROM: z.string().email(),

  OTP_PEPPER: z.string().min(16),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  GOOGLE_FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  return envSchema.parse(config);
}
