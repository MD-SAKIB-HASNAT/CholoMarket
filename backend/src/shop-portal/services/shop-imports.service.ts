import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { QUEUES, type ImportJobData } from 'src/platform/helpers/queues';
import { In } from 'typeorm';

/** CSV bulk uploads: the file is queued here and processed in the background by ImportsProcessor. */
@Injectable()
export class ShopImportsService {
  constructor(
    private readonly postgresService: PostgresService,
    @InjectQueue(QUEUES.imports) private readonly queue: Queue<ImportJobData>,
  ) {}

  async queueImport(
    shopId: number,
    userId: number,
    fileName: string,
    filePath: string,
  ) {
    const job = await this.postgresService.importJobs.save({
      shopId,
      createdBy: userId,
      fileName,
      status: 'queued',
    });
    await this.queue.add(
      'import-products',
      { importJobId: job.id, filePath },
      { attempts: 1, removeOnComplete: 100 },
    );
    return job;
  }

  /** The shop's CSV imports, newest first. */
  async list(shopId: number, q: CursorQueryDto) {
    const qb = this.postgresService.importJobs
      .createQueryBuilder('i')
      .where('i.shop_id = :shopId', { shopId });
    const page = await keysetIds(qb, {
      idExpr: 'i.id',
      keys: [{ expr: 'i.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.importJobs.find({
      where: { id: In(page.ids) },
    });
    return toCursorPage(inOrder(page.ids, found), page);
  }
}
