import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, type OnModuleInit } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { ChatService } from 'src/chat/services/chat.service';
import { CourierService } from 'src/courier/services/courier.service';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';
import { MAINTENANCE_JOBS, QUEUES } from 'src/platform/helpers/queues';

/**
 * Repeating background jobs (BullMQ job schedulers, so only one runs even with
 * several API instances):
 *  - expire reservations nobody collected, and unpaid orders past the payment window
 *  - expire stale bargaining offers
 *  - poll the courier for parcels it hasn't told us about (webhooks are the fast path)
 */
@Processor(QUEUES.maintenance)
export class MaintenanceProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(
    @InjectQueue(QUEUES.maintenance) private readonly queue: Queue,
    private readonly workflow: OrderWorkflowService,
    private readonly chat: ChatService,
    private readonly courier: CourierService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      MAINTENANCE_JOBS.expireReservations,
      { every: 60_000 },
      { name: MAINTENANCE_JOBS.expireReservations },
    );
    await this.queue.upsertJobScheduler(
      MAINTENANCE_JOBS.expireOffers,
      { every: 10 * 60_000 },
      { name: MAINTENANCE_JOBS.expireOffers },
    );
    await this.queue.upsertJobScheduler(
      MAINTENANCE_JOBS.syncShipments,
      { every: 2 * 60_000 },
      { name: MAINTENANCE_JOBS.syncShipments },
    );
  }

  async process(job: Job) {
    if (job.name === MAINTENANCE_JOBS.expireReservations) {
      const expired = await this.workflow.expireOverdue();
      if (expired) this.logger.log(`Expired ${expired} overdue shop order(s)`);
      return { expired };
    }
    if (job.name === MAINTENANCE_JOBS.syncShipments) {
      const changed = await this.courier.syncOpen();
      if (changed)
        this.logger.log(`Courier status changed for ${changed} parcel(s)`);
      return { changed };
    }
    if (job.name === MAINTENANCE_JOBS.expireOffers) {
      const expired = await this.chat.expireOffers();
      if (expired) this.logger.log(`Expired ${expired} offer(s)`);
      return { expired };
    }
    return null;
  }
}
