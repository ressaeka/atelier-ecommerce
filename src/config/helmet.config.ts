import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export const helmetConfig: Parameters<typeof helmet>[0] = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [`'self'`],
      styleSrc: [`'self'`, `'unsafe-inline'`],
      imgSrc: [`'self'`, 'data:', 'https://validator.swagger.io'],
      scriptSrc: [`'self'`, `'unsafe-inline'`],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
};

export function setupHelmet(app: INestApplication): void {
  app.use(helmet(helmetConfig));
}
