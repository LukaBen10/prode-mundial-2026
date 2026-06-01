import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
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
        <main className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">{children}</main>
        <footer className="border-t border-zinc-800/60 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
            <div className="grid sm:grid-cols-3 gap-5 text-sm">
              {/* Local */}
              <div className="space-y-1.5">
                <p className="font-bold text-zinc-300">Donut Makers Caballito</p>
                <p className="text-zinc-500">Av. La Plata 702, CABA</p>
                <Link href="/bases" className="text-zinc-500 hover:text-zinc-300 transition-colors inline-block">
                  Bases y Condiciones
                </Link>
              </div>

              {/* Contacto */}
              <div className="space-y-1.5 text-zinc-500">
                <p className="font-semibold text-zinc-400">Contacto</p>
                <p>
                  <a href="https://wa.me/5491172421226" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
                    📱 WhatsApp 11 7242-1226
                  </a>
                </p>
                <p>
                  <a href="mailto:donutmakers.caballito@gmail.com" className="hover:text-zinc-300 transition-colors break-all">
                    ✉️ donutmakers.caballito@gmail.com
                  </a>
                </p>
                <p>
                  <a href="https://www.instagram.com/donut.makers.caballito" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
                    📷 @donut.makers.caballito
                  </a>
                </p>
              </div>

              {/* Creador */}
              <div className="space-y-1.5 text-zinc-500 sm:text-right">
                <p className="font-semibold text-zinc-400">Creado por</p>
                <p>Luka Benincasa</p>
                <p>
                  <Link href="/contacto" className="text-orange-400/80 hover:text-orange-300 transition-colors font-medium">
                    ¿Querés una web o app? Escribime →
                  </Link>
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/40 pt-4 text-center text-xs text-zinc-600">
              © 2026 Donut Makers Caballito · El Prode del Mundial 2026
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
