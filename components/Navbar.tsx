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
    localStorage.removeItem('prode_admin');
    setLogueado(false);
    router.push('/');
  }

  const linkClass = (path: string) =>
    `text-sm font-semibold transition-colors px-1 pb-0.5 ${
      pathname === path
        ? 'text-white border-b-2 border-orange-500'
        : 'text-zinc-400 hover:text-white border-b-2 border-transparent'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/50">
      {/* Línea de acento degradado */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(251,146,60,0.5) 30%, rgba(251,191,36,0.6) 50%, rgba(251,146,60,0.5) 70%, transparent 100%)' }}
      />

      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-xl">🍩</span>
          <div className="leading-none">
            <span className="font-black text-base text-white tracking-tight">Prode </span>
            <span className="font-black text-base text-amber-400 tracking-tight">Mundial 26</span>
          </div>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-1 sm:gap-4">
          <Link href="/predicciones" className={linkClass('/predicciones')}>
            ⚽ Predicciones
          </Link>
          <Link href="/resultados" className={linkClass('/resultados')}>
            📊 Resultados
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
                className="bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-1.5 rounded-full font-bold transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 ml-1"
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
