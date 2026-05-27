'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BANDERAS } from '@/lib/data/banderas';

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

/** Devuelve el Date del inicio del partido en hora AR (UTC-3) */
function kickoffDate(partido: Partido): Date {
  return new Date(`${partido.fecha}T${partido.hora || '19:00'}:00-03:00`);
}

/** true si ya pasó la hora de inicio */
function estaLocked(partido: Partido): boolean {
  if (partido.jugado) return true;
  return new Date() >= kickoffDate(partido);
}

/** Badge con info del cierre */
function DeadlineBadge({ partido }: { partido: Partido }) {
  const [texto, setTexto] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    function calcular() {
      const kickoff = kickoffDate(partido);
      const diffMs = kickoff.getTime() - Date.now();

      if (diffMs <= 0) {
        setTexto('🔒 Cerrado');
        setColor('text-zinc-500');
        return;
      }
      const diffH = diffMs / 3600000;
      if (diffH < 1) {
        const mins = Math.floor(diffMs / 60000);
        setTexto(`⏰ Cierra en ${mins}m`);
        setColor('text-red-400');
      } else if (diffH < 24) {
        setTexto(`⏰ Cierra en ${Math.floor(diffH)}h`);
        setColor('text-orange-400');
      } else {
        const dia = kickoff.toLocaleDateString('es-AR', {
          day: 'numeric', month: 'short',
          timeZone: 'America/Argentina/Buenos_Aires',
        });
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

function GoalInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-12 h-10 text-center bg-zinc-800 border border-zinc-700 rounded-lg text-white font-bold focus:outline-none focus:border-green-500 disabled:opacity-40 transition-colors"
    />
  );
}

interface RankingEntry { posicion: number; id: number; nombre_usuario: string; puntos: number; }

function PrediccionesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramId = searchParams.get('participanteId');
  const participanteId = paramId ?? (typeof window !== 'undefined' ? localStorage.getItem('prode_id') : null);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, { local: string; visitante: string }>>({});
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [miRanking, setMiRanking] = useState<{ posicion: number; puntos: number; puntosLider: number; puntosNext: number | null } | null>(null);

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
      for (const p of preds) {
        map[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      }
      setPredicciones(map);

      const lista = ranking as RankingEntry[];
      const yo = lista.find((r) => String(r.id) === participanteId);
      if (yo) {
        const anterior = yo.posicion > 1 ? lista.find(r => r.posicion === yo.posicion - 1) : null;
        setMiRanking({
          posicion: yo.posicion,
          puntos: yo.puntos,
          puntosLider: lista[0]?.puntos ?? 0,
          puntosNext: anterior ? anterior.puntos - yo.puntos : null,
        });
      } else if (lista.length > 0) {
        setMiRanking({ posicion: lista.length + 1, puntos: 0, puntosLider: lista[0]?.puntos ?? 0, puntosNext: null });
      }

      setLoading(false);
    });
  }, [participanteId, router]);

  const partidosGrupo = partidos.filter((p) => p.grupo === grupoActivo);

  function updatePred(partidoId: number, side: 'local' | 'visitante', value: string) {
    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: {
        local: prev[partidoId]?.local ?? '0',
        visitante: prev[partidoId]?.visitante ?? '0',
        [side]: value,
      },
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

  if (loading) {
    return <div className="text-center py-20 text-zinc-400">Cargando partidos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          Tus predicciones{nombre ? `, ${nombre}` : ''} ⚽
        </h1>
        <p className="text-zinc-400 text-sm">
          {predCount} de {totalPartidos} partidos completados
        </p>
      </div>

      {/* Aviso fecha límite */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-orange-400 text-lg shrink-0">⏰</span>
        <p className="text-sm text-orange-200">
          <strong>¡Atención!</strong> Cada predicción se cierra automáticamente en el momento en que arranca el partido.
          Una vez que el partido empezó, ya no podés editarla.
          Los horarios son <strong>hora Argentina (ART)</strong>.
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${(predCount / totalPartidos) * 100}%` }}
        />
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
              <>
                <div className="text-3xl font-bold text-orange-400">+{miRanking.puntosNext}</div>
                <div className="text-zinc-400 text-xs">Para subir un puesto</div>
              </>
            ) : miRanking.posicion === 1 ? (
              <>
                <div className="text-3xl">🏆</div>
                <div className="text-zinc-400 text-xs">Vas primero!</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-zinc-500">{miRanking.puntosLider}</div>
                <div className="text-zinc-400 text-xs">Puntos del líder</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs de grupos */}
      <div className="flex flex-wrap gap-2">
        {GRUPOS.map((g) => {
          const partidosG = partidos.filter((p) => p.grupo === g);
          const predsG = partidosG.filter((p) => predicciones[p.id]).length;
          const completo = predsG === partidosG.length && partidosG.length > 0;
          return (
            <button
              key={g}
              onClick={() => setGrupoActivo(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                grupoActivo === g
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Grupo {g}{completo && ' ✓'}
            </button>
          );
        })}
      </div>

      {/* Partidos del grupo activo */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg text-zinc-300">Grupo {grupoActivo}</h2>
        {partidosGrupo.map((partido) => {
          const pred = predicciones[partido.id];
          const locked = estaLocked(partido);
          return (
            <div
              key={partido.id}
              className={`bg-zinc-900 border rounded-xl p-4 space-y-3 ${
                locked ? 'border-zinc-800 opacity-70' : 'border-zinc-700'
              }`}
            >
              {/* Fila principal: equipos + inputs */}
              <div className="flex items-center gap-3">
                <div className="flex-1 text-right">
                  <span className="font-semibold text-sm">
                    {BANDERAS[partido.equipo_local] && <span className="mr-1">{BANDERAS[partido.equipo_local]}</span>}
                    {partido.equipo_local}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <GoalInput
                    value={pred?.local ?? ''}
                    onChange={(v) => updatePred(partido.id, 'local', v)}
                    disabled={locked}
                  />
                  <span className="text-zinc-500 font-bold">-</span>
                  <GoalInput
                    value={pred?.visitante ?? ''}
                    onChange={(v) => updatePred(partido.id, 'visitante', v)}
                    disabled={locked}
                  />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm">
                    {BANDERAS[partido.equipo_visitante] && <span className="mr-1">{BANDERAS[partido.equipo_visitante]}</span>}
                    {partido.equipo_visitante}
                  </span>
                </div>
              </div>

              {/* Fila info: fecha, estadio, ciudad, deadline */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 border-t border-zinc-800 pt-2">
                <span>📅 {formatFecha(partido.fecha)}</span>
                <span>🕐 {partido.hora}hs AR</span>
                {partido.estadio && (
                  <span>🏟️ {partido.estadio}, {partido.ciudad}</span>
                )}
                <span className="ml-auto">
                  <DeadlineBadge partido={partido} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón guardar */}
      <div className="sticky bottom-4 pt-4">
        <button
          onClick={guardar}
          disabled={saving || guardado}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-500/20"
        >
          {saving ? 'Guardando...' : guardado ? '✓ Predicciones guardadas' : 'Guardar predicciones'}
        </button>
      </div>
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
