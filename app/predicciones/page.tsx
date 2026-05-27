'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BANDERAS } from '@/lib/data/banderas';
import FlagIcon from '@/components/FlagIcon';

interface Partido {
  id: number;
  fase: string;
  grupo: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha: string;
  hora: string;
  estadio: string;
  ciudad: string;
  jugado: number;
  goles_local: number | null;
  goles_visitante: number | null;
}

interface Prediccion {
  partido_id: number;
  goles_local: number;
  goles_visitante: number;
}

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function kickoffDate(partido: Partido): Date {
  return new Date(`${partido.fecha}T${partido.hora || '19:00'}:00-03:00`);
}

function estaLocked(partido: Partido): boolean {
  if (partido.jugado) return true;
  return new Date() >= kickoffDate(partido);
}

function calcularPuntos(gL: number, gV: number, pL: number, pV: number): 0 | 1 | 3 {
  if (gL === pL && gV === pV) return 3;
  const ganR = gL > gV ? 'L' : gL < gV ? 'V' : 'E';
  const ganP = pL > pV ? 'L' : pL < pV ? 'V' : 'E';
  return ganR === ganP ? 1 : 0;
}

function DeadlineBadge({ partido }: { partido: Partido }) {
  const [texto, setTexto] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    function calcular() {
      const kickoff = kickoffDate(partido);
      const diffMs = kickoff.getTime() - Date.now();
      if (diffMs <= 0) { setTexto('🔒 Cerrado'); setColor('text-zinc-500'); return; }
      const diffH = diffMs / 3600000;
      if (diffH < 1) {
        setTexto(`⏰ Cierra en ${Math.floor(diffMs / 60000)}m`);
        setColor('text-red-400');
      } else if (diffH < 24) {
        setTexto(`⏰ Cierra en ${Math.floor(diffH)}h`);
        setColor('text-orange-400');
      } else {
        const dia = kickoff.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' });
        setTexto(`Cierra el ${dia} · ${partido.hora}hs AR`);
        setColor('text-zinc-500');
      }
    }
    calcular();
    const t = setInterval(calcular, 30000);
    return () => clearInterval(t);
  }, [partido]);

  if (!texto) return null;
  return <span className={`text-xs font-medium ${color}`}>{texto}</span>;
}

function GoalInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <input type="number" min={0} max={20} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className="w-12 h-10 text-center bg-zinc-800 border border-zinc-700 rounded-lg text-white font-bold focus:outline-none focus:border-green-500 disabled:opacity-40 transition-colors" />
  );
}

interface RankingEntry { posicion: number; id: number; nombre_usuario: string; puntos: number; }

function PtsBadge({ pts }: { pts: 0 | 1 | 3 }) {
  if (pts === 3) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✓ 3 pts</span>;
  if (pts === 1) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">~ 1 pt</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">✗ 0 pts</span>;
}

function Flag({ equipo }: { equipo: string }) {
  const code = BANDERAS[equipo];
  if (!code) return null;
  return <FlagIcon code={code} alt={equipo} className="inline mr-1" />;
}

function PrediccionesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramId = searchParams.get('participanteId');
  const participanteId = paramId ?? (typeof window !== 'undefined' ? localStorage.getItem('prode_id') : null);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, { local: string; visitante: string }>>({});
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [vista, setVista] = useState<'predicciones' | 'resultados'>('predicciones');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [miRanking, setMiRanking] = useState<{ posicion: number; puntos: number; puntosLider: number; puntosNext: number | null } | null>(null);

  function actualizarRanking(ranking: RankingEntry[]) {
    const yo = ranking.find((r) => String(r.id) === participanteId);
    if (yo) {
      const anterior = yo.posicion > 1 ? ranking.find(r => r.posicion === yo.posicion - 1) : null;
      setMiRanking({ posicion: yo.posicion, puntos: yo.puntos, puntosLider: ranking[0]?.puntos ?? 0, puntosNext: anterior ? anterior.puntos - yo.puntos : null });
    } else if (ranking.length > 0) {
      setMiRanking({ posicion: ranking.length + 1, puntos: 0, puntosLider: ranking[0]?.puntos ?? 0, puntosNext: null });
    }
  }

  useEffect(() => {
    if (!participanteId) { router.push('/login'); return; }
    const n = localStorage.getItem('prode_nombre');
    if (n) setNombre(n);

    Promise.all([
      fetch('/api/partidos').then((r) => r.json()),
      fetch(`/api/predicciones?participanteId=${participanteId}`).then((r) => r.json()),
      fetch('/api/ranking').then((r) => r.json()),
    ]).then(([partidos, preds, ranking]) => {
      setPartidos(partidos);
      const map: Record<number, { local: string; visitante: string }> = {};
      for (const p of preds) map[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      setPredicciones(map);
      actualizarRanking(ranking as RankingEntry[]);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participanteId, router]);

  // Polling de resultados cada 60s — actualiza partidos y ranking sin tocar las predicciones del usuario
  useEffect(() => {
    if (!participanteId) return;
    const interval = setInterval(() => {
      Promise.all([
        fetch('/api/partidos').then(r => r.json()),
        fetch('/api/ranking').then(r => r.json()),
      ]).then(([partidos, ranking]) => {
        setPartidos(partidos);
        actualizarRanking(ranking as RankingEntry[]);
      });
    }, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participanteId]);

  const partidosGrupo = partidos.filter((p) => p.grupo === grupoActivo);
  const jugados = partidos.filter(p => p.jugado);

  function updatePred(partidoId: number, side: 'local' | 'visitante', value: string) {
    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: { local: prev[partidoId]?.local ?? '0', visitante: prev[partidoId]?.visitante ?? '0', [side]: value },
    }));
    setGuardado(false);
  }

  async function guardar() {
    setSaving(true);
    const payload = Object.entries(predicciones).map(([pid, pred]) => ({
      partido_id: parseInt(pid),
      goles_local: parseInt(pred.local) || 0,
      goles_visitante: parseInt(pred.visitante) || 0,
    }));
    await fetch('/api/predicciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participanteId: parseInt(participanteId!), predicciones: payload }),
    });
    setSaving(false);
    setGuardado(true);
  }

  const predCount = Object.keys(predicciones).length;
  const totalPartidos = partidos.length;

  if (loading) return <div className="text-center py-20 text-zinc-400">Cargando partidos...</div>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Tus predicciones{nombre ? `, ${nombre}` : ''} ⚽</h1>
        <p className="text-zinc-400 text-sm">{predCount} de {totalPartidos} partidos completados</p>
      </div>

      {/* Vista tabs */}
      <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        <button onClick={() => setVista('predicciones')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${vista === 'predicciones' ? 'bg-green-500 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>
          ⚽ Predicciones
        </button>
        <button onClick={() => setVista('resultados')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${vista === 'resultados' ? 'bg-orange-500 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>
          📊 Resultados
          {jugados.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${vista === 'resultados' ? 'bg-white/20' : 'bg-zinc-700'}`}>{jugados.length}</span>}
        </button>
      </div>

      {/* Card de posición */}
      {miRanking && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center space-y-1">
            <div className="text-3xl font-bold text-white">
              {miRanking.posicion === 1 ? '🥇' : miRanking.posicion === 2 ? '🥈' : miRanking.posicion === 3 ? '🥉' : `#${miRanking.posicion}`}
            </div>
            <div className="text-zinc-400 text-xs">Tu posición</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center space-y-1">
            <div className="text-3xl font-bold text-green-400">{miRanking.puntos}</div>
            <div className="text-zinc-400 text-xs">Tus puntos</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center space-y-1">
            {miRanking.puntosNext !== null && miRanking.puntosNext > 0 ? (
              <><div className="text-3xl font-bold text-orange-400">+{miRanking.puntosNext}</div><div className="text-zinc-400 text-xs">Para subir un puesto</div></>
            ) : miRanking.posicion === 1 ? (
              <><div className="text-3xl">🏆</div><div className="text-zinc-400 text-xs">¡Vas primero!</div></>
            ) : (
              <><div className="text-3xl font-bold text-zinc-500">{miRanking.puntosLider}</div><div className="text-zinc-400 text-xs">Puntos del líder</div></>
            )}
          </div>
        </div>
      )}

      {/* ══ VISTA: PREDICCIONES ══ */}
      {vista === 'predicciones' && (
        <>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-orange-400 text-lg shrink-0">⏰</span>
            <p className="text-sm text-orange-200">
              <strong>¡Atención!</strong> Cada predicción se cierra automáticamente en el momento en que arranca el partido.
              Una vez que el partido empezó, ya no podés editarla. Los horarios son <strong>hora Argentina (ART)</strong>.
            </p>
          </div>

          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${(predCount / totalPartidos) * 100}%` }} />
          </div>

          <div className="flex flex-wrap gap-2">
            {GRUPOS.map((g) => {
              const pG = partidos.filter((p) => p.grupo === g);
              const completo = pG.filter((p) => predicciones[p.id]).length === pG.length && pG.length > 0;
              return (
                <button key={g} onClick={() => setGrupoActivo(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${grupoActivo === g ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
                  Grupo {g}{completo && ' ✓'}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-lg text-zinc-300">Grupo {grupoActivo}</h2>
            {partidosGrupo.map((partido) => {
              const pred = predicciones[partido.id];
              const locked = estaLocked(partido);
              return (
                <div key={partido.id} className={`bg-zinc-900 border rounded-xl p-4 space-y-3 ${locked ? 'border-zinc-800 opacity-70' : 'border-zinc-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-right">
                      <span className="font-semibold text-sm">
                        <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <GoalInput value={pred?.local ?? ''} onChange={(v) => updatePred(partido.id, 'local', v)} disabled={locked} />
                      <span className="text-zinc-500 font-bold">-</span>
                      <GoalInput value={pred?.visitante ?? ''} onChange={(v) => updatePred(partido.id, 'visitante', v)} disabled={locked} />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">
                        <Flag equipo={partido.equipo_visitante} />{partido.equipo_visitante}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 border-t border-zinc-800 pt-2">
                    <span>📅 {formatFecha(partido.fecha)}</span>
                    <span>🕐 {partido.hora}hs AR</span>
                    {partido.estadio && <span>🏟️ {partido.estadio}, {partido.ciudad}</span>}
                    <span className="ml-auto"><DeadlineBadge partido={partido} /></span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 pb-6">
            <button onClick={guardar} disabled={saving || guardado}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-500/20">
              {saving ? 'Guardando...' : guardado ? '✓ Predicciones guardadas' : 'Guardar predicciones'}
            </button>
          </div>
        </>
      )}

      {/* ══ VISTA: RESULTADOS ══ */}
      {vista === 'resultados' && (
        <>
          {jugados.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-5xl">⏳</div>
              <p className="text-zinc-300 font-bold text-lg">Todavía no se jugó ningún partido.</p>
              <p className="text-zinc-500 text-sm">Los resultados van a aparecer acá cuando empiecen.</p>
              <p className="text-zinc-600 text-xs">Se actualiza automáticamente cada 60 segundos.</p>
            </div>
          ) : (
            <>
              <p className="text-zinc-500 text-xs">Se actualiza automáticamente · {jugados.length} {jugados.length === 1 ? 'partido jugado' : 'partidos jugados'}</p>

              {/* Tabs de grupos — solo los que tienen jugados */}
              <div className="flex flex-wrap gap-2">
                {GRUPOS.filter(g => partidos.some(p => p.grupo === g && p.jugado)).map((g) => (
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
                      <div key={partido.id} className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl px-4 py-3 flex items-center justify-between text-sm opacity-50">
                        <span className="text-zinc-400">
                          <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                          <span className="text-zinc-600 mx-2">vs</span>
                          <Flag equipo={partido.equipo_visitante} />{partido.equipo_visitante}
                        </span>
                        <span className="text-zinc-600 text-xs">⏳ Pendiente · {formatFecha(partido.fecha)}</span>
                      </div>
                    );
                  }

                  const pred = predicciones[partido.id];
                  const gL = partido.goles_local ?? 0;
                  const gV = partido.goles_visitante ?? 0;
                  const pts = pred ? calcularPuntos(gL, gV, parseInt(pred.local) || 0, parseInt(pred.visitante) || 0) : null;

                  return (
                    <div key={partido.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                      {/* Resultado real */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 text-right font-semibold text-sm">
                          <Flag equipo={partido.equipo_local} />{partido.equipo_local}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-lg font-black text-white text-lg">{gL}</div>
                          <span className="text-zinc-500 font-bold">-</span>
                          <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-lg font-black text-white text-lg">{gV}</div>
                        </div>
                        <div className="flex-1 font-semibold text-sm">
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
                        {pts !== null ? <PtsBadge pts={pts} /> : <span className="text-zinc-600 text-xs">–</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}

export default function PrediccionesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-400">Cargando...</div>}>
      <PrediccionesContent />
    </Suspense>
  );
}
