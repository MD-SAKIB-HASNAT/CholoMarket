// Fills dashboards with a realistic month of activity, using the real API so
// stock, payments, commission and ledgers stay consistent, then backdates it.
// Usage (API running, freshly seeded DB): npm run demo:history
import 'reflect-metadata';
import { AppDataSource } from 'src/database/postgres/data-source';

async function main() {
  const API = process.env.API_URL ?? 'http://localhost:4000/api';
  const ORDERS = Number(process.env.DEMO_ORDERS ?? 40);

  async function call<T = any>(
    method: string,
    path: string,
    token?: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
    const parsed = text ? JSON.parse(text) : null;
    return (parsed && 'success' in parsed ? parsed.data : parsed) as T;
  }

  async function login(phone: string, fullName?: string) {
    const otp = await call('POST', '/auth/otp/request', undefined, { phone });
    return call<{ accessToken: string; user: any }>(
      'POST',
      '/auth/otp/verify',
      undefined,
      { phone, code: otp.devCode, fullName },
    );
  }

  const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  const COMMENTS = [
    'Exactly as shown, picked up in 5 minutes.',
    'দোকানদার খুব ভালো ব্যবহার করেছেন।',
    'Genuine product, fair price.',
    'Easy pickup at the desk, no queue.',
    'Good quality, will buy again.',
    'Size was perfect.',
    'অনলাইনে রিজার্ভ করে খুব সুবিধা হলো।',
  ];

  console.log('Logging in customers and shop owners…');
  const customerSpecs: [string, string][] = [
    ['01800000001', 'Rahim Uddin'],
    ['01800000002', 'Farzana Akter'],
    ['01800000003', 'Tanvir Hasan'],
    ['01800000004', 'Nusrat Jahan'],
    ['01800000005', 'Sabbir Ahmed'],
    ['01800000006', 'Mim Chowdhury'],
    ['01800000007', 'Arif Hossain'],
    ['01800000008', 'Sumaiya Islam'],
  ];
  const customers = [];
  for (const [phone, name] of customerSpecs)
    customers.push(await login(phone, name));

  const ownerByShop = new Map<number, string>();
  for (let i = 1; i <= 13; i++) {
    const owner = await login(`017110000${String(i).padStart(2, '0')}`);
    for (const s of owner.user.shops)
      ownerByShop.set(s.shopId, owner.accessToken);
  }

  const catalog = await call('GET', '/products?limit=50&inStock=true');
  const products = [];
  for (const p of catalog.items)
    products.push(await call('GET', `/products/${p.id}`));
  const buyable = products.flatMap((p: any) =>
    p.variants
      .filter((v: any) => v.availableQty >= 3)
      .map((v: any) => ({ p, v })),
  );
  const markets = new Map<string, any>();
  const deliversByShop = new Map<number, boolean>(
    products.map((p: any) => [p.shop.id, p.shop.offersDelivery]),
  );
  const ADDRESSES = [
    {
      district: 'Dhaka',
      areaName: 'Mirpur 10',
      addressLine: 'House 14, Road 2, Block D',
      zone: 'inside_dhaka',
    },
    {
      district: 'Dhaka',
      areaName: 'Uttara Sector 7',
      addressLine: 'Flat 3B, House 22, Road 18',
      zone: 'inside_dhaka',
    },
    {
      district: 'Dhaka',
      areaName: 'Mohammadpur',
      addressLine: 'House 5/A, Tajmahal Road',
      zone: 'inside_dhaka',
    },
    {
      district: 'Chattogram',
      areaName: 'Agrabad',
      addressLine: 'Hotel Agrabad lane, House 9',
      zone: 'outside_dhaka',
    },
    {
      district: 'Sylhet',
      areaName: 'Zindabazar',
      addressLine: 'Shahjalal Road, House 41',
      zone: 'outside_dhaka',
    },
    {
      district: 'Gazipur',
      areaName: 'Tongi',
      addressLine: 'Station Road, Holding 112',
      zone: 'outside_dhaka',
    },
  ];

  let deskCache: string | undefined;
  async function deskToken() {
    deskCache ??= (await login('01700000011')).accessToken;
    return deskCache;
  }

  const created: { orderNo: string; daysAgo: number; keepRecent: boolean }[] =
    [];
  for (let i = 0; i < ORDERS; i++) {
    const customer = pick(customers);
    await call('DELETE', '/cart', customer.accessToken);
    const lines = Array.from({ length: Math.random() < 0.35 ? 2 : 1 }, () =>
      pick(buyable),
    );
    try {
      for (const { v } of lines)
        await call('POST', '/cart/items', customer.accessToken, {
          variantId: v.id,
          quantity: 1,
        });
    } catch {
      continue; // sold out meanwhile
    }
    const cart = await call('GET', '/cart', customer.accessToken);
    const shops = [];
    for (const g of cart.groups) {
      const slug = g.shop.market?.slug;
      if (slug && !markets.has(slug))
        markets.set(slug, await call('GET', `/markets/${slug}`));
      const desk = slug ? markets.get(slug).pickupPoints[0] : undefined;
      const roll = Math.random();
      if (deliversByShop.get(g.shop.id) && roll < 0.5)
        shops.push({ shopId: g.shop.id, fulfillmentType: 'delivery' });
      else if (desk && roll < 0.65)
        shops.push({
          shopId: g.shop.id,
          fulfillmentType: 'desk_pickup',
          pickupPointId: desk.id,
        });
      else shops.push({ shopId: g.shop.id, fulfillmentType: 'shop_pickup' });
    }
    const delivery = shops.some((x) => x.fulfillmentType === 'delivery')
      ? {
          address: {
            recipientName: customer.user.fullName,
            phone: customer.user.phone,
            ...pick(ADDRESSES),
          },
        }
      : {};
    const r = Math.random();
    const method = r < 0.55 ? 'cash' : r < 0.85 ? 'bkash' : 'nagad';
    let order;
    try {
      order = await call('POST', '/orders/checkout', customer.accessToken, {
        contactName: customer.user.fullName,
        contactPhone: customer.user.phone,
        paymentMethod: method,
        depositMethod: 'bkash',
        shops,
        ...delivery,
        ...(Math.random() < 0.15 && { couponCode: 'EID10' }),
      });
    } catch {
      order = await call('POST', '/orders/checkout', customer.accessToken, {
        contactName: customer.user.fullName,
        contactPhone: customer.user.phone,
        paymentMethod: 'bkash',
        shops,
        ...delivery,
      });
    }
    if (order.payment)
      await call(
        'POST',
        `/payments/${order.payment.id}/mock-complete`,
        customer.accessToken,
        { success: true, walletNumber: customer.user.phone },
      );

    const detail = await call(
      'GET',
      `/orders/${order.orderNo}`,
      customer.accessToken,
    );
    // The last few stay open so dashboards have work waiting.
    const keepRecent = i >= ORDERS - 5;
    for (const so of detail.shopOrders) {
      const token = ownerByShop.get(so.shopId)!;
      const act = (action: string, extra: Record<string, unknown> = {}) =>
        call(
          'POST',
          `/shop-portal/${so.shopId}/orders/${so.id}/action`,
          token,
          { action, ...extra },
        );
      const courier = (path: string, body: Record<string, unknown> = {}) =>
        call('POST', `/shop-portal/${so.shopId}/${path}`, token, body);
      if (keepRecent) {
        if (i % 2) await act('confirm');
        // Some delivery parcels are out with Steadfast right now.
        if (so.fulfillmentType === 'delivery' && i % 3 === 0) {
          const parcel = await courier(`orders/${so.id}/shipment`);
          await courier(`shipments/${parcel.id}/mock-status`, {
            courierStatus: 'pending',
          });
        }
        continue;
      }
      const fate = Math.random();
      if (fate < 0.06) {
        await act('reject', { reason: 'Size sold out in store' });
        continue;
      }
      if (fate < 0.1) {
        await call(
          'POST',
          `/orders/${order.orderNo}/shop-orders/${so.id}/cancel`,
          customer.accessToken,
          { reason: 'Changed my mind' },
        );
        continue;
      }
      await act('confirm');
      if (so.fulfillmentType === 'delivery') {
        const parcel = await courier(`orders/${so.id}/shipment`, {
          note: 'Call before coming',
        });
        await courier(`shipments/${parcel.id}/mock-status`, {
          courierStatus: 'pending',
        });
        // A few parcels come back (customer not reachable).
        if (Math.random() < 0.08) {
          await courier(`shipments/${parcel.id}/mock-status`, {
            courierStatus: 'cancelled',
          });
          continue;
        }
        await courier(`shipments/${parcel.id}/mock-status`, {
          courierStatus: 'delivered',
        });
      } else {
        await act('ready');
      }
      if (so.fulfillmentType === 'delivery') {
        // delivered above
      } else if (so.fulfillmentType === 'desk_pickup') {
        const deskStaff = await deskToken();
        await call(
          'POST',
          `/market-portal/${so.pickupPoint.marketId}/desk-orders/${so.id}/complete`,
          deskStaff,
          { pickupCode: so.pickupCode },
        ).catch(() => act('complete', { pickupCode: so.pickupCode }));
      } else {
        await act('complete', { pickupCode: so.pickupCode });
      }
      if (Math.random() < 0.6) {
        await call('POST', '/reviews', customer.accessToken, {
          shopOrderId: so.id,
          rating: Math.random() < 0.75 ? 5 : 4,
          comment: pick(COMMENTS),
        });
        const item = so.items[0];
        if (Math.random() < 0.5)
          await call('POST', '/reviews', customer.accessToken, {
            shopOrderId: so.id,
            productId: item.productId,
            rating: Math.random() < 0.7 ? 5 : 4,
            comment: pick(COMMENTS),
          }).catch(() => undefined);
      }
    }
    created.push({
      orderNo: order.orderNo,
      daysAgo: keepRecent ? 0 : 1 + Math.floor(Math.random() * 29),
      keepRecent,
    });
    process.stdout.write('.');
  }

  // Searches that found nothing tell onboarding what to bring on.
  for (const q of [
    'iphone 16 pro',
    'school bag',
    'বোরকা',
    'baby diaper',
    'iphone 16 pro',
    'rice cooker',
    'school bag',
    'iphone 16 pro',
  ]) {
    await call('GET', `/search?q=${encodeURIComponent(q)}`);
  }

  console.log(
    `\nBackdating ${created.filter((c) => !c.keepRecent).length} orders across the last 30 days…`,
  );
  await AppDataSource.initialize();
  for (const c of created.filter((x) => !x.keepRecent)) {
    const shift = `${c.daysAgo} days ${Math.floor(Math.random() * 8)} hours`;
    await AppDataSource.transaction(async (m) => {
      const [o] = await m.query(`SELECT id FROM orders WHERE order_no = $1`, [
        c.orderNo,
      ]);
      const sub = `(SELECT id FROM shop_orders WHERE order_id = ${Number(o.id)})`;
      await m.query(
        `UPDATE orders SET created_at = created_at - $1::interval, placed_at = placed_at - $1::interval, updated_at = updated_at - $1::interval WHERE id = $2`,
        [shift, o.id],
      );
      await m.query(
        `UPDATE shop_orders SET created_at = created_at - $1::interval, confirmed_at = confirmed_at - $1::interval, ready_at = ready_at - $1::interval,
           completed_at = completed_at - $1::interval, cancelled_at = cancelled_at - $1::interval, reserved_until = reserved_until - $1::interval,
           updated_at = updated_at - $1::interval WHERE order_id = $2`,
        [shift, o.id],
      );
      await m.query(
        `UPDATE shop_order_events SET created_at = created_at - $1::interval WHERE shop_order_id IN ${sub}`,
        [shift],
      );
      await m.query(
        `UPDATE payments SET created_at = created_at - $1::interval, paid_at = paid_at - $1::interval WHERE order_id = $2`,
        [shift, o.id],
      );
      await m.query(
        `UPDATE refunds SET created_at = created_at - $1::interval, processed_at = processed_at - $1::interval WHERE payment_id IN (SELECT id FROM payments WHERE order_id = $2)`,
        [shift, o.id],
      );
      await m.query(
        `UPDATE shop_ledger_entries SET created_at = created_at - $1::interval WHERE shop_order_id IN ${sub}`,
        [shift],
      );
      await m.query(
        `UPDATE reviews SET created_at = created_at - $1::interval WHERE shop_order_id IN ${sub}`,
        [shift],
      );
      await m.query(
        `UPDATE shipments SET created_at = created_at - $1::interval, updated_at = updated_at - $1::interval,
           delivered_at = delivered_at - $1::interval, last_synced_at = last_synced_at - $1::interval WHERE shop_order_id IN ${sub}`,
        [shift],
      );
      await m.query(
        `UPDATE shipment_events SET created_at = created_at - $1::interval WHERE shipment_id IN (SELECT id FROM shipments WHERE shop_order_id IN ${sub})`,
        [shift],
      );
      await m.query(
        `UPDATE inventory_movements SET created_at = created_at - $1::interval WHERE order_item_id IN (SELECT id FROM order_items WHERE shop_order_id IN ${sub})`,
        [shift],
      );
    });
  }
  await AppDataSource.query(
    `UPDATE notifications SET read_at = now() WHERE created_at < now() - interval '1 minute'`,
  );
  const [stats] =
    await AppDataSource.query(`SELECT count(*)::int AS orders, count(*) FILTER (WHERE status = 'completed')::int AS completed,
    (SELECT count(*)::int FROM shipments) AS parcels FROM orders`);
  await AppDataSource.destroy();
  console.log('Done:', stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
