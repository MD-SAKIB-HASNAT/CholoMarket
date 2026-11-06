import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannersService } from 'src/catalog/services/banners.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('banners')
@Controller('banners')
@UseInterceptors(ResponseInterceptor)
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  /** Running banner campaigns, e.g. `?placement=home_banner`. */
  @Get()
  async running(@Query('placement') placement = 'home_banner') {
    return {
      message: 'Banners fetched successfully',
      result: await this.banners.running(placement),
    };
  }
}
