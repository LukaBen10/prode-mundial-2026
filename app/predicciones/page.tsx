'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BANDERAS } from '@/lib/data/banderas';
import FlagIcon from '@/components/FlagIcon';
import LoadingState from '@/components/LoadingState';
import { FASES_ELIM } from '@/lib/data/partidos';
import type { Partido, RankingEntry } from '@/lib/types';

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function tieneEquipos(p: Partido): boolean {
  return !!p.equipo_local && !!p.equipo_visitante;
}

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

function DeadlineBadge({ partido }: { partido: Partido }) {
  const [texto, setTexto] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    function calcular() {
      const kickoff = kickoffDate(partido);
      const diffMs = kickoff.getTime() - Date.now();
      if (diffMs <= 0) { setTexto('🔒 Cerrado'); setColor('text-violet-300'); return; }
      const diffH = diffMs / 3600000;
      if (diffH < 1) {
        setTexto(`⏰ Cierra en ${Math.floor(diffMs / 60000)}m`);
        setColor('text-red-400');
      } else if (diffH < 24) {
        setTexto(`⏰ Cierra en ${Math.floor(diffH)}h`);
        setColor('text-amber-400');
      } else {
        const dia = kickoff.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' });
        setTexto(`Cierra el ${dia} · ${partido.hora}hs AR`);
        setColor('text-violet-300');
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
      className="w-12 h-10 text-center bg-violet-950/65 border border-violet-400/40 rounded-lg text-white font-bold focus:outline-none focus:border-amber-400 disabled:opacity-40 transition-colors" />
  );
}

function PrediccionesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramId = searchParams.get('participanteId');
  const participanteId = paramId ?? (typeof window !== 'undefined' ? localStorage.getItem('prode_id') : null);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, { local: string; visitante: string }>>({});
  const [vista, setVista] = useState('A'); // grupo (A-L) o fase eliminatoria
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [miRanking, setMiRanking] = useState<{ posicion: number; puntos: number; puntosLider: number; puntosNext: number | null } | null>(null);

  useEffect(() => {
    if (!participanteId) { router.push('/login'); return; }
    if (!localStorage.getItem('prode_token')) { router.push('/login'); return; } // sin sesión válida → re-login
    const n = localStorage.getItem('prode_nombre');
    if (n) setNombre(n);

    const authHeaders = { 'x-participante-id': String(participanteId), 'x-session-token': localStorage.getItem('prode_token') ?? '' };
    Promise.all([
      fetch('/api/partidos').then((r) => r.json()),
      fetch('/api/predicciones', { headers: authHeaders }).then((r) => r.json()),
      fetch('/api/ranking').then((r) => r.json()),
    ]).then(([partidos, preds, ranking]) => {
      setPartidos(Array.isArray(partidos) ? partidos : []);
      const map: Record<number, { local: string; visitante: string }> = {};
      if (Array.isArray(preds)) for (const p of preds) map[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      setPredicciones(map);

      const lista = (Array.isArray(ranking) ? ranking : []) as RankingEntry[];
      const yo = lista.find((r) => String(r.id) === participanteId);
      if (yo) {
        const anterior = yo.posicion > 1 ? lista.find(r => r.posicion === yo.posicion - 1) : null;
        setMiRanking({ posicion: yo.posicion, puntos: yo.puntos, puntosLider: lista[0]?.puntos ?? 0, puntosNext: anterior ? anterior.puntos - yo.puntos : null });
      } else if (lista.length > 0) {
        setMiRanking({ posicion: lista.length + 1, puntos: 0, puntosLider: lista[0]?.puntos ?? 0, puntosNext: null });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participanteId, router]);

  const esGrupo = GRUPOS.includes(vista);
  const partidosVista = esGrupo
    ? partidos.filter((p) => p.grupo === vista)
    : partidos.filter((p) => p.fase === vista);
  const tituloVista = esGrupo ? `Grupo ${vista}` : FASES_ELIM.find((f) => f.fase === vista)?.label ?? vista;

  function updatePred(partidoId: number, side: 'local' | 'visitante', value: string) {
    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: { local: prev[partidoId]?.local ?? '0', visitante: prev[partidoId]?.visitante ?? '0', [side]: value },
    }));
    setGuardado(false);
  }

  async function guardar() {
    setSaving(true);
    setError('');
    const payload = Object.entries(predicciones).map(([pid, pred]) => ({
      partido_id: parseInt(pid),
      goles_local: parseInt(pred.local) || 0,
      goles_visitante: parseInt(pred.visitante) || 0,
    }));
    try {
      const res = await fetch('/api/predicciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participante-id': String(participanteId),
          'x-session-token': localStorage.getItem('prode_token') ?? '',
        },
        body: JSON.stringify({ predicciones: payload }),
      });
      if (!res.ok) throw new Error();
      setGuardado(true);
    } catch {
      setError('No se pudieron guardar. Fijate la conexión y probá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const predCount = Object.keys(predicciones).length;
  const totalPartidos = partidos.filter(tieneEquipos).length || 1;

  if (loading) return <LoadingState texto="Cargando partidos..." />;

  return (
    <div className="space-y-6">

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Tus predicciones{nombre ? `, ${nombre}` : ''} ⚽</h1>
        <p className="text-violet-300 text-sm">{predCount} de {totalPartidos} partidos completados</p>
      </div>

      {miRanking && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-violet-950/70 border border-white/15 rounded-xl p-4 text-center space-y-1">
            <div className="text-3xl font-bold text-white">
              {miRanking.posicion === 1 ? '🥇' : miRanking.posicion === 2 ? '🥈' : miRanking.posicion === 3 ? '🥉' : `#${miRanking.posicion}`}
            </div>
            <div className="text-violet-300 text-xs">Tu posición</div>
          </div>
          <div className="bg-violet-950/70 border border-white/15 rounded-xl p-4 text-center space-y-1">
            <div className="text-3xl font-bold text-amber-400">{miRanking.puntos}</div>
            <div className="text-violet-300 text-xs">Tus puntos</div>
          </div>
          <div className="bg-violet-950/70 border border-white/15 rounded-xl p-4 text-center space-y-1">
            {miRanking.puntosNext !== null && miRanking.puntosNext > 0 ? (
              <><div className="text-3xl font-bold text-amber-400">+{miRanking.puntosNext}</div><div className="text-violet-300 text-xs">Para subir un puesto</div></>
            ) : miRanking.posicion === 1 ? (
              <><div className="text-3xl">🏆</div><div className="text-violet-300 text-xs">¡Vas primero!</div></>
            ) : (
              <><div className="text-3xl font-bold text-violet-300">{miRanking.puntosLider}</div><div className="text-violet-300 text-xs">Puntos del líder</div></>
            )}
          </div>
        </div>
      )}

      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-amber-400 text-lg shrink-0">⏰</span>
        <p className="text-sm text-amber-200">
          <strong>¡Atención!</strong> Cada predicción se cierra cuando arranca el partido. Los horarios son <strong>hora Argentina (ART)</strong>.
        </p>
      </div>

      <div className="h-2 bg-violet-950/65 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(predCount / totalPartidos) * 100}%` }} />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {GRUPOS.map((g) => {
            const pG = partidos.filter((p) => p.grupo === g);
            const cargados = pG.filter((p) => predicciones[p.id]).length;
            const total = pG.length;
            const completo = cargados === total && total > 0;
            return (
              <button key={g} onClick={() => setVista(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${vista === g ? 'bg-amber-400 text-violet-950' : 'bg-violet-950/65 text-violet-300 hover:text-white hover:bg-violet-800/60'}`}>
                {completo ? `Grupo ${g} ✓` : `Grupo ${g} ${cargados > 0 ? `${cargados}/${total}` : ''}`}
              </button>
            );
          })}
        </div>
        {/* Fases eliminatorias */}
        <div className="flex flex-wrap gap-2">
          {FASES_ELIM.map((f) => {
            const pF = partidos.filter((p) => p.fase === f.fase);
            if (pF.length === 0) return null;
            const definidos = pF.filter(tieneEquipos).length;
            return (
              <button key={f.fase} onClick={() => setVista(f.fase)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  vista === f.fase ? 'bg-amber-500 text-white' : 'bg-violet-950/65 text-amber-400/70 hover:text-amber-300 hover:bg-violet-800/60'
                }`}>
                {f.corto}{definidos === 0 ? ' 🔒' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-lg text-violet-200">{tituloVista}</h2>
        {!esGrupo && partidosVista.every((p) => !tieneEquipos(p)) && (
          <p className="text-violet-300 text-sm bg-violet-950/70 border border-white/15 rounded-xl px-4 py-3">
            🔒 Todavía no se sabe quiénes juegan esta fase. Los cruces y la predicción se habilitan a medida que avanzan los grupos.
          </p>
        )}
        {partidosVista.map((partido) => {
          const pred = predicciones[partido.id];
          const definido = tieneEquipos(partido);
          const locked = !definido || estaLocked(partido);
          return (
            <div key={partido.id} className={`bg-violet-950/70 border rounded-xl p-4 space-y-3 ${locked ? 'border-white/15 opacity-70' : 'border-violet-400/40'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 text-right">
                  <span className="font-semibold text-sm block truncate">
                    {definido ? (
                      <>
                        {BANDERAS[partido.equipo_local] && <FlagIcon code={BANDERAS[partido.equipo_local]} alt={partido.equipo_local} className="mr-1.5" />}
                        {partido.equipo_local}
                      </>
                    ) : <span className="text-violet-400 italic">Por definir</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <GoalInput value={pred?.local ?? ''} onChange={(v) => updatePred(partido.id, 'local', v)} disabled={locked} />
                  <span className="text-violet-300 font-bold">-</span>
                  <GoalInput value={pred?.visitante ?? ''} onChange={(v) => updatePred(partido.id, 'visitante', v)} disabled={locked} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm block truncate">
                    {definido ? (
                      <>
                        {BANDERAS[partido.equipo_visitante] && <FlagIcon code={BANDERAS[partido.equipo_visitante]} alt={partido.equipo_visitante} className="mr-1.5" />}
                        {partido.equipo_visitante}
                      </>
                    ) : <span className="text-violet-400 italic">Por definir</span>}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-violet-300 border-t border-white/15 pt-2">
                <span>📅 {formatFecha(partido.fecha)}</span>
                <span>🕐 {partido.hora}hs AR</span>
                {partido.estadio && <span>🏟️ {partido.estadio}, {partido.ciudad}</span>}
                <span className="ml-auto">{definido ? <DeadlineBadge partido={partido} /> : <span className="text-violet-400">A definir</span>}</span>
              </div>
              {partido.jugado && (
                <div className="border-t border-white/15 pt-2 flex items-center justify-center gap-2 text-sm">
                  <span className="text-violet-300">Resultado final:</span>
                  <span className="font-black text-white tabular-nums">{partido.goles_local} - {partido.goles_visitante}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 pb-6">
        {error && (
          <div className="mb-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <button onClick={guardar} disabled={saving || guardado}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-violet-950 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-amber-400/30">
          {saving ? 'Guardando...' : guardado ? '✓ Predicciones guardadas' : 'Guardar predicciones'}
        </button>
      </div>
    </div>
  );
}

export default function PrediccionesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PrediccionesContent />
    </Suspense>
  );
}
