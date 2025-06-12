// backend/src/seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './database/seeders/seeder.service';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as readline from 'readline';

function getCLIArgument(argName: string): boolean {
  const args = process.argv.slice(2);
  return args.includes(argName);
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim().toLowerCase());
  }));
}

async function bootstrap() {
  const scriptLogger = new Logger('DatabaseSetupSeederScript');
  scriptLogger.log('Initializing database setup and seeder script...');

  const forceMode = getCLIArgument('--force');
  if (forceMode) {
    scriptLogger.warn('--- FORCE MODE ENABLED --- User confirmation will be SKIPPED.');
  }

  let appContext;
  try {
    appContext = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });
    scriptLogger.log('Application context bootstrapped successfully.');

    const configService = appContext.get(ConfigService);
    const nodeEnv = configService.get('NODE_ENV');
    const appMode = configService.get('APP_MODE') || 'default';

    if (nodeEnv === 'production' && appMode !== 'demo' && !forceMode) {
      scriptLogger.error(
        'SCRIPT DISABLED: Cannot run in "production" environment (NODE_ENV=production) when appMode is not "demo", without --force flag.',
      );
      scriptLogger.log('To run in this configuration, you MUST use the --force flag and understand the consequences.');
      await appContext.close();
      process.exit(1);
      return;
    } else if (nodeEnv === 'production' && appMode === 'demo' && !forceMode) {
      scriptLogger.warn('--- RUNNING IN PRODUCTION (DEMO MODE) ---');
      scriptLogger.warn('The script will apply migrations and then seed data.');
      scriptLogger.warn('Confirmation is still required unless --force is used.');
    } else if (nodeEnv === 'production' && forceMode) {
        scriptLogger.warn('--- !!! RUNNING IN PRODUCTION WITH FORCE !!! ---');
        scriptLogger.warn('The script will apply migrations and then seed data, WITH FORCE.');
        scriptLogger.warn('This is highly DANGEROUS. Ensure you understand the consequences.');
    } else if (nodeEnv === 'development') {
        scriptLogger.log(`--- RUNNING IN DEVELOPMENT (NODE_ENV=${nodeEnv}) ---`);
        scriptLogger.log('The script will synchronize the database (drop and recreate schema based on entities) and then seed data.');
    }


    scriptLogger.log(`Proceeding with NODE_ENV: ${nodeEnv}, appMode: ${appMode}.`);

    const dbHost = configService.get('DB_HOST');
    const dbPort = configService.get('DB_PORT');
    const dbName = configService.get('DB_DATABASE');
    const dbUsername = configService.get('DB_USERNAME');

    scriptLogger.log(`Target Database Connection: postgresql://${dbUsername}:****@${dbHost}:${dbPort}/${dbName}`);

    const dataSource = appContext.get(DataSource);
    if (!dataSource.isInitialized) {
        scriptLogger.log('DataSource is not initialized. Initializing...');
        await dataSource.initialize();
        scriptLogger.log('DataSource initialized.');
    } else {
        scriptLogger.log('DataSource already initialized.');
    }
    scriptLogger.log('DataSource instance retrieved and ensured initialized.');

    const schemaActionDescription = nodeEnv === 'development'
      ? 'SYNCHRONIZE (DROP AND RECREATE SCHEMA based on entities)'
      : 'APPLY PENDING DATABASE MIGRATIONS';

    scriptLogger.warn(`--- !!! WARNING: DATABASE SCHEMA ACTION: ${schemaActionDescription} !!! ---`);
    scriptLogger.warn('After the schema action, the DATA SEEDING PROCESS will be executed.');
    scriptLogger.warn(`Target database: '${dbName}' on host '${dbHost}'.`);
    if (nodeEnv === 'development') {
        scriptLogger.warn('SYNCHRONIZE WILL WIPE AND RE-CREATE THE SCHEMA. This is IRREVERSIBLE for existing data.');
    } else {
        scriptLogger.warn('MIGRATIONS WILL UPDATE THE SCHEMA. Ensure migrations are correct.');
    }
    scriptLogger.warn('Review the seeder logic before proceeding as it might modify data.');


    if (!forceMode) {
      let confirmationLoop = true;
      do {
        const confirmation = await askQuestion(`Are you sure you want to ${schemaActionDescription.toLowerCase()} and then seed data? (yes/no): `);
        if (confirmation === 'no' || confirmation === 'n') {
          scriptLogger.log(`Database ${schemaActionDescription} and seeding CANCELED by the user.`);
          await appContext.close();
          process.exit(0);
          return;
        } else if (confirmation !== 'yes' && confirmation !== 'y') {
          scriptLogger.error('Invalid confirmation response. Expected "yes" or "no".');
        } else {
          scriptLogger.log('User confirmed manually.');
          confirmationLoop = false;
        }
      } while (confirmationLoop);
    } else {
      scriptLogger.log('Skipping user confirmation due to --force flag.');
    }

    scriptLogger.log(`Proceeding with: ${schemaActionDescription} and then data seeding...`);

    try {
      if (nodeEnv === 'development') {
        scriptLogger.log('Synchronizing database schema (drop and recreate based on entities)...');
        await dataSource.synchronize(true); 
        scriptLogger.log('Database schema synchronized successfully.');
      } else {
        scriptLogger.log('Running pending database migrations (this may take a moment)...');
        const appliedMigrations = await dataSource.runMigrations(); 
        if (appliedMigrations.length > 0) {
          scriptLogger.log(`Successfully applied ${appliedMigrations.length} migration(s):`);
          appliedMigrations.forEach(migration => scriptLogger.log(`- ${migration.name}`));
        } else {
          scriptLogger.log('No pending migrations to apply. Schema is up to date.');
        }
        scriptLogger.log('Database migrations completed.');
      }
    } catch (error) {
      scriptLogger.error(`Failed to ${schemaActionDescription}:`, error.stack || error);
      throw error;
    }

    const seeder = appContext.get(SeederService);
    scriptLogger.log('SeederService instance retrieved.');

    scriptLogger.log('Starting data seeding process...');
    await seeder.seed();
    scriptLogger.log('Data seeding completed successfully.');
    scriptLogger.warn(`--- DATABASE SCHEMA ACTION (${schemaActionDescription}) AND SEEDING FINISHED ---`);

  } catch (error) {
    scriptLogger.error('Database setup and/or seeding process failed!', error.stack || error);
    process.exitCode = 1;
  } finally {
    if (appContext) {
      scriptLogger.log('Closing application context...');
      await appContext.close();
      scriptLogger.log('Application context closed.');
    }
  }
}

bootstrap()
  .then(() => {
    const exitCode = process.exitCode || 0;
    const finalLogger = new Logger('SeederBootstrap');
    if (exitCode === 0) {
      finalLogger.log('Seeder script finished successfully.');
    } else {
      finalLogger.error(`Seeder script finished with errors (exit code: ${exitCode}).`);
    }
    process.exit(exitCode);
  })
  .catch((error) => {
    const finalLogger = new Logger('SeederBootstrapError');
    finalLogger.error('Unhandled critical error during seeder script execution:', error.stack || error);
    process.exit(1);
  });