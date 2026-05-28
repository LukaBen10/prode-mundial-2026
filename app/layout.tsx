import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Prode Mundial 2026 | Donut Makers',
  description: '¿Sabés de fútbol? Demostralo. El prode del barrio.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="text-white min-h-screen font-sans antialiased">

        {/* Fondo: estadio con más luz */}
        <div
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=70')",
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
