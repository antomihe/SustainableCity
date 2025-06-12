// backend\src\containers\containers.service.ts

import { Inject, Injectable, NotFoundException, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';
import { Container } from './entities/container.entity';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto, UpdateContainerStatusDto } from './dto/update-container.dto';
import { ContainersGateway } from './containers.gateway';
import { ContainerStatus } from './enums/container-status.enum';
import { EmailService } from '../common/services/email.service';
import appConfiguration from '../config/app.config';
import { ConfigService, ConfigType } from '@nestjs/config';
import { StatsQueryDto } from '../admin/dto/stats-query.dto';
import { ContainerType } from './enums/container-type.enum';
import { SearchContainerQueryDto } from './dto/search-container.dto';
import { ContainerWithDistanceResponseDto } from './dto/container-with-distance-response.dto';
import { I18nService, I18nContext } from 'nestjs-i18n'; 

@Injectable()
export class ContainersService {
  private readonly logger = new Logger(ContainersService.name);
  public readonly CRITICAL_FILL_LEVEL = 85;
  private appName: string;

  constructor(
    @InjectRepository(Container)
    private containersRepository: Repository<Container>,
    @Inject(forwardRef(() => ContainersGateway))
    private readonly containersGateway: ContainersGateway,
    private readonly emailService: EmailService,
    @Inject(appConfiguration.KEY)
    private readonly appConfigFromInject: ConfigType<typeof appConfiguration>, 
    private readonly i18n: I18nService, 
    private readonly configService: ConfigService, 
  ) {
  }
  
  private async getCurrentRequestLang(): Promise<string> {
    const langFromContext = I18nContext.current()?.lang;
    if (langFromContext) return langFromContext;
    const lang =  this.appConfigFromInject.defaultLanguage || this.configService.get('app').defaultLanguage ;
    this.appName = this.i18n.t('app.NAME', { lang: lang })  
    return lang;
  }

  async create(createContainerDto: CreateContainerDto): Promise<Container> {
    const container = this.containersRepository.create(createContainerDto);
    const savedContainer = await this.containersRepository.save(container);
    this.containersGateway.broadcastContainerUpdate(savedContainer);
    this.logger.log(`Container created: ${savedContainer.id} at ${savedContainer.location}`);
    return savedContainer;
  }

  async findAll(): Promise<Container[]> {
    return this.containersRepository.find();
  }

  async findAllFiltered(filters?: StatsQueryDto): Promise<Container[]> {
    const queryOptions: FindManyOptions<Container> = {};
    if (filters && filters.containerType && filters.containerType.toUpperCase() !== 'ALL') {
      queryOptions.where = { type: filters.containerType };
    }
    return this.containersRepository.find(queryOptions);
  }

  async findOne(id: string): Promise<Container> {
    const container = await this.containersRepository.findOneBy({ id });
    if (!container) {
      const lang = await this.getCurrentRequestLang();
      const message = await this.i18n.t('container.NOT_FOUND', { lang, args: { id } });
      throw new NotFoundException(message);
    }
    return container;
  }

  async findAllByIds(ids: string[]): Promise<Container[]> {
    if (!ids || ids.length === 0) return [];
    const containers = await this.containersRepository.findBy({ id: In(ids) });
    if (containers.length !== ids.length) {
      const lang = await this.getCurrentRequestLang();
      const foundIds = containers.map(c => c.id);
      const notFoundIds = ids.filter(id => !foundIds.includes(id));
      this.logger.warn(`Some container IDs not found: ${notFoundIds.join(', ')}`);
      const message = await this.i18n.t('container.NOT_FOUND_MULTIPLE', { lang, args: { ids: notFoundIds.join(', ') } });
      throw new NotFoundException(message);
    }
    return containers;
  }

  async update(id: string, updateContainerDto: UpdateContainerDto): Promise<Container> {
    const containerToUpdate = await this.findOne(id); 
    const originalFillLevel = containerToUpdate.fillLevel;
    await this.containersRepository.update(id, updateContainerDto);
    const updatedContainer = await this.findOne(id); 
    this.containersGateway.broadcastContainerUpdate(updatedContainer);
    this.logger.log(`Container updated: ${updatedContainer.id}`);
    await this.checkAndNotifyCriticalFillLevel(updatedContainer, originalFillLevel);
    return updatedContainer;
  }

  async updateStatus(id: string, updateStatusDto: UpdateContainerStatusDto): Promise<Container> {
    const container = await this.findOne(id); 
    const originalFillLevel = container.fillLevel;
    
    if (updateStatusDto.fillLevel !== undefined) container.fillLevel = updateStatusDto.fillLevel;
    if (updateStatusDto.status !== undefined) container.status = updateStatusDto.status;
    if (updateStatusDto.fillLevel === 0 && updateStatusDto.status === ContainerStatus.OK) {
        container.lastEmptiedAt = new Date();
        container.incidentDescription = null; // Reset incident description when emptied
    }
    const updatedContainer = await this.containersRepository.save(container);
    this.containersGateway.broadcastContainerUpdate(updatedContainer);
    this.logger.log(`Container status updated: ${updatedContainer.id}, Fill: ${updatedContainer.fillLevel}%, Status: ${updatedContainer.status}`);
    await this.checkAndNotifyCriticalFillLevel(updatedContainer, originalFillLevel);
    return updatedContainer;
  }

  async handleFullContainer(containerId: string): Promise<Container> {
    const container = await this.findOne(containerId); 
    container.status = ContainerStatus.FULL;
    container.incidentDescription = null; 
    const updatedContainer = await this.containersRepository.save(container);
    this.containersGateway.broadcastContainerUpdate(updatedContainer);
    this.logger.warn(`Container ${container.id} at ${container.location} marked as FULL. Fill level: ${container.fillLevel}%`);
    await this.checkAndNotifyCriticalFillLevel(updatedContainer, container.fillLevel); 
    return updatedContainer;
  }

  async handleDamagedContainer(containerId: string, incidentDescription: string): Promise<Container> {
    const container = await this.findOne(containerId); 
    container.status = ContainerStatus.DAMAGED;
    container.incidentDescription = incidentDescription;
    const updatedContainer = await this.containersRepository.save(container);
    this.containersGateway.broadcastContainerUpdate(updatedContainer);
    this.logger.warn(`Container ${container.id} at ${container.location} marked as damaged: ${incidentDescription}`);
    await this.checkAndNotifyDamageContainer(updatedContainer);
    return updatedContainer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.containersRepository.delete(id);
    if (result.affected === 0) {
      const lang = await this.getCurrentRequestLang();
      const message = await this.i18n.t('container.NOT_FOUND', { lang, args: { id } });
      throw new NotFoundException(message);
    }
    this.containersGateway.broadcastContainerDeletion(id);
    this.logger.log(`Container removed: ${id}`);
  }

  async checkAndNotifyCriticalFillLevel(container: Container, previousFillLevel: number): Promise<void> {
    if (container.fillLevel >= this.CRITICAL_FILL_LEVEL && previousFillLevel < this.CRITICAL_FILL_LEVEL) {
      this.logger.warn(`Container ${container.id} at ${container.location} reached critical fill level: ${container.fillLevel}%`);
      this.containersGateway.broadcastCriticalContainerAlert(container);

      const adminEmail = this.appConfigFromInject.adminEmail;
      if (adminEmail) {
        const lang = await this.getCurrentRequestLang(); 
        const subject = await this.i18n.t('email.SUBJECT_CONTAINER_CRITICAL_FILL', {
          lang,
          args: { location: container.location, appName: this.appName },
        });
        const bodyP1 = await this.i18n.t('email.BODY_CONTAINER_CRITICAL_FILL_P1', {
          lang,
          args: { location: container.location, fillLevel: container.fillLevel },
        });
        const bodyP2 = await this.i18n.t('email.BODY_CONTAINER_CRITICAL_FILL_P2', { lang });
        const htmlBody = `<p>${bodyP1}</p><p>${bodyP2}</p>`;

        await this.emailService.sendMail(adminEmail, subject, htmlBody)
        .catch(error => {
          this.logger.error(`Failed to send critical fill level email to ${adminEmail} for container ${container.id}: ${error.message}`, error.stack);
        });
      }
    }
  }

  async checkAndNotifyDamageContainer(container: Container): Promise<void> {
    if (container.status !== ContainerStatus.DAMAGED) return;
    const adminEmail = this.appConfigFromInject.adminEmail;
    if (adminEmail) {
      const lang = await this.getCurrentRequestLang(); 
      const subject = await this.i18n.t('email.SUBJECT_CONTAINER_DAMAGED', {
        lang,
        args: { location: container.location, appName: this.appName },
      });
      const bodyP1 = await this.i18n.t('email.BODY_CONTAINER_DAMAGED_P1', {
        lang,
        args: { location: container.location },
      });
      const bodyP2 = await this.i18n.t('email.BODY_CONTAINER_DAMAGED_P2', {
        lang,
        args: { incidentDescription: container.incidentDescription || 'N/A' },
      });
      const htmlBody = `<p>${bodyP1}</p><p>${bodyP2}</p>`;

      await this.emailService.sendMail(adminEmail, subject, htmlBody)
      .catch(error => {
        this.logger.error(`Failed to send damaged container email to ${adminEmail} for container ${container.id}: ${error.message}`, error.stack);
      });
    }
  }

  async getContainersNearingFull(threshold: number = this.CRITICAL_FILL_LEVEL): Promise<Container[]> {
    return this.containersRepository
      .createQueryBuilder('container')
      .where('container.fillLevel >= :threshold', { threshold })
      .andWhere('container.status = :status', { status: ContainerStatus.OK })
      .getMany();
  }

  async simulateFillLevelChange(containerId: string, increment: number): Promise<Container | null> {
    try {
      const container = await this.findOne(containerId);
      const originalFillLevel = container.fillLevel;
      
      let newFillLevel = container.fillLevel + increment;
      if (newFillLevel > 100) newFillLevel = 100;
      if (newFillLevel < 0) newFillLevel = 0;

      container.fillLevel = newFillLevel;
      if (container.fillLevel === 100 && container.status === ContainerStatus.OK) {
        container.status = ContainerStatus.FULL;
      } else if (container.fillLevel < 100 && container.status === ContainerStatus.FULL) {
        container.status = ContainerStatus.OK;
      }
      
      const updatedContainer = await this.containersRepository.save(container);
      this.containersGateway.broadcastContainerUpdate(updatedContainer);
      this.logger.log(`Simulated fill level change for ${containerId}: ${updatedContainer.fillLevel}%`);
      await this.checkAndNotifyCriticalFillLevel(updatedContainer, originalFillLevel);
      return updatedContainer;
    } catch (error) {
      this.logger.error(`Error simulating fill level for ${containerId}: ${error.message}`);
      return null;
    }
  }

  async getStatsByContainerType(): Promise<{ labels: string[]; data: number[] }> {
    const results: Array<{ container_type: ContainerType; count: string }> = await this.containersRepository
      .createQueryBuilder('container')
      .select('container.type', 'container_type')
      .addSelect('COUNT(container.id)', 'count')
      .groupBy('container.type')
      .getRawMany();

    const labels = results.map(r => r.container_type || 'Unknown');
    const data = results.map(r => parseInt(r.count, 10));
    return { labels, data };
  }

  async searchContainers(filters: SearchContainerQueryDto): Promise<ContainerWithDistanceResponseDto[]> {
    const queryBuilder = this.containersRepository.createQueryBuilder('container');

    if (filters.searchTerm) {
      queryBuilder.andWhere('LOWER(container.location) LIKE LOWER(:searchTerm)', {
        searchTerm: `%${filters.searchTerm}%`,
      });
    }
    if (filters.statuses && filters.statuses.length > 0) {
      queryBuilder.andWhere('container.status IN (:...statuses)', { statuses: filters.statuses });
    }
    if (filters.types && filters.types.length > 0) {
      queryBuilder.andWhere('container.type IN (:...types)', { types: filters.types });
    }
    if (filters.latitude !== undefined && filters.longitude !== undefined && filters.radius !== undefined) {
      const radiusInDegrees = filters.radius / 111;
      const minLat = filters.latitude - radiusInDegrees;
      const maxLat = filters.latitude + radiusInDegrees;
      const minLon = filters.longitude - radiusInDegrees;
      const maxLon = filters.longitude + radiusInDegrees;
      queryBuilder.andWhere(`(container.coordinates->>'lat')::float BETWEEN :minLat AND :maxLat`, { minLat, maxLat });
      queryBuilder.andWhere(`(container.coordinates->>'lng')::float BETWEEN :minLon AND :maxLon`, { minLon, maxLon });
    }
    let containers = await queryBuilder.orderBy('container.location', 'ASC').getMany();
    let containersWithDistance: ContainerWithDistanceResponseDto[];
    if (filters.latitude !== undefined && filters.longitude !== undefined && filters.radius !== undefined) {
      containersWithDistance = containers
        .map((container) => {
          if (!container.coordinates || container.coordinates.lat == null || container.coordinates.lng == null) return null;
          const distance = this.calculateHaversineDistance(filters.latitude!, filters.longitude!, container.coordinates.lat, container.coordinates.lng);
          return { ...container, distance } as ContainerWithDistanceResponseDto;
        })
        .filter((container): container is ContainerWithDistanceResponseDto => container !== null)
        .filter((container) => container.distance <= filters.radius!);
    } else {
      containersWithDistance = containers.map(container => ({ ...container, distance: undefined })) as ContainerWithDistanceResponseDto[];
    }
    return containersWithDistance.sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}