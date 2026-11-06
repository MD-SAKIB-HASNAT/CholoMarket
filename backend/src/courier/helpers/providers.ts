import { randomInt } from 'node:crypto';
import { randomCode } from 'src/common/helper/util';
import type { ShipmentStatus } from 'src/database/enums';

export interface BookingInput {
  invoice: string;
  recipientName: string;
  /** 11-digit local number, 01XXXXXXXXX */
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
}

export interface BookingResult {
  consignmentId: string;
  trackingCode: string | null;
  courierStatus: string;
  raw: Record<string, any>;
}

/** What every 3PL integration provides. Pathao, RedX, Paperfly… implement the same shape. */
export interface CourierClient {
  book(input: BookingInput): Promise<BookingResult>;
  /** `current` lets the mock courier move one step forward. */
  status(
    consignmentId: string,
    current?: string | null,
  ): Promise<{ courierStatus: string; raw: Record<string, any> }>;
  balance(): Promise<number | null>;
  trackingUrl(trackingCode: string): string;
}

// ------------------------------------------------------------------ Steadfast

/**
 * Steadfast (Packzy) merchant API. Auth: `Api-Key` and `Secret-Key` headers.
 * Base URL is configurable (STEADFAST_BASE_URL) because Steadfast has moved hosts before.
 */
export class SteadfastClient implements CourierClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly secretKey: string,
  ) {}

  private async call<T extends Record<string, any>>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Api-Key': this.apiKey,
        'Secret-Key': this.secretKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let json: T;
    try {
      json = (text ? JSON.parse(text) : {}) as T;
    } catch {
      throw new Error(
        `Steadfast replied with something unexpected (HTTP ${res.status}).`,
      );
    }
    if (!res.ok || (typeof json.status === 'number' && json.status !== 200)) {
      const errors = json.errors ? ` ${JSON.stringify(json.errors)}` : '';
      throw new Error(
        `Steadfast: ${json.message ?? `HTTP ${res.status}`}${errors}`,
      );
    }
    return json;
  }

  async book(input: BookingInput): Promise<BookingResult> {
    const json = await this.call<{ consignment: Record<string, any> }>(
      '/create_order',
      {
        method: 'POST',
        body: JSON.stringify({
          invoice: input.invoice,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone,
          recipient_address: input.recipientAddress,
          cod_amount: input.codAmount,
          note: input.note ?? '',
        }),
      },
    );
    const c = json.consignment ?? {};
    if (!c.consignment_id)
      throw new Error('Steadfast did not return a consignment ID.');
    return {
      consignmentId: String(c.consignment_id),
      trackingCode: c.tracking_code ?? null,
      courierStatus: c.status ?? 'in_review',
      raw: json,
    };
  }

  async status(consignmentId: string) {
    const json = await this.call<{ delivery_status?: string }>(
      `/status_by_cid/${encodeURIComponent(consignmentId)}`,
    );
    return { courierStatus: json.delivery_status ?? 'unknown', raw: json };
  }

  async balance() {
    const json = await this.call<{ current_balance?: number }>('/get_balance');
    return typeof json.current_balance === 'number'
      ? json.current_balance
      : null;
  }

  trackingUrl(trackingCode: string) {
    return `https://steadfast.com.bd/t/${trackingCode}`;
  }
}

/** Development stand-in: books instantly and moves one step per status check. */
export class MockSteadfastClient implements CourierClient {
  async book(input: BookingInput): Promise<BookingResult> {
    const consignmentId = String(randomInt(100_000_000, 999_999_999));
    const trackingCode = randomCode(10);
    return {
      consignmentId,
      trackingCode,
      courierStatus: 'in_review',
      raw: { mock: true, invoice: input.invoice, cod_amount: input.codAmount },
    };
  }

  /** Test mode never moves by itself: the shop's Test-mode buttons (or a webhook) play the courier. */
  async status(_consignmentId: string, current?: string | null) {
    const status = current ?? 'in_review';
    return {
      courierStatus: status,
      raw: { mock: true, delivery_status: status },
    };
  }

  async balance() {
    return 0;
  }

  trackingUrl(trackingCode: string) {
    return `https://steadfast.com.bd/t/${trackingCode}`;
  }
}

/**
 * Steadfast's status words → ours. "…_approval_pending" means the rider reported it but
 * Steadfast hasn't confirmed yet, so it's still in transit for us.
 */
export function normaliseSteadfast(status: string): ShipmentStatus {
  switch (status) {
    case 'in_review':
      return 'booked';
    case 'hold':
      return 'on_hold';
    case 'delivered':
      return 'delivered';
    case 'partial_delivered':
      return 'partial_delivered';
    case 'cancelled':
      return 'returned';
    default:
      return 'in_transit'; // pending, unknown, *_approval_pending
  }
}

export const STEADFAST_STATUS_LABEL: Record<string, string> = {
  in_review: 'Booked, waiting for pickup',
  pending: 'Picked up, on the way',
  hold: 'On hold at the courier',
  delivered_approval_pending: 'Delivered, awaiting confirmation',
  partial_delivered_approval_pending: 'Partly delivered, awaiting confirmation',
  cancelled_approval_pending: 'Cancelled, awaiting confirmation',
  unknown_approval_pending: 'Awaiting confirmation',
  delivered: 'Delivered',
  partial_delivered: 'Partly delivered',
  cancelled: 'Cancelled and returned to the shop',
  unknown: 'Status unknown',
};
