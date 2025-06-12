// backend\src\jobs\tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ContainerStatus } from '../containers/enums/container-status.enum';
import { ContainersService } from '@/containers/containers.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TasksService {

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly containersService: ContainersService,
    private readonly configService: ConfigService,
  ) { }

  // Sends weekly sustainability tips to all subscribers
  //Every monday at 9 AM
  @Cron('0 9 * * 1', { name: 'sendWeeklySustainabilityTips', timeZone: 'Europe/Madrid' })
  async handleWeeklySustainabilityTips() {
    const logger = new Logger('NEWSLETTER CRON');
    await this.subscriptionsService.sendSustainabilityTips();
    logger.log('Weekly sustainability tips sent to all subscribers.');
  }

  // DEMO SIMULATION - Simulate container filling up
  // Runs every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'simulateContainerFilling', timeZone: 'Europe/Madrid' })
  async handleSimulateContainerFilling() {
    const logger = new Logger('DEMO CONTAINER FILLING CRON');

    if (this.configService.get<string>('app.appMode') !== 'demo') {
      return; // Only run simulation in demo environment
    }
    try {
      const containers = await this.containersService.findAll();
      if (containers.length > 0) {
        const eligibleContainers = containers.filter(c => c.status === ContainerStatus.OK && c.fillLevel < 100);
        if (eligibleContainers.length > 0) {
          const randomContainer = eligibleContainers[Math.floor(Math.random() * eligibleContainers.length)];

          const increment = Math.floor(Math.random() * 10) + 5; // Random increment between 5% and 15%
          const spaceLeft = 100 - randomContainer.fillLevel;

          if (increment <= spaceLeft) {
            const newFillLevel = randomContainer.fillLevel + increment;

            await this.containersService.simulateFillLevelChange(randomContainer.id, increment);
            logger.log(`Simulated filling of container (${randomContainer.location}) by ${increment}%. New fill level: ${newFillLevel}%`);
          } else {
            logger.log(`Skipped container ${randomContainer.id} (${randomContainer.location}) - not enough space for a ${increment}% increase.`);
          }
        } else {
          logger.log('No eligible containers (OK and not full) found for filling simulation.');
        }
      } else {
        logger.log('No containers found in the system for filling simulation.');
      }
    } catch (error) {
      logger.error(`Error simulating container filling: ${error.message}`, error.stack);
    }
  }

  // DEMO SIMULATION - Simulate container damage
  // Runs every 2 hours
  @Cron('0 */2 * * *', { name: 'simulateContainerDamage', timeZone: 'Europe/Madrid' })
  async handleSimulateContainerDamage() {
    const logger = new Logger('DEMO CONTAINER DAMAGE CRON');

    if (this.configService.get<string>('app.appMode') !== 'demo') {
      return; // Only run simulation in demo environment
    }
    try {
      const containers = await this.containersService.findAll();
      if (containers.length === 0) {
        logger.log('No containers found. Skipping damage simulation.');
        return;
      }
      const eligibleContainers = containers.filter(c => c.status === ContainerStatus.OK);

      if (eligibleContainers.length === 0) {
        logger.log('No containers with status OK found to simulate damage.');
        return;
      }

      const randomContainer = eligibleContainers[Math.floor(Math.random() * eligibleContainers.length)];

      const damageDescriptions = [
        'Sensor malfunctioning, incorrect readings.',
        'Lid broken or jammed, cannot be opened/closed.',
        'Structural damage to the container body (crack/dent).',
        'Graffiti or vandalism affecting operation.',
        'Lock mechanism faulty or broken.',
        'Internal component failure (e.g., compactor).',
      ];
      const randomDescription = damageDescriptions[Math.floor(Math.random() * damageDescriptions.length)];

      await this.containersService.handleDamagedContainer(randomContainer.id, randomDescription);

      logger.log(`Simulated damage for container (${randomContainer.location}). Status set to DAMAGED. Description: "${randomDescription}"`);

    } catch (error) {
      logger.error(`Error simulating container damage: ${error.message}`, error.stack);
    }
  }

  // DEMO SIMULATION - Simulate container repair
  // Runs every 3 hours
  @Cron('0 */3 * * *', { name: 'simulateContainerRepair', timeZone: 'Europe/Madrid' })
  async handleSimulateContainerRepair() {
    const logger = new Logger('DEMO CONTAINER REPAIR CRON');

    if (this.configService.get<string>('app.appMode') !== 'demo') {
      return; // Only run simulation in demo environment
    }

    try {
      const containers = await this.containersService.findAll();
      if (containers.length === 0) {
        logger.log('No containers found. Skipping repair simulation.');
        return;
      }

      const eligibleContainers = containers.filter(c => c.status === ContainerStatus.DAMAGED || c.status === ContainerStatus.FULL);

      if (eligibleContainers.length === 0) {
        logger.log('No DAMAGED containers found to simulate repair.');
        return;
      }

      const randomContainer = eligibleContainers[Math.floor(Math.random() * eligibleContainers.length)];

      await this.containersService.updateStatus(randomContainer.id, {status: ContainerStatus.OK, fillLevel: 0});

      logger.log(`Simulated repair for container (${randomContainer.location}). Status set to OK and fill level to 0%.`);

    } catch (error) {
      logger.error(`Error simulating container repair: ${error.message}`, error.stack);
    }
  }
}