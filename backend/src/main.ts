// backend\src\main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  I18nValidationPipe,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const appPort = configService.get<number>('APP_PORT');
  const apiPrefix = configService.get<string>('API_PREFIX'); 
  const nodeEnv = configService.get<string>('NODE_ENV'); 
  const frontendUrl = configService.get<string>('FRONTEND_URL'); 
  const appMode = configService.get<string>('APP_MODE');

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalPipes(
    new I18nValidationPipe() 
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, 
    }),
  );


  if (nodeEnv !== 'production' || appMode === 'demo') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Backend API')
      .setDescription('API documentation for the backend services')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  app.enableCors({
    origin: frontendUrl || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(appPort);
  console.log(`Application is running on: ${await app.getUrl()}`); 
  if (nodeEnv !== 'production' || appMode === 'demo') {
    console.log(`Swagger docs available at: ${await app.getUrl()}/${apiPrefix}/docs`);
  }
}
bootstrap();