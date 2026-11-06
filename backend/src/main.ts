import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { mkdirSync } from 'node:fs';
import 'reflect-metadata';
import { AppModule } from 'src/app.module';
import { UPLOAD_ROOT } from 'src/platform/controllers/platform.controller';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3100')
      .split(',')
      .map((s) => s.trim()),
    credentials: true,
  });
  app.setGlobalPrefix('api', { exclude: ['uploads/{*path}'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();

  mkdirSync(UPLOAD_ROOT, { recursive: true });
  app.useStaticAssets(UPLOAD_ROOT, { prefix: '/uploads', maxAge: '7d' });

  const docs = new DocumentBuilder()
    .setTitle('Cholo Market API')
    .setDescription(
      'Malls and markets of Bangladesh, online. Phone + OTP login returns a Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    () => SwaggerModule.createDocument(app, docs),
    {
      swaggerOptions: { persistAuthorization: true },
    },
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(
    `API ready on http://localhost:${port}/api  (docs: /api/docs)`,
    'Bootstrap',
  );
}

void bootstrap();
