import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { LessThanOrEqual, MoreThan } from 'typeorm';

/** A carousel never shows more than this many slides. */
const MAX_SLIDES = 6;

@Injectable()
export class BannersService {
  constructor(private readonly postgresService: PostgresService) {}

  /** Running campaigns for a placement (home banners, mall sponsors, …), oldest first. */
  running(placement: string) {
    const now = new Date();
    return this.postgresService.adCampaigns.find({
      where: {
        placement,
        status: 'running',
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThan(now),
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        mobileImageUrl: true,
        imageHasText: true,
        linkUrl: true,
        placement: true,
        advertiser: true,
      },
      order: { id: 'ASC' },
      take: MAX_SLIDES,
    });
  }
}
