'use client';

import { useEffect, useState } from 'react';
import { BANDERAS } from '@/lib/data/banderas';
import FlagIcon from '@/components/FlagIcon';
import LoadingState from '@/components/LoadingState';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { calcularPuntos } from '@/lib/scoring';
import { FASES_ELIM } from '@/lib/data/partidos';
import type { Partido } from '@/lib/types';

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function PtsBadge({ pts }: { pts: number }) {
  if (pts === 3) return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">✓ 3 pts</span>;
  if (pts === 1) return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/35">~ 1 pt</span>;
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
  const [vista, setVista] = useState('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participanteId) return;

    const authHeaders = { 'x-participante-id': String(participanteId), 'x-session-token': localStorage.getItem('prode_token') ?? '' };
    Promise.all([
      fetch('/api/partidos').then(r => r.json()),
      fetch('/api/predicciones', { headers: authHeaders }).then(r => r.json()),
    ]).then(([partidos, preds]) => {
      setPartidos(Array.isArray(partidos) ? partidos : []);
      const map: Record<number, { local: string; visitante: string }> = {};
      if (Array.isArray(preds)) for (const p of preds) map[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      setPredicciones(map);

      const primerConJugados = GRUPOS.find(g => (partidos as Partido[]).some(p => p.grupo === g && p.jugado));
      if (primerConJugados) setVista(primerConJugados);

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [participanteId]);

  const jugados = partidos.filter(p => p.jugado);
  const gruposConJugados = GRUPOS.filter(g => partidos.some(p => p.grupo === g && p.jugado));
  const fasesConJugados = FASES_ELIM.filter(f => partidos.some(p => p.fase === f.fase && p.jugado));
  const esGrupo = GRUPOS.includes(vista);
  const partidosVista = esGrupo ? partidos.filter(p => p.grupo === vista) : partidos.filter(p => p.fase === vista);
  const tituloVista = esGrupo ? `Grupo ${vista}` : FASES_ELIM.find(f => f.fase === vista)?.label ?? vista;

  if (!participanteId || loading) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="text-center space-y-1 pt-2">
        <div className="text-4xl mb-2">📊</div>
        <h1 className="text-3xl font-black tracking-tight">Resultados</h1>
        <p className="text-violet-300 text-sm">
          {jugados.length === 0 ? 'Todavía no se jugó ningún partido' : `${jugados.length} ${jugados.length === 1 ? 'partido jugado' : 'partidos jugados'}`}
        </p>
      </div>

      {jugados.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="text-5xl">⏳</div>
          <p className="text-violet-200 font-bold text-lg">Todavía no se jugó ningún partido.</p>
          <p className="text-violet-300 text-sm">Los resultados van a aparecer acá cuando arranquen.</p>
        </div>
      ) : (
        <>
          {/* Tabs de grupos y fases con jugados */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {gruposConJugados.map((g) => (
                <button key={g} onClick={() => setVista(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${vista === g ? 'bg-amber-400 text-violet-950' : 'bg-violet-950/65 text-violet-300 hover:text-white hover:bg-violet-800/60'}`}>
                  Grupo {g}
                </button>
              ))}
            </div>
            {fasesConJugados.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fasesConJugados.map((f) => (
                  <button key={f.fase} onClick={() => setVista(f.fase)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${vista === f.fase ? 'bg-amber-500 text-white' : 'bg-violet-950/65 text-amber-400/70 hover:text-amber-300 hover:bg-violet-800/60'}`}>
                    {f.corto}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-lg text-violet-200">{tituloVista}</h2>

            {partidosVista.map((partido) => {
              if (!partido.jugado) {
                const definido = !!partido.equipo_local && !!partido.equipo_visitante;
                return (
                  <div key={partido.id} className="bg-violet-950/70 border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between text-sm opacity-50">
                    <span className="text-violet-300">
                      {definido ? (
                        <>
                          <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                          <span className="text-violet-400 mx-2">vs</span>
                          <Flag equipo={partido.equipo_visitante} />{partido.equipo_visitante}
                        </>
                      ) : <span className="text-violet-400 italic">Por definir</span>}
                    </span>
                    <span className="text-violet-400 text-xs">⏳ {formatFecha(partido.fecha)}</span>
                  </div>
                );
              }

              const pred = predicciones[partido.id];
              const gL = partido.goles_local ?? 0;
              const gV = partido.goles_visitante ?? 0;
              const pts = pred ? calcularPuntos(parseInt(pred.local) || 0, parseInt(pred.visitante) || 0, gL, gV) : null;

              const borderColor = pts === 3 ? 'border-amber-400/40' : pts === 1 ? 'border-blue-500/35' : pts === 0 ? 'border-red-500/20' : 'border-white/15';
              return (
                <div key={partido.id} className={`bg-violet-950/70 border ${borderColor} rounded-xl p-4 space-y-3`}>
                  {/* Resultado real */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 text-right font-semibold text-sm truncate">
                      <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <div className="w-10 h-10 flex items-center justify-center bg-violet-950/65 rounded-lg font-black text-white text-lg">{gL}</div>
                      <span className="text-violet-300 font-bold">-</span>
                      <div className="w-10 h-10 flex items-center justify-center bg-violet-950/65 rounded-lg font-black text-white text-lg">{gV}</div>
                    </div>
                    <div className="flex-1 min-w-0 font-semibold text-sm truncate">
                      <Flag equipo={partido.equipo_visitante} />{partido.equipo_visitante}
                    </div>
                  </div>

                  {/* Tu predicción + puntos */}
                  <div className="flex items-center justify-between border-t border-white/15 pt-2 text-xs">
                    {pred ? (
                      <span className="text-violet-300">
                        Tu pred: <span className="text-violet-100 font-bold">{pred.local} - {pred.visitante}</span>
                      </span>
                    ) : (
                      <span className="text-violet-400 italic">Sin predicción</span>
                    )}
                    {pts !== null ? <PtsBadge pts={pts} /> : <span className="text-violet-400">–</span>}
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
