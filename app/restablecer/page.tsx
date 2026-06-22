'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RestablecerPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  // Leer el token de la URL en el cliente (evita useSearchParams y su Suspense boundary).
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres'); return; }
    if (password !== password2) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOk(true);
      setTimeout(() => router.push('/login'), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  }

  // Token ausente en la URL: link mal copiado o entró de más.
  if (token === '') {
    return (
      <div className="max-w-sm mx-auto space-y-6 pt-4 text-center">
        <div className="text-5xl">🔌</div>
        <h1 className="text-2xl font-black tracking-tight">Link incompleto</h1>
        <p className="text-violet-300 text-sm leading-relaxed">
          Este link no trae el código de recuperación. Abrí el link tal cual te llegó al mail, o pedí uno nuevo.
        </p>
        <Link href="/recuperar" className="inline-block text-amber-400 hover:text-amber-300 underline text-sm">
          Pedir un nuevo link
        </Link>
      </div>
    );
  }

  if (ok) {
    return (
      <div className="max-w-sm mx-auto space-y-6 pt-4 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-black tracking-tight">¡Listo!</h1>
        <p className="text-violet-300 text-sm leading-relaxed">
          Cambiamos tu contraseña. Te llevamos al login para que entres con la nueva...
        </p>
        <Link href="/login" className="inline-block text-amber-400 hover:text-amber-300 underline text-sm">
          Ir al login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 pt-4">
      <div className="text-center space-y-2">
        <div className="text-5xl">🔐</div>
        <h1 className="text-3xl font-black tracking-tight">Nueva contraseña</h1>
        <p className="text-violet-300 text-sm">Elegí una contraseña nueva para tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-violet-950/70 border border-white/15 rounded-2xl p-5 sm:p-8 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required autoFocus
            autoComplete="new-password"
            className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Repetí la contraseña</label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            placeholder="La misma de arriba"
            required
            autoComplete="new-password"
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
          disabled={loading || token === null}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-violet-950 py-3 rounded-xl font-bold text-lg transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña 🔐'}
        </button>
      </form>
    </div>
  );
}
