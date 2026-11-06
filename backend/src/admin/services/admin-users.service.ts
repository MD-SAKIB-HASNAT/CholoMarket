import { Injectable } from '@nestjs/common';
import type { UserQueryDto } from 'src/admin/dto/admin-users.dto';
import { AuditService } from 'src/admin/services/audit.service';
import { normalizeBdPhone } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import type { PlatformRole } from 'src/database/enums';
import { PlatformStaff, User } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

export type AdminUserRow = User & { platformRole: PlatformRole | null };

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly audit: AuditService,
  ) {}

  /** Newest accounts first; search by phone, name or email. Each row carries its admin-team role, if any. */
  async list(q: UserQueryDto): Promise<CursorPage<AdminUserRow>> {
    const users = this.postgresService.dataSource.getRepository(User);
    const filter = users.createQueryBuilder('u');
    if (q.q)
      filter.where(
        "(u.phone || ' ' || coalesce(u.full_name, '') || ' ' || coalesce(u.email, '')) ILIKE :q",
        { q: `%${q.q}%` },
      );
    const page = await keysetIds(filter, {
      idExpr: 'u.id',
      keys: [{ expr: 'u.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });

    const found = inOrder(
      page.ids,
      await users.find({ where: { id: In(page.ids) } }),
    );
    const staff = await this.postgresService.dataSource
      .getRepository(PlatformStaff)
      .find({ where: { userId: In(page.ids) } });
    const roleOf = new Map(
      staff.filter((s) => s.isActive).map((s) => [s.userId, s.role]),
    );
    return toCursorPage(
      found.map((u) => ({ ...u, platformRole: roleOf.get(u.id) ?? null })),
      page,
    );
  }

  async setStaffRole(
    userId: number,
    role: PlatformRole | null,
    actorId: number,
  ) {
    const repo = this.postgresService.dataSource.getRepository(PlatformStaff);
    if (role) await repo.upsert({ userId, role, isActive: true }, ['userId']);
    else await repo.update({ userId }, { isActive: false });
    await this.audit.record(actorId, 'staff.role', 'user', userId, { role });
    return { userId, platformRole: role };
  }

  async setStatus(userId: number, status: User['status'], actorId: number) {
    await this.postgresService.dataSource
      .getRepository(User)
      .update(userId, { status });
    await this.audit.record(actorId, 'user.status', 'user', userId, { status });
    return this.postgresService.dataSource
      .getRepository(User)
      .findOneByOrFail({ id: userId });
  }

  /** The account for a mobile number, created on the spot for someone new (used when adding a shop or mall team member). */
  async findOrCreateByPhone(
    rawPhone: string,
    fullName?: string,
  ): Promise<User> {
    const phone = normalizeBdPhone(rawPhone);
    const repo = this.postgresService.dataSource.getRepository(User);
    const existing = await repo.findOne({ where: { phone } });
    if (existing) {
      if (fullName && !existing.fullName)
        await repo.update(existing.id, { fullName });
      return existing;
    }
    return repo.save({ phone, fullName: fullName ?? null });
  }
}
