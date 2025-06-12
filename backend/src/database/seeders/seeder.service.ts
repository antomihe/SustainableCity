// backend\src\database\seeders\seeder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';
import { Container } from '../../containers/entities/container.entity';
import { ContainerStatus } from '../../containers/enums/container-status.enum';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { ContainerType } from '../../containers/enums/container-type.enum';
import { OperatorAssignment } from '../../assignments/entities/operator-assignment.entity';

type ContainerSeedData = Omit<Partial<Container>, 'coordinates'> & {
  coordinates: { lat: number; lng: number };
  city: string; // Used for assignment logic, not part of Container entity
  location: string;
  capacity: number;
  fillLevel: number;
  status: ContainerStatus;
  type: ContainerType;
  incidentDescription?: string;
};

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Container) private readonly containerRepository: Repository<Container>,
    @InjectRepository(OperatorAssignment) private readonly assignmentRepository: Repository<OperatorAssignment>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }

  async seed() {
    this.logger.log('Starting database seeding...');
    await this.seedUsers();
    await this.seedContainers();
    await this.seedAssignments();
    this.logger.log('Database seeding finished.');
  }

  private async seedUsers() {
    const usersToSeed = [
      { email: this.configService.get<string>('ADMIN_EMAIL') || 'admin@example.com', password: 'password123', role: Role.Admin, name: 'Admin User' },
      { email: 'student@example.com', password: 'password123', role: Role.Student, name: 'Student User' },
      { email: 'madrid@operator.com', password: 'password123', role: Role.Operator, name: 'Madrid Operator' },
      { email: 'barcelona@operator.com', password: 'password123', role: Role.Operator, name: 'Barcelona Operator' },
      { email: 'paris@operator.com', password: 'password123', role: Role.Operator, name: 'Paris Operator' },
      { email: 'munich@operator.com', password: 'password123', role: Role.Operator, name: 'Munich Operator' },
      { email: 'warsaw@operator.com', password: 'password123', role: Role.Operator, name: 'Warsaw Operator' },
      { email: 'riga@operator.com', password: 'password123', role: Role.Operator, name: 'Riga Operator' },
      { email: 'stockholm@operator.com', password: 'password123', role: Role.Operator, name: 'Stockholm Operator' },
      { email: 'lappeenranta@operator.com', password: 'password123', role: Role.Operator, name: 'Lappeenranta Operator' },
    ];

    for (const userData of usersToSeed) {
      const existingUser = await this.userRepository.findOneBy({ email: userData.email });
      if (!existingUser) {
        const user = await this.usersService.create(userData, userData.role);
        user.isActive = true;
        user.requiresPasswordSet = false;
        user.password = await this.usersService.hashPassword(userData.password);
        await this.userRepository.save(user);
        this.logger.log(`Seeded user: ${userData.email}`);
      }
    }
  }

  private getContainersSeedData(): ContainerSeedData[] {
    return [
      // Madrid Containers 
      { city: 'Madrid', location: 'Corte Inglés Castellana, Madrid', coordinates: { lat: 40.446947, lng: -3.690530 }, capacity: 150, fillLevel: 45, status: ContainerStatus.OK, type: ContainerType.GENERAL },
      { city: 'Madrid', location: 'Fnac Callao, Madrid', coordinates: { lat: 40.420186, lng: -3.705782 }, capacity: 100, fillLevel: 75, status: ContainerStatus.FULL, type: ContainerType.PAPER },
      { city: 'Madrid', location: 'Primark Gran Vía, Madrid', coordinates: { lat: 40.420580, lng: -3.704340 }, capacity: 120, fillLevel: 20, status: ContainerStatus.OK, type: ContainerType.CLOTHING },
      { city: 'Madrid', location: 'Museo del Prado, Madrid', coordinates: { lat: 40.413781, lng: -3.692127 }, capacity: 90, fillLevel: 60, status: ContainerStatus.OK, type: ContainerType.PAPER },
      { city: 'Madrid', location: 'Parque del Retiro, Madrid', coordinates: { lat: 40.415260, lng: -3.684416 }, capacity: 130, fillLevel: 85, status: ContainerStatus.FULL, type: ContainerType.ORGANIC },
      { city: 'Madrid', location: 'Estación de Atocha, Madrid', coordinates: { lat: 40.407700, lng: -3.689240 }, capacity: 200, fillLevel: 30, status: ContainerStatus.OK, type: ContainerType.PLASTIC },
      { city: 'Madrid', location: 'Plaza Mayor, Madrid', coordinates: { lat: 40.415370, lng: -3.707410 }, capacity: 100, fillLevel: 95, status: ContainerStatus.FULL, type: ContainerType.GLASS },
      { city: 'Madrid', location: 'Mercado de San Miguel, Madrid', coordinates: { lat: 40.415144, lng: -3.709508 }, capacity: 110, fillLevel: 50, status: ContainerStatus.OK, type: ContainerType.METAL },
      { city: 'Madrid', location: 'Palacio Real, Madrid', coordinates: { lat: 40.417977, lng: -3.714312 }, capacity: 140, fillLevel: 40, status: ContainerStatus.OK, type: ContainerType.GENERAL },
      { city: 'Madrid', location: 'Plaza de España, Madrid', coordinates: { lat: 40.423070, lng: -3.712420 }, capacity: 120, fillLevel: 90, status: ContainerStatus.FULL, type: ContainerType.PLASTIC },
      { city: 'Madrid', location: 'Matadero Madrid', coordinates: { lat: 40.391634, lng: -3.698268 }, capacity: 150, fillLevel: 55, status: ContainerStatus.OK, type: ContainerType.ELECTRONICS },
      { city: 'Madrid', location: 'Casa de Campo, Madrid', coordinates: { lat: 40.417570, lng: -3.751170 }, capacity: 130, fillLevel: 65, status: ContainerStatus.OK, type: ContainerType.ORGANIC },
      { city: 'Madrid', location: 'Cines Callao, Madrid', coordinates: { lat: 40.420610, lng: -3.705932 }, capacity: 100, fillLevel: 30, status: ContainerStatus.DAMAGED, incidentDescription: 'Door stuck', type: ContainerType.GLASS },
      { city: 'Madrid', location: 'Telefónica Gran Vía, Madrid', coordinates: { lat: 40.420760, lng: -3.703484 }, capacity: 110, fillLevel: 45, status: ContainerStatus.OK, type: ContainerType.ELECTRONICS },
      { city: 'Madrid', location: 'Parque Juan Carlos I, Madrid', coordinates: { lat: 40.469010, lng: -3.599760 }, capacity: 180, fillLevel: 25, status: ContainerStatus.OK, type: ContainerType.OIL },

      // Lappeenranta Containers
      { city: 'Lappeenranta', location: 'Lappeenranta University of Technology', coordinates: { lat: 61.064917, lng: 28.094583 }, capacity: 160, fillLevel: 35, status: ContainerStatus.OK, type: ContainerType.GENERAL },
      { city: 'Lappeenranta', location: 'IsoKristiina Shopping Center, Lappeenranta', coordinates: { lat: 61.056939, lng: 28.193157 }, capacity: 140, fillLevel: 65, status: ContainerStatus.OK, type: ContainerType.PLASTIC },
      { city: 'Lappeenranta', location: 'Prisma Lappeenranta', coordinates: { lat: 61.050778, lng: 28.177639 }, capacity: 130, fillLevel: 85, status: ContainerStatus.FULL, type: ContainerType.GLASS },
      { city: 'Lappeenranta', location: 'Lappeenranta Harbour', coordinates: { lat: 61.062249, lng: 28.186573 }, capacity: 100, fillLevel: 40, status: ContainerStatus.OK, type: ContainerType.ORGANIC },
      { city: 'Lappeenranta', location: 'Wolkoff Restaurant, Lappeenranta', coordinates: { lat: 61.060056, lng: 28.185028 }, capacity: 90, fillLevel: 20, status: ContainerStatus.OK, type: ContainerType.OIL },
      { city: 'Lappeenranta', location: 'S-market Lappeenranta', coordinates: { lat: 61.064546, lng: 28.172744 }, capacity: 150, fillLevel: 70, status: ContainerStatus.OK, type: ContainerType.BATTERIES },
      { city: 'Lappeenranta', location: 'Pizzeria Pamukkale, Lappeenranta', coordinates: { lat: 61.047668, lng: 28.113330 }, capacity: 120, fillLevel: 60, status: ContainerStatus.OK, type: ContainerType.METAL },
      { city: 'Lappeenranta', location: 'Lappeenranta Fortress', coordinates: { lat: 61.064500, lng: 28.185000 }, capacity: 80, fillLevel: 55, status: ContainerStatus.DAMAGED, incidentDescription: 'Lateral tear', type: ContainerType.PAPER },
      { city: 'Lappeenranta', location: 'Sandcastle Lappeenranta', coordinates: { lat: 61.068644, lng: 28.184773 }, capacity: 100, fillLevel: 45, status: ContainerStatus.OK, type: ContainerType.CLOTHING },
      { city: 'Lappeenranta', location: 'LOAS, Lappeenranta', coordinates: { lat: 61.063138, lng: 28.096695 }, capacity: 90, fillLevel: 35, status: ContainerStatus.OK, type: ContainerType.OTHERS },
      // Barcelona Containers 
      { city: 'Barcelona', location: 'Sagrada Familia, Barcelona', coordinates: { lat: 41.4036299, lng: 2.1743558 }, capacity: 120, fillLevel: 60, status: ContainerStatus.OK, type: ContainerType.GENERAL },
      { city: 'Barcelona', location: 'Park Güell, Barcelona', coordinates: { lat: 41.4145, lng: 2.1520 }, capacity: 100, fillLevel: 30, status: ContainerStatus.OK, type: ContainerType.PLASTIC },
      { city: 'Barcelona', location: 'Las Ramblas, Barcelona', coordinates: { lat: 41.3813, lng: 2.1729 }, capacity: 150, fillLevel: 90, status: ContainerStatus.FULL, type: ContainerType.PAPER },
      { city: 'Barcelona', location: 'Barceloneta Beach, Barcelona', coordinates: { lat: 41.3787, lng: 2.1900 }, capacity: 130, fillLevel: 50, status: ContainerStatus.OK, type: ContainerType.GLASS },
      { city: 'Barcelona', location: 'Camp Nou, Barcelona', coordinates: { lat: 41.3809, lng: 2.1228 }, capacity: 200, fillLevel: 70, status: ContainerStatus.OK, type: ContainerType.ORGANIC },
      { city: 'Barcelona', location: 'Gothic Quarter, Barcelona', coordinates: { lat: 41.3825, lng: 2.1760 }, capacity: 110, fillLevel: 25, status: ContainerStatus.OK, type: ContainerType.METAL },

      // Paris Containers 
      { city: 'Paris', location: 'Eiffel Tower, Paris', coordinates: { lat: 48.858370, lng: 2.294481 }, capacity: 200, fillLevel: 80, status: ContainerStatus.FULL, type: ContainerType.PLASTIC },
      { city: 'Paris', location: 'Louvre Museum, Paris', coordinates: { lat: 48.860611, lng: 2.337644 }, capacity: 180, fillLevel: 65, status: ContainerStatus.OK, type: ContainerType.PAPER },
      { city: 'Paris', location: 'Notre Dame Cathedral, Paris', coordinates: { lat: 48.852968, lng: 2.349902 }, capacity: 150, fillLevel: 40, status: ContainerStatus.OK, type: ContainerType.GLASS },
      { city: 'Paris', location: 'Arc de Triomphe, Paris', coordinates: { lat: 48.873792, lng: 2.295028 }, capacity: 120, fillLevel: 75, status: ContainerStatus.FULL, type: ContainerType.GENERAL },
      { city: 'Paris', location: 'Montmartre, Paris', coordinates: { lat: 48.886705, lng: 2.343104 }, capacity: 100, fillLevel: 30, status: ContainerStatus.OK, type: ContainerType.CLOTHING },
      { city: 'Paris', location: 'Luxembourg Gardens, Paris', coordinates: { lat: 48.8462, lng: 2.3372 }, capacity: 130, fillLevel: 55, status: ContainerStatus.OK, type: ContainerType.ORGANIC },

      // Munich Containers
      { city: 'Munich', location: 'Marienplatz, Munich', coordinates: { lat: 48.137154, lng: 11.575382 }, capacity: 150, fillLevel: 50, status: ContainerStatus.OK, type: ContainerType.PAPER },
      { city: 'Munich', location: 'Hofbräuhaus, Munich', coordinates: { lat: 48.137602, lng: 11.579836 }, capacity: 100, fillLevel: 85, status: ContainerStatus.FULL, type: ContainerType.GLASS },
      { city: 'Munich', location: 'Englischer Garten, Munich', coordinates: { lat: 48.164219, lng: 11.605634 }, capacity: 180, fillLevel: 35, status: ContainerStatus.OK, type: ContainerType.ORGANIC },
      { city: 'Munich', location: 'Deutsches Museum, Munich', coordinates: { lat: 48.129920, lng: 11.583842 }, capacity: 160, fillLevel: 60, status: ContainerStatus.OK, type: ContainerType.ELECTRONICS },
      { city: 'Munich', location: 'BMW Welt, Munich', coordinates: { lat: 48.176761, lng: 11.557794 }, capacity: 130, fillLevel: 20, status: ContainerStatus.OK, type: ContainerType.METAL },

      // Warsaw Containers 
      { city: 'Warsaw', location: 'Palace of Culture and Science, Warsaw', coordinates: { lat: 52.231958, lng: 21.006725 }, capacity: 180, fillLevel: 70, status: ContainerStatus.OK, type: ContainerType.GLASS },
      { city: 'Warsaw', location: 'Old Town Market Place, Warsaw', coordinates: { lat: 52.249733, lng: 21.012213 }, capacity: 120, fillLevel: 45, status: ContainerStatus.OK, type: ContainerType.PAPER },
      { city: 'Warsaw', location: 'Łazienki Park, Warsaw', coordinates: { lat: 52.212792, lng: 21.033333 }, capacity: 150, fillLevel: 90, status: ContainerStatus.FULL, type: ContainerType.ORGANIC },
      { city: 'Warsaw', location: 'Warsaw Uprising Museum', coordinates: { lat: 52.232819, lng: 20.981017 }, capacity: 100, fillLevel: 25, status: ContainerStatus.OK, type: ContainerType.GENERAL },
      { city: 'Warsaw', location: 'Copernicus Science Centre, Warsaw', coordinates: { lat: 52.242316, lng: 21.027038 }, capacity: 130, fillLevel: 50, status: ContainerStatus.DAMAGED, incidentDescription: "Lid broken", type: ContainerType.PLASTIC },

      // Riga Containers 
      { city: 'Riga', location: 'House of the Blackheads, Riga', coordinates: { lat: 56.947499, lng: 24.106470 }, capacity: 100, fillLevel: 30, status: ContainerStatus.OK, type: ContainerType.ORGANIC },
      { city: 'Riga', location: 'Riga Central Market', coordinates: { lat: 56.944111, lng: 24.115036 }, capacity: 150, fillLevel: 80, status: ContainerStatus.FULL, type: ContainerType.GENERAL },
      { city: 'Riga', location: 'St. Peter\'s Church, Riga', coordinates: { lat: 56.947239, lng: 24.108910 }, capacity: 90, fillLevel: 55, status: ContainerStatus.OK, type: ContainerType.PAPER },
      { city: 'Riga', location: 'Freedom Monument, Riga', coordinates: { lat: 56.951904, lng: 24.113317 }, capacity: 80, fillLevel: 20, status: ContainerStatus.OK, type: ContainerType.GLASS },
      { city: 'Riga', location: 'Art Nouveau District, Riga', coordinates: { lat: 56.9590, lng: 24.1070 }, capacity: 110, fillLevel: 40, status: ContainerStatus.OK, type: ContainerType.METAL },

      // Stockholm Containers 
      { city: 'Stockholm', location: 'Gamla Stan, Stockholm', coordinates: { lat: 59.325695, lng: 18.071869 }, capacity: 130, fillLevel: 45, status: ContainerStatus.OK, type: ContainerType.METAL },
      { city: 'Stockholm', location: 'Vasa Museum, Stockholm', coordinates: { lat: 59.328102, lng: 18.091740 }, capacity: 100, fillLevel: 70, status: ContainerStatus.OK, type: ContainerType.PAPER },
      { city: 'Stockholm', location: 'Royal Palace, Stockholm', coordinates: { lat: 59.327030, lng: 18.071510 }, capacity: 150, fillLevel: 85, status: ContainerStatus.FULL, type: ContainerType.GENERAL },
      { city: 'Stockholm', location: 'Skansen, Stockholm', coordinates: { lat: 59.324501, lng: 18.104200 }, capacity: 160, fillLevel: 30, status: ContainerStatus.OK, type: ContainerType.ORGANIC },
      { city: 'Stockholm', location: 'ABBA The Museum, Stockholm', coordinates: { lat: 59.3249, lng: 18.0965 }, capacity: 120, fillLevel: 60, status: ContainerStatus.OK, type: ContainerType.PLASTIC },
      { city: 'Stockholm', location: 'Djurgården Island, Stockholm', coordinates: { lat: 59.3230, lng: 18.1008 }, capacity: 140, fillLevel: 25, status: ContainerStatus.OK, type: ContainerType.GLASS },
    ];
  }

  private async seedContainers() {
    const containersToSeed = this.getContainersSeedData();

    for (const containerData of containersToSeed) {
      const { city, ...containerEntityData } = containerData;

      const existingContainer = await this.containerRepository.findOneBy({ location: containerEntityData.location });
      if (!existingContainer) {
        await this.containerRepository.save(this.containerRepository.create(containerEntityData));
        this.logger.log(`Seeded container: ${containerEntityData.location}`);
      }
    }
  }

  private async seedAssignments() {
    const operators = await this.userRepository.find({ where: { role: Role.Operator } });

    if (!operators.length) {
      this.logger.warn('No operator users found. Skipping assignments seeding.');
      return;
    }

    const allContainersSeedData = this.getContainersSeedData();

    for (const operator of operators) {
      // Expect operator name like "Madrid Operator", "Barcelona Operator"
      const operatorNameParts = operator.name.split(' ');
      if (operatorNameParts.length < 2 || operatorNameParts[operatorNameParts.length - 1].toLowerCase() !== 'operator') {
        this.logger.warn(`Operator name "${operator.name}" (email: ${operator.email}) does not fit expected format '[City Name] Operator'. Skipping assignments for this operator.`);
        continue;
      }
      // Assuming city name can be multiple words, e.g. "Los Angeles Operator"
      const operatorCity = operatorNameParts.slice(0, -1).join(' ');


      const cityContainersSeedConfig = allContainersSeedData.filter(c => c.city === operatorCity);

      if (!cityContainersSeedConfig.length) {
        this.logger.log(`No containers found in seed data for city: ${operatorCity} (Operator: ${operator.email}).`);
        continue;
      }

      for (const containerConfig of cityContainersSeedConfig) {
        const dbContainer = await this.containerRepository.findOneBy({ location: containerConfig.location });

        if (!dbContainer) {
          this.logger.warn(`Container with location '${containerConfig.location}' for city ${operatorCity} not found in DB. Cannot assign to ${operator.email}.`);
          continue;
        }

        const existingAssignment = await this.assignmentRepository.findOneBy({
          operatorId: operator.id,
          containerId: dbContainer.id,
        });

        if (!existingAssignment) {
          const assignment = this.assignmentRepository.create({
            operatorId: operator.id,
            operator: operator,
            container: dbContainer,
            containerId: dbContainer.id,
            assignedAt: new Date(),
          });

          await this.assignmentRepository.save(assignment);
          this.logger.log(`Assigned container '${dbContainer.location}' to operator '${operator.email}'.`);
        }
      }
    }
    this.logger.log('Assignments seeding process completed.');
  }
}