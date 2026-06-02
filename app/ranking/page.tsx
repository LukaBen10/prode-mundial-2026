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
        <p className="text-violet-300 text-sm">Se actualiza después de cada partido</p>
      </div>

      {!miId || loading ? (
        <LoadingState />
      ) : ranking.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="text-5xl">👀</div>
          <p className="text-violet-200 font-bold text-xl">Nadie se anotó todavía.</p>
          <p className="text-violet-300 text-sm">¡Sé el primero del barrio!</p>
          <Link href="/unirse" className="inline-block mt-2 bg-amber-400 hover:bg-amber-300 text-violet-950 px-7 py-3 rounded-full font-bold transition-all shadow-lg shadow-amber-400/20">
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
                      ? 'bg-blue-500/15 border border-blue-500/35'
                      : 'bg-violet-950/40 border border-violet-400/25'
                  }`}
                >
                  <div className="text-3xl">🥈</div>
                  <div className="font-bold text-sm truncate text-violet-100">{top3[1].nombre_usuario}</div>
                  {miId && String(top3[1].id) === miId && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full block">vos</span>
                  )}
                  <div className="text-3xl font-black text-violet-200">{top3[1].puntos}</div>
                  <div className="text-violet-400 text-xs">pts</div>
                </div>
              ) : <div className="flex-1" />}

              {/* 1° lugar */}
              <div
                className={`flex-1 text-center rounded-2xl p-6 space-y-2 relative ${
                  miId && String(top3[0].id) === miId
                    ? 'bg-blue-500/15 border border-blue-400/40'
                    : 'bg-violet-950/40 border border-amber-400/40'
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
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full inline-block">vos</span>
                )}
                <div
                  className="text-4xl font-black text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                >
                  {top3[0].puntos}
                </div>
                <div className="text-violet-300 text-xs">pts</div>
              </div>

              {/* 3° lugar */}
              {top3[2] ? (
                <div
                  className={`flex-1 text-center rounded-2xl p-5 space-y-2 mt-14 ${
                    miId && String(top3[2].id) === miId
                      ? 'bg-blue-500/15 border border-blue-500/35'
                      : 'bg-violet-950/40 border border-violet-400/25'
                  }`}
                >
                  <div className="text-3xl">🥉</div>
                  <div className="font-bold text-sm truncate text-violet-100">{top3[2].nombre_usuario}</div>
                  {miId && String(top3[2].id) === miId && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full block">vos</span>
                  )}
                  <div className="text-3xl font-black text-amber-400">{top3[2].puntos}</div>
                  <div className="text-violet-400 text-xs">pts</div>
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
              <div className="flex-1 h-px bg-violet-900/40" />
              <span className="text-violet-400 text-xs font-medium">RESTO DEL RANKING</span>
              <div className="flex-1 h-px bg-violet-900/40" />
            </div>
          )}

          {/* ── Resto de la tabla ── */}
          {resto.length > 0 && (
            <div className="bg-violet-950/40 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  {resto.map((entry) => {
                    const soyYo = miId && String(entry.id) === miId;
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-white/10 last:border-0 transition-colors ${
                          soyYo ? 'bg-blue-500/15' : 'hover:bg-violet-800/30'
                        }`}
                      >
                        <td className="px-5 py-3.5 text-violet-400 font-mono text-sm w-10">{entry.posicion}</td>
                        <td className="px-2 py-3.5 font-semibold text-sm text-violet-100">
                          {entry.nombre_usuario}
                          {soyYo && (
                            <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">vos</span>
                          )}
                          {entry.fuera_premios ? (
                            <span className="ml-2 text-xs bg-amber-500/15 text-amber-400/80 px-2 py-0.5 rounded-full" title="Juega pero no compite por premios">🏠 no compite</span>
                          ) : null}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold text-amber-400">{entry.puntos}</span>
                          <span className="text-violet-400 text-xs ml-1">pts</span>
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

      <p className="text-center text-violet-400 text-sm pb-4">
        ¿Todavía no te anotaste?{' '}
        <Link href="/unirse" className="text-amber-400 hover:text-amber-300 underline">
          Sumate acá
        </Link>
      </p>

    </div>
  );
}
