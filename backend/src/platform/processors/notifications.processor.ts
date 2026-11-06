import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { QUEUES, type NotificationJob } from 'src/platform/helpers/queues';

/**
 * Stores in-app notifications. This is also the place to fan out to
 * SMS (e.g. SSL Wireless / Alpha SMS) and push (FCM) in production.
 */
@Processor(QUEUES.notifications)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly postgresService: PostgresService) {
    super();
  }

  async process(job: Job<NotificationJob>) {
    const { userIds, kind, title, body, data, channels } = job.data;
    await this.postgresService.notifications.insert(
      userIds.map((userId) => ({
        userId,
        kind,
        title,
        body: body ?? null,
        data: data ?? {},
        channels: channels ?? ['in_app'],
      })),
    );
    if (channels?.includes('sms')) {
      this.logger.log(`[sms] to users ${userIds.join(',')}: ${title}`);
    }
    return { delivered: userIds.length };
  }
}
