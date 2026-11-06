import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatsService } from 'src/catalog/services/stats.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('stats')
@Controller('stats')
@UseInterceptors(ResponseInterceptor)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async counts() {
    return {
      message: 'Stats fetched successfully',
      result: await this.statsService.counts(),
    };
  }
}
