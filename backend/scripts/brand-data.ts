/** Demo brands and which seeded products carry them (SQL LIKE patterns on the product's English name). */
export const BRANDS: { name: string; slug: string; products: string[] }[] = [
  { name: 'Samsung', slug: 'samsung', products: ['Galaxy%'] },
  { name: 'Xiaomi', slug: 'xiaomi', products: ['Redmi%'] },
  {
    name: 'Anker',
    slug: 'anker',
    products: ['%GaN Fast Charger%', 'Power Bank%', 'Braided USB-C Cable%'],
  },
  {
    name: 'Haylou',
    slug: 'haylou',
    products: ['Wireless Earbuds%', 'Wired Earphones%'],
  },
  { name: 'Lenovo', slug: 'lenovo', products: ['Ultrabook%'] },
  { name: 'Logitech', slug: 'logitech', products: ['Wireless Keyboard%'] },
  {
    name: 'Walton',
    slug: 'walton',
    products: ['24" IPS Monitor%', 'Tempered Glass Protector%'],
  },
  {
    name: 'Aarong',
    slug: 'aarong',
    products: [
      '%Jamdani%',
      'Printed Cotton Kurti%',
      '%Panjabi%',
      'Unstitched Three-Piece%',
    ],
  },
  {
    name: 'Yellow',
    slug: 'yellow',
    products: [
      'Slim Fit Oxford Shirt%',
      'Stretch Denim Jeans%',
      'Polo T-Shirt%',
      'Linen Co-ord Set%',
    ],
  },
  {
    name: 'Bata',
    slug: 'bata',
    products: ['Leather Loafer%', 'Kids Velcro Sandal%'],
  },
  { name: 'Apex', slug: 'apex', products: ['Running Sneakers%'] },
  { name: 'Titan', slug: 'titan', products: ['Classic Analog Watch%'] },
  {
    name: 'Miyako',
    slug: 'miyako',
    products: ['Pressure Cooker%', 'Non-stick Fry Pan%', 'Ceramic Table Lamp%'],
  },
];
