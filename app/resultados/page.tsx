'use client';

import { useEffect, useState } from 'react';
import { BANDERAS } from '@/lib/data/banderas';
import FlagIcon from '@/components/FlagIcon';
import LoadingState from '@/components/LoadingState';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { calcularPuntos } from '@/lib/scoring';
import type { Partido } from '@/lib/types';

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function PtsBadge({ pts }: { pts: number }) {
  if (pts === 3) return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✓ 3 pts</span>;
  if (pts === 1) return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">~ 1 pt</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">✗ 0 pts</span>;
}

function Flag({ equipo }: { equipo: string }) {
  const code = BANDERAS[equipo];
  if (!code) return null;
  return <FlagIcon code={code} alt={equipo} className="inline mr-1.5" />;
}

export default function ResultadosPage() {
  const participanteId = useAuthRedirect();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, { local: string; visitante: string }>>({});
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participanteId) return;

    Promise.all([
      fetch('/api/partidos').then(r => r.json()),
      fetch(`/api/predicciones?participanteId=${participanteId}`).then(r => r.json()),
    ]).then(([partidos, preds]) => {
      setPartidos(partidos);
      const map: Record<number, { local: string; visitante: string }> = {};
      for (const p of preds) map[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      setPredicciones(map);

      const primerConJugados = GRUPOS.find(g => (partidos as Partido[]).some(p => p.grupo === g && p.jugado));
      if (primerConJugados) setGrupoActivo(primerConJugados);

      setLoading(false);
    });
  }, [participanteId]);

  const jugados = partidos.filter(p => p.jugado);
  const gruposConJugados = GRUPOS.filter(g => partidos.some(p => p.grupo === g && p.jugado));

  if (!participanteId || loading) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="text-center space-y-1 pt-2">
        <div className="text-4xl mb-2">📊</div>
        <h1 className="text-3xl font-black tracking-tight">Resultados</h1>
        <p className="text-zinc-500 text-sm">
          {jugados.length === 0 ? 'Todavía no se jugó ningún partido' : `${jugados.length} ${jugados.length === 1 ? 'partido jugado' : 'partidos jugados'}`}
        </p>
      </div>

      {jugados.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="text-5xl">⏳</div>
          <p className="text-zinc-300 font-bold text-lg">Todavía no se jugó ningún partido.</p>
          <p className="text-zinc-500 text-sm">Los resultados van a aparecer acá cuando arranquen.</p>
        </div>
      ) : (
        <>
          {/* Tabs de grupos con jugados */}
          <div className="flex flex-wrap gap-2">
            {gruposConJugados.map((g) => (
              <button key={g} onClick={() => setGrupoActivo(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${grupoActivo === g ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
                Grupo {g}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-lg text-zinc-300">Grupo {grupoActivo}</h2>

            {partidos.filter(p => p.grupo === grupoActivo).map((partido) => {
              if (!partido.jugado) {
                return (
                  <div key={partido.id} className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl px-4 py-3 flex items-center justify-between text-sm opacity-50">
                    <span className="text-zinc-400">
                      <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                      <span className="text-zinc-600 mx-2">vs</span>
                      <Flag equipo={partido.equipo_visitante} />{partido.equipo_visitante}
                    </span>
                    <span className="text-zinc-600 text-xs">⏳ {formatFecha(partido.fecha)}</span>
                  </div>
                );
              }

              const pred = predicciones[partido.id];
              const gL = partido.goles_local ?? 0;
              const gV = partido.goles_visitante ?? 0;
              const pts = pred ? calcularPuntos(parseInt(pred.local) || 0, parseInt(pred.visitante) || 0, gL, gV) : null;

              const borderColor = pts === 3 ? 'border-green-500/40' : pts === 1 ? 'border-orange-500/30' : pts === 0 ? 'border-red-500/20' : 'border-zinc-800';
              return (
                <div key={partido.id} className={`bg-zinc-900 border ${borderColor} rounded-xl p-4 space-y-3`}>
                  {/* Resultado real */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 text-right font-semibold text-sm truncate">
                      <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-lg font-black text-white text-lg">{gL}</div>
                      <span className="text-zinc-500 font-bold">-</span>
                      <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-lg font-black text-white text-lg">{gV}</div>
                    </div>
                    <div className="flex-1 min-w-0 font-semibold text-sm truncate">
                      <Flag equipo={partido.equipo_visitante} />{partido.equipo_visitante}
                    </div>
                  </div>

                  {/* Tu predicción + puntos */}
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-xs">
                    {pred ? (
                      <span className="text-zinc-400">
                        Tu pred: <span className="text-zinc-200 font-bold">{pred.local} - {pred.visitante}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">Sin predicción</span>
                    )}
                    {pts !== null ? <PtsBadge pts={pts} /> : <span className="text-zinc-600">–</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
