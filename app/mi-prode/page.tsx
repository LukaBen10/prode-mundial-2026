'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingState from '@/components/LoadingState';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import type { RankingEntry } from '@/lib/types';

// Recordatorios por mail: activo (Resend configurado con dominio prodedonut.com.ar).
const MAILS_HABILITADOS = true;

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
  const [donas, setDonas] = useState(0);

  useEffect(() => {
    if (!participanteId) return;
    setNombre(localStorage.getItem('prode_nombre') ?? '');
    setEsAdmin(parseInt(localStorage.getItem('prode_admin') ?? '0') >= 1);

    // Cargar preferencia de avisos
    fetch('/api/avisos', {
      headers: { 'x-participante-id': participanteId, 'x-session-token': localStorage.getItem('prode_token') ?? '' },
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('prode_token'); router.push('/login'); return null; }
        return r.ok ? r.json() : null;
      })
      .then(d => { if (d) { setAceptaAvisos(!!d.acepta_avisos); setAvisosDefinido(!!d.avisos_definido); setDonas(d.donas_especiales ?? 0); } })
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
      })
      .catch(() => setLoading(false));
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
          {saludo}, <span className="text-amber-400">@{nombre}</span>! 👋
        </h1>
        <p className="text-violet-300">Acá está tu prode. Que arranque el partido.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-violet-950/70 border border-white/15 rounded-2xl p-4 text-center space-y-1">
          <div className="text-4xl font-black">
            {medalla ?? <span className="text-white">#{posicion}</span>}
          </div>
          <div className="text-violet-300 text-xs">Tu posición</div>
          {totalParticipantes > 0 && (
            <div className="text-violet-400 text-xs">de {totalParticipantes}</div>
          )}
        </div>

        <div className="bg-violet-950/70 border border-white/15 rounded-2xl p-4 text-center space-y-1">
          <div className="text-4xl font-black text-amber-400">{puntos}</div>
          <div className="text-violet-300 text-xs">Tus puntos</div>
        </div>

        <div className="bg-violet-950/70 border border-white/15 rounded-2xl p-4 text-center space-y-1">
          {posicion === 1 ? (
            <>
              <div className="text-4xl">🏆</div>
              <div className="text-amber-400 text-xs font-semibold">¡Vas primero!</div>
            </>
          ) : puntosNext !== null && puntosNext > 0 ? (
            <>
              <div className="text-4xl font-black text-amber-400">+{puntosNext}</div>
              <div className="text-violet-300 text-xs">Para subir un puesto</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-black text-violet-300">{puntosLider}</div>
              <div className="text-violet-300 text-xs">Puntos del líder</div>
            </>
          )}
        </div>
      </div>

      {/* Donas especiales del Mundial */}
      <div className="bg-violet-950/70 border border-white/15 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-white flex items-center gap-2">🍩 Donas especiales</h2>
          <span className="text-amber-400 font-bold tabular-nums">{donas} {donas === 1 ? 'dona' : 'donas'}</span>
        </div>
        <div className="h-2.5 bg-violet-900/60 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${((donas % 4) / 4) * 100}%` }} />
        </div>
        <p className="text-violet-300 text-xs leading-relaxed">
          {donas === 0
            ? 'Cada 4 donas especiales del Mundial que comprés en el local te suman +1 punto. 🔥'
            : <>Llevás <strong className="text-white">{donas}</strong>{Math.floor(donas / 4) > 0 ? <> = <strong className="text-amber-400">{Math.floor(donas / 4)} {Math.floor(donas / 4) === 1 ? 'punto' : 'puntos'}</strong></> : ''}. Te {4 - (donas % 4) === 1 ? 'falta' : 'faltan'} <strong className="text-white">{4 - (donas % 4)}</strong> para el próximo punto 🍩</>}
        </p>
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        <Link
          href={`/predicciones?participanteId=${participanteId ?? ''}`}
          className="flex items-center justify-between w-full bg-violet-950/70 border border-white/15 hover:border-amber-400/40 rounded-2xl p-5 transition-colors group"
        >
          <div className="space-y-0.5">
            <div className="font-bold text-lg">⚽ Mis predicciones</div>
            <div className="text-violet-300 text-sm">Cargá o editá tus resultados antes de cada partido</div>
          </div>
          <span className="text-violet-300 group-hover:text-amber-400 transition-colors text-2xl">→</span>
        </Link>

        <Link
          href="/ranking"
          className="flex items-center justify-between w-full bg-violet-950/70 border border-white/15 hover:border-violet-400/40 rounded-2xl p-5 transition-colors group"
        >
          <div className="space-y-0.5">
            <div className="font-bold text-lg">🏆 Tabla de posiciones</div>
            <div className="text-violet-300 text-sm">Ver cómo van todos</div>
          </div>
          <span className="text-violet-300 group-hover:text-white transition-colors text-2xl">→</span>
        </Link>

        {/* Panel admin — solo visible para admins */}
        {esAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between w-full bg-violet-950/70 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-5 transition-colors group"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-lg">🔑 Panel Admin</div>
              <div className="text-violet-300 text-sm">Participantes, resultados y consumos</div>
            </div>
            <span className="text-violet-300 group-hover:text-amber-400 transition-colors text-2xl">→</span>
          </Link>
        )}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="w-full text-violet-400 hover:text-violet-300 text-sm py-2 transition-colors text-center"
      >
        Cerrar sesión
      </button>

      {/* Avisos por mail — OCULTO hasta configurar Resend (MAILS_HABILITADOS) */}
      {MAILS_HABILITADOS && (
      <div className={`rounded-2xl p-5 ${!avisosDefinido ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-violet-950/70 border border-white/15'}`}>
        {!avisosDefinido ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">📧</span>
              <div className="space-y-0.5">
                <h2 className="font-bold text-white">¿Te avisamos por mail?</h2>
                <p className="text-violet-200 text-sm leading-relaxed">
                  Te mandamos un recordatorio los días que juega tu prode, así no te olvidás de cargar las predicciones.
                  Un mail por día, nada de spam. Te podés dar de baja cuando quieras.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => guardarAvisos(true)} disabled={savingAvisos}
                className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-violet-950 py-2.5 rounded-xl font-bold text-sm transition-colors">
                Sí, avisame
              </button>
              <button onClick={() => guardarAvisos(false)} disabled={savingAvisos}
                className="flex-1 bg-violet-950/65 hover:bg-violet-800/60 text-violet-200 py-2.5 rounded-xl font-bold text-sm transition-colors">
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
                <p className="text-violet-300 text-xs">{aceptaAvisos ? 'Activados — te avisamos los días que jugás.' : 'Desactivados.'}</p>
              </div>
            </div>
            <button onClick={() => guardarAvisos(!aceptaAvisos)} disabled={savingAvisos}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${aceptaAvisos ? 'bg-amber-400' : 'bg-violet-800/70'}`}
              aria-label="Activar o desactivar avisos por mail">
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${aceptaAvisos ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        )}
      </div>
      )}

      {/* Reglas */}
      <div className="bg-violet-950/70 border border-white/15 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-violet-200 text-sm">Cómo se suman los puntos</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-black text-lg w-6">3</span>
            <span className="text-violet-300">Resultado exacto (ej: predijiste 2-1 y salió 2-1)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-black text-lg w-6">1</span>
            <span className="text-violet-300">Ganador correcto</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-black text-lg w-6">+1</span>
            <span className="text-violet-300">Por venir a <strong className="text-white">Donut Makers</strong> durante un partido</span>
          </div>
        </div>
      </div>

    </div>
  );
}
