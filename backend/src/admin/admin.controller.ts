// backend\src\admin\admin.controller.ts
import { Controller, Get, Param, Query, Res, StreamableFile, ValidationPipe, UsePipes, Inject, Logger } from '@nestjs/common'; // Added Logger
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Protected } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { PdfService } from '../common/services/pdf.service';
import { Response } from 'express';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { StatisticsService } from '../statistics/statistics.service';
import { StatsQueryDto } from './dto/stats-query.dto';
import { ContainerStatus } from '../containers/enums/container-status.enum';
import { ContainerType } from '../containers/enums/container-type.enum';
import { ContainersService } from '../containers/containers.service';
import { IncidentsService } from '../incidents/incidents.service';
import * as QRCode from 'qrcode';
import appConfiguration from '../config/app.config';
import { ConfigType } from '@nestjs/config';
import { I18nService, I18nContext, I18nLang } from 'nestjs-i18n'; 

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@Protected(Role.Admin)
@ApiCommonResponses()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: true }))
export class AdminController {
  private readonly logger = new Logger(AdminController.name); 
  private readonly frontendBaseUrl: string;

  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly pdfService: PdfService,
    private readonly containersService: ContainersService,
    private readonly incidentsService: IncidentsService,
    @Inject(appConfiguration.KEY) private readonly appConfig: ConfigType<typeof appConfiguration>,
    private readonly i18n: I18nService,
  ) {
    this.frontendBaseUrl = this.appConfig.frontendUrl; 
  }

  private async getCurrentRequestLang(): Promise<string> {
    return I18nContext.current()?.lang || this.appConfig.defaultLanguage;
  }

  @Get('reports/container-status')
  @ApiOperation({ summary: 'Generate PDF report of container statuses' })
  @ApiQuery({ name: 'containerType', required: false, enum: ContainerType, description: 'Filter by type (e.g., GENERAL)' })
  @ApiResponse({ status: 200, description: 'PDF report generated and streamed.' })
  async getContainerStatusReport(
    @Query() filters: StatsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const currentLang = await this.getCurrentRequestLang();
    const containers = await this.containersService.findAllFiltered(filters);
    const now = new Date();

    const reportTitle = await this.i18n.t('admin.REPORT_CONTAINER_STATUS_TITLE', { lang: currentLang });
    const filteredByTypeLabel = await this.i18n.t('admin.REPORT_FILTERED_BY_TYPE', {
      lang: currentLang,
      args: { type: filters.containerType || await this.i18n.t('admin.REPORT_ALL_TYPES', { lang: currentLang }) },
    });
    const generatedOnLabel = await this.i18n.t('admin.REPORT_GENERATED_ON', {
      lang: currentLang,
      args: { date: now.toLocaleDateString(currentLang), time: now.toLocaleTimeString(currentLang) },
    });

    const tableHeaderLocation = await this.i18n.t('admin.TABLE_HEADER_LOCATION', { lang: currentLang });
    const tableHeaderType = await this.i18n.t('admin.TABLE_HEADER_TYPE', { lang: currentLang });
    const tableHeaderCapacity = await this.i18n.t('admin.TABLE_HEADER_CAPACITY', { lang: currentLang });
    const tableHeaderFillLevel = await this.i18n.t('admin.TABLE_HEADER_FILL_LEVEL', { lang: currentLang });
    const tableHeaderStatus = await this.i18n.t('admin.TABLE_HEADER_STATUS', { lang: currentLang });

    const content: any[] = [
      { text: reportTitle, style: 'header' },
      { text: filteredByTypeLabel, style: 'subheaderSmall' },
      { text: generatedOnLabel, style: 'subheaderSmall' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: tableHeaderLocation, style: 'tableHeader' },
              { text: tableHeaderType, style: 'tableHeader' },
              { text: tableHeaderCapacity, style: 'tableHeader' },
              { text: tableHeaderFillLevel, style: 'tableHeader' },
              { text: tableHeaderStatus, style: 'tableHeader' }
            ],
            ...containers.map(c => [
              c.location,
              this.i18n.t(`containerType.${c.type}`, { lang: currentLang }), 
              c.capacity.toString(),
              c.fillLevel.toString(),
              this.i18n.t(`containerStatus.${c.status}`, { lang: currentLang }),]),
          ],
        },
      },
    ];

    const documentDefinition = {
      content: content,
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] as [number, number, number, number] },
        subheaderSmall: { fontSize: 9, italics: true, margin: [0, 2, 0, 5] as [number, number, number, number] },
        tableHeader: { bold: true, fontSize: 10, color: 'black' },
      },
      defaultStyle: { fontSize: 9 }
    };

    const pdfBuffer = await this.pdfService.generatePdf(documentDefinition);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="container-status-report-${filters.containerType || 'ALL'}-${Date.now()}.pdf"`,
    });
    return new StreamableFile(pdfBuffer);
  }

  @Get('reports/container-qr-codes')
  @ApiOperation({ summary: 'Generate a PDF with QR codes for each container' })
  @ApiResponse({ status: 200, description: 'PDF with QR codes generated and streamed.' })
  async getContainerQrCodesPdf(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const currentLang = await this.getCurrentRequestLang();
    const containers = await this.containersService.findAll();
    const pdfContent: any[] = [];

    if (!this.frontendBaseUrl) {
      this.logger.warn("Generating QRs with fallback base URL. Ensure FRONTEND_URLS is properly configured in production.");
    }

    const containerLabel = await this.i18n.t('admin.QR_PDF_CONTAINER_LABEL', { lang: currentLang });
    const idLabel = await this.i18n.t('admin.QR_PDF_ID_LABEL', { lang: currentLang });
    const typeLabel = await this.i18n.t('admin.QR_PDF_TYPE_LABEL', { lang: currentLang });
    const scanToReportLabel = await this.i18n.t('admin.QR_PDF_SCAN_TO_REPORT', { lang: currentLang });
    const urlLabel = await this.i18n.t('admin.QR_PDF_URL_LABEL', { lang: currentLang });
    const errorGeneratingQrLabel = await this.i18n.t('admin.QR_PDF_ERROR_GENERATING', { lang: currentLang });

    for (const container of containers) {
      const reportUrl = `${this.frontendBaseUrl}/report-incident?containerId=${container.id}`;
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(reportUrl, { errorCorrectionLevel: 'H', width: 200, margin: 1 });
      } catch (err) {
        this.logger.error(`Error generating QR code for container ${container.id}:`, err);
        qrDataUrl = 'QR_CODE_GENERATION_ERROR'; 
      }

      const containerType = this.i18n.t(`containerType.${container.type}`, { lang: currentLang });

      pdfContent.push(
        { text: containerLabel.replace('{location}', container.location), style: 'containerHeader', margin: [0, 0, 0, 10] as [number, number, number, number] },
        { text: idLabel.replace('{id}', container.id), style: 'smallText', margin: [0, 0, 0, 5] as [number, number, number, number] },
        { text: typeLabel.replace('{type}', containerType), style: 'smallText', margin: [0, 0, 0, 20] as [number, number, number, number] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              stack: [
                qrDataUrl.startsWith('data:image/png;base64,') ?
                  { image: qrDataUrl, width: 150 } :
                  { text: errorGeneratingQrLabel, style: 'errorText' },
                { text: scanToReportLabel, style: 'qrLabel', alignment: 'center' as const, margin: [0, 5, 0, 0] as [number, number, number, number] },
              ]
            },
            { width: '*', text: '' },
          ]
        },
        { text: urlLabel.replace('{url}', reportUrl), style: 'urlText', margin: [0, 15, 0, 0] as [number, number, number, number], alignment: 'center' as const },
      );
      if (containers.indexOf(container) < containers.length - 1) {
        pdfContent.push({ text: '', pageBreak: 'after' });
      }
    }

    if (!pdfContent.length) {
      const noContainersMsg = await this.i18n.t('admin.QR_PDF_NO_CONTAINERS', { lang: currentLang });
      pdfContent.push({ text: noContainersMsg, alignment: 'center' as const });
    }

    const documentDefinition = {
      content: pdfContent,
      defaultStyle: { fontSize: 10 },
      styles: {
        containerHeader: { fontSize: 18, bold: true, alignment: 'center' as const },
        smallText: { fontSize: 8, color: 'grey' },
        qrLabel: { fontSize: 9, italics: true, color: 'black' },
        urlText: { fontSize: 7, color: 'blue', decoration: 'underline' as const },
        errorText: { fontSize: 9, color: 'red', bold: true, alignment: 'center' as const },
      },
      pageMargins: [30, 40, 30, 40] as [number, number, number, number],
    };

    const pdfBuffer = await this.pdfService.generatePdf(documentDefinition);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="container-qr-codes-${Date.now()}.pdf"`,
    });
    return new StreamableFile(pdfBuffer);
  }

  @Get('statistics/container-usage')
  @ApiOperation({ summary: 'Get container usage statistics (summary of current state with filters)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'containerType', required: false, enum: ContainerType, description: 'Filter by type (e.g., GENERAL)' })
  async getContainerUsageStatistics(@Query() filters: StatsQueryDto) {
    // Data itself is not translated, but labels in a UI consuming this would be.
    return this.statisticsService.getContainerUsage(filters);
  }

  @Get('statistics/container-types')
  @ApiOperation({ summary: 'Get statistics by container type distribution with filters' })
  async getContainerTypesDistribution() {
    // Data itself is not translated
    return this.statisticsService.getContainerTypesDistribution();
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get summary data for the admin dashboard (current snapshot)' })
  async getDashboardSummary() {
    // Data itself is not translated
    const containers = await this.containersService.findAll();
    const incidents = await this.incidentsService.findAllIncidents();

    const CRITICAL_FILL_LEVEL_THRESHOLD = (this.containersService as any).CRITICAL_FILL_LEVEL || 85; // Accessing potentially private member
    const criticalContainers = containers.filter(c =>
      c.fillLevel >= CRITICAL_FILL_LEVEL_THRESHOLD || c.status === ContainerStatus.FULL
    );

    return {
      totalContainers: containers.length,
      fullContainers: criticalContainers.length, // Label would be "Full Containers" in UI
      activeIncidents: incidents.length,        // Label would be "Active Incidents" in UI
    };
  }
}