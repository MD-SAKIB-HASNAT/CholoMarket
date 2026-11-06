import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';
import { UPLOAD_ROOT } from 'src/platform/controllers/platform.controller';
import { IMPORT_COLUMNS } from 'src/shop-portal/processors/imports.processor';
import { ShopImportsService } from 'src/shop-portal/services/shop-imports.service';

const SAMPLE_ROWS =
  'Cotton Panjabi,সুতি পাঞ্জাবি,mens-fashion,1850,12,PJ-001,2200,L,White,Eid collection,yes\n' +
  'Wireless Earbuds,ওয়্যারলেস ইয়ারবাড,audio,2499,5,EB-100,,,Black,Bluetooth 5.3,no\n';

/** Bulk product upload by CSV (managers). */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopImportsController {
  constructor(private readonly imports: ShopImportsService) {}

  @Roles(Role.ShopManager)
  @Get('imports/template')
  template(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-import-template.csv"',
    );
    res.send(`﻿${IMPORT_COLUMNS.join(',')}\n${SAMPLE_ROWS}`);
  }

  @Roles(Role.ShopManager)
  @Get('imports')
  async list(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.imports.list(shopId, q),
    };
  }

  /** CSV bulk upload, processed in the background by the "imports" queue. */
  @Roles(Role.ShopManager)
  @ApiConsumes('multipart/form-data')
  @Post('imports')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(null, /\.csv$/i.test(file.originalname)),
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(UPLOAD_ROOT, 'imports');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, _file, cb) => cb(null, `${randomUUID()}.csv`),
      }),
    }),
  )
  async upload(
    @Param('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Upload a .csv file (max 5 MB).');
    return {
      message: 'Upload completed successfully',
      result: await this.imports.queueImport(
        shopId,
        user.id,
        file.originalname,
        file.path,
      ),
    };
  }
}
