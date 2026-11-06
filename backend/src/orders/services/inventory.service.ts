import { ConflictException, Injectable } from '@nestjs/common';
import type { InventoryReason } from 'src/database/enums';
import {
  InventoryMovement,
  ProductVariant,
} from 'src/database/postgres/entities';
import type { EntityManager } from 'typeorm';

interface Line {
  variantId: number;
  quantity: number;
  orderItemId?: number | null;
}

/**
 * Every stock change goes through here so the variant counters and the
 * inventory_movements ledger can never drift apart.
 */
@Injectable()
export class InventoryService {
  /** Hold stock for an online order (available_qty drops, stock_qty unchanged). */
  async reserve(m: EntityManager, line: Line, userId: number | null) {
    const res = await m
      .createQueryBuilder()
      .update(ProductVariant)
      .set({ reservedQty: () => 'reserved_qty + :qty' })
      .where('id = :id AND stock_qty - reserved_qty >= :qty')
      .setParameters({ id: line.variantId, qty: line.quantity })
      .execute();
    if (!res.affected)
      throw new ConflictException(
        'Some items just sold out. Please review your cart.',
      );
    await this.log(m, line, 0, line.quantity, 'reserve', userId);
  }

  /** Give held stock back (cancelled / rejected / expired). */
  async release(m: EntityManager, line: Line, userId: number | null) {
    await m
      .createQueryBuilder()
      .update(ProductVariant)
      .set({ reservedQty: () => 'GREATEST(reserved_qty - :qty, 0)' })
      .where('id = :id')
      .setParameters({ id: line.variantId, qty: line.quantity })
      .execute();
    await this.log(m, line, 0, -line.quantity, 'release', userId);
  }

  /** Customer collected: the hold becomes a sale. */
  async sell(m: EntityManager, line: Line, userId: number | null) {
    await m
      .createQueryBuilder()
      .update(ProductVariant)
      .set({
        stockQty: () => 'stock_qty - :qty',
        reservedQty: () => 'reserved_qty - :qty',
        stockUpdatedAt: () => 'now()',
      })
      .where('id = :id')
      .setParameters({ id: line.variantId, qty: line.quantity })
      .execute();
    await this.log(
      m,
      line,
      -line.quantity,
      -line.quantity,
      'online_sale',
      userId,
    );
  }

  /** Shop-side change from the one-tap stock buttons (restock, sold in store, ...). */
  async adjust(
    m: EntityManager,
    variantId: number,
    change: number,
    reason: InventoryReason,
    userId: number | null,
    note?: string,
  ) {
    const res = await m
      .createQueryBuilder()
      .update(ProductVariant)
      .set({
        stockQty: () => 'stock_qty + :change',
        stockUpdatedAt: () => 'now()',
      })
      .where('id = :id AND stock_qty + :change >= reserved_qty')
      .setParameters({ id: variantId, change })
      .execute();
    if (!res.affected)
      throw new ConflictException(
        'Stock cannot go below the quantity held for online orders.',
      );
    await m.insert(InventoryMovement, {
      variantId,
      stockChange: change,
      reservedChange: 0,
      reason,
      note: note ?? null,
      createdBy: userId,
    });
  }

  private log(
    m: EntityManager,
    line: Line,
    stockChange: number,
    reservedChange: number,
    reason: InventoryReason,
    userId: number | null,
  ) {
    return m.insert(InventoryMovement, {
      variantId: line.variantId,
      stockChange,
      reservedChange,
      reason,
      orderItemId: line.orderItemId ?? null,
      createdBy: userId,
    });
  }
}
