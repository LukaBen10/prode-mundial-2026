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
      <body className="bg-zinc-950 text-white min-h-screen font-sans antialiased">
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
