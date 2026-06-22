'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RecuperarPage() {
  const [ident, setIdent] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: ident }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="max-w-sm mx-auto space-y-6 pt-4 text-center">
        <div className="text-5xl">📬</div>
        <h1 className="text-2xl font-black tracking-tight">Revisá tu mail</h1>
        <p className="text-violet-300 text-sm leading-relaxed">
          Si esos datos corresponden a una cuenta, te mandamos un mail con el link para crear una nueva contraseña.
          Fijate también en <strong className="text-violet-200">spam</strong> por las dudas. El link vale 1 hora.
        </p>
        <Link href="/login" className="inline-block text-amber-400 hover:text-amber-300 underline text-sm">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 pt-4">
      <div className="text-center space-y-2">
        <div className="text-5xl">🔑</div>
        <h1 className="text-3xl font-black tracking-tight">¿Te olvidaste?</h1>
        <p className="text-violet-300 text-sm">Pasanos tu mail, usuario o DNI y te mandamos un link para recuperarla</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-violet-950/70 border border-white/15 rounded-2xl p-5 sm:p-8 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Mail, usuario o DNI</label>
          <input
            type="text"
            value={ident}
            onChange={e => setIdent(e.target.value)}
            placeholder="Tu mail, usuario o DNI"
            required autoFocus
            autoComplete="username"
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
          {loading ? 'Enviando...' : 'Mandame el link 📩'}
        </button>
      </form>

      <p className="text-center text-violet-300 text-sm">
        ¿Te acordaste?{' '}
        <Link href="/login" className="text-amber-400 hover:text-amber-300 underline">
          Volver al login
        </Link>
      </p>
    </div>
  );
}
