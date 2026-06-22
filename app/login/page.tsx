'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: nombreUsuario, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('prode_id', String(data.id));
      localStorage.setItem('prode_codigo', data.codigo);
      localStorage.setItem('prode_nombre', data.nombre_usuario);
      localStorage.setItem('prode_token', data.token ?? '');
      if (data.is_admin >= 1) {
        localStorage.setItem('prode_admin', String(data.is_admin));
      } else {
        localStorage.removeItem('prode_admin');
      }

      router.push('/mi-prode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 pt-4">

      <div className="text-center space-y-2">
        <div className="text-5xl">🍩⚽</div>
        <h1 className="text-3xl font-black tracking-tight">Dale, entrá</h1>
        <p className="text-violet-300 text-sm">Ingresá con tu usuario, mail o DNI y tu contraseña</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-violet-950/70 border border-white/15 rounded-2xl p-5 sm:p-8 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Usuario, mail o DNI</label>
          <input
            type="text"
            value={nombreUsuario}
            onChange={e => setNombreUsuario(e.target.value)}
            placeholder="Tu usuario, mail o DNI"
            required autoFocus
            autoComplete="username"
            className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
            className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-violet-950 py-3 rounded-xl font-bold text-lg transition-colors"
        >
          {loading ? 'Entrando...' : 'Entrar al prode ⚽'}
        </button>
      </form>

      <p className="text-center">
        <Link href="/recuperar" className="text-violet-300 hover:text-amber-300 text-sm underline underline-offset-2">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <p className="text-center text-violet-300 text-sm">
        ¿Todavía no te anotaste?{' '}
        <Link href="/unirse" className="text-amber-400 hover:text-amber-300 underline">
          Registrate acá
        </Link>
      </p>

    </div>
  );
}
