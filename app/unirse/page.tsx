'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UnirsePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/participantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, whatsapp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');

      localStorage.setItem('prode_id', String(data.id));
      localStorage.setItem('prode_codigo', data.codigo);
      localStorage.setItem('prode_nombre', data.nombre);

      router.push(`/predicciones?participanteId=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="text-5xl">🏆</div>
        <h1 className="text-3xl font-bold">Sumate al prode</h1>
        <p className="text-zinc-400">
          Completá tus datos y en un momento ya estás cargando predicciones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Tu nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Martín"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            WhatsApp
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 1123456789"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-zinc-500">Solo para avisarte si ganás algo 😄</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg transition-colors"
        >
          {loading ? 'Registrando...' : 'Entrar al prode ⚽'}
        </button>
      </form>

      <p className="text-center text-zinc-500 text-sm">
        Ya participás?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const id = localStorage.getItem('prode_id');
            if (id) router.push(`/predicciones?participanteId=${id}`);
            else alert('No encontré tu registro en este dispositivo. Registrate de nuevo.');
          }}
          className="text-green-400 hover:text-green-300 underline"
        >
          Ir a mis predicciones
        </a>
      </p>
    </div>
  );
}
