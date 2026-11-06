import { STEADFAST_STATUS_LABEL } from 'src/courier/helpers/providers';
import { Shipment, ShipmentEvent } from 'src/database/postgres/entities';
import { In, type DataSource } from 'typeorm';

/** The shape order pages, the shop portal and admin all use for a courier shipment. */
export function presentShipment(s: Shipment, events: ShipmentEvent[] = []) {
  return {
    id: s.id,
    shopOrderId: s.shopOrderId,
    provider: s.provider,
    mode: s.courierAccount?.mode ?? null,
    consignmentId: s.consignmentId,
    trackingCode: s.trackingCode,
    trackingUrl: s.trackingCode
      ? `https://steadfast.com.bd/t/${s.trackingCode}`
      : null,
    status: s.status,
    courierStatus: s.courierStatus,
    courierStatusLabel: s.courierStatus
      ? (STEADFAST_STATUS_LABEL[s.courierStatus] ?? s.courierStatus)
      : null,
    codAmount: s.codAmount,
    courierCharge: s.courierCharge,
    recipient: s.recipient,
    deliveredAt: s.deliveredAt,
    lastSyncedAt: s.lastSyncedAt,
    createdAt: s.createdAt,
    events: events.map((e) => ({
      id: e.id,
      status: e.status,
      courierStatus: e.courierStatus,
      source: e.source,
      message: e.message,
      createdAt: e.createdAt,
    })),
  };
}

export type ShipmentView = ReturnType<typeof presentShipment>;

/** Shipments for a set of shop orders, keyed by shop order id. */
export async function shipmentsFor(
  db: DataSource,
  shopOrderIds: number[],
): Promise<Map<number, ShipmentView>> {
  if (!shopOrderIds.length) return new Map();
  const rows = await db.getRepository(Shipment).find({
    where: { shopOrderId: In(shopOrderIds) },
    relations: { courierAccount: true },
  });
  const events = rows.length
    ? await db.getRepository(ShipmentEvent).find({
        where: { shipmentId: In(rows.map((r) => r.id)) },
        order: { createdAt: 'ASC' },
      })
    : [];
  return new Map(
    rows.map((r) => [
      r.shopOrderId,
      presentShipment(
        r,
        events.filter((e) => e.shipmentId === r.id),
      ),
    ]),
  );
}
