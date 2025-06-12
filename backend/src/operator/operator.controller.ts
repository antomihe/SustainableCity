// backend\src\operator\operator.controller.ts
import { Controller, Get, Param, Res, StreamableFile, ParseUUIDPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Protected } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { PdfService } from '../common/services/pdf.service';
import { Response } from 'express';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { ContainerStatus } from '../containers/enums/container-status.enum';
import { UsersService } from '../users/users.service';
import { AssignedContainerResponseDto } from './dto/assigned-container-response.dto';
import { AssignmentsService } from '../assignments/assignments.service';
import { IncidentsService } from '../incidents/incidents.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ConfigType } from '@nestjs/config';
import appConfiguration from '../config/app.config';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

export const CRITICAL_FILL_LEVEL = 80;

@ApiTags('Operator')
@Controller({ path: 'operator', version: '1' })
@Protected(Role.Operator)
@ApiCommonResponses()
export class OperatorController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignedContainersService: AssignmentsService,
    private readonly incidentsService: IncidentsService,
    private readonly pdfService: PdfService,
    private readonly i18n: I18nService,
    @Inject(appConfiguration.KEY) private readonly appConfig: ConfigType<typeof appConfiguration>,
  ) { }

  private async getCurrentRequestLang(): Promise<string> {
    return I18nContext.current()?.lang || this.appConfig.defaultLanguage;
  }

  @Get(':operatorId/assigned-containers')
  @ApiOperation({ summary: 'Get containers assigned to an operator (Operator only)' })
  @ApiParam({ name: 'operatorId', description: 'ID of the operator' })
  @ApiResponse({
    status: 200,
    description: 'List of assigned containers.',
    type: [AssignedContainerResponseDto],
  })
  async getAssignedContainers(
    @Param('operatorId', ParseUUIDPipe) operatorId: string,
    internationalization: boolean = false
  ): Promise<AssignedContainerResponseDto[]> {
    const lang = await this.getCurrentRequestLang();
    const assignedContainers = await this.assignedContainersService.getAssignedContainersForOperator(operatorId);
    const incidentContainers = await this.incidentsService.findAllIncidents();

    const assignedIncidentContainers = incidentContainers.filter(incidentContainer => {
      return assignedContainers.some(assigned => assigned.id === incidentContainer.id);
    }); 

    const translatedTasks = await Promise.all(assignedIncidentContainers.map(async (container) => {
      let description = '';
      if (container.status === ContainerStatus.FULL) {
        description = await this.i18n.t('operator.CONTAINER_STATUS_DESC_FULL', { lang });
      } else if (container.status === ContainerStatus.DAMAGED) {
        if (container.incidentDescription) {
          description = await this.i18n.t('operator.CONTAINER_STATUS_DESC_DAMAGED', {
            lang,
            args: { description: container.incidentDescription },
          });
        } else {
          description = await this.i18n.t('operator.CONTAINER_STATUS_DESC_DAMAGED_NO_DESC', { lang });
        }
      } else if (container.fillLevel > CRITICAL_FILL_LEVEL) {
        description = await this.i18n.t('operator.CONTAINER_STATUS_DESC_CRITICAL_FILL', { lang });
      } else {
        description = await this.i18n.t('operator.CONTAINER_STATUS_DESC_NORMAL', { lang });
      }

      let statusLabel = container.status;
      let containerTypeLabel = container.type;

      if (internationalization) {
        statusLabel = await this.i18n.t(`containerStatus.${container.status}`, { lang });
        containerTypeLabel = await this.i18n.t(`containerType.${container.type}`, { lang });
      }

      return {
        id: container.id,
        location: container.location,
        fillLevel: container.fillLevel,
        description: description,
        lastUpdated: container.lastEmptiedAt || container.createdAt,
        status: statusLabel,
        containerType: containerTypeLabel
      } as AssignedContainerResponseDto;
    }));

    return translatedTasks;
  }

  @Get(':operatorId/tasks-pdf')
  @ApiOperation({ summary: 'Generate PDF of daily tasks for an operator (Operator only)' })
  @ApiParam({ name: 'operatorId', description: 'ID of the operator' })
  @ApiResponse({ status: 200, description: 'PDF of daily tasks generated and streamed.' })
  async getDailyTasksPdf(
    @Param('operatorId', ParseUUIDPipe) operatorId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const lang = await this.getCurrentRequestLang();
    const tasks = await this.getAssignedContainers(operatorId, true);
    const user = await this.usersService.findOne(operatorId);
    const now = new Date();

    const pdfTitle = await this.i18n.t('operator.DAILY_TASKS_PDF_TITLE', { lang, args: { operatorName: user.name } });
    const dateLabel = await this.i18n.t('operator.PDF_DATE_LABEL', { lang, args: { date: now.toLocaleDateString(lang) } });
    const tableHeaderLocation = await this.i18n.t('operator.TABLE_HEADER_CONTAINER_LOCATION', { lang });
    const tableHeaderFillLevel = await this.i18n.t('operator.TABLE_HEADER_FILL_LEVEL_PERCENT', { lang });
    const tableHeaderStatus = await this.i18n.t('operator.TABLE_HEADER_CURRENT_STATUS', { lang });
    const tableHeaderContainerType = await this.i18n.t('operator.TABLE_HEADER_CONTAINER_TYPE', { lang });
    const noTasksMessage = await this.i18n.t('operator.NO_URGENT_TASKS_ASSIGNED', { lang });

    const content: any[] = [
      { text: pdfTitle, style: 'header' },
      { text: dateLabel, style: 'subheader' },
      '\n\n',
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: tableHeaderLocation, style: 'tableHeader' },
              { text: tableHeaderContainerType, style: 'tableHeader' },
              { text: tableHeaderStatus, style: 'tableHeader' },
              { text: tableHeaderFillLevel, style: 'tableHeader' }
            ],
            ...tasks.map(t => [t.location, t.containerType, t.status, t.fillLevel.toString() + '%']),
          ],
        },
      },
    ];

    if (tasks.length === 0) {
      content.push({ text: `\n\n${noTasksMessage}`, style: 'italic' });
    }

    const documentDefinition: TDocumentDefinitions = {
      content: content,
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, italics: true, margin: [0, 0, 0, 20] },
        tableHeader: { bold: true, fontSize: 12, color: 'black' },
        italic: { italics: true }
      },
    };

    const pdfBuffer = await this.pdfService.generatePdf(documentDefinition);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="daily-tasks-${operatorId}-${Date.now()}.pdf"`,
    });
    return new StreamableFile(pdfBuffer);
  }
}
