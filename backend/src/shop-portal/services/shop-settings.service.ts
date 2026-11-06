import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeBdPhone } from 'src/common/helper/util';
import { Shop, ShopCategory, ShopHours } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import type {
  ShopHoursDto,
  ShopSettingsDto,
  VerificationInputDto,
} from 'src/shop-portal/dto/shop-settings.dto';

/** The shop's profile, opening hours and trade documents. */
@Injectable()
export class ShopSettingsService {
  constructor(private readonly postgresService: PostgresService) {}

  async settings(shopId: number) {
    const shop = await this.postgresService.shops.findOne({
      where: { id: shopId },
      relations: { categories: true, market: true, floor: true },
    });
    if (!shop) throw new NotFoundException();
    const hours = await this.postgresService.dataSource
      .getRepository(ShopHours)
      .find({ where: { shopId }, order: { weekday: 'ASC' } });
    return {
      ...shop,
      categoryIds: shop.categories.map((c) => c.categoryId),
      hours,
    };
  }

  async updateSettings(shopId: number, dto: ShopSettingsDto) {
    const { categoryIds, phone, whatsapp, ...fields } = dto;
    await this.postgresService.dataSource.transaction(async (m) => {
      await m.update(Shop, shopId, {
        ...fields,
        ...(phone !== undefined && {
          phone: phone ? normalizeBdPhone(phone) : null,
        }),
        ...(whatsapp !== undefined && {
          whatsapp: whatsapp ? normalizeBdPhone(whatsapp) : null,
        }),
      });
      if (categoryIds) {
        await m.delete(ShopCategory, { shopId });
        if (categoryIds.length)
          await m.insert(
            ShopCategory,
            categoryIds.map((categoryId) => ({ shopId, categoryId })),
          );
      }
    });
    return this.settings(shopId);
  }

  async setHours(shopId: number, dto: ShopHoursDto) {
    await this.postgresService.dataSource.transaction(async (m) => {
      await m.delete(ShopHours, { shopId });
      if (dto.hours.length) {
        await m.insert(
          ShopHours,
          dto.hours.map((h) => ({
            shopId,
            weekday: h.weekday,
            opensAt: h.isClosed ? null : (h.opensAt ?? null),
            closesAt: h.isClosed ? null : (h.closesAt ?? null),
            isClosed: h.isClosed,
          })),
        );
      }
    });
    return this.settings(shopId);
  }

  listVerifications(shopId: number) {
    return this.postgresService.shopVerifications.find({
      where: { shopId },
      order: { createdAt: 'DESC' },
    });
  }

  async submitVerification(shopId: number, dto: VerificationInputDto) {
    if (!dto.documentNumber && !dto.documentUrl)
      throw new BadRequestException('Add the document number or a photo.');
    return this.postgresService.shopVerifications.save({
      shopId,
      kind: dto.kind,
      documentNumber: dto.documentNumber ?? null,
      documentUrl: dto.documentUrl ?? null,
      expiresOn: dto.expiresOn ?? null,
      status: 'pending',
    });
  }
}
