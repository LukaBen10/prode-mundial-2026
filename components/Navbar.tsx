'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [logueado, setLogueado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = localStorage.getItem('prode_id');
    const n = localStorage.getItem('prode_nombre');
    const adminLevel = parseInt(localStorage.getItem('prode_admin') ?? '0');
    setLogueado(!!id);
    setNombre(n ?? '');
    setEsAdmin(adminLevel >= 1);
    setMenuOpen(false);
  }, [pathname]);

  function cerrarSesion() {
    localStorage.removeItem('prode_id');
    localStorage.removeItem('prode_codigo');
    localStorage.removeItem('prode_nombre');
    localStorage.removeItem('prode_admin');
    setLogueado(false);
    setMenuOpen(false);
    router.push('/');
  }

  const linkClass = (path: string) =>
    `text-sm font-semibold transition-colors px-1 pb-0.5 ${
      pathname === path
        ? 'text-white border-b-2 border-amber-400'
        : 'text-violet-200 hover:text-white border-b-2 border-transparent'
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center w-full text-left py-3.5 px-4 text-base font-semibold transition-colors rounded-xl ${
      pathname === path
        ? 'text-white bg-violet-800/50'
        : 'text-violet-200 hover:text-white hover:bg-violet-800/40 active:bg-violet-800/60'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-violet-950/80 backdrop-blur-md border-b border-white/10">
      {/* Línea de acento degradado */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.5) 30%, rgba(251,191,36,0.7) 50%, rgba(212,175,55,0.5) 70%, transparent 100%)' }}
      />

      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group" onClick={() => setMenuOpen(false)}>
          <span className="text-xl">🍩</span>
          <div className="leading-none">
            <span className="font-black text-base text-white tracking-tight">Prode </span>
            <span className="font-black text-base text-amber-400 tracking-tight">Mundial 26</span>
          </div>
        </Link>

        {/* ── Desktop nav ─────────────────────────────── */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/predicciones" className={linkClass('/predicciones')}>⚽ Predicciones</Link>
          <Link href="/resultados" className={linkClass('/resultados')}>📊 Resultados</Link>
          <Link href="/ranking" className={linkClass('/ranking')}>🏆 Ranking</Link>
          <Link href="/bases" className={linkClass('/bases')}>📋 Bases</Link>
          {logueado ? (
            <>
              {esAdmin && <Link href="/admin" className={linkClass('/admin')}>⚙️ Admin</Link>}
              <Link href="/mi-prode" className={linkClass('/mi-prode')}>👤 @{nombre}</Link>
              <button onClick={cerrarSesion} className="text-xs text-violet-300 hover:text-white transition-colors ml-1">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass('/login')}>Entrar</Link>
              <Link
                href="/unirse"
                className="bg-amber-400 hover:bg-amber-300 text-violet-950 text-sm px-4 py-1.5 rounded-full font-bold transition-all shadow-md shadow-amber-400/30 hover:shadow-amber-400/50 ml-1"
              >
                Participar
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile: CTA + hamburger ──────────────────── */}
        <div className="flex md:hidden items-center gap-2">
          {!logueado && (
            <Link
              href="/unirse"
              onClick={() => setMenuOpen(false)}
              className="bg-amber-400 text-violet-950 text-xs px-3.5 py-2 rounded-full font-bold active:bg-amber-500"
            >
              Participar
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(m => !m)}
            className="p-2 text-violet-200 hover:text-white active:text-white transition-colors"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-violet-950/95 backdrop-blur-md px-3 py-2 space-y-0.5">
          <Link href="/predicciones" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/predicciones')}>
            ⚽ Predicciones
          </Link>
          <Link href="/resultados" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/resultados')}>
            📊 Resultados
          </Link>
          <Link href="/ranking" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/ranking')}>
            🏆 Ranking
          </Link>
          <Link href="/bases" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/bases')}>
            📋 Bases y Condiciones
          </Link>

          <div className="h-px bg-white/10 mx-4 my-1" />

          {logueado ? (
            <>
              <Link href="/mi-prode" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/mi-prode')}>
                👤 Mi prode <span className="text-violet-300 font-normal ml-1">@{nombre}</span>
              </Link>
              {esAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/admin')}>
                  ⚙️ Admin
                </Link>
              )}
              <button
                onClick={cerrarSesion}
                className="flex items-center w-full text-left py-3.5 px-4 text-base font-semibold text-red-400 hover:text-red-300 active:text-red-300 transition-colors rounded-xl hover:bg-violet-800/40"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className={mobileLinkClass('/login')}>
              Entrar al prode
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
