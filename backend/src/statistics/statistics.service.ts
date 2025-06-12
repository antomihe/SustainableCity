// backend\src\statistics\statistics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Container } from '../containers/entities/container.entity';
import { ContainerType } from '../containers/enums/container-type.enum';
import { StatsQueryDto } from '../admin/dto/stats-query.dto';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(Container)
    private readonly containerRepository: Repository<Container>,
  ) { }


  private applyContainerTypeFilter(
    queryBuilder: SelectQueryBuilder<Container>,
    filters: StatsQueryDto
  ): SelectQueryBuilder<Container> {
    if (filters.containerType && filters.containerType.toUpperCase() !== 'ALL') {
      queryBuilder.andWhere('container.type = :containerType', { containerType: filters.containerType });
    }
    return queryBuilder;
  }

  async getContainerUsage(filters: StatsQueryDto): Promise<any> {
    let queryBuilder = this.containerRepository.createQueryBuilder('container');
    queryBuilder = this.applyContainerTypeFilter(queryBuilder, filters);

    const containers = await queryBuilder.getMany();

    const totalCapacity = containers.reduce((sum, c) => sum + c.capacity, 0);
    const currentTotalFill = containers.reduce((sum, c) => sum + (c.capacity * c.fillLevel / 100), 0);
    const overallFillPercentage = totalCapacity > 0 ? (currentTotalFill / totalCapacity) * 100 : 0;

    return {
      totalContainers: containers.length,
      totalCapacity,
      currentTotalFill,
      overallFillPercentage: parseFloat(overallFillPercentage.toFixed(2)),
      containersSummary: containers.map(c => ({
        id: c.id,
        location: c.location,
        fillLevel: c.fillLevel,
        status: c.status,
        containerType: c.type,
      })),
    };
  }

  async getContainerTypesDistribution(): Promise<{ labels: string[]; data: number[] }> {
    let queryBuilder = this.containerRepository.createQueryBuilder('container')
      .select('container.type', 'type')
      .addSelect('COUNT(container.id)', 'count')
      .groupBy('container.type');

    const results: Array<{ type: ContainerType | null; count: string }> = await queryBuilder.getRawMany();

    const labels = results.map(r => r.type || 'Desconocido');
    const data = results.map(r => parseInt(r.count, 10));

    return { labels, data };
  }
}