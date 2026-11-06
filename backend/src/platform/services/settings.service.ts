import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** Tunables an admin can change without a deploy. */
export const SETTING_DEFAULTS = {
  /** Optional customer fee per order (BDT). Always collected online. */
  pickup_fee: 0,
  /** Minutes a customer has to complete online payment before the order is cancelled. */
  payment_window_minutes: 30,
  /** Customers with this many uncollected reservations must pay a deposit. */
  no_show_deposit_threshold: 2,
  /** Deposit % required from those customers. */
  no_show_deposit_percent: 20,
  /** Hours a pending bargaining offer stays open. */
  offer_validity_hours: 24,
  /** Hours an accepted offer price can be used at checkout. */
  accepted_offer_hours: 48,
  /** Customer hotline shown in the app. */
  support_hotline: '09600-000000',
  /** Home-delivery charge per shop parcel (BDT). */
  delivery_fee_inside_dhaka: 70,
  delivery_fee_outside_dhaka: 130,
  /** "Nearby" search: the farthest a customer may look, in kilometres (they can choose less). */
  nearby_max_km: 0.5,
  /** Bearer token Steadfast sends with its webhook calls (set the same in the Steadfast panel). */
  steadfast_webhook_token: 'change-me',
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

@Injectable()
export class SettingsService {
  constructor(private readonly postgresService: PostgresService) {}

  async get<K extends SettingKey>(
    key: K,
  ): Promise<(typeof SETTING_DEFAULTS)[K]> {
    const row = await this.postgresService.platformSettings.findOne({
      where: { key },
    });
    return (row?.value ??
      SETTING_DEFAULTS[key]) as (typeof SETTING_DEFAULTS)[K];
  }

  async all(): Promise<Record<SettingKey, unknown>> {
    const rows = await this.postgresService.platformSettings.find();
    const values: Record<string, unknown> = { ...SETTING_DEFAULTS };
    for (const r of rows) values[r.key] = r.value;
    return values as Record<SettingKey, unknown>;
  }

  async set(key: SettingKey, value: unknown, userId: number) {
    await this.postgresService.platformSettings.save({
      key,
      value,
      updatedBy: userId,
    });
    return this.all();
  }
}
