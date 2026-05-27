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
  }, [pathname]); // re-check en cada cambio de ruta

  function cerrarSesion() {
    localStorage.removeItem('prode_id');
    localStorage.removeItem('prode_codigo');
    localStorage.removeItem('prode_nombre');
    setLogueado(false);
    router.push('/');
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🍩</span>
          <span className="text-white">Prode</span>
          <span className="text-green-400">Mundial 26</span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/ranking" className="text-zinc-400 hover:text-white transition-colors">
            Ranking
          </Link>

          {logueado ? (
            <>
              <Link
                href="/mi-prode"
                className="text-zinc-300 hover:text-white transition-colors font-medium"
              >
                @{nombre}
              </Link>
              <button
                onClick={cerrarSesion}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-300 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link
                href="/unirse"
                className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-full font-semibold transition-colors"
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
