'use client';

import { useState, useEffect } from 'react';

interface ParticipanteCompleto {
  id: number;
  nombre_completo: string;
  nombre_usuario: string;
  mail: string;
  whatsapp: string;
  dni: string;
  puntos: number;
  created_at: string;
  is_admin: number;
}

interface ParticipanteBusqueda {
  id: number;
  nombre_usuario: string;
  nombre_completo: string;
  puntos: number;
}

interface Partido {
  id: number;
  fase: string;
  grupo: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha: string;
  goles_local: number | null;
  goles_visitante: number | null;
  jugado: number;
}

interface Stats {
  total: number;
  conPredicciones: number;
  totalPredicciones: number;
}

type Tab = 'participantes' | 'resultados' | 'consumos' | 'admins';
type AuthMode = 'participant' | 'password' | null;

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Formatea número de WhatsApp argentino → wa.me link */
function waLink(numero: string): string {
  const clean = numero.replace(/\D/g, '').replace(/^0+/, '');
  return `https://wa.me/549${clean}`;
}

export default function AdminPage() {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('participantes');

  // Participantes
  const [participantes, setParticipantes] = useState<ParticipanteCompleto[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingParts, setLoadingParts] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Resultados
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Record<number, { local: string; visitante: string }>>({});
  const [loadingPartidos, setLoadingPartidos] = useState(false);
  const [mensajes, setMensajes] = useState<Record<number, string>>({});

  // Consumos
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ParticipanteBusqueda[]>([]);
  const [msgConsumo, setMsgConsumo] = useState<Record<string, string>>({});

  // Admins
  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [resultadosAdmin, setResultadosAdmin] = useState<ParticipanteBusqueda[]>([]);
  const [msgAdmin, setMsgAdmin] = useState<Record<number, string>>({});

  useEffect(() => {
    // 1. ¿Está logueado y es admin?
    const isAdmin = localStorage.getItem('prode_admin') === '1';
    const participanteId = localStorage.getItem('prode_id');
    if (isAdmin && participanteId) {
      setAuthMode('participant');
      cargarTodo('participant', participanteId, '');
      return;
    }

    // 2. Contraseña guardada en session
    const saved = sessionStorage.getItem('admin_pass');
    if (saved) {
      setPassword(saved);
      setAuthMode('password');
      cargarTodo('password', '', saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Devuelve los headers de auth según el modo */
  function authHeaders(mode: AuthMode, participanteId: string, pass: string): Record<string, string> {
    if (mode === 'participant') {
      return { 'x-admin-participante-id': participanteId };
    }
    return { 'x-admin-password': pass };
  }

  async function cargarTodo(mode: AuthMode, participanteId: string, pass: string) {
    cargarParticipantes(mode, participanteId, pass);
    cargarPartidos();
  }

  async function cargarParticipantes(mode: AuthMode, participanteId: string, pass: string) {
    setLoadingParts(true);
    const res = await fetch('/api/admin/participantes', {
      headers: authHeaders(mode, participanteId, pass),
    });
    const data = await res.json();
    setParticipantes(data.participantes ?? []);
    setStats(data.stats ?? null);
    setLoadingParts(false);
  }

  async function cargarPartidos() {
    setLoadingPartidos(true);
    const res = await fetch('/api/partidos');
    const data = await res.json();
    setPartidos(data);
    const map: Record<number, { local: string; visitante: string }> = {};
    for (const p of data as Partido[]) {
      if (p.jugado) map[p.id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
    }
    setResultados(map);
    setLoadingPartidos(false);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    // Verificamos con un request de prueba
    const res = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ partido_id: -1, goles_local: 0, goles_visitante: 0 }),
    });
    if (res.status === 401) { alert('Contraseña incorrecta'); return; }
    sessionStorage.setItem('admin_pass', password);
    setAuthMode('password');
    cargarTodo('password', '', password);
  }

  /** Obtiene los headers actuales (usando state) */
  function getHeaders(): Record<string, string> {
    if (authMode === 'participant') {
      return { 'x-admin-participante-id': localStorage.getItem('prode_id') ?? '' };
    }
    return { 'x-admin-password': password };
  }

  async function cargarResultado(partidoId: number) {
    const res = resultados[partidoId];
    if (!res) return;
    const r = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ partido_id: partidoId, goles_local: parseInt(res.local) || 0, goles_visitante: parseInt(res.visitante) || 0 }),
    });
    const data = await r.json();
    if (data.ok) {
      setMensajes(prev => ({ ...prev, [partidoId]: `✓ ${data.prediccionesActualizadas} predicciones actualizadas` }));
      cargarPartidos();
      if (authMode === 'participant') cargarParticipantes('participant', localStorage.getItem('prode_id') ?? '', '');
      else cargarParticipantes('password', '', password);
    } else {
      setMensajes(prev => ({ ...prev, [partidoId]: `Error: ${data.error}` }));
    }
  }

  async function buscarParticipante(q: string) {
    setBusqueda(q);
    if (q.length < 2) { setResultadosBusqueda([]); return; }
    const res = await fetch(`/api/admin/puntos-extra?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
    const data = await res.json();
    setResultadosBusqueda(Array.isArray(data) ? data : []);
  }

  async function darPuntoConsumo(nombre_usuario: string) {
    const res = await fetch('/api/admin/puntos-extra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ nombre_usuario, puntos: 1 }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsgConsumo(prev => ({ ...prev, [nombre_usuario]: `✓ +1 pt → total: ${data.puntosNuevos} pts` }));
      setResultadosBusqueda(prev => prev.map(p => p.nombre_usuario === nombre_usuario ? { ...p, puntos: data.puntosNuevos } : p));
      if (authMode === 'participant') cargarParticipantes('participant', localStorage.getItem('prode_id') ?? '', '');
      else cargarParticipantes('password', '', password);
    } else {
      setMsgConsumo(prev => ({ ...prev, [nombre_usuario]: `Error: ${data.error}` }));
    }
  }

  async function buscarAdmin(q: string) {
    setBusquedaAdmin(q);
    if (q.length < 2) { setResultadosAdmin([]); return; }
    const res = await fetch(`/api/admin/puntos-extra?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
    const data = await res.json();
    setResultadosAdmin(Array.isArray(data) ? data : []);
  }

  async function toggleAdmin(id: number, hacerAdmin: boolean) {
    const res = await fetch('/api/admin/participantes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id, is_admin: hacerAdmin }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsgAdmin(prev => ({ ...prev, [id]: hacerAdmin ? '✓ Ahora es admin' : '✓ Ya no es admin' }));
      if (authMode === 'participant') cargarParticipantes('participant', localStorage.getItem('prode_id') ?? '', '');
      else cargarParticipantes('password', '', password);
    } else {
      setMsgAdmin(prev => ({ ...prev, [id]: `Error: ${data.error}` }));
    }
  }

  // ── Pantalla de login (solo si no es admin por cuenta) ──────────
  if (!authMode) {
    return (
      <div className="max-w-sm mx-auto mt-16 space-y-6">
        <h1 className="text-2xl font-bold text-center">Panel Admin</h1>
        <form onSubmit={login} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña" autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500" />
          <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-bold">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const pendientes = partidos.filter(p => !p.jugado);
  const jugados = partidos.filter(p => p.jugado);
  const participantesFiltrados = participantes.filter(p =>
    !filtroBusqueda || p.nombre_completo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    p.nombre_usuario.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    p.dni.includes(filtroBusqueda) || p.mail.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );
  const adminsActuales = participantes.filter(p => p.is_admin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Panel Admin</h1>
        {stats && (
          <div className="flex gap-4 text-sm text-zinc-400">
            <span><strong className="text-white">{stats.total}</strong> inscriptos</span>
            <span><strong className="text-white">{stats.conPredicciones as number}</strong> con predicciones</span>
            <span><strong className="text-white">{jugados.length}</strong> partidos jugados</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-0 flex-wrap">
        {([
          { id: 'participantes', label: '👥 Participantes' },
          { id: 'resultados',    label: '⚽ Resultados' },
          { id: 'consumos',      label: '🍩 Consumos' },
          { id: 'admins',        label: '🔑 Admins' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2 ${
              tab === t.id ? 'text-white border-green-500' : 'text-zinc-400 border-transparent hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Participantes ─────────────────────────────────── */}
      {tab === 'participantes' && (
        <div className="space-y-4">
          <input type="text" value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
            placeholder="Filtrar por nombre, usuario, DNI o mail..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500" />

          {loadingParts ? (
            <p className="text-zinc-500 py-8 text-center">Cargando...</p>
          ) : participantesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {participantes.length === 0 ? 'Todavía no se inscribió nadie.' : 'No hay resultados para ese filtro.'}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium">Nombre completo</th>
                    <th className="text-left px-4 py-3 font-medium">DNI</th>
                    <th className="text-left px-4 py-3 font-medium">WhatsApp</th>
                    <th className="text-left px-4 py-3 font-medium">Mail</th>
                    <th className="text-right px-4 py-3 font-medium">Puntos</th>
                    <th className="text-right px-4 py-3 font-medium">Inscripto</th>
                  </tr>
                </thead>
                <tbody>
                  {participantesFiltrados.map((p, i) => (
                    <tr key={p.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        @{p.nombre_usuario}
                        {p.is_admin ? <span className="ml-1 text-xs text-amber-400">🔑</span> : null}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{p.nombre_completo}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono">{p.dni}</td>
                      <td className="px-4 py-3">
                        <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 underline underline-offset-2">
                          {p.whatsapp}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{p.mail}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${p.puntos > 0 ? 'text-green-400' : 'text-zinc-500'}`}>{p.puntos}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500 text-xs">{formatFechaHora(p.created_at as string)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Resultados ────────────────────────────────────── */}
      {tab === 'resultados' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-semibold text-zinc-300">Partidos pendientes ({pendientes.length})</h2>
            {loadingPartidos ? <p className="text-zinc-500">Cargando...</p> : pendientes.length === 0 ? (
              <p className="text-zinc-500">No hay partidos pendientes.</p>
            ) : (
              pendientes.map(partido => (
                <div key={partido.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-zinc-500 w-16 shrink-0">{formatFecha(partido.fecha)}</span>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">G {partido.grupo}</span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate flex-1 text-right">{partido.equipo_local}</span>
                      <input type="number" min={0} max={20} value={resultados[partido.id]?.local ?? ''}
                        onChange={e => setResultados(p => ({ ...p, [partido.id]: { ...p[partido.id], local: e.target.value } }))}
                        className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-green-500" />
                      <span className="text-zinc-500">-</span>
                      <input type="number" min={0} max={20} value={resultados[partido.id]?.visitante ?? ''}
                        onChange={e => setResultados(p => ({ ...p, [partido.id]: { ...p[partido.id], visitante: e.target.value } }))}
                        className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-green-500" />
                      <span className="text-sm font-medium truncate flex-1">{partido.equipo_visitante}</span>
                    </div>
                    <button onClick={() => cargarResultado(partido.id)}
                      className="bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
                      Guardar
                    </button>
                  </div>
                  {mensajes[partido.id] && <p className="text-xs text-green-400 mt-2 pl-20">{mensajes[partido.id]}</p>}
                </div>
              ))
            )}
          </section>

          {jugados.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold text-zinc-400">Jugados ({jugados.length})</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {jugados.map(p => (
                  <div key={p.id} className="flex items-center gap-3 text-sm px-4 py-3 border-b border-zinc-800/50 last:border-0">
                    <span className="text-zinc-500 text-xs w-14 shrink-0">{formatFecha(p.fecha)}</span>
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-400">G {p.grupo}</span>
                    <span className="flex-1 text-right text-zinc-300">{p.equipo_local}</span>
                    <span className="font-bold text-white px-2">{p.goles_local} - {p.goles_visitante}</span>
                    <span className="flex-1 text-zinc-300">{p.equipo_visitante}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Tab: Consumos ──────────────────────────────────────── */}
      {tab === 'consumos' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">Buscá al cliente que vino al local durante un partido y dale +1 punto.</p>
          <input type="text" value={busqueda} onChange={e => buscarParticipante(e.target.value)}
            placeholder="Buscar por usuario o nombre..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500" />
          {resultadosBusqueda.length > 0 && (
            <div className="space-y-2">
              {resultadosBusqueda.map(p => (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                    <span className="text-zinc-400 text-sm ml-2">{p.nombre_completo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-bold">{p.puntos} pts</span>
                    <button onClick={() => darPuntoConsumo(p.nombre_usuario)}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
                      +1 punto
                    </button>
                    {msgConsumo[p.nombre_usuario] && (
                      <span className="text-xs text-green-400">{msgConsumo[p.nombre_usuario]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {busqueda.length >= 2 && resultadosBusqueda.length === 0 && (
            <p className="text-zinc-500 text-sm">No se encontró ningún usuario.</p>
          )}
        </div>
      )}

      {/* ── Tab: Admins ────────────────────────────────────────── */}
      {tab === 'admins' && (
        <div className="space-y-6">

          {/* Admins actuales */}
          <section className="space-y-3">
            <h2 className="font-semibold text-zinc-300">Admins actuales ({adminsActuales.length})</h2>
            {adminsActuales.length === 0 ? (
              <p className="text-zinc-500 text-sm">No hay admins cargados todavía.</p>
            ) : (
              <div className="space-y-2">
                {adminsActuales.map(p => (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                      <span className="text-zinc-400 text-sm ml-2">{p.nombre_completo}</span>
                      <span className="ml-2 text-amber-400 text-xs">🔑 admin</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {msgAdmin[p.id] && <span className="text-xs text-green-400">{msgAdmin[p.id]}</span>}
                      <button
                        onClick={() => toggleAdmin(p.id, false)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Quitar admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Agregar admin */}
          <section className="space-y-3">
            <h2 className="font-semibold text-zinc-300">Dar acceso admin</h2>
            <p className="text-zinc-500 text-sm">Buscá un participante y hacelo admin. Va a poder entrar al panel con su cuenta.</p>
            <input type="text" value={busquedaAdmin} onChange={e => buscarAdmin(e.target.value)}
              placeholder="Buscar por usuario o nombre..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500" />
            {resultadosAdmin.length > 0 && (
              <div className="space-y-2">
                {resultadosAdmin.map(p => {
                  const yaEsAdmin = adminsActuales.some(a => a.id === p.id);
                  return (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                        <span className="text-zinc-400 text-sm ml-2">{p.nombre_completo}</span>
                        {yaEsAdmin && <span className="ml-2 text-amber-400 text-xs">🔑 ya es admin</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {msgAdmin[p.id] && <span className="text-xs text-green-400">{msgAdmin[p.id]}</span>}
                        {!yaEsAdmin && (
                          <button
                            onClick={() => toggleAdmin(p.id, true)}
                            className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Hacer admin
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {busquedaAdmin.length >= 2 && resultadosAdmin.length === 0 && (
              <p className="text-zinc-500 text-sm">No se encontró ningún usuario.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
