import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri, Rubik } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const rubik = Rubik({ variable: '--font-rubik', subsets: ['latin'], display: 'swap' });
const bangla = Hind_Siliguri({
  variable: '--font-bangla',
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Cholo Market';

const DESCRIPTION =
  "Walk through Dhaka's malls shop by shop, search any market, shop or product, and order online. Home delivery across Bangladesh with cash on delivery, or pick up in store.";
// The journey banner doubles as the link preview on Facebook, WhatsApp and Messenger.
const SHARE_IMAGE = {
  url: '/banners/journey-share.png?v=3',
  width: 1200,
  height: 630,
  alt: 'Cholo Market: choose a mall, walk into a shop, order the product, delivered to your door',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'),
  title: {
    default: `${APP_NAME} — Bangladesh's malls & markets, online`,
    template: `%s · ${APP_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: `${APP_NAME} — Dhaka's malls, now at your door`,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: { card: 'summary_large_image', images: [SHARE_IMAGE.url] },
};

export const viewport: Viewport = {
  themeColor: '#891f2f',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${bangla.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
