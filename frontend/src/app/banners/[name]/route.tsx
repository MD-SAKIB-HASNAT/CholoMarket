import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * The home page's lead banner, drawn from real photos so a first-time visitor sees the
 * whole idea at a glance: market → shop → product → your door.
 * Rendered once per size at build time (and cached in dev):
 *   /banners/journey-wide.png   2400×750  desktop and tablet carousel
 *   /banners/journey-phone.png  1200×800  phone carousel
 *   /banners/journey-share.png  1200×630  link previews (Facebook, WhatsApp, ...)
 * Browsers cache these for a day, so after changing the artwork bump the `?v=` in the banner's
 * image URLs (admin Banners page, backend/scripts/seed.ts) and in app/layout.tsx.
 * Photo credits (CC BY-SA): scripts/banners/photos/CREDITS.md
 */

export const dynamic = 'force-static';

const LAYOUTS = {
  'journey-wide.png': { width: 2400, height: 750 },
  'journey-phone.png': { width: 1200, height: 800 },
  'journey-share.png': { width: 1200, height: 630 },
} as const;
type Name = keyof typeof LAYOUTS;

export function generateStaticParams() {
  return Object.keys(LAYOUTS).map(name => ({ name }));
}

const MAROON = '#891f2f';
const MARIGOLD = '#ed9e2f';
const CREAM = '#f9f3ec';
const INK = '#2c1d19';

const photo = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

type Step = { label: string; text: string; src?: string; grid?: string[]; focus?: string };

/** The four pictures: a market building, a famous shop's sign, a mix of products, a parcel at the door. */
const PRODUCT_PHOTOS = [
  'photo-1560769629-975ec94e6a86', // sneakers
  'photo-1606220588913-b3aacb4d2f46', // earbuds
  'photo-1616406432452-07bc5938759d', // leather loafers
  'photo-1646149757906-e6e9e9a7c77f', // attar
];

async function localPhoto(name: string) {
  const file = await readFile(join(process.cwd(), 'scripts', 'banners', 'photos', name));
  return `data:image/jpeg;base64,${file.toString('base64')}`;
}

async function loadSteps(): Promise<Step[]> {
  const [market, shop] = await Promise.all([
    localPhoto('zamzam-tower.jpg'),
    localPhoto('aarong.jpg'),
  ]);
  return [
    { label: 'Market', text: 'Choose your market', src: market, focus: 'center 40%' },
    { label: 'Shop', text: 'Walk into a shop', src: shop, focus: 'center 8%' },
    {
      label: 'Product',
      text: 'Order what you like',
      grid: PRODUCT_PHOTOS.map(id => photo(id, 420)),
    },
    {
      label: 'Your door',
      text: 'Delivered, pay in cash',
      src: photo('photo-1566576721346-d4a3b4eaeb55', 700),
      focus: 'center 60%',
    },
  ];
}

async function loadFont(family: string, weight: number) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`)
    ).text();
    const src = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null; // fall back to the renderer's built-in font
  }
}

/** The logo figure (components/site/logo.tsx), white for the maroon panel: bag slung behind, right hand at the neck. */
function Walker({ height }: { height: number }) {
  return (
    <svg
      width={(height * 40) / 36}
      height={height}
      viewBox="0 0 40 36"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="rotate(-8 9 22)">
        <path d="M6.6 17.2V15.8a2.6 2.6 0 0 1 5.2 0v1.4" stroke="white" strokeWidth="1.4" />
        <rect x="3.6" y="17.2" width="11" height="10.6" rx="1.8" fill={MARIGOLD} />
      </g>
      <path d="M22.6 10.4C17.4 10.2 13.4 12.2 10.6 16.8" stroke={MARIGOLD} strokeWidth="1.6" />
      <path d="M24.2 11.4 20.8 22" stroke="white" strokeWidth="3.8" />
      <path d="M24 12.6 17.8 15.8 22.4 9.9" stroke="white" strokeWidth="2.8" />
      <path d="M24.6 12.6 28.8 16.4 32 19.8" stroke="white" strokeWidth="2.8" />
      <path d="M20.8 22 25.6 27.6 28.8 33.4" stroke="white" strokeWidth="3.4" />
      <path d="M20.8 22 16.6 27.8 12.4 32.4" stroke="white" strokeWidth="3.4" />
      <circle cx="25.8" cy="6.2" r="3.7" fill="white" />
    </svg>
  );
}

function Brand({ scale }: { scale: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 * scale }}>
      <Walker height={50 * scale} />
      <div
        style={{
          display: 'flex',
          fontSize: 40 * scale,
          lineHeight: 1,
          color: 'white',
          fontWeight: 700,
          letterSpacing: -1 * scale,
        }}
      >
        cholo<span style={{ fontWeight: 500, color: '#f3d9c4' }}>market</span>
      </div>
    </div>
  );
}

function Step({
  step,
  index,
  photoW,
  photoH,
  scale,
  labelOnly,
}: {
  step: Step;
  index: number;
  photoW: number;
  photoH: number;
  scale: number;
  labelOnly?: boolean;
}) {
  const half = { width: (photoW - 3) / 2, height: (photoH - 3) / 2 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: photoW }}>
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: photoW,
          height: photoH,
          borderRadius: 14 * scale,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {step.grid ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: photoW, height: photoH }}>
            {step.grid.map(src => (
              // eslint-disable-next-line @next/next/no-img-element -- rendered by the OG image renderer, not the browser
              <img key={src} src={src} {...half} style={{ objectFit: 'cover', ...half }} alt="" />
            ))}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by the OG image renderer, not the browser
          <img
            src={step.src}
            width={photoW}
            height={photoH}
            style={{
              objectFit: 'cover',
              objectPosition: step.focus,
              width: photoW,
              height: photoH,
            }}
            alt=""
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 14 * scale,
            left: 14 * scale,
            width: 46 * scale,
            height: 46 * scale,
            borderRadius: 999,
            background: index === 3 ? MARIGOLD : MAROON,
            color: index === 3 ? INK : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26 * scale,
            fontWeight: 700,
          }}
        >
          {index + 1}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 16 * scale,
          fontSize: (labelOnly ? 46 : 34) * scale,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.1,
        }}
      >
        {step.label}
      </div>
      {labelOnly ? null : (
        <div
          style={{ display: 'flex', marginTop: 4 * scale, fontSize: 22 * scale, color: '#6b5a52' }}
        >
          {step.text}
        </div>
      )}
    </div>
  );
}

function Arrow({ scale, height }: { scale: number; height: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height,
        color: MAROON,
        fontSize: 52 * scale,
        fontWeight: 700,
      }}
    >
      →
    </div>
  );
}

function Journey({
  steps,
  photoW,
  photoH,
  scale,
  labelOnly,
}: {
  steps: Step[];
  photoW: number;
  photoH: number;
  scale: number;
  labelOnly?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 * scale }}>
      {steps.flatMap((s, i) => {
        const card = (
          <Step
            key={s.label}
            step={s}
            index={i}
            photoW={photoW}
            photoH={photoH}
            scale={scale}
            labelOnly={labelOnly}
          />
        );
        return i ? [<Arrow key={`a${i}`} scale={scale} height={photoH} />, card] : [card];
      })}
    </div>
  );
}

function Chips({ scale }: { scale: number }) {
  return (
    <div style={{ display: 'flex', gap: 12 * scale }}>
      {['Cash on delivery', 'Real market shops', 'bKash · Nagad'].map(c => (
        <div
          key={c}
          style={{
            display: 'flex',
            padding: `${8 * scale}px ${18 * scale}px`,
            borderRadius: 999,
            border: `2px solid ${MARIGOLD}`,
            color: 'white',
            fontSize: 22 * scale,
            fontWeight: 500,
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

/** Desktop: message on maroon at the left, the four photos on cream at the right. */
function Wide({ steps }: { steps: Step[] }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: CREAM }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 1000,
          padding: '70px 80px',
          background: MAROON,
        }}
      >
        <Brand scale={1.1} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 70,
              fontWeight: 700,
              lineHeight: 1.04,
              color: 'white',
              letterSpacing: -1.5,
            }}
          >
            <span>{"Bangladesh's markets,"}</span>
            <span style={{ color: MARIGOLD }}>now at your door.</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 31,
              lineHeight: 1.35,
              color: '#f3e3da',
              maxWidth: 800,
            }}
          >
            Choose a market, step into a shop, order the product. We deliver it with cash on
            delivery, or you pick it up yourself.
          </div>
        </div>
        <Chips scale={1.1} />
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Journey steps={steps} photoW={262} photoH={420} scale={1} />
      </div>
    </div>
  );
}

/**
 * Phone: shown about 350px wide, so everything is big — two-line headline, one short line,
 * and a single bold word under each photo.
 */
function Phone({ steps }: { steps: Step[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: CREAM,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          padding: '44px 52px 38px',
          background: MAROON,
        }}
      >
        <Brand scale={1.15} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.02,
            color: 'white',
            letterSpacing: -2,
          }}
        >
          <span>{"Bangladesh's markets,"}</span>
          <span style={{ color: MARIGOLD }}>now at your door.</span>
        </div>
        <div style={{ display: 'flex', fontSize: 38, color: '#f3e3da', fontWeight: 500 }}>
          Cash on delivery · or pick it up
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Journey steps={steps} photoW={234} photoH={250} scale={0.7} labelOnly />
      </div>
    </div>
  );
}

/** Link preview: message band on top, photos underneath. */
function Stacked({ height, steps }: { height: number; steps: Step[] }) {
  const share = height < 700;
  const photoH = share ? 200 : 300;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: CREAM,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: share ? 14 : 20,
          padding: share ? '36px 48px 30px' : '48px 52px 40px',
          background: MAROON,
        }}
      >
        <Brand scale={share ? 0.8 : 0.95} />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: share ? 56 : 66,
            fontWeight: 700,
            lineHeight: 1.05,
            color: 'white',
            letterSpacing: -1.5,
          }}
        >
          {"Bangladesh's markets, "}
          <span style={{ color: MARIGOLD }}>now at your door.</span>
        </div>
        <div
          style={{ display: 'flex', fontSize: share ? 24 : 28, lineHeight: 1.3, color: '#f3e3da' }}
        >
          Order from real market shops. Cash on delivery, or pick it up yourself.
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Journey steps={steps} photoW={226} photoH={photoH} scale={0.82} />
      </div>
    </div>
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!(name in LAYOUTS)) return new Response('Not found', { status: 404 });
  const size = LAYOUTS[name as Name];
  const [medium, bold, steps] = await Promise.all([
    loadFont('Rubik', 500),
    loadFont('Rubik', 700),
    loadSteps(),
  ]);
  const fonts = [
    ...(medium
      ? [{ name: 'Rubik', data: medium, weight: 500 as const, style: 'normal' as const }]
      : []),
    ...(bold
      ? [{ name: 'Rubik', data: bold, weight: 700 as const, style: 'normal' as const }]
      : []),
  ];
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        fontFamily: fonts.length ? 'Rubik' : undefined,
      }}
    >
      {name === 'journey-wide.png' ? (
        <Wide steps={steps} />
      ) : name === 'journey-phone.png' ? (
        <Phone steps={steps} />
      ) : (
        <Stacked height={size.height} steps={steps} />
      )}
    </div>,
    { ...size, fonts, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } }
  );
}
