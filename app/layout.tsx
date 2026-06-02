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
  themeColor: '#6d28d9',
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

        {/* Fondo violeta degradado */}
        <div
          className="fixed inset-0 -z-20"
          style={{
            background: 'linear-gradient(160deg, #6d28d9 0%, #5b21b6 45%, #4c1d95 100%)',
          }}
        />
        {/* Patrón de hexágonos sutil */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">{children}</main>
        <footer className="border-t border-white/15 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
            <div className="grid sm:grid-cols-3 gap-5 text-sm">
              {/* Local */}
              <div className="space-y-1.5">
                <p className="font-bold text-white">Donut Makers Caballito</p>
                <p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Av.+La+Plata+702,+Caballito,+CABA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-300 hover:text-white transition-colors"
                  >
                    📍 Av. La Plata 702, CABA
                  </a>
                </p>
                <Link href="/bases" className="text-violet-300 hover:text-white transition-colors inline-block">
                  Bases y Condiciones
                </Link>
              </div>

              {/* Contacto */}
              <div className="space-y-1.5 text-violet-300">
                <p className="font-semibold text-violet-100">Contacto</p>
                <p>
                  <a href="https://wa.me/5491172421226" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    📱 WhatsApp 11 7242-1226
                  </a>
                </p>
                <p>
                  <a href="mailto:donutmakers.caballito@gmail.com" className="hover:text-white transition-colors break-all">
                    ✉️ donutmakers.caballito@gmail.com
                  </a>
                </p>
                <p>
                  <a href="https://www.instagram.com/donut.makers.caballito" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    📷 @donut.makers.caballito
                  </a>
                </p>
              </div>

              {/* Creador */}
              <div className="space-y-1.5 text-violet-300 sm:text-right">
                <p className="font-semibold text-violet-100">Creado por</p>
                <p>Luka</p>
                <p>
                  <Link href="/contacto" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    ¿Querés una web o app? Escribime →
                  </Link>
                </p>
              </div>
            </div>

            <div className="border-t border-white/15 pt-4 text-center text-xs text-violet-400">
              © 2026 Donut Makers Caballito · El Prode del Mundial 2026
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
