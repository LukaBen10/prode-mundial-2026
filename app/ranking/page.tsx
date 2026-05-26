'use client';

import { useEffect, useState } from 'react';

interface RankingEntry {
  posicion: number;
  id: number;
  nombre: string;
  puntos: number;
}

const MEDALLAS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ranking')
      .then((r) => r.json())
      .then((data) => { setRanking(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="text-5xl">🏆</div>
        <h1 className="text-3xl font-bold">Tabla de posiciones</h1>
        <p className="text-zinc-400">Se actualiza después de cada partido</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500">Cargando...</div>
        ) : ranking.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-4xl">👀</div>
            <p className="text-zinc-400">Todavía no hay nadie acá.</p>
            <p className="text-zinc-500 text-sm">¡Sé el primero en anotarte!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                <th className="text-left px-6 py-4 font-medium w-12">#</th>
                <th className="text-left px-4 py-4 font-medium">Nombre</th>
                <th className="text-right px-6 py-4 font-medium">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-xl">
                    {MEDALLAS[entry.posicion] ?? (
                      <span className="text-zinc-500 text-base font-mono">{entry.posicion}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-medium">{entry.nombre}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-400 font-bold text-lg">{entry.puntos}</span>
                    <span className="text-zinc-500 text-sm ml-1">pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-center text-zinc-500 text-sm">
        El Mundial arranca el 11 de junio · ¿Todavía no te anotaste?{' '}
        <a href="/unirse" className="text-orange-400 hover:text-orange-300 underline">
          Sumate acá
        </a>
      </p>
    </div>
  );
}
