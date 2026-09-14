import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

const API_PREFIX = 'api/v1';
const DOCS_PATH = 'api/docs';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');
  const isProduction = configService.getOrThrow<boolean>('isProduction');

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(isProduction));
  app.enableShutdownHooks();

  const documentConfig = new DocumentBuilder()
    .setTitle('CarCareApp API')
    .setDescription('API documentation for the CarCareApp backend')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Supabase access token',
    })
    .build();
  SwaggerModule.setup(
    DOCS_PATH,
    app,
    SwaggerModule.createDocument(app, documentConfig),
  );

  await app.listen(port);

  Logger.log(
    `CarCare API listening on http://localhost:${port}/${API_PREFIX}`,
    'Bootstrap',
  );
}

await bootstrap();
