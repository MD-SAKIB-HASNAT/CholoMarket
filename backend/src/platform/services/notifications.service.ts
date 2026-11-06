import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  keysetIds,
  toCursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { QUEUES, type NotificationJob } from 'src/platform/helpers/queues';
import { In, IsNull } from 'typeorm';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly postgresService: PostgresService,
    @InjectQueue(QUEUES.notifications)
    private readonly queue: Queue<NotificationJob>,
  ) {}

  /** Fire-and-forget: queued so request latency never depends on SMS/push providers. */
  notify(job: NotificationJob): void {
    const userIds = [...new Set(job.userIds)].filter(Boolean);
    if (!userIds.length) return;
    this.queue
      .add(
        job.kind,
        { ...job, userIds },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 1000,
        },
      )
      .catch((err: Error) =>
        this.logger.error(`Could not queue notification: ${err.message}`),
      );
  }

  /** A page of the user's notifications, newest first, plus how many are still unread (across all pages). */
  async list(userId: number, q: CursorQueryDto) {
    const qb = this.postgresService.notifications
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId });
    const [page, unread] = await Promise.all([
      keysetIds(qb, {
        idExpr: 'n.id',
        keys: [{ expr: 'n.created_at', dir: 'DESC', type: 'timestamptz' }],
        tieDir: 'DESC',
        idType: 'bigint',
        page: q,
      }),
      this.postgresService.notifications.count({
        where: { userId, readAt: IsNull() },
      }),
    ]);
    const found = await this.postgresService.notifications.find({
      where: { id: In(page.ids.map(String)) },
    });
    const byId = new Map(found.map((n) => [Number(n.id), n]));
    return {
      ...toCursorPage(
        page.ids.flatMap((id) => byId.get(id) ?? []),
        page,
      ),
      unread,
    };
  }

  async markRead(userId: number, id: string) {
    const n = await this.postgresService.notifications.findOne({
      where: { id, userId },
    });
    if (!n) throw new NotFoundException();
    n.readAt = new Date();
    return this.postgresService.notifications.save(n);
  }

  async markAllRead(userId: number) {
    await this.postgresService.notifications.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { ok: true };
  }
}
