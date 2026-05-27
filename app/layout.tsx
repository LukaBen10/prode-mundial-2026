import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Prode Mundial 2026 | Donut Makers',
  description: '¿Sabés de fútbol? Demostralo. El prode del barrio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="text-white min-h-screen font-sans antialiased">

        {/* Fondo: imagen de estadio/copa difuminada */}
        <div
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=70')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'blur(18px) brightness(0.22) saturate(0.7)',
            transform: 'scale(1.08)',
          }}
        />
        {/* Overlay oscuro encima de la imagen */}
        <div className="fixed inset-0 -z-10 bg-zinc-950/80" />

        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-800 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-zinc-500 text-sm">
            Donut Makers Bakery · Av. La Plata 702, CABA
          </div>
        </footer>
      </body>
    </html>
  );
}
