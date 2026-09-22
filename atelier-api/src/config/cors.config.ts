import { INestApplication } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

export const corsConfig: CorsOptions = {
  origin: true,
  credentials: true,
};

export function setupCors(app: INestApplication): void {
  app.enableCors(corsConfig);
}
