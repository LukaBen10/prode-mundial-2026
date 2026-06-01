'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingState from '@/components/LoadingState';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import type { RankingEntry } from '@/lib/types';

export default function MiProdePage() {
  const router = useRouter();
  const participanteId = useAuthRedirect();
  const [nombre, setNombre] = useState('');
  const [posicion, setPosicion] = useState<number | null>(null);
  const [puntos, setPuntos] = useState(0);
  const [puntosNext, setPuntosNext] = useState<number | null>(null);
  const [puntosLider, setPuntosLider] = useState(0);
  const [totalParticipantes, setTotalParticipantes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);

  // Avisos por mail
  const [aceptaAvisos, setAceptaAvisos] = useState(false);
  const [avisosDefinido, setAvisosDefinido] = useState(true); // true hasta cargar, para no parpadear el banner
  const [savingAvisos, setSavingAvisos] = useState(false);

  useEffect(() => {
    if (!participanteId) return;
    setNombre(localStorage.getItem('prode_nombre') ?? '');
    setEsAdmin(parseInt(localStorage.getItem('prode_admin') ?? '0') >= 1);

    // Cargar preferencia de avisos
    fetch('/api/avisos', {
      headers: { 'x-participante-id': participanteId, 'x-session-token': localStorage.getItem('prode_token') ?? '' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setAceptaAvisos(!!d.acepta_avisos); setAvisosDefinido(!!d.avisos_definido); } })
      .catch(() => {});

    fetch('/api/ranking')
      .then(r => r.json())
      .then((ranking: RankingEntry[]) => {
        setTotalParticipantes(ranking.length);
        const yo = ranking.find(r => String(r.id) === participanteId);
        if (yo) {
          setPosicion(yo.posicion);
          setPuntos(yo.puntos);
          setPuntosLider(ranking[0]?.puntos ?? 0);
          const anterior = yo.posicion > 1 ? ranking.find(r => r.posicion === yo.posicion - 1) : null;
          setPuntosNext(anterior ? anterior.puntos - yo.puntos : null);
        } else {
          setPosicion(ranking.length + 1);
          setPuntosLider(ranking[0]?.puntos ?? 0);
        }
        setLoading(false);
      });
  }, [participanteId]);

  async function guardarAvisos(acepta: boolean) {
    setSavingAvisos(true);
    const res = await fetch('/api/avisos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-participante-id': participanteId ?? '',
        'x-session-token': localStorage.getItem('prode_token') ?? '',
      },
      body: JSON.stringify({ acepta }),
    });
    setSavingAvisos(false);
    if (res.ok) { setAceptaAvisos(acepta); setAvisosDefinido(true); }
  }

  if (!participanteId || loading) return <LoadingState />;

  async function handleLogout() {
    const token = localStorage.getItem('prode_token');
    if (token) {
      await fetch('/api/logout', { method: 'POST', headers: { 'x-session-token': token } });
    }
    localStorage.clear();
    router.push('/login');
  }

  const medalla = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : posicion === 3 ? '🥉' : null;

  const saludos = ['¡Ahí estás', '¡Buenas', 'Bienvenido de vuelta', '¡Hola'];
  const saludo = saludos[nombre.length % saludos.length];

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Saludo */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">
          {saludo}, <span className="text-orange-400">@{nombre}</span>! 👋
        </h1>
        <p className="text-zinc-400">Acá está tu prode. Que arranque el partido.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
          <div className="text-4xl font-black">
            {medalla ?? <span className="text-white">#{posicion}</span>}
          </div>
          <div className="text-zinc-400 text-xs">Tu posición</div>
          {totalParticipantes > 0 && (
            <div className="text-zinc-600 text-xs">de {totalParticipantes}</div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
          <div className="text-4xl font-black text-green-400">{puntos}</div>
          <div className="text-zinc-400 text-xs">Tus puntos</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1">
          {posicion === 1 ? (
            <>
              <div className="text-4xl">🏆</div>
              <div className="text-amber-400 text-xs font-semibold">¡Vas primero!</div>
            </>
          ) : puntosNext !== null && puntosNext > 0 ? (
            <>
              <div className="text-4xl font-black text-orange-400">+{puntosNext}</div>
              <div className="text-zinc-400 text-xs">Para subir un puesto</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-black text-zinc-400">{puntosLider}</div>
              <div className="text-zinc-400 text-xs">Puntos del líder</div>
            </>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        <Link
          href={`/predicciones?participanteId=${participanteId ?? ''}`}
          className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-5 transition-colors group"
        >
          <div className="space-y-0.5">
            <div className="font-bold text-lg">⚽ Mis predicciones</div>
            <div className="text-zinc-400 text-sm">Cargá o editá tus resultados antes de cada partido</div>
          </div>
          <span className="text-zinc-500 group-hover:text-orange-400 transition-colors text-2xl">→</span>
        </Link>

        <Link
          href="/ranking"
          className="flex items-center justify-between w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-colors group"
        >
          <div className="space-y-0.5">
            <div className="font-bold text-lg">🏆 Tabla de posiciones</div>
            <div className="text-zinc-400 text-sm">Ver cómo van todos</div>
          </div>
          <span className="text-zinc-500 group-hover:text-white transition-colors text-2xl">→</span>
        </Link>

        {/* Panel admin — solo visible para admins */}
        {esAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between w-full bg-zinc-900 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-5 transition-colors group"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-lg">🔑 Panel Admin</div>
              <div className="text-zinc-400 text-sm">Participantes, resultados y consumos</div>
            </div>
            <span className="text-zinc-500 group-hover:text-amber-400 transition-colors text-2xl">→</span>
          </Link>
        )}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="w-full text-zinc-600 hover:text-zinc-400 text-sm py-2 transition-colors text-center"
      >
        Cerrar sesión
      </button>

      {/* Avisos por mail */}
      <div className={`rounded-2xl p-5 ${!avisosDefinido ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-zinc-900 border border-zinc-800'}`}>
        {!avisosDefinido ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">📧</span>
              <div className="space-y-0.5">
                <h2 className="font-bold text-white">¿Te avisamos por mail?</h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Te mandamos un recordatorio los días que juega tu prode, así no te olvidás de cargar las predicciones.
                  Un mail por día, nada de spam. Te podés dar de baja cuando quieras.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => guardarAvisos(true)} disabled={savingAvisos}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                Sí, avisame
              </button>
              <button onClick={() => guardarAvisos(false)} disabled={savingAvisos}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl font-bold text-sm transition-colors">
                No, gracias
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-2xl shrink-0">📧</span>
              <div className="min-w-0">
                <h2 className="font-bold text-white text-sm">Recordatorios por mail</h2>
                <p className="text-zinc-500 text-xs">{aceptaAvisos ? 'Activados — te avisamos los días que jugás.' : 'Desactivados.'}</p>
              </div>
            </div>
            <button onClick={() => guardarAvisos(!aceptaAvisos)} disabled={savingAvisos}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${aceptaAvisos ? 'bg-orange-500' : 'bg-zinc-700'}`}
              aria-label="Activar o desactivar avisos por mail">
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${aceptaAvisos ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        )}
      </div>

      {/* Reglas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-zinc-300 text-sm">Cómo se suman los puntos</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-black text-lg w-6">3</span>
            <span className="text-zinc-400">Resultado exacto (ej: predijiste 2-1 y salió 2-1)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-orange-400 font-black text-lg w-6">1</span>
            <span className="text-zinc-400">Ganador correcto</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-orange-300 font-black text-lg w-6">+1</span>
            <span className="text-zinc-400">Por venir a <strong className="text-white">Donut Makers</strong> durante un partido</span>
          </div>
        </div>
      </div>

    </div>
  );
}
