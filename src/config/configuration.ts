export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  host: process.env.HOST ?? 'localhost',

  nodeEnv: process.env.NODE_ENV ?? 'development',

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    resetSecret: process.env.JWT_RESET_SECRET!,
  },

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL!,
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    from: process.env.MAIL_FROM!,
  },

  otp: {
    pepper: process.env.OTP_PEPPER!,
  },

  google: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
  },
});
