import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Prode Mundial 2026 | Donut Makers',
  description: '¿Sabés de fútbol? Demostralo. El prode del barrio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-white min-h-screen font-sans antialiased">
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-2xl">🍩</span>
              <span className="text-white">Prode</span>
              <span className="text-green-400">Mundial 26</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/ranking" className="text-zinc-400 hover:text-white transition-colors">
                Ranking
              </Link>
              <Link
                href="/unirse"
                className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-full font-semibold transition-colors"
              >
                Participar
              </Link>
            </div>
          </div>
        </nav>
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
