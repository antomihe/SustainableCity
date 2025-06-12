// backend\src\incidents\incidents.service.ts
import { ReportIncidentDto } from "./dto/report-incident.dto";
import { ContainersService } from "../containers/containers.service";
import { IncidentType } from "./enums/incident-type.enum";
import { ConflictException, Injectable } from "@nestjs/common";
import { Container } from "../containers/entities/container.entity";
import { ContainerStatus } from "../containers/enums/container-status.enum";
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class IncidentsService {
    constructor(
        private readonly containersService: ContainersService,
        private readonly i18n: I18nService,
    ) { }

    async reportIncident(reportIncidentDto: ReportIncidentDto): Promise<Container> {
        const container = await this.containersService.findOne(reportIncidentDto.containerId);
        if (container.status === ContainerStatus.FULL && reportIncidentDto.type !== IncidentType.DAMAGED || container.status === ContainerStatus.DAMAGED) {
            const message = this.i18n.t('incident.ALREADY_REPORTED', { lang: I18nContext.current()?.lang });
            throw new ConflictException(message);
        }

        if (reportIncidentDto.type === IncidentType.FULL) {
            return await this.containersService.handleFullContainer(reportIncidentDto.containerId);
        } else if (reportIncidentDto.type === IncidentType.DAMAGED) {
            return await this.containersService.handleDamagedContainer(reportIncidentDto.containerId, reportIncidentDto.description as string);
        } else {
            const message = await this.i18n.t('incident.INVALID_TYPE', {
                lang: I18nContext.current()?.lang,
                args: { type: reportIncidentDto.type },
            });
            throw new ConflictException(message);
        }
    }

    async findAllIncidents(): Promise<Container[]> {
        const containers = await this.containersService.findAll();
        return containers.filter(container =>
            container.fillLevel > this.containersService.CRITICAL_FILL_LEVEL ||
            container.status === ContainerStatus.FULL ||
            container.status === ContainerStatus.DAMAGED
        );
    }
}