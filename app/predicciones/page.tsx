'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Partido {
  id: number;
  fase: string;
  grupo: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha: string;
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

function PrediccionesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const participanteId = searchParams.get('participanteId');

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, { local: string; visitante: string }>>({});
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (!participanteId) { router.push('/unirse'); return; }

    const n = localStorage.getItem('prode_nombre');
    if (n) setNombre(n);

    Promise.all([
      fetch('/api/partidos').then((r) => r.json()),
      fetch(`/api/predicciones?participanteId=${participanteId}`).then((r) => r.json()),
    ]).then(([partidos, preds]) => {
      setPartidos(partidos);
      const map: Record<number, { local: string; visitante: string }> = {};
      for (const p of preds) {
        map[p.partido_id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      }
      setPredicciones(map);
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
    return (
      <div className="text-center py-20 text-zinc-400">Cargando partidos...</div>
    );
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

      {/* Progress bar */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${(predCount / totalPartidos) * 100}%` }}
        />
      </div>

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
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors relative ${
                grupoActivo === g
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Grupo {g}
              {completo && (
                <span className="ml-1 text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Partidos del grupo activo */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg text-zinc-300">Grupo {grupoActivo}</h2>
        {partidosGrupo.map((partido) => {
          const pred = predicciones[partido.id];
          return (
            <div
              key={partido.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="flex-1 text-right">
                <span className="font-semibold text-sm">{partido.equipo_local}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <GoalInput
                  value={pred?.local ?? ''}
                  onChange={(v) => updatePred(partido.id, 'local', v)}
                  disabled={!!partido.jugado}
                />
                <span className="text-zinc-500 font-bold">-</span>
                <GoalInput
                  value={pred?.visitante ?? ''}
                  onChange={(v) => updatePred(partido.id, 'visitante', v)}
                  disabled={!!partido.jugado}
                />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-sm">{partido.equipo_visitante}</span>
              </div>
              <div className="text-zinc-500 text-xs w-14 text-right shrink-0">
                {formatFecha(partido.fecha)}
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
