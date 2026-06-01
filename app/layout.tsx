import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

const SITE_URL = 'https://prode-mundial-2026-henna-zeta.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'Prode Mundial 2026 · Donut Makers Caballito',
    template: '%s · Prode Mundial 2026',
  },
  description: '¿Sabés de fútbol? Predecí los partidos del Mundial 2026 y ganá premios en Donut Makers Caballito. Gratis, para clientes del local.',
  metadataBase: new URL(SITE_URL),
  keywords: ['prode', 'mundial 2026', 'donut makers', 'caballito', 'predicciones fútbol', 'fútbol argentina'],
  openGraph: {
    title: 'Prode Mundial 2026 · Donut Makers Caballito',
    description: '¿Sabés de fútbol? Predecí los partidos del Mundial 2026 y ganá premios. Gratis, solo para clientes del local.',
    url: SITE_URL,
    siteName: 'Prode Donut Makers',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'Prode Mundial 2026 - Donut Makers Caballito' }],
  },
  twitter: {
    card: 'summary',
    title: 'Prode Mundial 2026 · Donut Makers Caballito',
    description: '¿Sabés de fútbol? Predecí los partidos del Mundial 2026 y ganá premios.',
    images: ['/icon.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect para banderas de equipos */}
        <link rel="preconnect" href="https://flagcdn.com" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
      </head>
      <body className="text-white min-h-screen font-sans antialiased">

        {/* Fondo: estadio local (sin dependencia externa) */}
        <div
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: "url('/estadio.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            filter: 'blur(6px) brightness(0.72) saturate(1.5)',
            transform: 'scale(1.06)',
          }}
        />
        {/* Overlay liviano — deja respirar el estadio */}
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: 'linear-gradient(180deg, rgba(0,18,6,0.18) 0%, rgba(0,12,4,0.42) 25%, rgba(9,9,11,0.72) 58%, rgba(9,9,11,0.90) 100%)',
          }}
        />

        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-800/60 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-zinc-500 text-sm">
            Donut Makers Bakery · Av. La Plata 702, CABA
          </div>
        </footer>
      </body>
    </html>
  );
}
