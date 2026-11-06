import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import {
  GeoInputDto,
  GeoListQueryDto,
  GeoLookupQueryDto,
} from 'src/geo/dto/geo.dto';
import { GEO_LEVELS, type GeoLevel } from 'src/geo/helpers/geo-levels';
import { GeoService } from 'src/geo/services/geo.service';

const LEVEL_PIPE = new ParseEnumPipe(
  Object.fromEntries(GEO_LEVELS.map((l) => [l, l])),
  {
    exceptionFactory: () =>
      new BadRequestException(
        'Unknown level. Use divisions, districts, areas or sub-areas.',
      ),
  },
);

/** Public pickers for the location filters: only active rows, each level narrowed by its parent. */
@ApiTags('geo')
@Controller('geo')
@UseInterceptors(ResponseInterceptor)
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('divisions')
  async divisions() {
    return {
      message: 'Geo fetched successfully',
      result: await this.geo.divisions(),
    };
  }

  @Get('districts')
  async districts(@Query() q: GeoLookupQueryDto) {
    return {
      message: 'Geo fetched successfully',
      result: await this.geo.districts(q.divisionId),
    };
  }

  @Get('areas')
  async areas(@Query() q: GeoLookupQueryDto) {
    return {
      message: 'Geo fetched successfully',
      result: await this.geo.areas(q.districtId),
    };
  }

  @Get('sub-areas')
  async subAreas(@Query() q: GeoLookupQueryDto) {
    return {
      message: 'Geo fetched successfully',
      result: await this.geo.subAreas(q.areaId),
    };
  }
}

/** Admin CRUD for division → district → area → sub-area. */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/geo')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class GeoAdminController {
  constructor(private readonly geo: GeoService) {}

  @Get(':level')
  async list(
    @Param('level', LEVEL_PIPE) level: GeoLevel,
    @Query() q: GeoListQueryDto,
  ) {
    return {
      message: 'Geo fetched successfully',
      result: await this.geo.list(level, q),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Post(':level')
  async create(
    @Param('level', LEVEL_PIPE) level: GeoLevel,
    @Body() dto: GeoInputDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Geo created successfully',
      result: await this.geo.create(level, dto, user.id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Patch(':level/:id')
  async update(
    @Param('level', LEVEL_PIPE) level: GeoLevel,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GeoInputDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Geo updated successfully',
      result: await this.geo.update(level, id, dto, user.id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Delete(':level/:id')
  async remove(
    @Param('level', LEVEL_PIPE) level: GeoLevel,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Geo deleted successfully',
      result: await this.geo.remove(level, id, user.id),
    };
  }
}
