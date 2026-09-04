import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './config/swagger.config.js';
import { setupCors } from './config/cors.config.js';
import { setupHelmet } from './config/helmet.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupHelmet(app);
  setupCors(app);

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  setupSwagger(app);

  const host = config.get<string>('HOST') ?? 'localhost';
  const port = config.get<number>('PORT') ?? 4000;

  await app.listen(port, host);

  console.log(`Server running at http://${host}:${port}`);
  console.log(`Swagger Docs: http://${host}:${port}/api/docs`);
}

void bootstrap();
