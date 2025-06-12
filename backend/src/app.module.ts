// backend\src\app.module.ts
// backend/src/app.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path'; // Make sure path.join is used correctly
import * as Joi from 'joi';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContainersModule } from './containers/containers.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { OperatorModule } from './operator/operator.module';
import { CommonModule } from './common/common.module';
import { JobsModule } from './jobs/jobs.module';
import { SeederModule } from './database/seeders/seeder.module';
import { SeederService } from './database/seeders/seeder.service';
import { AssignmentsModule } from './assignments/assignments.module';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';

const envSchema = Joi.object({
  APP_PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().default('api'),
  APP_MODE: Joi.string().valid('default', 'demo').default('default'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'demo').default('development'),
  FRONTEND_URL: Joi.string().uri().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  JWT_SECRET: Joi.string().min(10).required(),
  JWT_EXPIRATION_TIME: Joi.string().pattern(/^\d+[smhd]$/).default('3600s'),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().port().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  ADMIN_EMAIL: Joi.string().email().required(),
  DEFAULT_LANGUAGE: Joi.string().valid('en', 'es').default('es'),
}).unknown(true);


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, emailConfig],
      envFilePath: '.env',
      validationSchema: envSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get<string>('DEFAULT_LANGUAGE', 'es'),
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: configService.get<string>('NODE_ENV') === 'development',
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['Accept-Language']),
        AcceptLanguageResolver,
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ContainersModule,
    AssignmentsModule,
    IncidentsModule,
    SubscriptionsModule,
    AdminModule,
    OperatorModule,
    CommonModule,
    JobsModule,
    SeederModule,
  ],
})
export class AppModule /*implements OnModuleInit */ {
  // constructor(private readonly seederService: SeederService) { }

  // async onModuleInit() {
  //   if (process.env.NODE_ENV === 'development') {
  //     await this.seederService.seed();
  //     console.log('Seeding complete.');
  //   }
  // }
}