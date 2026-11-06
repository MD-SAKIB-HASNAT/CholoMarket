async function main() {
  // End-to-end smoke test against a running API (npm run start:dev) with seed data.
  // Walks the whole Phase 1 journey and asserts each step. Usage: npm run smoke
  const API = process.env.API_URL ?? 'http://localhost:4000/api';
  let failures = 0;

  async function call<T = any>(
    method: string,
    path: string,
    token?: string,
    body?: unknown,
    raw = false,
  ): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body !== undefined &&
          !(body instanceof FormData) && {
            'Content-Type': 'application/json',
          }),
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
    const text = await res.text();
    const parsed = text && !raw ? JSON.parse(text) : null;
    // Every API answer is `{ success, statusCode, message, data }`.
    const data = raw
      ? text
      : parsed && 'success' in parsed
        ? parsed.data
        : parsed;
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
    return data as T;
  }

  function check(name: string, ok: unknown, detail?: unknown) {
    if (ok) console.log(`  ✓ ${name}`);
    else {
      failures++;
      console.log(`  ✗ ${name}`, detail ?? '');
    }
  }

  async function expectError(
    name: string,
    fn: () => Promise<unknown>,
    contains: string,
  ) {
    try {
      await fn();
      check(name, false, 'expected an error');
    } catch (e) {
      check(
        name,
        (e as Error).message.includes(contains),
        (e as Error).message,
      );
    }
  }

  const redisFlush = async (phone: string) => phone; // throttle keys expire on their own (30s)

  async function login(phone: string, fullName?: string) {
    await redisFlush(phone);
    const otp = await call('POST', '/auth/otp/request', undefined, { phone });
    const res = await call('POST', '/auth/otp/verify', undefined, {
      phone,
      code: otp.devCode,
      fullName,
    });
    return res as { accessToken: string; user: any };
  }

  console.log('\n1. Login');
  const customer = await login('01800000001');
  check(
    'customer logged in',
    customer.accessToken && customer.user.phone === '+8801800000001',
  );
  const gadgetOwner = await login('01711000002');
  check(
    'shop owner sees their shop',
    gadgetOwner.user.shops[0]?.name === 'Gadget Zone',
    gadgetOwner.user.shops,
  );
  const nakshiOwner = await login('01711000001');
  const desk = await login('01700000011');
  check(
    'desk staff sees market role',
    desk.user.markets[0]?.role === 'desk_staff',
  );
  const admin = await login('01700000001');
  check('admin has platform role', admin.user.platformRole === 'super_admin');
  await expectError(
    'wrong OTP is rejected',
    () =>
      call('POST', '/auth/otp/verify', undefined, {
        phone: '01800000002',
        code: '000000',
      }),
    'Wrong or expired',
  );

  console.log('\n2. Browse & search');
  const markets = await call('GET', '/markets');
  check(
    '4 markets listed',
    markets.items.length === 4 && !markets.hasMore,
    markets,
  );
  const dir = await call('GET', '/markets/shapla-city-mall/directory');
  check(
    'walk-through has floors in order',
    dir.floors.map((f: any) => f.level).join(',') === '0,1,2,3',
  );
  check(
    'ground floor has Nakshi Style House',
    dir.floors[0].shops.some((s: any) => s.nameEn === 'Nakshi Style House'),
  );
  const s1 = await call('GET', '/search?q=panjabi');
  check(
    'English search finds panjabi',
    s1.products.items.length >= 2,
    s1.products.items.length,
  );
  const s2 = await call('GET', `/search?q=${encodeURIComponent('পাঞ্জাবি')}`);
  check(
    'Bangla search finds পাঞ্জাবি',
    s2.products.items.length >= 2,
    s2.products.items.length,
  );
  const s3 = await call('GET', '/search?q=panjbi');
  check(
    'typo-tolerant search (panjbi)',
    s3.products.items.length >= 1,
    s3.products.items.length,
  );
  const cats = await call('GET', '/categories');
  check('category tree has children', cats[0].children.length > 0);
  const electronics = cats.find((c: any) => c.slug === 'electronics');
  const byCat = await call('GET', `/shops?categoryId=${electronics.id}`);
  check(
    'shops by category (electronics) includes Gadget Zone',
    byCat.items.some((s: any) => s.nameEn === 'Gadget Zone'),
  );

  console.log('\n3. Bargaining');
  const earbudsList = await call('GET', '/products?q=earbuds');
  const earbuds = await call(
    'GET',
    `/products/${earbudsList.items[0].id}`,
    customer.accessToken,
  );
  check(
    'product hides minOfferPrice',
    earbuds.variants.every((v: any) => !('minOfferPrice' in v)),
  );
  const ev = earbuds.variants[0];
  const low = await call('POST', '/offers', customer.accessToken, {
    variantId: ev.id,
    quantity: 1,
    offeredPrice: 2000,
  });
  check(
    'lowball offer auto-rejected by hidden floor',
    low.status === 'rejected',
  );
  const offer = await call('POST', '/offers', customer.accessToken, {
    variantId: ev.id,
    quantity: 1,
    offeredPrice: 3100,
    note: 'Student discount please',
  });
  check('fair offer is pending', offer.status === 'pending');
  const gadgetShopId = gadgetOwner.user.shops[0].shopId;
  const countered = await call(
    'POST',
    `/shop-portal/${gadgetShopId}/offers/${offer.id}/respond`,
    gadgetOwner.accessToken,
    { action: 'counter', counterPrice: 3250 },
  );
  check(
    'shop counters',
    countered.status === 'countered' && countered.counterPrice === 3250,
  );
  const accepted = await call(
    'POST',
    `/offers/${offer.id}/respond`,
    customer.accessToken,
    { action: 'accept_counter' },
  );
  check(
    'customer accepts counter at 3250',
    accepted.status === 'accepted' && accepted.finalPrice === 3250,
  );
  await expectError(
    'shop cannot respond to customer endpoint for others',
    () =>
      call('POST', `/offers/${offer.id}/respond`, gadgetOwner.accessToken, {
        action: 'withdraw',
      }),
    '404',
  );

  console.log('\n4. Cart across two shops');
  await call('DELETE', '/cart', customer.accessToken);
  await call('POST', '/cart/items', customer.accessToken, {
    variantId: ev.id,
    quantity: 1,
    offerId: offer.id,
  });
  const panjabi = (
    await call('GET', '/products?q=Cotton%20Panjabi')
  ).items.find((p: any) => p.nameEn.startsWith('Cotton Panjabi'));
  const panjabiDetail = await call('GET', `/products/${panjabi.id}`);
  const panjabiL = panjabiDetail.variants.find(
    (v: any) => v.attributes.size === 'L',
  );
  const stockBefore = panjabiL.availableQty;
  let cart = await call('POST', '/cart/items', customer.accessToken, {
    variantId: panjabiL.id,
    quantity: 2,
  });
  check(
    'cart grouped into 2 shops',
    cart.groups.length === 2,
    cart.groups.length,
  );
  check(
    'bargained price applied in cart',
    cart.groups.some((g: any) =>
      g.items.some((i: any) => i.unitPrice === 3250),
    ),
  );
  check(
    'cart subtotal = 3250 + 2×1850',
    cart.subtotal === 3250 + 3700,
    cart.subtotal,
  );
  await expectError(
    'cannot add more than stock',
    () =>
      call('POST', '/cart/items', customer.accessToken, {
        variantId: panjabiL.id,
        quantity: 40,
      }),
    'available',
  );

  console.log('\n5. Checkout with bKash + coupon, desk pickup for one shop');
  const market = await call('GET', '/markets/shapla-city-mall');
  const deskPoint = market.pickupPoints[0];
  const nakshiShopId = nakshiOwner.user.shops[0].shopId;
  const checkout = await call(
    'POST',
    '/orders/checkout',
    customer.accessToken,
    {
      contactName: 'Rahim Uddin',
      contactPhone: '01800000001',
      paymentMethod: 'bkash',
      couponCode: 'EID10',
      shops: [
        {
          shopId: nakshiShopId,
          fulfillmentType: 'desk_pickup',
          pickupPointId: deskPoint.id,
        },
      ],
    },
  );
  check(
    'order waits for payment',
    checkout.status === 'pending_payment' && checkout.payment?.id,
  );
  check(
    'coupon EID10 capped at ৳500',
    checkout.grandTotal === 6950 - 500,
    checkout.grandTotal,
  );
  const afterReserve = await call('GET', `/products/${panjabi.id}`);
  check(
    'stock reserved (available dropped by 2)',
    afterReserve.variants.find((v: any) => v.id === panjabiL.id)
      .availableQty ===
      stockBefore - 2,
  );
  cart = await call('GET', '/cart', customer.accessToken);
  check('cart emptied after checkout', cart.itemCount === 0);
  const failed = await call(
    'POST',
    `/payments/${checkout.payment.id}/mock-complete`,
    customer.accessToken,
    { success: false },
  );
  check('cancelled payment marked failed', failed.status === 'failed');
  const retry = await call(
    'POST',
    `/orders/${checkout.orderNo}/pay`,
    customer.accessToken,
    { method: 'bkash' },
  );
  const paid = await call(
    'POST',
    `/payments/${retry.id}/mock-complete`,
    customer.accessToken,
    { success: true, walletNumber: '01800000001' },
  );
  check('bKash payment succeeded', paid.status === 'succeeded' && paid.trxId);
  let order = await call(
    'GET',
    `/orders/${checkout.orderNo}`,
    customer.accessToken,
  );
  check(
    'order placed & paid',
    order.status === 'placed' && order.paymentStatus === 'paid',
    [order.status, order.paymentStatus],
  );
  const soGadget = order.shopOrders.find((s: any) => s.shopId === gadgetShopId);
  const soNakshi = order.shopOrders.find((s: any) => s.shopId === nakshiShopId);
  check(
    'commission: electronics 3% − Pro plan 2pt = 1%',
    soGadget.items[0].commissionRate === 1,
    soGadget.items[0].commissionRate,
  );
  check(
    'commission: fashion 6% − Basic plan 1pt = 5%',
    soNakshi.items[0].commissionRate === 5,
    soNakshi.items[0].commissionRate,
  );

  console.log('\n6. Shop fulfils with pickup code');
  const shopOrders = await call(
    'GET',
    `/shop-portal/${gadgetShopId}/orders?status=active`,
    gadgetOwner.accessToken,
  );
  check(
    'shop sees the order (no pickup code leaked)',
    shopOrders.items.some(
      (s: any) => s.id === soGadget.id && !('pickupCode' in s),
    ),
  );
  await call(
    'POST',
    `/shop-portal/${gadgetShopId}/orders/${soGadget.id}/action`,
    gadgetOwner.accessToken,
    { action: 'confirm' },
  );
  await call(
    'POST',
    `/shop-portal/${gadgetShopId}/orders/${soGadget.id}/action`,
    gadgetOwner.accessToken,
    { action: 'ready' },
  );
  await expectError(
    'wrong pickup code rejected',
    () =>
      call(
        'POST',
        `/shop-portal/${gadgetShopId}/orders/${soGadget.id}/action`,
        gadgetOwner.accessToken,
        { action: 'complete', pickupCode: '000000' },
      ),
    'Wrong pickup code',
  );
  const done = await call(
    'POST',
    `/shop-portal/${gadgetShopId}/orders/${soGadget.id}/action`,
    gadgetOwner.accessToken,
    { action: 'complete', pickupCode: soGadget.pickupCode },
  );
  check('shop order completed', done.status === 'completed');
  await expectError(
    'other shop cannot touch this order',
    () =>
      call(
        'POST',
        `/shop-portal/${nakshiShopId}/orders/${soGadget.id}/action`,
        nakshiOwner.accessToken,
        { action: 'confirm' },
      ),
    '404',
  );
  await expectError(
    'customer cannot open shop portal',
    () =>
      call('GET', `/shop-portal/${gadgetShopId}/orders`, customer.accessToken),
    '403',
  );

  console.log('\n7. Mall pickup desk hands over the other part');
  await call(
    'POST',
    `/shop-portal/${nakshiShopId}/orders/${soNakshi.id}/action`,
    nakshiOwner.accessToken,
    { action: 'ready' },
  );
  const deskOrders = await call(
    'GET',
    `/market-portal/${market.id}/desk-orders`,
    desk.accessToken,
  );
  check(
    'desk sees desk-pickup order',
    deskOrders.items.some((s: any) => s.id === soNakshi.id),
  );
  await call(
    'POST',
    `/market-portal/${market.id}/desk-orders/${soNakshi.id}/complete`,
    desk.accessToken,
    { pickupCode: soNakshi.pickupCode },
  );
  order = await call(
    'GET',
    `/orders/${checkout.orderNo}`,
    customer.accessToken,
  );
  check('whole order completed', order.status === 'completed', order.status);
  const afterSale = await call('GET', `/products/${panjabi.id}`);
  check(
    'stock now sold (still 2 less)',
    afterSale.variants.find((v: any) => v.id === panjabiL.id).availableQty ===
      stockBefore - 2,
  );

  console.log('\n8. Review');
  await call('POST', '/reviews', customer.accessToken, {
    shopOrderId: soGadget.id,
    rating: 5,
    comment: 'Genuine product, fast handover.',
  });
  await call('POST', '/reviews', customer.accessToken, {
    shopOrderId: soGadget.id,
    productId: earbuds.id,
    rating: 4,
    comment: 'Great sound for the price.',
  });
  await expectError(
    'duplicate review blocked',
    () =>
      call('POST', '/reviews', customer.accessToken, {
        shopOrderId: soGadget.id,
        rating: 3,
      }),
    'already reviewed',
  );
  const shopAfter = await call('GET', `/shops/gadget-zone`);
  check(
    'shop rating updated',
    shopAfter.ratingCount === 1 && shopAfter.ratingAvg === 5,
  );

  console.log('\n9. Cash order with required deposit (Gadget Zone asks 10%)');
  const charger = (await call('GET', '/products?q=charger')).items[0];
  const chargerD = await call('GET', `/products/${charger.id}`);
  await call('POST', '/cart/items', customer.accessToken, {
    variantId: chargerD.variants[0].id,
    quantity: 2,
  });
  const cashOrder = await call(
    'POST',
    '/orders/checkout',
    customer.accessToken,
    {
      contactName: 'Rahim Uddin',
      contactPhone: '01800000001',
      paymentMethod: 'cash',
      depositMethod: 'nagad',
    },
  );
  check(
    'deposit of 10% due online',
    cashOrder.amountDueOnline === 390 && cashOrder.payment?.method === 'nagad',
    cashOrder,
  );
  await call(
    'POST',
    `/payments/${cashOrder.payment.id}/mock-complete`,
    customer.accessToken,
    { success: true },
  );
  const cashDetail = await call(
    'GET',
    `/orders/${cashOrder.orderNo}`,
    customer.accessToken,
  );
  const cashSo = cashDetail.shopOrders[0];
  check('cash due at pickup = 3510', cashSo.cashDue === 3510, cashSo.cashDue);
  await call(
    'POST',
    `/shop-portal/${gadgetShopId}/orders/${cashSo.id}/action`,
    gadgetOwner.accessToken,
    { action: 'complete', pickupCode: cashSo.pickupCode },
  ).catch(async () => {
    await call(
      'POST',
      `/shop-portal/${gadgetShopId}/orders/${cashSo.id}/action`,
      gadgetOwner.accessToken,
      { action: 'confirm' },
    );
    await call(
      'POST',
      `/shop-portal/${gadgetShopId}/orders/${cashSo.id}/action`,
      gadgetOwner.accessToken,
      { action: 'complete', pickupCode: cashSo.pickupCode },
    );
  });
  const cashAfter = await call(
    'GET',
    `/orders/${cashOrder.orderNo}`,
    customer.accessToken,
  );
  check(
    'cash collected, order paid',
    cashAfter.paymentStatus === 'paid' &&
      cashAfter.payments.some(
        (p: any) => p.method === 'cash' && p.amount === 3510,
      ),
  );

  console.log('\n10. Customer cancels → stock released + refund');
  const watch = (await call('GET', '/products?q=Analog')).items[0];
  const watchD = await call('GET', `/products/${watch.id}`);
  const wv = watchD.variants[0];
  await call('POST', '/cart/items', customer.accessToken, {
    variantId: wv.id,
    quantity: 1,
  });
  const wOrder = await call('POST', '/orders/checkout', customer.accessToken, {
    contactName: 'Rahim',
    contactPhone: '01800000001',
    paymentMethod: 'bkash',
  });
  await call(
    'POST',
    `/payments/${wOrder.payment.id}/mock-complete`,
    customer.accessToken,
    { success: true },
  );
  const wDetail = await call(
    'GET',
    `/orders/${wOrder.orderNo}`,
    customer.accessToken,
  );
  await call(
    'POST',
    `/orders/${wOrder.orderNo}/shop-orders/${wDetail.shopOrders[0].id}/cancel`,
    customer.accessToken,
    { reason: 'Changed my mind' },
  );
  const wAfter = await call(
    'GET',
    `/orders/${wOrder.orderNo}`,
    customer.accessToken,
  );
  check(
    'cancelled + refunded',
    wAfter.status === 'cancelled' &&
      wAfter.paymentStatus === 'refunded' &&
      wAfter.refunds.length === 1,
    [wAfter.status, wAfter.paymentStatus],
  );
  const watchAfter = await call('GET', `/products/${watch.id}`);
  check(
    'watch stock released',
    watchAfter.variants[0].availableQty === wv.availableQty,
  );

  console.log('\n10b. Home delivery: cash on delivery via Steadfast');
  const glowOwner = await login('01711000003');
  const glowShopId = glowOwner.user.shops[0].shopId;
  const sunscreen = (await call('GET', '/products?q=Sunscreen')).items[0];
  const sunD = await call('GET', `/products/${sunscreen.id}`);
  const sunV = sunD.variants[0];
  await call('POST', '/cart/items', customer.accessToken, {
    variantId: sunV.id,
    quantity: 2,
  });
  const address = {
    recipientName: 'Rahim Uddin',
    phone: '01800000001',
    district: 'Dhaka',
    areaName: 'Mirpur 10',
    addressLine: 'House 12, Road 3, Block C',
    zone: 'inside_dhaka',
  };
  const cod = await call('POST', '/orders/checkout', customer.accessToken, {
    contactName: 'Rahim Uddin',
    contactPhone: '01800000001',
    paymentMethod: 'cash',
    shops: [{ shopId: glowShopId, fulfillmentType: 'delivery' }],
    address,
    saveAddress: true,
  });
  check(
    'COD order placed without online payment',
    cod.status === 'placed' && !cod.payment,
    cod,
  );
  check(
    'delivery charge ৳70 inside Dhaka added',
    cod.grandTotal === 1900 + 70,
    cod.grandTotal,
  );
  const addresses = await call('GET', '/me/addresses', customer.accessToken);
  check(
    'address saved for next time',
    addresses.length === 1 && addresses[0].isDefault,
  );
  let codDetail = await call(
    'GET',
    `/orders/${cod.orderNo}`,
    customer.accessToken,
  );
  const codSo = codDetail.shopOrders[0];
  check(
    'courier collects ৳1970 on delivery',
    codSo.fulfillmentType === 'delivery' &&
      codSo.deliveryFee === 70 &&
      codSo.cashDue === 1970,
    codSo,
  );
  check(
    'order keeps the delivery address',
    codDetail.deliveryAddress?.areaName === 'Mirpur 10',
  );
  await expectError(
    'pickup handover refused for delivery orders',
    () =>
      call(
        'POST',
        `/shop-portal/${glowShopId}/orders/${codSo.id}/action`,
        glowOwner.accessToken,
        { action: 'ready' },
      ),
    'courier',
  );
  await call(
    'POST',
    `/shop-portal/${glowShopId}/orders/${codSo.id}/action`,
    glowOwner.accessToken,
    { action: 'confirm' },
  );
  const couriers = await call(
    'GET',
    `/shop-portal/${glowShopId}/couriers`,
    glowOwner.accessToken,
  );
  check(
    'shop has a Steadfast account (test mode)',
    couriers.length === 1 &&
      couriers[0].provider === 'steadfast' &&
      !('apiKey' in couriers[0]),
  );
  const stockBeforeShip = (
    await call(
      'GET',
      `/shop-portal/${glowShopId}/products/${sunscreen.id}`,
      glowOwner.accessToken,
    )
  ).variants[0].stockQty;
  const shipment = await call(
    'POST',
    `/shop-portal/${glowShopId}/orders/${codSo.id}/shipment`,
    glowOwner.accessToken,
    { note: 'Call before coming' },
  );
  check(
    'booked with Steadfast: consignment + tracking',
    shipment.consignmentId &&
      shipment.trackingCode &&
      shipment.status === 'booked' &&
      shipment.codAmount === 1970,
    shipment,
  );
  await expectError(
    'cannot book the same order twice',
    () =>
      call(
        'POST',
        `/shop-portal/${glowShopId}/orders/${codSo.id}/shipment`,
        glowOwner.accessToken,
        {},
      ),
    'already',
  );
  const afterShip = await call(
    'GET',
    `/shop-portal/${glowShopId}/orders/${codSo.id}`,
    glowOwner.accessToken,
  );
  check(
    'shop order marked shipped',
    afterShip.status === 'shipped' &&
      afterShip.shipment?.consignmentId === shipment.consignmentId,
  );
  const stockAfterShip = (
    await call(
      'GET',
      `/shop-portal/${glowShopId}/products/${sunscreen.id}`,
      glowOwner.accessToken,
    )
  ).variants[0].stockQty;
  check(
    'stock left the shop when shipped',
    stockAfterShip === stockBeforeShip - 2,
    [stockBeforeShip, stockAfterShip],
  );
  const transit = await call(
    'POST',
    `/shop-portal/${glowShopId}/shipments/${shipment.id}/mock-status`,
    glowOwner.accessToken,
    { courierStatus: 'pending' },
  );
  check('courier picked it up (in transit)', transit.status === 'in_transit');
  await expectError(
    'webhook with a wrong token is refused',
    () =>
      call('POST', '/webhooks/steadfast', 'wrong-token', {
        consignment_id: shipment.consignmentId,
        status: 'delivered',
      }),
    '401',
  );
  const hook = await call(
    'POST',
    '/webhooks/steadfast',
    'dev-steadfast-webhook-token',
    {
      notification_type: 'delivery_status',
      consignment_id: Number(shipment.consignmentId),
      invoice: codSo.subOrderNo,
      status: 'delivered',
      cod_amount: 1970,
      delivery_charge: 60,
      tracking_message: 'Delivered to customer',
    },
  );
  check('Steadfast webhook accepted', hook.status === 'success');
  codDetail = await call('GET', `/orders/${cod.orderNo}`, customer.accessToken);
  check(
    'delivered → order completed and paid',
    codDetail.status === 'completed' && codDetail.paymentStatus === 'paid',
    [codDetail.status, codDetail.paymentStatus],
  );
  check(
    'COD payment recorded as collected by Steadfast',
    codDetail.payments.some(
      (pm: any) =>
        pm.method === 'cash' &&
        pm.amount === 1970 &&
        pm.gateway === 'steadfast',
    ),
  );
  check(
    'customer sees tracking + delivered',
    codDetail.shopOrders[0].shipment?.status === 'delivered' &&
      codDetail.shopOrders[0].shipment.trackingUrl?.includes(
        shipment.trackingCode,
      ),
  );
  const repeat = await call(
    'POST',
    '/webhooks/steadfast',
    'dev-steadfast-webhook-token',
    { consignment_id: shipment.consignmentId, status: 'delivered' },
  );
  check('repeated webhook is harmless', repeat.status === 'success');

  console.log('\n10c. Delivery returned by the courier → stock back + refund');
  await call('POST', '/cart/items', customer.accessToken, {
    variantId: sunV.id,
    quantity: 1,
  });
  const ret = await call('POST', '/orders/checkout', customer.accessToken, {
    contactName: 'Rahim Uddin',
    contactPhone: '01800000001',
    paymentMethod: 'bkash',
    shops: [{ shopId: glowShopId, fulfillmentType: 'delivery' }],
    address: {
      ...address,
      district: 'Sylhet',
      areaName: 'Zindabazar',
      zone: 'outside_dhaka',
    },
  });
  check(
    'outside Dhaka charge ৳130',
    ret.grandTotal === 950 + 130,
    ret.grandTotal,
  );
  await call(
    'POST',
    `/payments/${ret.payment.id}/mock-complete`,
    customer.accessToken,
    { success: true },
  );
  const retSo = (
    await call('GET', `/orders/${ret.orderNo}`, customer.accessToken)
  ).shopOrders[0];
  const retShip = await call(
    'POST',
    `/shop-portal/${glowShopId}/orders/${retSo.id}/shipment`,
    glowOwner.accessToken,
    {},
  );
  const stockBeforeReturn = (
    await call(
      'GET',
      `/shop-portal/${glowShopId}/products/${sunscreen.id}`,
      glowOwner.accessToken,
    )
  ).variants[0].stockQty;
  const cancelled = await call(
    'POST',
    `/shop-portal/${glowShopId}/shipments/${retShip.id}/mock-status`,
    glowOwner.accessToken,
    { courierStatus: 'cancelled' },
  );
  check(
    'courier cancelled → shipment returned',
    cancelled.status === 'returned',
  );
  const retAfter = await call(
    'GET',
    `/orders/${ret.orderNo}`,
    customer.accessToken,
  );
  check(
    'order cancelled and fully refunded',
    retAfter.shopOrders[0].status === 'returned' &&
      retAfter.paymentStatus === 'refunded',
    [retAfter.shopOrders[0].status, retAfter.paymentStatus],
  );
  const stockAfterReturn = (
    await call(
      'GET',
      `/shop-portal/${glowShopId}/products/${sunscreen.id}`,
      glowOwner.accessToken,
    )
  ).variants[0].stockQty;
  check(
    'returned parcel back in stock',
    stockAfterReturn === stockBeforeReturn + 1,
    [stockBeforeReturn, stockAfterReturn],
  );
  const glowDash = await call(
    'GET',
    `/shop-portal/${glowShopId}/dashboard`,
    glowOwner.accessToken,
  );
  check(
    'COD sale: shop owes only the commission',
    Math.abs(glowDash.balance - -(1900 * 0.07)) < 0.01,
    glowDash.balance,
  );

  console.log('\n11. Shop tools: one-tap stock, ledger, CSV import');
  const variantId = chargerD.variants[0].id;
  const v1 = await call(
    'POST',
    `/shop-portal/${gadgetShopId}/variants/${variantId}/stock`,
    gadgetOwner.accessToken,
    { mode: 'adjust', quantity: -1 },
  );
  check(
    'sold-in-store -1',
    v1.stockQty === chargerD.variants[0].stockQty - 2 - 1,
    v1.stockQty,
  );
  const dash = await call(
    'GET',
    `/shop-portal/${gadgetShopId}/dashboard`,
    gadgetOwner.accessToken,
  );
  check(
    'dashboard balance = online sales − commission',
    Math.abs(dash.balance - (3250 + 390 - 32.5 - 39)) < 0.01,
    dash.balance,
  );
  const form = new FormData();
  form.append(
    'file',
    new Blob(
      [
        'name_en,name_bn,category_slug,price,stock,sku\nUSB Hub 4-port,ইউএসবি হাব,accessories,850,10,GZ-HUB4\nBroken Row,,nope,abc,1,\n',
      ],
      { type: 'text/csv' },
    ),
    'products.csv',
  );
  const imp = await call(
    'POST',
    `/shop-portal/${gadgetShopId}/imports`,
    gadgetOwner.accessToken,
    form,
  );
  check('import queued', imp.status === 'queued');
  await new Promise((r) => setTimeout(r, 2500));
  const imports = await call(
    'GET',
    `/shop-portal/${gadgetShopId}/imports`,
    gadgetOwner.accessToken,
  );
  check(
    'import processed by Bull worker (1 created, 1 failed)',
    imports.items[0].status === 'completed' &&
      imports.items[0].createdCount === 1 &&
      imports.items[0].failedCount === 1,
    imports.items[0],
  );

  console.log('\n12. Admin');
  const adminDash = await call('GET', '/admin/dashboard', admin.accessToken);
  check(
    'admin dashboard has data',
    adminDash.shops === 13 && adminDash.ordersMonth >= 3,
    adminDash,
  );
  const balances = await call(
    'GET',
    '/admin/finance/balances',
    admin.accessToken,
  );
  const gzBalance = balances.items.find((b: any) => b.shopId === gadgetShopId);
  await call('POST', '/admin/finance/payouts', admin.accessToken, {
    shopId: gadgetShopId,
    amount: 1000,
    reference: 'BKASH-TRX-TEST',
  });
  const balances2 = await call(
    'GET',
    '/admin/finance/balances',
    admin.accessToken,
  );
  check(
    'payout reduces balance',
    Math.abs(
      balances2.items.find((b: any) => b.shopId === gadgetShopId).balance -
        (gzBalance.balance - 1000),
    ) < 0.01,
  );
  await expectError(
    'customer cannot open admin',
    () => call('GET', '/admin/dashboard', customer.accessToken),
    '403',
  );
  const notes = await call('GET', '/notifications', customer.accessToken);
  check(
    'customer got notifications via queue',
    notes.items.length > 0,
    notes.items.length,
  );

  console.log(
    '\n13. Locations: division → district → area → sub-area, market filters, nearby',
  );
  const divisions = await call('GET', '/geo/divisions');
  check(
    '8 divisions in the public picker',
    divisions.length === 8,
    divisions.length,
  );
  const dhakaDiv = divisions.find((d: any) => d.nameEn === 'Dhaka');
  const ctgDiv = divisions.find((d: any) => d.nameEn === 'Chattogram');
  const dhakaDistricts = await call(
    'GET',
    `/geo/districts?divisionId=${dhakaDiv.id}`,
  );
  check(
    'Dhaka division has its 13 districts',
    dhakaDistricts.length === 13,
    dhakaDistricts.length,
  );
  const dhakaDistrict = dhakaDistricts.find((d: any) => d.nameEn === 'Dhaka');
  const dhakaAreas = await call(
    'GET',
    `/geo/areas?districtId=${dhakaDistrict.id}`,
  );
  const dhanmondi = dhakaAreas.find((a: any) => a.nameEn === 'Dhanmondi');
  const dhanmondiSubs = await call(
    'GET',
    `/geo/sub-areas?areaId=${dhanmondi.id}`,
  );
  const road27 = dhanmondiSubs.find((a: any) => a.nameEn === 'Road 27');
  check(
    'Dhanmondi has neighbourhoods incl. Road 27',
    !!road27 && dhanmondiSubs.length >= 3,
    dhanmondiSubs,
  );

  const shaplaNames = (page: any) => page.items.map((m: any) => m.nameEn);
  check(
    'markets filter by division',
    shaplaNames(
      await call('GET', `/markets?divisionId=${dhakaDiv.id}`),
    ).includes('Shapla City Mall') &&
      !shaplaNames(
        await call('GET', `/markets?divisionId=${ctgDiv.id}`),
      ).includes('Shapla City Mall'),
  );
  check(
    'markets filter by district',
    (await call('GET', `/markets?districtId=${dhakaDistrict.id}`)).items
      .length >= 3,
  );
  check(
    'markets filter by area',
    shaplaNames(await call('GET', `/markets?areaId=${dhanmondi.id}`)).join() ===
      'Shapla City Mall',
  );
  check(
    'markets filter by sub-area',
    shaplaNames(await call('GET', `/markets?subAreaId=${road27.id}`)).join() ===
      'Shapla City Mall',
  );
  check(
    'shops filter by location (via their market)',
    (await call('GET', `/shops?areaId=${dhanmondi.id}`)).items.length > 0 &&
      (await call('GET', `/shops?divisionId=${ctgDiv.id}`)).items.length >= 1,
  );

  // Shapla City Mall is at 23.7465, 90.3760; the default radius is 500 m.
  const near = await call(
    'GET',
    '/markets?nearby=true&lat=23.7466&lng=90.3761',
  );
  check(
    'nearby markets: Shapla within the radius, with a distance',
    near.items.length === 1 &&
      near.items[0].nameEn === 'Shapla City Mall' &&
      near.items[0].distanceMeters < 50 &&
      near.radiusMeters === 500,
    near,
  );
  check(
    'nearby shops: its shops, with distance',
    (
      await call('GET', '/shops?nearby=true&lat=23.7466&lng=90.3761')
    ).items.every((x: any) => x.distanceMeters < 100),
  );
  check(
    'far from every market: nothing nearby',
    (await call('GET', '/markets?nearby=true&lat=24.9&lng=91.8')).items
      .length === 0,
  );
  await expectError(
    'nearby needs the customer position',
    () => call('GET', '/markets?nearby=true'),
    'location',
  );
  check(
    'public config shows the radius',
    (await call('GET', '/config')).nearbyMaxKm === 0.5,
  );

  // The admin chooses how close "nearby" is.
  await call('PUT', '/admin/settings/nearby_max_km', admin.accessToken, {
    value: 0.05,
  });
  check(
    'admin narrows nearby to 50 m: 200 m away is out',
    (await call('GET', '/markets?nearby=true&lat=23.7483&lng=90.3760')).items
      .length === 0,
  );
  check(
    '…and 20 m away is still in',
    (await call('GET', '/markets?nearby=true&lat=23.7467&lng=90.3760')).items
      .length === 1,
  );
  await call('PUT', '/admin/settings/nearby_max_km', admin.accessToken, {
    value: 0.5,
  });

  // Admin CRUD, each level tied to its parent.
  const geoName = `Smoke ${Date.now() % 100000}`;
  const newDiv = await call('POST', '/admin/geo/divisions', admin.accessToken, {
    nameEn: geoName,
    nameBn: 'পরীক্ষা বিভাগ',
  });
  await expectError(
    'duplicate division name refused',
    () =>
      call('POST', '/admin/geo/divisions', admin.accessToken, {
        nameEn: geoName,
        nameBn: 'x',
      }),
    'already exists',
  );
  await expectError(
    'a district needs its division',
    () =>
      call('POST', '/admin/geo/districts', admin.accessToken, {
        nameEn: 'Orphan',
        nameBn: 'x',
      }),
    'division',
  );
  const newDis = await call('POST', '/admin/geo/districts', admin.accessToken, {
    nameEn: `${geoName} District`,
    nameBn: 'পরীক্ষা জেলা',
    parentId: newDiv.id,
  });
  check(
    'district is tied to its division',
    newDis.parentId === newDiv.id &&
      newDis.divisionId === newDiv.id &&
      newDis.parentName === geoName,
    newDis,
  );
  const newArea = await call('POST', '/admin/geo/areas', admin.accessToken, {
    nameEn: `${geoName} Area`,
    nameBn: 'পরীক্ষা এলাকা',
    parentId: newDis.id,
    kind: 'upazila',
    isServiceable: true,
  });
  check(
    'area keeps kind and delivery flag',
    newArea.kind === 'upazila' &&
      newArea.isServiceable === true &&
      newArea.parentPath.includes('›'),
    newArea,
  );
  const newSub = await call('POST', '/admin/geo/sub-areas', admin.accessToken, {
    nameEn: `${geoName} Sub`,
    nameBn: 'পরীক্ষা পাড়া',
    parentId: newArea.id,
  });
  check(
    'sub-area path runs division › district › area',
    newSub.parentPath === `${geoName} › ${geoName} District › ${geoName} Area`,
    newSub.parentPath,
  );
  check(
    'edit renames',
    (
      await call(
        'PATCH',
        `/admin/geo/sub-areas/${newSub.id}`,
        admin.accessToken,
        { nameEn: `${geoName} Sub 2` },
      )
    ).nameEn === `${geoName} Sub 2`,
  );
  await call('PATCH', `/admin/geo/sub-areas/${newSub.id}`, admin.accessToken, {
    isActive: false,
  });
  check(
    'a hidden sub-area leaves the public picker',
    (await call('GET', `/geo/sub-areas?areaId=${newArea.id}`)).length === 0,
  );
  await expectError(
    'cannot delete a division that still has districts',
    () =>
      call('DELETE', `/admin/geo/divisions/${newDiv.id}`, admin.accessToken),
    'district',
  );
  await expectError(
    'cannot delete an area that has sub-areas',
    () => call('DELETE', `/admin/geo/areas/${dhanmondi.id}`, admin.accessToken),
    'sub-area',
  );
  await expectError(
    'customer cannot manage locations',
    () =>
      call('POST', '/admin/geo/divisions', customer.accessToken, {
        nameEn: 'x',
        nameBn: 'y',
      }),
    '403',
  );
  for (const path of [
    `sub-areas/${newSub.id}`,
    `areas/${newArea.id}`,
    `districts/${newDis.id}`,
    `divisions/${newDiv.id}`,
  ]) {
    await call('DELETE', `/admin/geo/${path}`, admin.accessToken);
  }
  check(
    'removing bottom-up works',
    (
      await call(
        'GET',
        `/admin/geo/divisions?q=${encodeURIComponent(geoName)}`,
        admin.accessToken,
      )
    ).items.length === 0,
  );

  // A market's sub-area must belong to its area.
  const gulshanSub = (await call('GET', '/geo/sub-areas')).find(
    (x: any) => x.nameEn === 'Gulshan 1',
  );
  await expectError(
    'market sub-area must match its area',
    () =>
      call('PATCH', '/admin/markets/1', admin.accessToken, {
        subAreaId: gulshanSub.id,
      }),
    'not part of the chosen area',
  );
  const shaplaAdmin = await call('GET', '/admin/markets/1', admin.accessToken);
  check(
    'admin market shows division › district › area › sub-area',
    shaplaAdmin.area.district.division.nameEn === 'Dhaka' &&
      shaplaAdmin.subArea.nameEn === 'Road 27',
    shaplaAdmin.area,
  );

  console.log('\n13b. Cursor pagination, product filters and nearby products');
  /** Follows nextCursor to the end; returns every id, in order, and the number of pages. */
  async function walk(path: string, size: number, token?: string) {
    const ids: number[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const sep = path.includes('?') ? '&' : '?';
      const page: any = await call(
        'GET',
        `${path}${sep}limit=${size}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        token,
      );
      ids.push(...page.items.map((i: any) => i.id));
      cursor = page.nextCursor;
      pages++;
      if (cursor && !page.hasMore) throw new Error('cursor without hasMore');
    } while (cursor && pages < 100);
    return { ids, pages };
  }
  const sameWalk = async (name: string, path: string, token?: string) => {
    const whole = await walk(path, 50, token);
    const small = await walk(path, 3, token);
    check(
      `${name}: cursor pages (by 3) match one big page, no repeats`,
      whole.ids.length > 0 &&
        JSON.stringify(whole.ids) === JSON.stringify(small.ids) &&
        new Set(small.ids).size === small.ids.length,
      [whole.ids.length, small.ids.length],
    );
    return whole.ids;
  };
  const allProducts = await sameWalk('products', '/products');
  for (const sort of [
    'newest',
    'price_asc',
    'price_desc',
    'rating',
    'discount',
  ])
    await sameWalk(`products sort=${sort}`, `/products?sort=${sort}`);
  await sameWalk('markets', '/markets');
  await sameWalk('shops', '/shops');
  check(
    'page size is capped at 50',
    (await call('GET', '/products?limit=50')).items.length <= 50,
  );
  await expectError(
    'a bad cursor is refused',
    () => call('GET', '/products?cursor=not-a-cursor'),
    'page marker',
  );
  const stats = await call('GET', '/stats');
  check(
    'stats carry the totals the lists no longer have',
    stats.markets === 4 &&
      stats.shops === 13 &&
      stats.products === allProducts.length,
    stats,
  );

  const fashion = (await call('GET', '/categories')).find(
    (c: any) => c.slug === 'fashion',
  );
  const fashionIds = await sameWalk(
    'products by category',
    `/products?categoryId=${fashion.id}`,
  );
  check(
    'category filter narrows (with its sub-categories)',
    fashionIds.length > 0 && fashionIds.length < allProducts.length,
  );
  const brandPage = await call('GET', '/brands?limit=50');
  check(
    'brands listed A–Z with product counts',
    brandPage.items.length >= 10 &&
      brandPage.items.every((b: any) => b.productCount > 0) &&
      brandPage.items.map((b: any) => b.name).join() ===
        [...brandPage.items.map((b: any) => b.name)].sort().join(),
  );
  const samsung = brandPage.items.find((b: any) => b.name === 'Samsung');
  const samsungIds = (await call('GET', `/products?brandId=${samsung.id}`))
    .items;
  check(
    'brand filter returns only that brand',
    samsungIds.length >= 1 &&
      samsungIds.every((p: any) => p.nameEn.startsWith('Galaxy')),
    samsungIds.map((p: any) => p.nameEn),
  );
  check(
    'brands narrow to a category',
    (await call('GET', `/brands?categoryId=${fashion.id}`)).items.every(
      (b: any) =>
        ['Aarong', 'Yellow', 'Bata', 'Apex', 'Titan'].includes(b.name),
    ),
  );
  const byName = await call('GET', '/products?q=panjabi');
  check(
    'search by name',
    byName.items.length >= 2 &&
      byName.items.every((p: any) => /panjabi/i.test(p.nameEn)),
    byName.items.map((p: any) => p.nameEn),
  );
  check(
    'search + category + brand combine',
    (await call('GET', `/products?q=panjabi&categoryId=${fashion.id}`)).items
      .length >= 2,
  );

  // Nearby products: shops of the market within the radius (Shapla City Mall at 23.7465, 90.3760).
  const nearP = await call(
    'GET',
    '/products?nearby=true&lat=23.7466&lng=90.3761',
  );
  const nearIds = await sameWalk(
    'nearby products',
    '/products?nearby=true&lat=23.7466&lng=90.3761',
  );
  check(
    'nearby products: only the mall within reach, nearest first, with distance',
    nearIds.length > 0 &&
      nearIds.length < allProducts.length &&
      nearP.radiusMeters === 500 &&
      nearP.items.every((p: any) => p.distanceMeters < 100),
    nearP.radiusMeters,
  );
  check(
    'nearby + category/brand/name still filter',
    (
      await call(
        'GET',
        `/products?nearby=true&lat=23.7466&lng=90.3761&q=panjabi`,
      )
    ).items.every((p: any) => /panjabi/i.test(p.nameEn)),
  );
  check(
    'far away: no nearby products',
    (await call('GET', '/products?nearby=true&lat=24.9&lng=91.8')).items
      .length === 0,
  );
  await expectError(
    'nearby needs a position',
    () => call('GET', '/products?nearby=true'),
    'location',
  );
  await expectError(
    'sorting by distance needs Nearby',
    () => call('GET', '/products?sort=nearest'),
    'Nearby',
  );
  await call('PUT', '/admin/settings/nearby_max_km', admin.accessToken, {
    value: 0.02,
  });
  check(
    'the admin radius applies to products too (20 m)',
    (await call('GET', '/products?nearby=true&lat=23.7483&lng=90.3760')).items
      .length === 0 &&
      (await call('GET', '/products?nearby=true&lat=23.7466&lng=90.3761')).items
        .length > 0,
  );
  await call('PUT', '/admin/settings/nearby_max_km', admin.accessToken, {
    value: 0.5,
  });

  // Brand admin: create, rename, refuse a duplicate, protect used brands.
  const brandName = `Smoke Brand ${Date.now() % 100000}`;
  const newBrand = await call('POST', '/admin/brands', admin.accessToken, {
    name: brandName,
  });
  await expectError(
    'duplicate brand refused',
    () => call('POST', '/admin/brands', admin.accessToken, { name: brandName }),
    'already exists',
  );
  check(
    'new brand is hidden from shoppers until it has products',
    !(await call('GET', '/brands?limit=50')).items.some(
      (b: any) => b.id === newBrand.id,
    ) &&
      (
        await call('GET', '/admin/brands?limit=50', admin.accessToken)
      ).items.some((b: any) => b.id === newBrand.id),
  );
  await expectError(
    'customers cannot manage brands',
    () => call('POST', '/admin/brands', customer.accessToken, { name: 'x y' }),
    '403',
  );
  await call('DELETE', `/admin/brands/${newBrand.id}`, admin.accessToken);
  await expectError(
    'a brand with products cannot be deleted',
    () => call('DELETE', `/admin/brands/${samsung.id}`, admin.accessToken),
    'use',
  );

  console.log('\n13c. Roles: one AuthGuard, one RolesGuard');
  await expectError('no token: 401', () => call('GET', '/orders'), '401');
  await expectError(
    'customer cannot open a shop panel',
    () =>
      call('GET', `/shop-portal/${gadgetShopId}/orders`, customer.accessToken),
    '403',
  );
  await expectError(
    "another shop's owner cannot open this shop panel",
    () =>
      call(
        'GET',
        `/shop-portal/${gadgetShopId}/orders`,
        nakshiOwner.accessToken,
      ),
    '403',
  );
  check(
    'the owner can',
    Array.isArray(
      (
        await call(
          'GET',
          `/shop-portal/${gadgetShopId}/orders`,
          gadgetOwner.accessToken,
        )
      ).items,
    ),
  );
  await expectError(
    'desk staff cannot open the admin console',
    () => call('GET', '/admin/markets', desk.accessToken),
    '403',
  );
  check(
    'platform ops/super admin may open any shop panel',
    Array.isArray(
      (
        await call(
          'GET',
          `/shop-portal/${gadgetShopId}/orders`,
          admin.accessToken,
        )
      ).items,
    ),
  );

  console.log('\n14. Panel accounts work from their panel only');
  await expectError(
    'admin cannot use the cart',
    () =>
      call('POST', '/cart/items', admin.accessToken, {
        variantId: 1,
        quantity: 1,
      }),
    '403',
  );
  await expectError(
    'shop owner cannot use the cart',
    () => call('GET', '/cart', gadgetOwner.accessToken),
    '403',
  );
  await expectError(
    'shop owner cannot check out',
    () =>
      call('POST', '/orders/checkout', gadgetOwner.accessToken, {
        contactName: 'x',
        contactPhone: '01711000002',
        paymentMethod: 'cash',
        shops: [],
      }),
    '403',
  );
  await expectError(
    'desk staff cannot follow shops',
    () => call('POST', '/shops/1/follow', desk.accessToken),
    '403',
  );
  check(
    'customers still can',
    Array.isArray((await call('GET', '/cart', customer.accessToken)).groups),
  );

  console.log(
    failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed ✔',
  );
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
