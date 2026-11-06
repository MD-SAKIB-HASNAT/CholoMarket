import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuthGuard, type AuthUser } from 'src/auth';
import { SearchQueryDto } from 'src/catalog/dto/search.dto';
import { SearchService } from 'src/catalog/services/search.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('search')
@Controller('search')
@UseInterceptors(ResponseInterceptor)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /** One box for everything: markets, shops and products (Bangla or English). */
  @UseGuards(OptionalAuthGuard)
  @Get()
  async find(@Query() q: SearchQueryDto, @CurrentUser() user?: AuthUser) {
    return {
      message: 'Search fetched successfully',
      result: await this.search.search(q, user?.id),
    };
  }
}
