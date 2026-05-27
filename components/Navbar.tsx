'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [logueado, setLogueado] = useState(false);
  const [nombre, setNombre] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = localStorage.getItem('prode_id');
    const n = localStorage.getItem('prode_nombre');
    setLogueado(!!id);
    setNombre(n ?? '');
  }, [pathname]);

  function cerrarSesion() {
    localStorage.removeItem('prode_id');
    localStorage.removeItem('prode_codigo');
    localStorage.removeItem('prode_nombre');
    setLogueado(false);
    router.push('/');
  }

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors px-1 ${
      pathname === path
        ? 'text-white'
        : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="text-2xl">🍩</span>
          <span className="text-white">Prode</span>
          <span className="text-amber-400">Mundial 26</span>
        </Link>

        {/* Nav links — siempre visibles */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/predicciones" className={linkClass('/predicciones')}>
            ⚽ Predicciones
          </Link>
          <Link href="/ranking" className={linkClass('/ranking')}>
            🏆 Ranking
          </Link>

          {logueado ? (
            <>
              <Link href="/mi-prode" className={linkClass('/mi-prode')}>
                👤 @{nombre}
              </Link>
              <button
                onClick={cerrarSesion}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass('/login')}>
                Entrar
              </Link>
              <Link
                href="/unirse"
                className="bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-1.5 rounded-full font-semibold transition-colors ml-1"
              >
                Participar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
