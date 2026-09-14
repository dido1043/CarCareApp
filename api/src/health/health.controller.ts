import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';

interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness plus database connectivity' })
  @ApiOkResponse({ description: 'Service and database are reachable' })
  async check(): Promise<HealthResponse> {
    const reachable = await this.prisma.isReachable();
    const body: HealthResponse = {
      status: reachable ? 'ok' : 'error',
      database: reachable ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };

    if (!reachable) {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }
}
