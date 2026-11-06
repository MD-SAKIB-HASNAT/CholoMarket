import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { NearbyMapQueryDto } from 'src/geo/dto/nearby-map.dto';
import { NearbyMapService } from 'src/geo/services/nearby-map.service';

/** Public: what is around a point, for the Nearby map. */
@ApiTags('geo')
@Controller('nearby')
@UseInterceptors(ResponseInterceptor)
export class NearbyMapController {
  constructor(private readonly nearbyMapService: NearbyMapService) {}

  @Get('map')
  async map(@Query() q: NearbyMapQueryDto) {
    return {
      message: 'Nearby places fetched successfully',
      result: await this.nearbyMapService.pins(q),
    };
  }
}
