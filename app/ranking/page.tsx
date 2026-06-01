'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingState from '@/components/LoadingState';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import type { RankingEntry } from '@/lib/types';

export default function RankingPage() {
  const miId = useAuthRedirect();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!miId) return;
    fetch('/api/ranking')
      .then((r) => r.json())
      .then((data) => { setRanking(data); setLoading(false); });
  }, [miId]);

  // El podio de PREMIOS solo cuenta a quienes compiten (excluye staff/organizadores)
  const competidores = ranking.filter((r) => !r.fuera_premios);
  const top3 = competidores.slice(0, 3);
  const top3Ids = new Set(top3.map((e) => e.id));
  const resto = ranking.filter((e) => !top3Ids.has(e.id));
  const hayExcluidos = ranking.some((r) => r.fuera_premios);

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-4xl font-black tracking-tight">Tabla de posiciones</h1>
        <p className="text-zinc-500 text-sm">Se actualiza después de cada partido</p>
      </div>

      {!miId || loading ? (
        <LoadingState />
      ) : ranking.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="text-5xl">👀</div>
          <p className="text-zinc-300 font-bold text-xl">Nadie se anotó todavía.</p>
          <p className="text-zinc-500 text-sm">¡Sé el primero del barrio!</p>
          <Link href="/unirse" className="inline-block mt-2 bg-orange-500 hover:bg-orange-400 text-white px-7 py-3 rounded-full font-bold transition-all shadow-lg shadow-orange-500/20">
            Sumarme al prode
          </Link>
        </div>
      ) : (
        <>
          {/* ── Podio top 3 ── */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 px-2">

              {/* 2° lugar */}
              {top3[1] ? (
                <div
                  className={`flex-1 text-center rounded-2xl p-5 space-y-2 mt-8 ${
                    miId && String(top3[1].id) === miId
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-zinc-900/80 border border-zinc-700'
                  }`}
                >
                  <div className="text-3xl">🥈</div>
                  <div className="font-bold text-sm truncate text-zinc-200">{top3[1].nombre_usuario}</div>
                  {miId && String(top3[1].id) === miId && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full block">vos</span>
                  )}
                  <div className="text-3xl font-black text-zinc-300">{top3[1].puntos}</div>
                  <div className="text-zinc-600 text-xs">pts</div>
                </div>
              ) : <div className="flex-1" />}

              {/* 1° lugar */}
              <div
                className={`flex-1 text-center rounded-2xl p-6 space-y-2 relative ${
                  miId && String(top3[0].id) === miId
                    ? 'bg-green-500/10 border border-green-400/40'
                    : 'bg-zinc-900/80 border border-amber-400/40'
                }`}
                style={{
                  boxShadow: miId && String(top3[0].id) === miId
                    ? '0 0 30px rgba(34,197,94,0.12), 0 0 60px rgba(34,197,94,0.06)'
                    : '0 0 30px rgba(251,191,36,0.15), 0 0 60px rgba(251,191,36,0.07)',
                }}
              >
                {/* Estrella decorativa */}
                <div className="text-xs text-amber-400/60 tracking-widest font-bold">⭐ ⭐ ⭐</div>
                <div className="text-5xl">🥇</div>
                <div className="font-black text-base truncate text-white">{top3[0].nombre_usuario}</div>
                {miId && String(top3[0].id) === miId && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full inline-block">vos</span>
                )}
                <div
                  className="text-4xl font-black text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                >
                  {top3[0].puntos}
                </div>
                <div className="text-zinc-500 text-xs">pts</div>
              </div>

              {/* 3° lugar */}
              {top3[2] ? (
                <div
                  className={`flex-1 text-center rounded-2xl p-5 space-y-2 mt-14 ${
                    miId && String(top3[2].id) === miId
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-zinc-900/80 border border-zinc-700'
                  }`}
                >
                  <div className="text-3xl">🥉</div>
                  <div className="font-bold text-sm truncate text-zinc-200">{top3[2].nombre_usuario}</div>
                  {miId && String(top3[2].id) === miId && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full block">vos</span>
                  )}
                  <div className="text-3xl font-black text-orange-400">{top3[2].puntos}</div>
                  <div className="text-zinc-600 text-xs">pts</div>
                </div>
              ) : <div className="flex-1" />}

            </div>
          )}

          {/* Aclaración sobre el podio de premios */}
          {top3.length > 0 && (
            <p className="text-center text-amber-400/70 text-xs -mt-4">
              🏆 El podio define los <strong>ganadores de premios</strong>
            </p>
          )}

          {/* Línea divisora */}
          {resto.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-600 text-xs font-medium">RESTO DEL RANKING</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          )}

          {/* ── Resto de la tabla ── */}
          {resto.length > 0 && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  {resto.map((entry) => {
                    const soyYo = miId && String(entry.id) === miId;
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-zinc-800/50 last:border-0 transition-colors ${
                          soyYo ? 'bg-green-500/10' : 'hover:bg-zinc-800/30'
                        }`}
                      >
                        <td className="px-5 py-3.5 text-zinc-600 font-mono text-sm w-10">{entry.posicion}</td>
                        <td className="px-2 py-3.5 font-semibold text-sm text-zinc-200">
                          {entry.nombre_usuario}
                          {soyYo && (
                            <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">vos</span>
                          )}
                          {entry.fuera_premios ? (
                            <span className="ml-2 text-xs bg-amber-500/15 text-amber-400/80 px-2 py-0.5 rounded-full" title="Juega pero no compite por premios">🏠 no compite</span>
                          ) : null}
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

      <p className="text-center text-zinc-600 text-sm pb-4">
        ¿Todavía no te anotaste?{' '}
        <Link href="/unirse" className="text-orange-400 hover:text-orange-300 underline">
          Sumate acá
        </Link>
      </p>

    </div>
  );
}
