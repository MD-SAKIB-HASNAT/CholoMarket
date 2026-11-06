import Link from 'next/link';
import { WalkerMark } from '@/components/site/Logo';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/markets', label: '1. Malls & markets' },
      { href: '/shops', label: '2. Shops' },
      { href: '/products', label: '3. Products' },
    ],
  },
  {
    title: 'Your orders',
    links: [
      { href: '/orders', label: 'Track an order' },
      { href: '/offers', label: 'My offers' },
      { href: '/messages', label: 'Messages' },
      { href: '/wishlist', label: 'Wishlist' },
    ],
  },
  {
    title: 'For shops & malls',
    links: [
      { href: '/login', label: 'Shop owner login' },
      { href: '/login', label: 'Mall management login' },
      { href: '/login', label: 'Get your shop listed' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-white/75">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-end gap-2 leading-none">
            <WalkerMark light />
            <span className="text-[1.4rem] font-bold tracking-[-0.03em] text-white">
              cholo<span className="font-medium text-white/80">market</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm">
            Dhaka’s malls and markets, online. Order from any shop and get it delivered with cash on
            delivery, or collect it at the mall.
          </p>
          <div className="text-sm">
            <p className="font-medium text-white">Hotline 09600-000000</p>
            <p>10am – 9pm, every day</p>
          </div>
        </div>
        {COLUMNS.map(col => (
          <div key={col.title} className="space-y-3 text-sm">
            <p className="font-medium text-white">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cholo Market · Dhanmondi, Dhaka</p>
          <div className="flex flex-wrap items-center gap-2">
            <span>We accept</span>
            {['bKash', 'Nagad', 'Cash on pickup'].map(m => (
              <span key={m} className="rounded border border-white/20 px-2 py-0.5 text-white/90">
                {m}
              </span>
            ))}
          </div>
        </div>
        <p className="container-page pb-5 text-[11px] leading-relaxed text-white/50">
          Banner photos:{' '}
          <a
            className="underline hover:text-white"
            href="https://commons.wikimedia.org/wiki/File:Zamzam_tower_at_Uttara_3.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Zamzam Tower, Uttara
          </a>{' '}
          by Wasiul Bahar and{' '}
          <a
            className="underline hover:text-white"
            href="https://commons.wikimedia.org/wiki/File:Aarong_a_Bangladeshi_clothing_%26_handicrafts_brand_in_Basundhara_city_Dhaka_Bangladesh.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Aarong, Bashundhara City
          </a>{' '}
          by Sm faysal, via Wikimedia Commons, licensed{' '}
          <a
            className="underline hover:text-white"
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . Aarong is a trademark of its owner; we are not affiliated.
        </p>
      </div>
    </footer>
  );
}
