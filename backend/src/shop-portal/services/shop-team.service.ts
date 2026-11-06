import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeBdPhone } from 'src/common/helper/util';
import { PostgresService } from 'src/database/postgres/postgres.service';
import type { AddMemberDto } from 'src/shop-portal/dto/shop-team.dto';

@Injectable()
export class ShopTeamService {
  constructor(private readonly postgresService: PostgresService) {}

  list(shopId: number) {
    return this.postgresService.shopMembers.find({
      where: { shopId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async add(shopId: number, dto: AddMemberDto) {
    const phone = normalizeBdPhone(dto.phone);
    let user = await this.postgresService.users.findOne({ where: { phone } });
    user ??= await this.postgresService.users.save({
      phone,
      fullName: dto.fullName ?? null,
    });
    await this.postgresService.shopMembers.upsert(
      { shopId, userId: user.id, role: dto.role, isActive: true },
      ['shopId', 'userId'],
    );
    return this.list(shopId);
  }

  async remove(shopId: number, userId: number) {
    const member = await this.postgresService.shopMembers.findOne({
      where: { shopId, userId },
    });
    if (!member) throw new NotFoundException();
    if (member.role === 'owner')
      throw new BadRequestException('The owner cannot be removed.');
    await this.postgresService.shopMembers.update(
      { shopId, userId },
      { isActive: false },
    );
    return this.list(shopId);
  }
}
