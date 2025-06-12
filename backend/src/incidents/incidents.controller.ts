// backend\src\incidents\incidents.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { IncidentsService } from './incidents.service';
import { Container } from '../containers/entities/container.entity';

@ApiTags('Incidents')
@Controller({ path: 'incidents', version: '1' })
@ApiCommonResponses()
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
  ) { }

  @Post('report')
  @ApiOperation({ summary: 'Report a new incident' })
  @ApiBody({ type: ReportIncidentDto })
  @ApiResponse({ status: 201, description: 'Incident reported successfully.', type: Container })
  @ApiResponse({ status: 404, description: 'Container not found.' })
  @ApiResponse({ status: 409, description: 'Invalid incident type.' })
  @ApiResponse({ status: 422, description: 'Validation error.' })
  async reportIncident(
    @Body() reportIncidentDto: ReportIncidentDto,
  ): Promise<Container> {
    return this.incidentsService.reportIncident(reportIncidentDto);
  }
}