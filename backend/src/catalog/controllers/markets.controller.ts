import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DirectoryQueryDto, MarketQueryDto } from 'src/catalog/dto/markets.dto';
import { MarketsService } from 'src/catalog/services/markets.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('markets')
@Controller('markets')
@UseInterceptors(ResponseInterceptor)
export class MarketsController {
  constructor(private readonly markets: MarketsService) {}

  /** Markets by place or nearby, A–Z (partners first). Cursor-paged. */
  @Get()
  async list(@Query() q: MarketQueryDto) {
    return {
      message: 'Markets fetched successfully',
      result: await this.markets.list(q),
    };
  }

  @Get(':slug')
  async one(@Param('slug') slug: string) {
    return {
      message: 'Markets fetched successfully',
      result: await this.markets.bySlug(slug),
    };
  }

  /** Walk through the mall: shops grouped by floor in walking order. */
  @Get(':slug/directory')
  async directory(@Param('slug') slug: string, @Query() q: DirectoryQueryDto) {
    return {
      message: 'Markets fetched successfully',
      result: await this.markets.directory(slug, q),
    };
  }
}
