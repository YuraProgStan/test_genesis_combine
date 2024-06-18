import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response } from 'express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const configService = app.get(ConfigService);

  const limiter = rateLimit({
    windowMs: configService.get('THROTTLE_WINDOW_MS'),
    limit: configService.get('THROTTLE_LIMIT'),
  });

  app.use('/graphql', limiter);
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve static files from the docs directory
  app.useStaticAssets(join(__dirname, '..', 'docs'));

  // Add route for serving the documentation
  app.getHttpAdapter().get('/docs', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '..', 'docs', 'index.html'));
  });

  // Add route for serving the Playground
  app.getHttpAdapter().get('/playground', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '..', 'docs', 'playground.html'));
  });
  await app.listen(configService.get('APP_PORT') || 3000);
}
bootstrap();
