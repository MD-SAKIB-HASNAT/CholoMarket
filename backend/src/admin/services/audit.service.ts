import { Injectable } from '@nestjs/common';
import {
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import { AuditLog } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

/** The admin team's trail: one place that writes "who changed what", and the screen that reads it back. */
@Injectable()
export class AuditService {
  constructor(private readonly postgresService: PostgresService) {}

  record(
    actorId: number,
    action: string,
    entityType: string,
    entityId: number | null,
    changes?: Record<string, any>,
  ) {
    return this.postgresService.dataSource.getRepository(AuditLog).insert({
      actorId,
      action,
      entityType,
      entityId,
      changes: changes ?? null,
    });
  }

  /** Who changed what, newest first. */
  async list(q: CursorQueryDto): Promise<CursorPage<AuditLog>> {
    const repo = this.postgresService.dataSource.getRepository(AuditLog);
    const page = await keysetIds(repo.createQueryBuilder('a'), {
      idExpr: 'a.id',
      keys: [{ expr: 'a.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    // The audit id is a bigint (a string in entities), so look rows up and re-order by that.
    const rows = await repo.find({
      where: { id: In(page.ids.map(String)) },
      relations: { actor: true },
    });
    const byId = new Map(rows.map((r) => [Number(r.id), r]));
    return toCursorPage(
      page.ids.flatMap((id) => byId.get(id) ?? []),
      page,
    );
  }
}
