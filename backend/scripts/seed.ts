// Development seed: wipes ALL data and loads a demo dataset.
// Usage: npm run seed            (refuses to run when NODE_ENV=production)
import { config } from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from 'src/database/postgres/data-source';
import {
  AdCampaign,
  Area,
  Brand,
  Category,
  CommissionRule,
  Coupon,
  CourierAccount,
  District,
  Division,
  InventoryMovement,
  Market,
  MarketFloor,
  MarketMember,
  PickupPoint,
  PlatformSetting,
  PlatformStaff,
  Product,
  ProductImage,
  ProductVariant,
  Shop,
  ShopCategory,
  ShopHours,
  ShopMember,
  ShopPayoutAccount,
  ShopSubscription,
  ShopVerification,
  SubArea,
  SubscriptionPlan,
  User,
} from 'src/database/postgres/entities';
import { BRANDS } from './brand-data';
import { AREAS, DIVISIONS, MARKET_PLACES } from './geo-data';

async function main() {
  config();
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed a production database.');
    process.exit(1);
  }

  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  // ---------------------------------------------------------------- photos
  // Free-licence photos from Unsplash (https://unsplash.com/license), hotlinked as Unsplash asks.
  const U = (id: string, w = 1000) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

  const PRODUCT_PHOTOS: Record<string, string> = {
    'Cotton Panjabi — White': 'photo-1781106785213-ee999c3edf50',
    'Embroidered Panjabi — Maroon': 'photo-1783923134331-bbc138b3d706',
    'Jamdani Saree': 'photo-1610030469983-98e550d6193c',
    'Printed Cotton Kurti': 'photo-1741847639057-b51a25d42892',
    'Galaxy A56 5G (8/256GB)': 'photo-1592890288564-76628a30a657',
    'Redmi Note 15 (8/128GB)': 'photo-1511707171634-5f897ff02aa9',
    'Wireless Earbuds Pro': 'photo-1606220588913-b3aacb4d2f46',
    '65W GaN Fast Charger': 'photo-1770417999831-1c070eb628e6',
    'Power Bank 20000mAh': 'photo-1760708825913-65a50b3dc39b',
    'Vitamin C Brightening Serum 30ml': 'photo-1713768704571-6aeb0d0e5105',
    'Sunscreen SPF 50+ PA++++': 'photo-1594055103006-7871176f1a7e',
    'Matte Liquid Lipstick': 'photo-1760860992755-c432351d47e9',
    'Oud Attar 12ml': 'photo-1646149757906-e6e9e9a7c77f',
    'Leather Loafer': 'photo-1616406432452-07bc5938759d',
    'Running Sneakers': 'photo-1560769629-975ec94e6a86',
    'Kids Velcro Sandal': 'photo-1781628166172-7dca9cbfd86e',
    'Kids Cotton Panjabi Set': 'photo-1767796704735-f4bbd932c297',
    'Girls Frock — Floral': 'photo-1562438995-20c8bc11d4a9',
    'Classic Analog Watch': 'photo-1616928231359-fc8b7e244c3b',
    'Laptop Backpack 15.6"': 'photo-1594299447935-e5b840f54b9b',
    '22K Gold Ring (2.5g)': 'photo-1598560917807-1bae44bd2be8',
    'Gold Plated Necklace Set': 'photo-1758995115857-2de1eb6283d0',
    'Ultrabook 14" i5 (16GB/512GB)': 'photo-1777777008773-a646d94edf91',
    '24" IPS Monitor 75Hz': 'photo-1547658718-1cdaa0852790',
    'Wireless Keyboard & Mouse Combo': 'photo-1768839719877-c280c9a3633f',
    'Slim Fit Oxford Shirt': 'photo-1602810316693-3667c854239a',
    'Stretch Denim Jeans': 'photo-1602293589930-45aad59ba3ab',
    'Linen Co-ord Set': 'photo-1764298493197-a1c1cce57800',
    'Polo T-Shirt (Pack of 2)': 'photo-1720514496268-44bb31c03815',
    'Cotton Lungi': 'photo-1634640234915-b0f41a1eaaa3',
    'Kids Shorts (Pack of 3)': 'photo-1778788732561-a6f28431a2bd',
    'Pressure Cooker 5L': 'photo-1693038603562-bb6191269ecc',
    'Non-stick Fry Pan 26cm': 'photo-1592156328697-079f6ee0cfa5',
    'Ceramic Table Lamp': 'photo-1579326882518-21eaa7893b02',
    'Tempered Glass Protector': 'photo-1583291023438-41cef6453b1f',
    'Braided USB-C Cable 1.5m': 'photo-1595756630452-736bc8ef3693',
    'Wired Earphones with Mic': 'photo-1632835746204-22f652dac3af',
    'Unstitched Three-Piece': 'photo-1759840278381-bf7d5e332050',
    'Classic Abaya': 'photo-1772474500365-c2c520545f44',
  };

  const SHOP_COVERS: Record<string, string> = {
    'Nakshi Style House': 'photo-1775662039200-8e9e4a635367',
    'Gadget Zone': 'photo-1777073233428-ff338440ccad',
    'Glow Beauty Corner': 'photo-1757800945999-ed0fa905d0f5',
    'Step Up Shoes': 'photo-1633464129147-777bdcc97c1d',
    'Little Stars Kidswear': 'photo-1760287363879-6012adab292c',
    'Time & Bags': 'photo-1526743655626-e3d757b13d61',
    'Swarna Jewellers': 'photo-1606760227091-3dd870d97f1d',
    'TechNest Computers': 'photo-1571857089849-f6390447191a',
    'Urban Threads': 'photo-1729487151777-b4be9098ecbb',
    'Bhai Bhai Garments': 'photo-1636267289101-80f5d51954fc',
    'Rannaghor Kitchen Mart': 'photo-1509023667260-6677209e6fdf',
    'Mobile Care Point': 'photo-1677145503755-5a8c581671fe',
    'Port City Fashion': 'photo-1765009433753-c7462637d21f',
  };

  const MARKET_COVERS: Record<string, string> = {
    shapla: 'photo-1758448500717-2e4bcd79108b',
    padma: 'photo-1772325022036-8852e90377fc',
    mirpur: 'photo-1740246158671-45f15f8c88dd',
    chawk: 'photo-1781967653059-f34f7f4f7365',
  };

  const CATEGORY_PHOTOS: Record<string, string> = {
    fashion: 'photo-1777628530456-bb93d3a03faf',
    electronics: 'photo-1498049794561-7780e7231661',
    cosmetics: 'photo-1512496015851-a90fb38ba796',
    jewellery: 'photo-1758995115682-1452a1a9e35b',
    'bags-watches': 'photo-1524592094714-0f0654e20314',
    'home-kitchen': 'photo-1580929753603-10519c6e480a',
  };

  await AppDataSource.initialize();
  const db = AppDataSource;

  // ---------------------------------------------------------------- reset
  const tables: { tablename: string }[] = await db.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('migrations', 'typeorm_metadata')`,
  );
  await db.query(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
  console.log(`Cleared ${tables.length} tables`);

  // ---------------------------------------------------------------- geography (division → district → area → sub-area)
  const divisionRows = await db
    .getRepository(Division)
    .save(DIVISIONS.map((d) => ({ nameEn: d.name[0], nameBn: d.name[1] })));
  const districtRows = await db.getRepository(District).save(
    DIVISIONS.flatMap((d, i) =>
      d.districts.map(([nameEn, nameBn]) => ({
        divisionId: divisionRows[i].id,
        nameEn,
        nameBn,
      })),
    ),
  );
  const districtId = Object.fromEntries(
    DIVISIONS.flatMap((d, i) =>
      d.districts.map(([en]) => [
        `${d.name[0]}/${en}`,
        districtRows.find(
          (r) => r.divisionId === divisionRows[i].id && r.nameEn === en,
        )!.id,
      ]),
    ),
  );
  const areaRows = await db.getRepository(Area).save(
    Object.entries(AREAS).flatMap(([district, list]) =>
      list.map((a) => ({
        districtId: districtId[district],
        nameEn: a.name[0],
        nameBn: a.name[1],
        kind: a.kind ?? 'thana',
        isServiceable: a.serviceable ?? false,
      })),
    ),
  );
  const areaKey = (district: string, name: string) =>
    areaRows.find(
      (r) => r.districtId === districtId[district] && r.nameEn === name,
    )!.id;
  const subAreaRows = await db.getRepository(SubArea).save(
    Object.entries(AREAS).flatMap(([district, list]) =>
      list.flatMap((a) =>
        a.subAreas.map(([nameEn, nameBn]) => ({
          areaId: areaKey(district, a.name[0]),
          nameEn,
          nameBn,
        })),
      ),
    ),
  );
  const placeOf = (key: string) => {
    const [district, areaName, subName] = MARKET_PLACES[key];
    const areaId = areaKey(district, areaName);
    return {
      areaId,
      subAreaId: subAreaRows.find(
        (r) => r.areaId === areaId && r.nameEn === subName,
      )!.id,
    };
  };
  console.log(
    `Geography: ${divisionRows.length} divisions, ${districtRows.length} districts, ${areaRows.length} areas, ${subAreaRows.length} sub-areas`,
  );

  // ---------------------------------------------------------------- categories (icon = lucide name)
  const catRepo = db.getRepository(Category);
  const roots: [string, string, string, [string, string, string][]][] = [
    [
      'Fashion',
      'ফ্যাশন',
      'shirt',
      [
        ['Men', 'ছেলেদের', 'shirt'],
        ['Women', 'মেয়েদের', 'sparkles'],
        ['Kids', 'শিশুদের', 'baby'],
        ['Footwear', 'জুতা', 'footprints'],
      ],
    ],
    [
      'Electronics',
      'ইলেকট্রনিক্স',
      'smartphone',
      [
        ['Mobile Phones', 'মোবাইল ফোন', 'smartphone'],
        ['Audio', 'অডিও', 'headphones'],
        ['Computers', 'কম্পিউটার', 'laptop'],
        ['Accessories', 'এক্সেসরিজ', 'cable'],
      ],
    ],
    [
      'Cosmetics',
      'প্রসাধনী',
      'sparkles',
      [
        ['Skincare', 'ত্বকের যত্ন', 'droplet'],
        ['Makeup', 'মেকআপ', 'palette'],
        ['Fragrance', 'সুগন্ধি', 'flower'],
      ],
    ],
    [
      'Jewellery',
      'গয়না',
      'gem',
      [
        ['Gold', 'সোনা', 'crown'],
        ['Fashion Jewellery', 'ফ্যাশন গয়না', 'gem'],
      ],
    ],
    [
      'Bags & Watches',
      'ব্যাগ ও ঘড়ি',
      'watch',
      [
        ['Bags', 'ব্যাগ', 'shopping-bag'],
        ['Watches', 'ঘড়ি', 'watch'],
      ],
    ],
    [
      'Home & Kitchen',
      'ঘর ও রান্নাঘর',
      'sofa',
      [
        ['Kitchen', 'রান্নাঘর', 'cooking-pot'],
        ['Decor', 'সাজসজ্জা', 'lamp'],
      ],
    ],
  ];
  const cat: Record<string, number> = {};
  let order = 0;
  for (const [nameEn, nameBn, icon, children] of roots) {
    const photo = CATEGORY_PHOTOS[slug(nameEn)];
    const parent = await catRepo.save({
      slug: slug(nameEn),
      nameEn,
      nameBn,
      icon,
      sortOrder: order++,
      imageUrl: photo ? U(photo, 600) : null,
    });
    cat[parent.slug] = parent.id;
    for (const [cEn, cBn, cIcon] of children) {
      const childSlug =
        (
          {
            Men: 'mens-fashion',
            Women: 'womens-fashion',
            Kids: 'kids-fashion',
          } as Record<string, string>
        )[cEn] ?? slug(cEn);
      const child = await catRepo.save({
        slug: childSlug,
        nameEn: cEn,
        nameBn: cBn,
        icon: cIcon,
        parentId: parent.id,
        sortOrder: order++,
      });
      cat[child.slug] = child.id;
    }
  }

  // ---------------------------------------------------------------- plans, settings, commission, coupons
  const plans = await db.getRepository(SubscriptionPlan).save([
    {
      code: 'free',
      nameEn: 'Free',
      nameBn: 'ফ্রি',
      monthlyPrice: 0,
      maxProducts: 50,
      maxStaff: 2,
      commissionDiscount: 0,
      features: { analytics: false },
    },
    {
      code: 'basic',
      nameEn: 'Basic',
      nameBn: 'বেসিক',
      monthlyPrice: 999,
      maxProducts: 500,
      maxStaff: 5,
      commissionDiscount: 1,
      features: { analytics: true },
    },
    {
      code: 'pro',
      nameEn: 'Pro',
      nameBn: 'প্রো',
      monthlyPrice: 2499,
      maxProducts: null,
      maxStaff: null,
      commissionDiscount: 2,
      features: { analytics: true, featuredSlots: 1 },
    },
  ]);
  const plan = Object.fromEntries(plans.map((p) => [p.code, p.id]));

  await db.getRepository(PlatformSetting).save([
    { key: 'pickup_fee', value: 0 },
    { key: 'support_hotline', value: '09600-000000' },
    { key: 'delivery_fee_inside_dhaka', value: 70 },
    { key: 'delivery_fee_outside_dhaka', value: 130 },
    { key: 'nearby_max_km', value: 0.5 },
    { key: 'steadfast_webhook_token', value: 'dev-steadfast-webhook-token' },
  ]);

  const launch = new Date('2026-01-01T00:00:00+06:00');
  const afterPromo = new Date('2026-04-01T00:00:00+06:00');
  await db.getRepository(CommissionRule).save([
    {
      rate: 0,
      validFrom: launch,
      validTo: afterPromo,
      note: 'Launch promotion: zero commission for the first 3 months',
    },
    { rate: 5, validFrom: afterPromo, note: 'Default commission' },
    {
      categoryId: cat.fashion,
      rate: 6,
      validFrom: afterPromo,
      note: 'Fashion',
    },
    {
      categoryId: cat.electronics,
      rate: 3,
      validFrom: afterPromo,
      note: 'Electronics (thin margins)',
    },
    {
      categoryId: cat['mobile-phones'],
      rate: 2,
      validFrom: afterPromo,
      note: 'Phones',
    },
    {
      categoryId: cat.cosmetics,
      rate: 7,
      validFrom: afterPromo,
      note: 'Cosmetics',
    },
    {
      categoryId: cat.jewellery,
      rate: 2,
      validFrom: afterPromo,
      note: 'Jewellery (gold price heavy)',
    },
    { categoryId: cat['bags-watches'], rate: 6, validFrom: afterPromo },
    { categoryId: cat['home-kitchen'], rate: 6, validFrom: afterPromo },
  ]);

  // ---------------------------------------------------------------- users
  const userRepo = db.getRepository(User);
  const mkUser = (phone: string, fullName: string) =>
    userRepo.save({ phone, fullName, phoneVerifiedAt: new Date() });
  const admin = await mkUser('+8801700000001', 'Platform Admin');
  const onboarder = await mkUser('+8801700000002', 'Nadia (Onboarding)');
  const finance = await mkUser('+8801700000003', 'Finance Team');
  const mallAdmin = await mkUser('+8801700000010', 'Shapla Mall Management');
  const deskStaff = await mkUser('+8801700000011', 'Pickup Desk Staff');
  await mkUser('+8801800000001', 'Rahim Uddin');
  await mkUser('+8801800000002', 'Farzana Akter');
  await db.getRepository(PlatformStaff).save([
    { userId: admin.id, role: 'super_admin' },
    { userId: onboarder.id, role: 'onboarding' },
    { userId: finance.id, role: 'finance' },
  ]);

  // ---------------------------------------------------------------- markets
  interface FloorSpec {
    level: number;
    nameEn: string;
    nameBn: string;
  }
  const marketSpecs: {
    key: string;
    nameEn: string;
    nameBn: string;
    kind: Market['kind'];
    area: string;
    address: string;
    partner: boolean;
    description: string;
    floors: FloorSpec[];
    desks: [string, number, string][];
    lat: number;
    lng: number;
    offDay: number | null;
  }[] = [
    {
      key: 'shapla',
      nameEn: 'Shapla City Mall',
      nameBn: 'শাপলা সিটি মল',
      kind: 'mall',
      area: 'Dhanmondi',
      address: 'Road 27, Dhanmondi, Dhaka 1209',
      partner: true,
      lat: 23.7465,
      lng: 90.376,
      offDay: 2,
      description:
        'Six floors of fashion, electronics and beauty in the heart of Dhanmondi, with a food court on level 3.',
      floors: [
        { level: 0, nameEn: 'Ground Floor', nameBn: 'নিচতলা' },
        { level: 1, nameEn: 'Level 1', nameBn: 'দোতলা' },
        { level: 2, nameEn: 'Level 2', nameBn: 'তিনতলা' },
        { level: 3, nameEn: 'Level 3', nameBn: 'চারতলা' },
      ],
      desks: [
        [
          'Main Gate Pickup Desk',
          0,
          'Beside the information desk at the main gate',
        ],
        [
          'Level 3 Food Court Desk',
          3,
          'Next to the escalators, food court side',
        ],
      ],
    },
    {
      key: 'padma',
      nameEn: 'Padma Trade Centre',
      nameBn: 'পদ্মা ট্রেড সেন্টার',
      kind: 'mall',
      area: 'Gulshan',
      address: 'Gulshan Avenue, Gulshan-1, Dhaka 1212',
      partner: true,
      lat: 23.7806,
      lng: 90.4163,
      offDay: null,
      description:
        'Premium brands, gadgets and gold jewellery. Open every day.',
      floors: [
        { level: 0, nameEn: 'Ground Floor', nameBn: 'নিচতলা' },
        { level: 1, nameEn: 'Level 1', nameBn: 'দোতলা' },
        { level: 2, nameEn: 'Level 2', nameBn: 'তিনতলা' },
      ],
      desks: [['Customer Service Desk', 0, 'Ground floor, south entrance']],
    },
    {
      key: 'mirpur',
      nameEn: 'Mirpur Bazaar Complex',
      nameBn: 'মিরপুর বাজার কমপ্লেক্স',
      kind: 'market',
      area: 'Mirpur',
      address: 'Mirpur-10 Circle, Dhaka 1216',
      partner: false,
      lat: 23.8069,
      lng: 90.3687,
      offDay: 2,
      description:
        'Everyday prices on clothes, shoes, kitchenware and phone accessories. Bargaining welcome!',
      floors: [
        { level: 0, nameEn: 'Ground Floor', nameBn: 'নিচতলা' },
        { level: 1, nameEn: 'First Floor', nameBn: 'দোতলা' },
      ],
      desks: [],
    },
    {
      key: 'chawk',
      nameEn: 'Karnaphuli Shopping Centre',
      nameBn: 'কর্ণফুলী শপিং সেন্টার',
      kind: 'mall',
      area: 'Panchlaish',
      address: 'O.R. Nizam Road, Panchlaish, Chattogram',
      partner: false,
      lat: 22.3597,
      lng: 91.8283,
      offDay: 5,
      description: 'Chattogram’s family shopping destination.',
      floors: [
        { level: 0, nameEn: 'Ground Floor', nameBn: 'নিচতলা' },
        { level: 1, nameEn: 'Level 1', nameBn: 'দোতলা' },
      ],
      desks: [['Info Desk', 0, 'Main entrance']],
    },
  ];

  const markets: Record<string, Market> = {};
  const floors: Record<string, Record<number, number>> = {};
  for (const spec of marketSpecs) {
    const market = await db.getRepository(Market).save({
      slug: slug(spec.nameEn),
      nameEn: spec.nameEn,
      nameBn: spec.nameBn,
      kind: spec.kind,
      description: spec.description,
      ...placeOf(spec.key),
      addressLine: spec.address,
      latitude: spec.lat,
      longitude: spec.lng,
      opensAt: '10:00',
      closesAt: '21:00',
      weeklyOffDay: spec.offDay,
      coverUrl: U(MARKET_COVERS[spec.key], 1600),
      isPartner: spec.partner,
      partnerSince: spec.partner ? '2026-01-15' : null,
      status: 'active',
      createdBy: admin.id,
    });
    markets[spec.key] = market;
    floors[spec.key] = {};
    for (const f of spec.floors) {
      const floor = await db
        .getRepository(MarketFloor)
        .save({ marketId: market.id, ...f });
      floors[spec.key][f.level] = floor.id;
    }
    for (const [nameEn, level, instructions] of spec.desks) {
      await db.getRepository(PickupPoint).save({
        marketId: market.id,
        floorId: floors[spec.key][level],
        nameEn,
        instructions,
        opensAt: '10:00',
        closesAt: '21:00',
        isHub: level === 0,
      });
    }
  }
  await db.getRepository(MarketMember).save([
    { marketId: markets.shapla.id, userId: mallAdmin.id, role: 'admin' },
    { marketId: markets.shapla.id, userId: deskStaff.id, role: 'desk_staff' },
  ]);

  // ---------------------------------------------------------------- shops & products
  type V = {
    a?: Record<string, string>;
    p: number;
    c?: number;
    s: number;
    min?: number;
    sku?: string;
  };
  type P = {
    en: string;
    bn: string;
    cat: string;
    neg?: boolean;
    desc: string;
    v: V[];
    warranty?: [Product['warrantyType'], number];
  };
  interface ShopSpec {
    market: string;
    floor: number;
    number: string;
    en: string;
    bn: string;
    cat: string;
    extra?: string[];
    verified?: boolean;
    plan?: string;
    deposit?: number;
    desc: string;
    products: P[];
  }

  const sizes = (
    price: number,
    stock: number[],
    extra: Partial<V> = {},
    list = ['M', 'L', 'XL'],
  ) =>
    list.map((size, i) => ({
      a: { size },
      p: price,
      s: stock[i] ?? 3,
      ...extra,
    }));

  const shopSpecs: ShopSpec[] = [
    {
      market: 'shapla',
      floor: 0,
      number: 'G-04',
      en: 'Nakshi Style House',
      bn: 'নকশি স্টাইল হাউস',
      cat: 'mens-fashion',
      extra: ['womens-fashion'],
      verified: true,
      plan: 'basic',
      desc: 'Handloom panjabis, sarees and kurtis made by local artisans.',
      products: [
        {
          en: 'Cotton Panjabi — White',
          bn: 'সুতি পাঞ্জাবি — সাদা',
          cat: 'mens-fashion',
          neg: true,
          desc: 'Breathable handloom cotton, perfect for Eid and Friday prayers.',
          v: sizes(1850, [6, 8, 4], { c: 2200, min: 1500 }),
        },
        {
          en: 'Embroidered Panjabi — Maroon',
          bn: 'এমব্রয়ডারি পাঞ্জাবি — মেরুন',
          cat: 'mens-fashion',
          neg: true,
          desc: 'Hand-embroidered collar and placket.',
          v: sizes(2650, [3, 5, 2], { c: 3100, min: 2200 }),
        },
        {
          en: 'Jamdani Saree',
          bn: 'জামদানি শাড়ি',
          cat: 'womens-fashion',
          neg: true,
          desc: 'Traditional Dhakai jamdani, 6 yards with blouse piece.',
          v: [
            { a: { color: 'Red' }, p: 8500, s: 2, min: 7500 },
            { a: { color: 'Teal' }, p: 8900, s: 1, min: 7800 },
          ],
        },
        {
          en: 'Printed Cotton Kurti',
          bn: 'প্রিন্টেড কটন কুর্তি',
          cat: 'womens-fashion',
          desc: 'Block printed, everyday wear.',
          v: sizes(1250, [5, 7, 3], {}, ['S', 'M', 'L']),
        },
      ],
    },
    {
      market: 'shapla',
      floor: 1,
      number: 'L1-12',
      en: 'Gadget Zone',
      bn: 'গ্যাজেট জোন',
      cat: 'mobile-phones',
      extra: ['audio', 'accessories'],
      verified: true,
      plan: 'pro',
      deposit: 10,
      desc: 'Official phones with brand warranty, earbuds and chargers.',
      products: [
        {
          en: 'Galaxy A56 5G (8/256GB)',
          bn: 'গ্যালাক্সি A56 5G',
          cat: 'mobile-phones',
          desc: 'Official Bangladesh variant with 1 year brand warranty.',
          warranty: ['brand_official', 12],
          v: [
            { a: { color: 'Graphite' }, p: 52999, s: 4, sku: 'GZ-A56-G' },
            { a: { color: 'Light Blue' }, p: 52999, s: 2, sku: 'GZ-A56-B' },
          ],
        },
        {
          en: 'Redmi Note 15 (8/128GB)',
          bn: 'রেডমি নোট ১৫',
          cat: 'mobile-phones',
          desc: '120Hz AMOLED, 5500mAh battery.',
          warranty: ['brand_official', 12],
          v: [{ a: { color: 'Black' }, p: 27499, s: 6, sku: 'GZ-RN15-K' }],
        },
        {
          en: 'Wireless Earbuds Pro',
          bn: 'ওয়্যারলেস ইয়ারবাড প্রো',
          cat: 'audio',
          neg: true,
          desc: 'ANC, 30h battery with case, Bluetooth 5.3.',
          warranty: ['shop', 6],
          v: [
            {
              a: { color: 'White' },
              p: 3499,
              c: 4200,
              s: 12,
              min: 2900,
              sku: 'GZ-EB-W',
            },
            {
              a: { color: 'Black' },
              p: 3499,
              c: 4200,
              s: 9,
              min: 2900,
              sku: 'GZ-EB-K',
            },
          ],
        },
        {
          en: '65W GaN Fast Charger',
          bn: '৬৫ ওয়াট ফাস্ট চার্জার',
          cat: 'accessories',
          neg: true,
          desc: 'USB-C PD, charges laptops and phones.',
          warranty: ['shop', 3],
          v: [{ p: 1950, s: 20, min: 1600, sku: 'GZ-CH65' }],
        },
        {
          en: 'Power Bank 20000mAh',
          bn: 'পাওয়ার ব্যাংক ২০০০০mAh',
          cat: 'accessories',
          desc: '22.5W fast charging, two USB ports.',
          warranty: ['shop', 6],
          v: [{ p: 2450, s: 1, sku: 'GZ-PB20' }],
        },
      ],
    },
    {
      market: 'shapla',
      floor: 1,
      number: 'L1-03',
      en: 'Glow Beauty Corner',
      bn: 'গ্লো বিউটি কর্নার',
      cat: 'skincare',
      extra: ['makeup', 'fragrance'],
      verified: true,
      desc: 'Authentic Korean and local skincare. Every product batch checked.',
      products: [
        {
          en: 'Vitamin C Brightening Serum 30ml',
          bn: 'ভিটামিন সি সিরাম',
          cat: 'skincare',
          desc: '15% vitamin C with hyaluronic acid.',
          v: [{ p: 1350, c: 1600, s: 15 }],
        },
        {
          en: 'Sunscreen SPF 50+ PA++++',
          bn: 'সানস্ক্রিন SPF ৫০+',
          cat: 'skincare',
          desc: 'Lightweight, no white cast. Ideal for humid weather.',
          v: [{ p: 950, s: 25 }],
        },
        {
          en: 'Matte Liquid Lipstick',
          bn: 'ম্যাট লিকুইড লিপস্টিক',
          cat: 'makeup',
          desc: '12-hour wear, transfer-proof.',
          v: [
            { a: { shade: 'Brick Red' }, p: 650, s: 10 },
            { a: { shade: 'Nude Pink' }, p: 650, s: 8 },
            { a: { shade: 'Berry' }, p: 650, s: 0 },
          ],
        },
        {
          en: 'Oud Attar 12ml',
          bn: 'ঊদ আতর',
          cat: 'fragrance',
          neg: true,
          desc: 'Alcohol-free, long-lasting oud.',
          v: [{ p: 1200, s: 14, min: 950 }],
        },
      ],
    },
    {
      market: 'shapla',
      floor: 2,
      number: 'L2-21',
      en: 'Step Up Shoes',
      bn: 'স্টেপ আপ শুজ',
      cat: 'footwear',
      desc: 'Leather shoes, sandals and sneakers for the whole family.',
      products: [
        {
          en: 'Leather Loafer',
          bn: 'চামড়ার লোফার',
          cat: 'footwear',
          neg: true,
          desc: 'Genuine cow leather, cushioned sole.',
          v: sizes(3200, [3, 4, 2, 1], { min: 2700 }, ['40', '41', '42', '43']),
        },
        {
          en: 'Running Sneakers',
          bn: 'রানিং স্নিকার',
          cat: 'footwear',
          desc: 'Breathable mesh, light EVA sole.',
          v: sizes(2750, [5, 6, 4, 2], { c: 3300 }, ['39', '40', '41', '42']),
        },
        {
          en: 'Kids Velcro Sandal',
          bn: 'বাচ্চাদের স্যান্ডেল',
          cat: 'footwear',
          desc: 'Soft, non-slip, easy on and off.',
          v: sizes(890, [6, 6, 6], {}, ['26', '28', '30']),
        },
      ],
    },
    {
      market: 'shapla',
      floor: 2,
      number: 'L2-05',
      en: 'Little Stars Kidswear',
      bn: 'লিটল স্টারস কিডসওয়্যার',
      cat: 'kids-fashion',
      desc: 'Comfortable cotton clothes for babies and kids.',
      products: [
        {
          en: 'Kids Cotton Panjabi Set',
          bn: 'বাচ্চাদের পাঞ্জাবি সেট',
          cat: 'kids-fashion',
          neg: true,
          desc: 'Panjabi and pajama set for Eid.',
          v: sizes(1150, [4, 5, 5], { min: 950 }, ['2-3Y', '4-5Y', '6-7Y']),
        },
        {
          en: 'Girls Frock — Floral',
          bn: 'মেয়েদের ফ্রক — ফ্লোরাল',
          cat: 'kids-fashion',
          desc: 'Soft cotton with lining.',
          v: sizes(1350, [3, 4, 2], {}, ['3Y', '5Y', '7Y']),
        },
      ],
    },
    {
      market: 'shapla',
      floor: 3,
      number: 'L3-02',
      en: 'Time & Bags',
      bn: 'টাইম অ্যান্ড ব্যাগস',
      cat: 'watches',
      extra: ['bags'],
      desc: 'Watches, wallets and backpacks.',
      products: [
        {
          en: 'Classic Analog Watch',
          bn: 'ক্লাসিক অ্যানালগ ঘড়ি',
          cat: 'watches',
          neg: true,
          desc: 'Stainless steel, water resistant 30m.',
          warranty: ['shop', 12],
          v: [
            { a: { strap: 'Leather' }, p: 4200, s: 5, min: 3600 },
            { a: { strap: 'Metal' }, p: 4600, s: 3, min: 3900 },
          ],
        },
        {
          en: 'Laptop Backpack 15.6"',
          bn: 'ল্যাপটপ ব্যাকপ্যাক',
          cat: 'bags',
          desc: 'Water-repellent with USB charging port.',
          v: [
            { a: { color: 'Grey' }, p: 2350, s: 7 },
            { a: { color: 'Black' }, p: 2350, s: 9 },
          ],
        },
      ],
    },
    {
      market: 'padma',
      floor: 0,
      number: 'G-10',
      en: 'Swarna Jewellers',
      bn: 'স্বর্ণ জুয়েলার্স',
      cat: 'gold',
      extra: ['fashion-jewellery'],
      verified: true,
      deposit: 20,
      desc: 'BAJUS-rate 22K gold. Hallmarked with certificate.',
      products: [
        {
          en: '22K Gold Ring (2.5g)',
          bn: '২২ ক্যারেট সোনার আংটি',
          cat: 'gold',
          desc: 'Price includes making charge. Hallmarked.',
          v: sizes(31500, [2, 2, 1], {}, ['Size 14', 'Size 16', 'Size 18']),
        },
        {
          en: 'Gold Plated Necklace Set',
          bn: 'গোল্ড প্লেটেড নেকলেস সেট',
          cat: 'fashion-jewellery',
          neg: true,
          desc: 'Necklace with matching earrings for weddings.',
          v: [{ p: 3800, s: 6, min: 3200 }],
        },
      ],
    },
    {
      market: 'padma',
      floor: 1,
      number: 'L1-07',
      en: 'TechNest Computers',
      bn: 'টেকনেস্ট কম্পিউটার্স',
      cat: 'computers',
      extra: ['accessories'],
      verified: true,
      plan: 'basic',
      desc: 'Laptops, monitors and accessories with official warranty.',
      products: [
        {
          en: 'Ultrabook 14" i5 (16GB/512GB)',
          bn: 'আল্ট্রাবুক ১৪ ইঞ্চি',
          cat: 'computers',
          desc: '13th gen Intel i5, IPS display, backlit keyboard.',
          warranty: ['brand_official', 24],
          v: [{ p: 84500, s: 3, sku: 'TN-UB14' }],
        },
        {
          en: '24" IPS Monitor 75Hz',
          bn: '২৪ ইঞ্চি মনিটর',
          cat: 'computers',
          neg: true,
          desc: 'Full HD, HDMI + VGA, eye-care.',
          warranty: ['brand_official', 36],
          v: [{ p: 13500, c: 14900, s: 6, min: 12500, sku: 'TN-MN24' }],
        },
        {
          en: 'Wireless Keyboard & Mouse Combo',
          bn: 'ওয়্যারলেস কিবোর্ড মাউস',
          cat: 'accessories',
          desc: 'Silent keys, 2.4GHz receiver.',
          warranty: ['shop', 6],
          v: [{ p: 1650, s: 18, sku: 'TN-KM01' }],
        },
      ],
    },
    {
      market: 'padma',
      floor: 2,
      number: 'L2-01',
      en: 'Urban Threads',
      bn: 'আরবান থ্রেডস',
      cat: 'mens-fashion',
      extra: ['womens-fashion'],
      desc: 'Smart casual shirts, denim and polos.',
      products: [
        {
          en: 'Slim Fit Oxford Shirt',
          bn: 'স্লিম ফিট অক্সফোর্ড শার্ট',
          cat: 'mens-fashion',
          desc: '100% cotton, wrinkle resistant.',
          v: sizes(1990, [4, 6, 3], { c: 2490 }),
        },
        {
          en: 'Stretch Denim Jeans',
          bn: 'স্ট্রেচ ডেনিম জিন্স',
          cat: 'mens-fashion',
          desc: 'Mid-rise, slim tapered.',
          v: sizes(2490, [5, 5, 3, 2], {}, ['30', '32', '34', '36']),
        },
        {
          en: 'Linen Co-ord Set',
          bn: 'লিনেন কো-অর্ড সেট',
          cat: 'womens-fashion',
          desc: 'Relaxed top and trousers.',
          v: sizes(3450, [2, 3, 2], {}, ['S', 'M', 'L']),
        },
      ],
    },
    {
      market: 'mirpur',
      floor: 0,
      number: 'A-17',
      en: 'Bhai Bhai Garments',
      bn: 'ভাই ভাই গার্মেন্টস',
      cat: 'mens-fashion',
      extra: ['kids-fashion'],
      deposit: 0,
      desc: 'Wholesale prices on everyday clothing. Dam-dor kora jabe!',
      products: [
        {
          en: 'Polo T-Shirt (Pack of 2)',
          bn: 'পোলো টি-শার্ট (২টি)',
          cat: 'mens-fashion',
          neg: true,
          desc: 'Export quality pique cotton.',
          v: sizes(890, [10, 12, 8], { min: 700 }),
        },
        {
          en: 'Cotton Lungi',
          bn: 'সুতি লুঙ্গি',
          cat: 'mens-fashion',
          neg: true,
          desc: 'Soft check lungi, pre-washed.',
          v: [
            { a: { color: 'Blue check' }, p: 550, s: 20, min: 450 },
            { a: { color: 'Green check' }, p: 550, s: 15, min: 450 },
          ],
        },
        {
          en: 'Kids Shorts (Pack of 3)',
          bn: 'বাচ্চাদের হাফপ্যান্ট (৩টি)',
          cat: 'kids-fashion',
          neg: true,
          desc: 'Elastic waist cotton shorts.',
          v: sizes(650, [8, 8, 8], { min: 520 }, ['2-4Y', '4-6Y', '6-8Y']),
        },
      ],
    },
    {
      market: 'mirpur',
      floor: 0,
      number: 'B-03',
      en: 'Rannaghor Kitchen Mart',
      bn: 'রান্নাঘর কিচেন মার্ট',
      cat: 'kitchen',
      extra: ['decor'],
      desc: 'Pressure cookers, non-stick pans, storage and decor.',
      products: [
        {
          en: 'Pressure Cooker 5L',
          bn: 'প্রেশার কুকার ৫ লিটার',
          cat: 'kitchen',
          neg: true,
          desc: 'Aluminium, ISI-style safety valve.',
          warranty: ['shop', 12],
          v: [{ p: 2850, s: 7, min: 2500 }],
        },
        {
          en: 'Non-stick Fry Pan 26cm',
          bn: 'নন-স্টিক ফ্রাই প্যান',
          cat: 'kitchen',
          neg: true,
          desc: 'Granite coating, induction base.',
          v: [{ p: 1450, s: 11, min: 1250 }],
        },
        {
          en: 'Ceramic Table Lamp',
          bn: 'সিরামিক টেবিল ল্যাম্প',
          cat: 'decor',
          desc: 'Hand-painted base with linen shade.',
          v: [{ p: 2200, s: 4 }],
        },
      ],
    },
    {
      market: 'mirpur',
      floor: 1,
      number: 'F-22',
      en: 'Mobile Care Point',
      bn: 'মোবাইল কেয়ার পয়েন্ট',
      cat: 'accessories',
      extra: ['audio'],
      desc: 'Covers, glass protectors, cables and earphones at market prices.',
      products: [
        {
          en: 'Tempered Glass Protector',
          bn: 'টেম্পার্ড গ্লাস',
          cat: 'accessories',
          neg: true,
          desc: 'Fitting included free at the shop.',
          v: [
            { a: { model: 'iPhone 15' }, p: 350, s: 30, min: 250 },
            { a: { model: 'Galaxy A56' }, p: 300, s: 25, min: 220 },
            { a: { model: 'Redmi Note 15' }, p: 280, s: 25, min: 200 },
          ],
        },
        {
          en: 'Braided USB-C Cable 1.5m',
          bn: 'ব্রেইডেড টাইপ-সি ক্যাবল',
          cat: 'accessories',
          neg: true,
          desc: '60W fast charging.',
          v: [{ p: 450, s: 40, min: 350 }],
        },
        {
          en: 'Wired Earphones with Mic',
          bn: 'ওয়্যার্ড ইয়ারফোন',
          cat: 'audio',
          desc: 'Deep bass, in-line remote.',
          v: [{ p: 390, s: 0 }],
        },
      ],
    },
    {
      market: 'chawk',
      floor: 0,
      number: 'G-08',
      en: 'Port City Fashion',
      bn: 'পোর্ট সিটি ফ্যাশন',
      cat: 'womens-fashion',
      verified: true,
      desc: 'Three-piece, sarees and abayas.',
      products: [
        {
          en: 'Unstitched Three-Piece',
          bn: 'আনস্টিচড থ্রি-পিস',
          cat: 'womens-fashion',
          neg: true,
          desc: 'Lawn cotton with chiffon dupatta.',
          v: [
            { a: { color: 'Mint' }, p: 2650, s: 6, min: 2200 },
            { a: { color: 'Peach' }, p: 2650, s: 4, min: 2200 },
          ],
        },
        {
          en: 'Classic Abaya',
          bn: 'ক্লাসিক আবায়া',
          cat: 'womens-fashion',
          desc: 'Nida fabric, with hijab.',
          v: sizes(3200, [3, 4, 2], {}, ['52', '54', '56']),
        },
      ],
    },
  ];

  const shopIds: number[] = [];
  let ownerSeq = 1;
  for (const [i, spec] of shopSpecs.entries()) {
    const owner = await mkUser(
      `+88017110000${String(ownerSeq++).padStart(2, '0')}`,
      `${spec.en.split(' ')[0]} Owner`,
    );
    const market = markets[spec.market];
    const shop = await db.getRepository(Shop).save({
      slug: slug(spec.en),
      marketId: market.id,
      floorId: floors[spec.market][spec.floor],
      shopNumber: spec.number,
      walkOrder: i + 1,
      mapX: 10 + ((i * 23) % 80),
      mapY: 15 + ((i * 37) % 70),
      nameEn: spec.en,
      nameBn: spec.bn,
      description: spec.desc,
      coverUrl: SHOP_COVERS[spec.en] ? U(SHOP_COVERS[spec.en], 1600) : null,
      phone: owner.phone,
      primaryCategoryId: cat[spec.cat],
      depositPercent: spec.deposit ?? 0,
      reservationHours: 24,
      returnWindowDays: 3,
      offersDelivery: spec.en !== 'Swarna Jewellers',
      returnPolicy:
        'Unused items with tags can be returned or exchanged within 3 days with the receipt.',
      status: 'active',
      isVerified: !!spec.verified,
      verifiedAt: spec.verified ? new Date() : null,
      onboardedBy: onboarder.id,
    });
    shopIds.push(shop.id);
    await db
      .getRepository(ShopMember)
      .save({ shopId: shop.id, userId: owner.id, role: 'owner' });
    await db.getRepository(ShopCategory).save(
      [spec.cat, ...(spec.extra ?? [])].map((c) => ({
        shopId: shop.id,
        categoryId: cat[c],
      })),
    );
    await db.getRepository(ShopHours).save(
      Array.from({ length: 7 }, (_, weekday) => ({
        shopId: shop.id,
        weekday,
        isClosed: weekday === market.weeklyOffDay,
        opensAt: weekday === market.weeklyOffDay ? null : '10:00',
        closesAt: weekday === market.weeklyOffDay ? null : '21:00',
      })),
    );
    await db.getRepository(ShopSubscription).save({
      shopId: shop.id,
      planId: plan[spec.plan ?? 'free'],
      status: 'active',
      startsAt: launch,
    });
    await db.getRepository(ShopPayoutAccount).save({
      shopId: shop.id,
      method: 'bkash',
      accountName: spec.en,
      accountNumber: owner.phone.slice(3),
      isDefault: true,
      verifiedAt: new Date(),
    });
    // Test-mode Steadfast account: bookings are simulated until the shop adds its real API keys.
    if (spec.en !== 'Swarna Jewellers') {
      await db.getRepository(CourierAccount).save({
        shopId: shop.id,
        provider: 'steadfast',
        mode: 'mock',
        label: 'Steadfast (test mode)',
        isDefault: true,
      });
    }
    await db.getRepository(ShopVerification).save([
      {
        shopId: shop.id,
        kind: 'trade_license',
        documentNumber: `TRAD/DNCC/${100000 + i}/2026`,
        status: spec.verified ? 'approved' : 'pending',
        reviewedBy: spec.verified ? admin.id : null,
        reviewedAt: spec.verified ? new Date() : null,
      },
      ...(spec.verified
        ? [
            {
              shopId: shop.id,
              kind: 'physical_visit' as const,
              status: 'approved' as const,
              reviewedBy: onboarder.id,
              reviewedAt: new Date(),
              notes: 'Visited, photos taken',
            },
          ]
        : []),
    ]);

    for (const p of spec.products) {
      const product = await db.getRepository(Product).save({
        shopId: shop.id,
        categoryId: cat[p.cat],
        slug: slug(p.en),
        nameEn: p.en,
        nameBn: p.bn,
        description: p.desc,
        isNegotiable: !!p.neg,
        status: 'active',
        warrantyType: p.warranty?.[0] ?? 'none',
        warrantyMonths: p.warranty?.[1] ?? null,
        minPrice: Math.min(...p.v.map((v) => v.p)),
        createdBy: owner.id,
      });
      if (PRODUCT_PHOTOS[p.en])
        await db.getRepository(ProductImage).save({
          productId: product.id,
          url: U(PRODUCT_PHOTOS[p.en]),
          sortOrder: 0,
        });
      for (const v of p.v) {
        const variant = await db.getRepository(ProductVariant).save({
          productId: product.id,
          sku: v.sku ?? null,
          attributes: v.a ?? {},
          price: v.p,
          compareAtPrice: v.c ?? null,
          minOfferPrice: v.min ?? null,
          stockQty: v.s,
          lowStockThreshold: 2,
        });
        if (v.s > 0)
          await db.getRepository(InventoryMovement).save({
            variantId: variant.id,
            stockChange: v.s,
            reason: 'restock',
            note: 'Opening stock',
            createdBy: onboarder.id,
          });
      }
    }
  }

  await db.getRepository(Coupon).save([
    {
      code: 'EID10',
      fundedBy: 'platform',
      discountType: 'percent',
      discountValue: 10,
      maxDiscount: 500,
      minOrderTotal: 1000,
      perUserLimit: 1,
      startsAt: launch,
      endsAt: new Date('2027-01-01'),
    },
    {
      code: 'SHAPLA200',
      fundedBy: 'market',
      marketId: markets.shapla.id,
      discountType: 'fixed',
      discountValue: 200,
      minOrderTotal: 2000,
      perUserLimit: 2,
      startsAt: launch,
      endsAt: new Date('2027-01-01'),
    },
  ]);

  // ---------------------------------------------------------------- brands (the product list can be filtered by them)
  for (const brand of BRANDS) {
    const [created] = await db
      .getRepository(Brand)
      .save([{ name: brand.name, slug: brand.slug }]);
    for (const pattern of brand.products)
      await db.query(
        `UPDATE products SET brand_id = $1 WHERE name_en LIKE $2 AND brand_id IS NULL`,
        [created.id, pattern],
      );
  }

  // Home-page banners (ad_campaigns, placement home_banner).
  const year = {
    startsAt: launch,
    endsAt: new Date('2027-06-30'),
    status: 'running' as const,
  };
  await db.getRepository(AdCampaign).save([
    {
      // Slide 1: the Bangla banner (frontend/scripts/banners/bangla.html → npm run banners:build), for all of Bangladesh.
      advertiser: 'external',
      placement: 'home_banner',
      ...year,
      title:
        'সারা বাংলাদেশের মার্কেট, এখন আপনার হাতের মুঠোয় — ঘরে বসেই অর্ডার করুন',
      imageUrl: '/banner-art/bn-wide.png?v=2',
      mobileImageUrl: '/banner-art/bn-phone.png?v=2',
      imageHasText: true,
      linkUrl: '/markets',
    },
    {
      // Slide 2: the English version: artwork drawn by the web app (frontend/src/app/banners) that explains the whole idea.
      advertiser: 'external',
      placement: 'home_banner',
      ...year,
      title:
        "Bangladesh's markets, now at your door — choose a market, walk into a shop, order the product",
      imageUrl: '/banners/journey-wide.png?v=3',
      mobileImageUrl: '/banners/journey-phone.png?v=3',
      imageHasText: true,
      linkUrl: '/markets',
    },
    {
      advertiser: 'market',
      marketId: markets.shapla.id,
      placement: 'home_banner',
      ...year,
      title: 'Eid collection is in at Shapla City Mall',
      subtitle:
        'Panjabi, saree and three-piece from 6 shops. Order today — delivered to your door, pay cash on delivery.',
      imageUrl: U('photo-1776539788649-365595327e68', 1800),
      linkUrl: '/markets/shapla-city-mall',
    },
    {
      advertiser: 'shop',
      placement: 'home_banner',
      ...year,
      title: 'Phones with official warranty',
      subtitle:
        'Compare prices across Gadget Zone, TechNest and Mobile Care Point.',
      imageUrl: U('photo-1761494296583-99b15e9063c5', 1800),
      linkUrl: '/search?scope=product&q=phone',
    },
    {
      advertiser: 'external',
      placement: 'home_banner',
      ...year,
      title: 'Delivered to your door. Pay when it arrives.',
      subtitle:
        'Steadfast delivers across Bangladesh — ৳70 inside Dhaka. Or collect it at the mall, free.',
      imageUrl: U('photo-1483985988355-763728e1935b', 1800),
      linkUrl: '/search?scope=product',
    },
  ]);

  const counts =
    await db.query(`SELECT (SELECT count(*) FROM markets)::int AS markets, (SELECT count(*) FROM shops)::int AS shops,
    (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM product_variants)::int AS variants, (SELECT count(*) FROM users)::int AS users`);
  console.log('Seeded:', counts[0]);
  console.log(`
  Demo logins (phone + OTP; in development the OTP is shown on screen):
    Super admin      01700000001
    Onboarding team  01700000002
    Finance          01700000003
    Mall admin       01700000010   (Shapla City Mall)
    Pickup desk      01700000011   (Shapla City Mall)
    Shop owner       01711000001   (Nakshi Style House) … 01711000013
    Customer         01800000001
  `);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
