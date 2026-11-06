import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorQueryDto,
  type SortKey,
} from 'src/common/pagination';
import { presentShipment } from 'src/courier/helpers/present';
import {
  MockSteadfastClient,
  STEADFAST_STATUS_LABEL,
  SteadfastClient,
  normaliseSteadfast,
  type CourierClient,
} from 'src/courier/helpers/providers';
import {
  OPEN_SHIPMENT_STATUSES,
  type ShipmentStatus,
} from 'src/database/enums';
import {
  CourierAccount,
  Shipment,
  ShipmentEvent,
  ShopOrder,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';
import { SettingsService } from 'src/platform/services/settings.service';
import { In, IsNull, LessThan, type SelectQueryBuilder } from 'typeorm';

const NEWEST_FIRST: SortKey[] = [
  { expr: 's.created_at', dir: 'DESC', type: 'timestamptz' },
];

export interface SaveAccountInput {
  provider: 'steadfast';
  mode: 'mock' | 'live';
  label?: string;
  apiKey?: string;
  secretKey?: string;
  isDefault?: boolean;
}

/**
 * Third-party courier delivery. A shop connects its courier merchant account, then books
 * each home-delivery order as a shipment. Status comes back by webhook (Steadfast calls us)
 * and by polling (every 2 minutes) as a safety net; both end in `applyStatus`, which moves
 * the shop order to completed (delivered) or returned.
 */
@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  constructor(
    private readonly postgresService: PostgresService,
    private readonly workflow: OrderWorkflowService,
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  // ------------------------------------------------------------ accounts

  private client(account: CourierAccount): CourierClient {
    if (account.mode === 'mock') return new MockSteadfastClient();
    if (!account.apiKey || !account.secretKey)
      throw new BadRequestException('This courier account has no API keys.');
    const base = this.config.get<string>(
      'STEADFAST_BASE_URL',
      'https://portal.packzy.com/api/v1',
    );
    return new SteadfastClient(base, account.apiKey, account.secretKey);
  }

  private accountWithKeys(id: number) {
    return this.postgresService.dataSource
      .getRepository(CourierAccount)
      .createQueryBuilder('a')
      .addSelect(['a.apiKey', 'a.secretKey'])
      .where('a.id = :id', { id })
      .getOne();
  }

  listAccounts(shopId: number) {
    return this.postgresService.dataSource.getRepository(CourierAccount).find({
      where: { shopId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async saveAccount(
    shopId: number,
    input: SaveAccountInput,
    accountId?: number,
  ) {
    if (
      input.mode === 'live' &&
      (!input.apiKey || !input.secretKey) &&
      !accountId
    ) {
      throw new BadRequestException(
        'Enter the API key and secret key from your Steadfast merchant panel.',
      );
    }
    const repo = this.postgresService.dataSource.getRepository(CourierAccount);
    return this.postgresService.dataSource.transaction(async (m) => {
      let account = accountId
        ? await m.findOne(CourierAccount, { where: { id: accountId, shopId } })
        : null;
      if (accountId && !account) throw new NotFoundException();
      const makeDefault =
        input.isDefault ??
        !(await m.exists(CourierAccount, {
          where: {
            shopId,
            provider: input.provider,
            isDefault: true,
            isActive: true,
          },
        }));
      if (makeDefault)
        await m.update(
          CourierAccount,
          { shopId, provider: input.provider },
          { isDefault: false },
        );
      account ??= repo.create({ shopId, provider: input.provider });
      Object.assign(account, {
        mode: input.mode,
        // Editing (e.g. "make default") without a label keeps the current one.
        label:
          input.label?.trim() ||
          (account.mode === input.mode && account.label) ||
          (input.mode === 'mock' ? 'Steadfast (test mode)' : 'Steadfast'),
        isDefault: makeDefault,
        isActive: true,
        ...(input.apiKey && {
          apiKey: input.apiKey.trim(),
          keyHint: input.apiKey.trim().slice(-4),
        }),
        ...(input.secretKey && { secretKey: input.secretKey.trim() }),
      });
      const saved = await m.save(CourierAccount, account);
      const { apiKey: _k, secretKey: _s, ...safe } = saved;
      return safe;
    });
  }

  async testAccount(shopId: number, accountId: number) {
    const account = await this.accountWithKeys(accountId);
    if (!account || account.shopId !== shopId) throw new NotFoundException();
    try {
      const balance = await this.client(account).balance();
      await this.postgresService.dataSource
        .getRepository(CourierAccount)
        .update(account.id, { lastCheckedAt: new Date(), lastError: null });
      return { ok: true, balance, mode: account.mode };
    } catch (err) {
      const message = (err as Error).message;
      await this.postgresService.dataSource
        .getRepository(CourierAccount)
        .update(account.id, { lastCheckedAt: new Date(), lastError: message });
      throw new BadRequestException(message);
    }
  }

  async removeAccount(shopId: number, accountId: number) {
    await this.postgresService.dataSource
      .getRepository(CourierAccount)
      .update({ id: accountId, shopId }, { isActive: false, isDefault: false });
    return this.listAccounts(shopId);
  }

  // ------------------------------------------------------------ booking

  /** Book a home-delivery shop order with the shop's courier and mark it shipped. */
  async book(
    shopId: number,
    shopOrderId: number,
    userId: number,
    opts: { courierAccountId?: number; note?: string },
  ) {
    const so = await this.postgresService.dataSource
      .getRepository(ShopOrder)
      .findOne({
        where: { id: shopOrderId, shopId },
        relations: { order: true },
      });
    if (!so) throw new NotFoundException('Order not found');
    if (so.fulfillmentType !== 'delivery')
      throw new BadRequestException('This order is for pickup, not delivery.');
    if (so.order.status === 'pending_payment')
      throw new BadRequestException('The customer has not paid yet.');
    if (!['placed', 'confirmed'].includes(so.status))
      throw new BadRequestException(
        `This order is already ${so.status.replace(/_/g, ' ')}.`,
      );
    if (
      await this.postgresService.dataSource
        .getRepository(Shipment)
        .exists({ where: { shopOrderId } })
    )
      throw new BadRequestException(
        'A courier is already booked for this order.',
      );

    const accounts =
      this.postgresService.dataSource.getRepository(CourierAccount);
    const chosen = opts.courierAccountId
      ? await accounts.findOne({
          where: { id: opts.courierAccountId, shopId, isActive: true },
        })
      : await accounts.findOne({
          where: { shopId, isActive: true },
          order: { isDefault: 'DESC', createdAt: 'ASC' },
        });
    if (!chosen)
      throw new BadRequestException(
        'Connect a courier account first (Settings → Delivery).',
      );
    const account = (await this.accountWithKeys(chosen.id))!;

    const a = so.order.deliveryAddress ?? {};
    const recipient = {
      name: String(a.recipientName ?? so.order.contactName),
      phone: String(a.phone ?? so.order.contactPhone).replace(/^\+88/, ''),
      address: [
        a.addressLine,
        a.landmark && `near ${a.landmark}`,
        a.areaName,
        a.district,
      ]
        .filter(Boolean)
        .join(', '),
      zone: a.zone ?? null,
    };

    let booked;
    try {
      booked = await this.client(account).book({
        invoice: so.subOrderNo,
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        recipientAddress: recipient.address,
        codAmount: so.cashDue,
        note: opts.note,
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Courier booking failed — ${(err as Error).message}`,
      );
    }

    const status = normaliseSteadfast(booked.courierStatus);
    const shipment = await this.postgresService.dataSource.transaction(
      async (m) => {
        const s = await m.save(Shipment, {
          shopOrderId: so.id,
          shopId,
          courierAccountId: account.id,
          provider: account.provider,
          invoice: so.subOrderNo,
          consignmentId: booked.consignmentId,
          trackingCode: booked.trackingCode,
          status,
          courierStatus: booked.courierStatus,
          codAmount: so.cashDue,
          recipient,
          note: opts.note ?? null,
          createdBy: userId,
          lastSyncedAt: new Date(),
        });
        await m.insert(ShipmentEvent, {
          shipmentId: s.id,
          status,
          courierStatus: booked.courierStatus,
          source: 'booking',
          message: STEADFAST_STATUS_LABEL[booked.courierStatus] ?? null,
          raw: booked.raw,
        });
        return s;
      },
    );
    await this.workflow.apply(so.id, 'ship', {
      actorId: userId,
      reason: `Booked with ${account.provider} · ${booked.consignmentId}`,
    });
    return this.view(shipment.id);
  }

  // ------------------------------------------------------------ status

  /** One place where courier status changes land, whatever the source. */
  async applyStatus(
    shipmentId: number,
    courierStatus: string,
    source: 'poll' | 'webhook' | 'manual',
    raw: Record<string, any> | null,
    message?: string,
  ) {
    const repo = this.postgresService.dataSource.getRepository(Shipment);
    const shipment = await repo.findOneByOrFail({ id: shipmentId });
    const status = normaliseSteadfast(courierStatus);
    if (shipment.courierStatus === courierStatus) {
      await repo.update(shipment.id, { lastSyncedAt: new Date() });
      return shipment;
    }
    const deliveredNow =
      (status === 'delivered' || status === 'partial_delivered') &&
      !shipment.deliveredAt;
    await repo.update(shipment.id, {
      status,
      courierStatus,
      lastSyncedAt: new Date(),
      ...(deliveredNow && { deliveredAt: new Date() }),
      ...(typeof raw?.delivery_charge === 'number' && {
        courierCharge: raw.delivery_charge,
      }),
    });
    await this.postgresService.dataSource.getRepository(ShipmentEvent).insert({
      shipmentId,
      status,
      courierStatus,
      source,
      message: message ?? STEADFAST_STATUS_LABEL[courierStatus] ?? null,
      raw,
    });

    try {
      if (deliveredNow)
        await this.workflow.apply(shipment.shopOrderId, 'deliver', {
          actorId: null,
          courier: shipment.provider,
        });
      if (status === 'returned')
        await this.workflow.apply(shipment.shopOrderId, 'return', {
          actorId: null,
          reason: message ?? 'Returned by the courier',
        });
    } catch (err) {
      // Already moved on (e.g. a repeated webhook): the shipment record is still updated.
      this.logger.warn(`Shipment ${shipmentId}: ${(err as Error).message}`);
    }
    return repo.findOneByOrFail({ id: shipmentId });
  }

  /** Ask the courier for the latest status. `shopId` limits it to that shop's parcels. */
  async refresh(shipmentId: number, shopId?: number) {
    const shipment = await this.postgresService.dataSource
      .getRepository(Shipment)
      .findOneBy({ id: shipmentId, ...(shopId && { shopId }) });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const account = await this.accountWithKeys(shipment.courierAccountId);
    if (!account) throw new NotFoundException('Courier account missing');
    try {
      const res = await this.client(account).status(
        shipment.consignmentId,
        shipment.courierStatus,
      );
      await this.applyStatus(shipment.id, res.courierStatus, 'poll', res.raw);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Could not reach the courier — ${(err as Error).message}`,
      );
    }
    return this.view(shipment.id);
  }

  /** Maintenance job: poll open shipments not heard from in the last minute. */
  async syncOpen(): Promise<number> {
    const due = await this.postgresService.dataSource
      .getRepository(Shipment)
      .find({
        where: [
          {
            status: In(OPEN_SHIPMENT_STATUSES),
            lastSyncedAt: LessThan(new Date(Date.now() - 60_000)),
          },
          { status: In(OPEN_SHIPMENT_STATUSES), lastSyncedAt: IsNull() },
        ],
        select: { id: true },
        take: 200,
      });
    let changed = 0;
    for (const { id } of due) {
      try {
        const before = await this.postgresService.dataSource
          .getRepository(Shipment)
          .findOneByOrFail({ id });
        const after = await this.refresh(id);
        if (after.courierStatus !== before.courierStatus) changed++;
      } catch (err) {
        this.logger.warn(`Sync shipment ${id}: ${(err as Error).message}`);
      }
    }
    return changed;
  }

  /** Test-mode accounts only: let the shop play the courier's part. */
  async mockStatus(shopId: number, shipmentId: number, courierStatus: string) {
    const shipment = await this.postgresService.dataSource
      .getRepository(Shipment)
      .findOne({
        where: { id: shipmentId, shopId },
        relations: { courierAccount: true },
      });
    if (!shipment) throw new NotFoundException();
    if (shipment.courierAccount.mode !== 'mock')
      throw new ForbiddenException(
        'Only test-mode courier accounts can be simulated.',
      );
    if (!(courierStatus in STEADFAST_STATUS_LABEL))
      throw new BadRequestException('Unknown courier status.');
    await this.applyStatus(shipment.id, courierStatus, 'manual', {
      mock: true,
      delivery_status: courierStatus,
    });
    return this.view(shipment.id);
  }

  /** Steadfast calls this with `Authorization: Bearer <token>` set in its merchant panel. */
  async webhook(
    authorization: string | undefined,
    payload: Record<string, any>,
  ) {
    const expected = String(await this.settings.get('steadfast_webhook_token'));
    const given = (authorization ?? '').replace(/^Bearer\s+/i, '');
    const ok =
      given.length === expected.length &&
      timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!ok || expected === 'change-me')
      throw new UnauthorizedException('Bad webhook token.');

    const consignmentId = payload.consignment_id
      ? String(payload.consignment_id)
      : null;
    const invoice = payload.invoice ? String(payload.invoice) : null;
    const shipment = await this.postgresService.dataSource
      .getRepository(Shipment)
      .findOne({
        where: consignmentId
          ? { provider: 'steadfast', consignmentId }
          : { provider: 'steadfast', invoice: invoice ?? '' },
      });
    if (!shipment) return { status: 'ignored', reason: 'unknown consignment' };
    const courierStatus = payload.status ?? payload.delivery_status;
    if (courierStatus) {
      await this.applyStatus(
        shipment.id,
        String(courierStatus),
        'webhook',
        payload,
        payload.tracking_message,
      );
    } else if (payload.tracking_message) {
      await this.postgresService.dataSource
        .getRepository(ShipmentEvent)
        .insert({
          shipmentId: shipment.id,
          status: shipment.status,
          courierStatus: shipment.courierStatus,
          source: 'webhook',
          message: String(payload.tracking_message),
          raw: payload,
        });
    }
    return { status: 'success' };
  }

  // ------------------------------------------------------------ reading

  async view(shipmentId: number) {
    const s = await this.postgresService.dataSource
      .getRepository(Shipment)
      .findOne({
        where: { id: shipmentId },
        relations: { courierAccount: true },
      });
    if (!s) throw new NotFoundException();
    const events = await this.postgresService.dataSource
      .getRepository(ShipmentEvent)
      .find({ where: { shipmentId }, order: { createdAt: 'ASC' } });
    return presentShipment(s, events);
  }

  /** A shop's parcels, newest first. `status=open` means still with the courier. */
  async listForShop(
    shopId: number,
    q: CursorQueryDto & { status?: ShipmentStatus | 'open' },
  ) {
    const qb = this.shipmentsQuery(q.status).andWhere('s.shop_id = :shopId', {
      shopId,
    });
    const page = await keysetIds(qb, {
      idExpr: 's.id',
      keys: NEWEST_FIRST,
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.dataSource
      .getRepository(Shipment)
      .find({
        where: { id: In(page.ids) },
        relations: { courierAccount: true, shopOrder: true },
      });
    return toCursorPage(
      inOrder(page.ids, found).map((r) => ({
        ...presentShipment(r),
        subOrderNo: r.shopOrder.subOrderNo,
      })),
      page,
    );
  }

  /** Every shop's parcels for the admin team, newest first. */
  async listAll(q: CursorQueryDto & { status?: string }) {
    const qb = this.shipmentsQuery(
      q.status as ShipmentStatus | 'open' | undefined,
    );
    const page = await keysetIds(qb, {
      idExpr: 's.id',
      keys: NEWEST_FIRST,
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.dataSource
      .getRepository(Shipment)
      .find({
        where: { id: In(page.ids) },
        relations: {
          courierAccount: true,
          shopOrder: { shop: true, order: true },
        },
      });
    return toCursorPage(
      inOrder(page.ids, found).map((r) => ({
        ...presentShipment(r),
        subOrderNo: r.shopOrder.subOrderNo,
        orderNo: r.shopOrder.order?.orderNo,
        shopName: r.shopOrder.shop?.nameEn,
      })),
      page,
    );
  }

  private shipmentsQuery(
    status?: ShipmentStatus | 'open',
  ): SelectQueryBuilder<Shipment> {
    const qb = this.postgresService.dataSource
      .getRepository(Shipment)
      .createQueryBuilder('s')
      .where('1 = 1');
    if (status === 'open')
      qb.andWhere('s.status IN (:...open)', { open: OPEN_SHIPMENT_STATUSES });
    else if (status) qb.andWhere('s.status = :status', { status });
    return qb;
  }
}
