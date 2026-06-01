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

  useEffect(() => {
    if (!participanteId) return;
    setNombre(localStorage.getItem('prode_nombre') ?? '');
    setEsAdmin(parseInt(localStorage.getItem('prode_admin') ?? '0') >= 1);

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
