import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { AuthGuard, type AuthUser, CurrentUser, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { SettingsService } from 'src/platform/services/settings.service';

export const UPLOAD_ROOT = join(process.cwd(), 'uploads');
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@ApiTags('platform')
@Controller()
@UseInterceptors(ResponseInterceptor)
export class PlatformController {
  constructor(
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @Get('health')
  async health() {
    return {
      message: 'Platform fetched successfully',
      result: { ok: true, time: new Date().toISOString() },
    };
  }

  /** Public app config (hotline, fees) for the frontend. */
  @Get('config')
  async publicConfig() {
    const s = await this.settings.all();
    return {
      message: 'Platform fetched successfully',
      result: {
        pickupFee: s.pickup_fee,
        supportHotline: s.support_hotline,
        paymentWindowMinutes: s.payment_window_minutes,
        deliveryFeeInsideDhaka: s.delivery_fee_inside_dhaka,
        deliveryFeeOutsideDhaka: s.delivery_fee_outside_dhaka,
        nearbyMaxKm: s.nearby_max_km,
      },
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('notifications')
  async listNotifications(
    @CurrentUser() user: AuthUser,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Platform fetched successfully',
      result: await this.notifications.list(user.id, q),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('notifications/read-all')
  async readAll(@CurrentUser() user: AuthUser) {
    return {
      message: 'Read all completed successfully',
      result: await this.notifications.markAllRead(user.id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('notifications/:id/read')
  async read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return {
      message: 'Read completed successfully',
      result: await this.notifications.markRead(user.id, id),
    };
  }

  /** Product photos, logos, documents. Local disk in dev; swap for S3/R2 in production. */
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Post('uploads/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(null, IMAGE_TYPES.includes(file.mimetype)),
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const now = new Date();
          const dir = join(
            UPLOAD_ROOT,
            String(now.getFullYear()),
            String(now.getMonth() + 1).padStart(2, '0'),
          );
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) =>
          cb(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase() || '.jpg'}`,
          ),
      }),
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() _user: AuthUser,
  ) {
    if (!file)
      throw new BadRequestException(
        'Upload a JPG, PNG, WEBP or GIF image up to 5 MB.',
      );
    const relative = file.path.slice(UPLOAD_ROOT.length).replace(/\\/g, '/');
    const base = this.config.get<string>(
      'PUBLIC_API_URL',
      'http://localhost:4000',
    );
    return {
      message: 'Upload completed successfully',
      result: { url: `${base}/uploads${relative}` },
    };
  }
}
