// backend/src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const migrationsPath = join(__dirname, '../database/migrations/*{.ts,.js}');

    const dbOptions: TypeOrmModuleOptions = {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,

      synchronize: isDevelopment,
      logging: isDevelopment ? ['error', 'warn'] : ['error'],
      autoLoadEntities: true,
      migrationsTableName: 'migrations_typeorm',
      migrationsRun: !isDevelopment, 
      migrations: [migrationsPath],
      ssl: isDevelopment ? false : true,
    };

    return dbOptions;
  },
);