import { BadRequestException, Injectable } from '@nestjs/common';
import {
  SETTING_DEFAULTS,
  SettingsService,
  type SettingKey,
} from 'src/platform/services/settings.service';

/** The platform settings screen: every tunable with its current value, and a safe way to change one. */
@Injectable()
export class AdminSettingsService {
  constructor(private readonly settings: SettingsService) {}

  all() {
    return this.settings.all();
  }

  set(key: string, value: unknown, userId: number) {
    if (!(key in SETTING_DEFAULTS))
      throw new BadRequestException('Unknown setting.');
    return this.settings.set(key as SettingKey, value, userId);
  }
}
