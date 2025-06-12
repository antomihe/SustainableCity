// backend/src/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false, 
  logging: ['error', 'warn'], 

  entities: [join(__dirname, '**/*.entity{.ts,.js}')], 

  migrationsTableName: 'migrations_typeorm', 
  migrations: [
    // __dirname aquí is backend/src
    join(__dirname, 'database/migrations/*{.ts,.js}'), 
  ],
  
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;