import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { PlatformController } from 'src/platform/controllers/platform.controller';
import { QUEUES } from 'src/platform/helpers/queues';
import { NotificationsProcessor } from 'src/platform/processors/notifications.processor';
import { CommissionService } from 'src/platform/services/commission.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { SettingsService } from 'src/platform/services/settings.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.notifications },
      { name: QUEUES.imports },
      { name: QUEUES.maintenance },
    ),
  ],
  controllers: [PlatformController],
  providers: [
    SettingsService,
    CommissionService,
    NotificationsService,
    NotificationsProcessor,
  ],
  exports: [
    SettingsService,
    CommissionService,
    NotificationsService,
    BullModule,
  ],
})
export class PlatformModule {}
