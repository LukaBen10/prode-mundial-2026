'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RankingEntry {
  posicion: number;
  id: number;
  nombre_usuario: string;
  puntos: number;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [miId, setMiId] = useState<string | null>(null);

  useEffect(() => {
    setMiId(localStorage.getItem('prode_id'));
    fetch('/api/ranking')
      .then((r) => r.json())
      .then((data) => { setRanking(data); setLoading(false); });
  }, []);

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight">Tabla de posiciones</h1>
        <p className="text-zinc-400 text-sm">Se actualiza después de cada partido</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Cargando...</div>
      ) : ranking.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="text-5xl">👀</div>
          <p className="text-zinc-300 font-semibold">Nadie se anotó todavía.</p>
          <p className="text-zinc-500 text-sm">¡Sé el primero!</p>
          <Link href="/unirse" className="inline-block mt-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-2.5 rounded-full font-bold transition-colors">
            Sumarme al prode
          </Link>
        </div>
      ) : (
        <>
          {/* ── Podio top 3 ── */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3">

              {/* 2° lugar */}
              {top3[1] ? (
                <div className={`flex-1 text-center rounded-2xl p-5 space-y-2 border ${miId && String(top3[1].id) === miId ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-900 border-zinc-700'} mb-0 mt-6`}>
                  <div className="text-4xl">🥈</div>
                  <div className="font-bold text-sm truncate">{top3[1].nombre_usuario}</div>
                  {miId && String(top3[1].id) === miId && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">vos</span>
                  )}
                  <div className="text-2xl font-black text-zinc-300">{top3[1].puntos}</div>
                  <div className="text-zinc-500 text-xs">pts</div>
                </div>
              ) : <div className="flex-1" />}

              {/* 1° lugar */}
              <div className={`flex-1 text-center rounded-2xl p-6 space-y-2 border shadow-lg ${miId && String(top3[0].id) === miId ? 'bg-green-500/10 border-green-400/40 shadow-green-500/10' : 'bg-zinc-900 border-amber-400/40 shadow-amber-400/10'}`}>
                <div className="text-5xl">🥇</div>
                <div className="font-bold truncate">{top3[0].nombre_usuario}</div>
                {miId && String(top3[0].id) === miId && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">vos</span>
                )}
                <div className="text-3xl font-black text-amber-400">{top3[0].puntos}</div>
                <div className="text-zinc-500 text-xs">pts</div>
              </div>

              {/* 3° lugar */}
              {top3[2] ? (
                <div className={`flex-1 text-center rounded-2xl p-5 space-y-2 border ${miId && String(top3[2].id) === miId ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-900 border-zinc-700'} mt-10`}>
                  <div className="text-4xl">🥉</div>
                  <div className="font-bold text-sm truncate">{top3[2].nombre_usuario}</div>
                  {miId && String(top3[2].id) === miId && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">vos</span>
                  )}
                  <div className="text-2xl font-black text-orange-400">{top3[2].puntos}</div>
                  <div className="text-zinc-500 text-xs">pts</div>
                </div>
              ) : <div className="flex-1" />}

            </div>
          )}

          {/* ── Resto de la tabla ── */}
          {resto.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Usuario</th>
                    <th className="text-right px-5 py-3 font-medium">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {resto.map((entry) => {
                    const soyYo = miId && String(entry.id) === miId;
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-zinc-800/50 last:border-0 transition-colors ${soyYo ? 'bg-green-500/10' : 'hover:bg-zinc-800/30'}`}
                      >
                        <td className="px-5 py-3.5 text-zinc-500 font-mono text-sm">{entry.posicion}</td>
                        <td className="px-4 py-3.5 font-medium text-sm">
                          {entry.nombre_usuario}
                          {soyYo && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">vos</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold text-green-400">{entry.puntos}</span>
                          <span className="text-zinc-600 text-xs ml-1">pts</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p className="text-center text-zinc-500 text-sm">
        ¿Todavía no te anotaste?{' '}
        <Link href="/unirse" className="text-orange-400 hover:text-orange-300 underline">
          Sumate acá
        </Link>
      </p>

    </div>
  );
}
