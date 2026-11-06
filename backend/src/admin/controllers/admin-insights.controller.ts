import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminInsightsService } from 'src/admin/services/admin-insights.service';
import { AuditService } from 'src/admin/services/audit.service';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';

/** The dashboard, what customers search for, and the audit trail. */
@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminInsightsController {
  constructor(
    private readonly insights: AdminInsightsService,
    private readonly audit: AuditService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return {
      message: 'Data fetched successfully',
      result: await this.insights.dashboard(),
    };
  }

  @Get('search-insights')
  async searchInsights() {
    return {
      message: 'Data fetched successfully',
      result: await this.insights.searchInsights(),
    };
  }

  @Get('audit-log')
  async auditLog(@Query() q: CursorQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.audit.list(q),
    };
  }
}
