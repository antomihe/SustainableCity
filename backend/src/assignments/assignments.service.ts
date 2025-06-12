// backend\src\assignments\assignments.service.ts
import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common'; 
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OperatorAssignment } from './entities/operator-assignment.entity';
import { User } from '../users/entities/user.entity';
import { Container } from '../containers/entities/container.entity';
import { Role } from '../users/enums/role.enum';
import { UsersService } from '../users/users.service';
import { ContainersService } from '../containers/containers.service';
import { I18nService, I18nContext } from 'nestjs-i18n'; 
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(OperatorAssignment)
    private readonly assignmentRepository: Repository<OperatorAssignment>,
    private readonly usersService: UsersService,
    private readonly containersService: ContainersService,
    private readonly i18n: I18nService, 
    private readonly configService: ConfigService
  ) { }

  private async getCurrentRequestLang(): Promise<string> {
    return I18nContext.current()?.lang || this.configService.get('app').defaultLanguage;
  }

  async assignContainersToOperator(operatorId: string, containerIds: string[]): Promise<OperatorAssignment[]> {
    const lang = await this.getCurrentRequestLang();
    
    const operatorUser = await this.usersService.findOne(operatorId);
    if (operatorUser.role !== Role.Operator) {
      const message = await this.i18n.t('assignment.USER_NOT_OPERATOR', { lang, args: { id: operatorId } });
      
      throw new BadRequestException(message);
    }

    
    await this.assignmentRepository.delete({ operatorId: operatorId });

    if (!containerIds || containerIds.length === 0) {
      this.logger.log(`No containers to assign to operator ${operatorId}. All previous assignments cleared.`);
      return [];
    }

    
    
    const existingContainers = await this.containersService.findAllByIds(containerIds);
    const validContainerIdsToAssign = existingContainers.map(c => c.id);

    
    const requestedContainerIdsSet = new Set(containerIds);
    const nonExistentRequestedIds = containerIds.filter(id => !validContainerIdsToAssign.includes(id));
    if (nonExistentRequestedIds.length > 0) {
        this.logger.warn(`Attempted to assign non-existent containers: ${nonExistentRequestedIds.join(', ')} to operator ${operatorId}. These were ignored.`);
    }


    if (validContainerIdsToAssign.length === 0) {
      this.logger.log(`No valid containers found to assign to operator ${operatorId} from list: ${containerIds.join(', ')}`);
      return []; 
    }

    const newAssignments: OperatorAssignment[] = validContainerIdsToAssign.map(containerId => {
      return this.assignmentRepository.create({
        operatorId: operatorId,
        containerId: containerId,
      });
    });

    const savedAssignments = await this.assignmentRepository.save(newAssignments);
    this.logger.log(`Assigned ${savedAssignments.length} containers to operator ${operatorId}.`);

    
    return this.assignmentRepository.find({
      where: { operatorId: operatorId, containerId: In(validContainerIdsToAssign) },
      relations: ['operator', 'container']
    });
  }

  async assignOperatorsToContainer(containerId: string, userIds: string[]): Promise<OperatorAssignment[]> {
    const lang = await this.getCurrentRequestLang();
    
    await this.containersService.findOne(containerId); 

    
    await this.assignmentRepository.delete({ containerId: containerId });

    if (!userIds || userIds.length === 0) {
      this.logger.log(`No operators to assign to container ${containerId}. All previous assignments cleared.`);
      return [];
    }

    
    const existingUsers = await this.usersService.findAllByIds(userIds);
    const validOperators = existingUsers.filter(user => user.role === Role.Operator);
    const validOperatorIdsToAssign = validOperators.map(u => u.id);

    
    const nonOperatorOrNonExistentIds = userIds.filter(id => !validOperatorIdsToAssign.includes(id));
    if (nonOperatorOrNonExistentIds.length > 0) {
        this.logger.warn(`Attempted to assign non-operator or non-existent users: ${nonOperatorOrNonExistentIds.join(', ')} to container ${containerId}. These were ignored.`);
    }

    if (validOperatorIdsToAssign.length === 0) {
      this.logger.log(`No valid operators found to assign to container ${containerId} from list: ${userIds.join(', ')}`);
      return [];
    }

    const newAssignments: OperatorAssignment[] = validOperatorIdsToAssign.map(operatorId => {
      return this.assignmentRepository.create({
        operatorId: operatorId,
        containerId: containerId,
      });
    });

    const savedAssignments = await this.assignmentRepository.save(newAssignments);
    this.logger.log(`Assigned ${savedAssignments.length} operators to container ${containerId}.`);

    return this.assignmentRepository.find({
      where: { containerId, operatorId: In(validOperatorIdsToAssign) },
      relations: ['operator', 'container'],
    });
  }

  async getAssignedContainersForOperator(operatorId: string): Promise<Container[]> {
    const lang = await this.getCurrentRequestLang();
    
    const operatorUser = await this.usersService.findOne(operatorId);
    if (operatorUser.role !== Role.Operator) {
      const message = await this.i18n.t('assignment.USER_NOT_OPERATOR', { lang, args: { id: operatorId } });
      throw new BadRequestException(message); 
    }

    const assignments = await this.assignmentRepository.find({
      where: { operatorId: operatorId },
      relations: ['container']
    });
    return assignments.map(assignment => assignment.container).filter(container => !!container); 
  }

  async getOperatorsForContainer(containerId: string): Promise<User[]> {
    await this.containersService.findOne(containerId); 

    const assignments = await this.assignmentRepository.find({
      where: { containerId: containerId },
      relations: ['operator']
    });
    return assignments.map(assignment => assignment.operator).filter(operator => !!operator); 
  }

  async removeAssignment(operatorId: string, containerId: string): Promise<void> {
    const lang = await this.getCurrentRequestLang();
    const result = await this.assignmentRepository.delete({ operatorId, containerId });
    if (result.affected === 0) {
      const message = await this.i18n.t('assignment.ASSIGNMENT_NOT_FOUND', {
        lang,
        args: { operatorId, containerId },
      });
      throw new NotFoundException(message);
    }
    this.logger.log(`Removed assignment for operator ${operatorId} from container ${containerId}.`);
  }
}