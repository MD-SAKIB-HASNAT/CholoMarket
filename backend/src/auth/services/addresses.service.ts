import { Injectable, NotFoundException } from '@nestjs/common';
import { normalizeBdPhone } from 'src/common/helper/util';
import { UserAddress } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { AddressInputDto } from 'src/orders/dto/orders.dto';

/** A customer keeps a handful of addresses; the list is capped rather than paged. */
const MAX_ADDRESSES = 50;

@Injectable()
export class AddressesService {
  constructor(private readonly postgresService: PostgresService) {}

  list(userId: number) {
    return this.postgresService.userAddresses.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
      take: MAX_ADDRESSES,
    });
  }

  async create(userId: number, dto: AddressInputDto) {
    const hasDefault = await this.postgresService.userAddresses.exists({
      where: { userId, isDefault: true },
    });
    return this.postgresService.userAddresses.save({
      ...dto,
      phone: normalizeBdPhone(dto.phone),
      userId,
      isDefault: !hasDefault,
    });
  }

  async update(userId: number, id: number, dto: Partial<AddressInputDto>) {
    const res = await this.postgresService.userAddresses.update(
      { id, userId },
      { ...dto, ...(dto.phone && { phone: normalizeBdPhone(dto.phone) }) },
    );
    if (!res.affected) throw new NotFoundException();
    return this.postgresService.userAddresses.findOneByOrFail({ id });
  }

  async makeDefault(userId: number, id: number) {
    await this.postgresService.dataSource.transaction(async (m) => {
      if (!(await m.exists(UserAddress, { where: { id, userId } })))
        throw new NotFoundException();
      await m.update(UserAddress, { userId }, { isDefault: false });
      await m.update(UserAddress, { id }, { isDefault: true });
    });
    return this.list(userId);
  }

  async remove(userId: number, id: number) {
    await this.postgresService.userAddresses.delete({ id, userId });
    return this.list(userId);
  }
}
