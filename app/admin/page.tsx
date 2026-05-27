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

type Tab = 'participantes' | 'resultados' | 'consumos';

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [autenticado, setAutenticado] = useState(false);
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

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pass');
    if (saved) { setPassword(saved); setAutenticado(true); cargarTodo(saved); }
  }, []);

  async function cargarTodo(pass: string) {
    cargarParticipantes(pass);
    cargarPartidos(pass);
  }

  async function cargarParticipantes(pass: string) {
    setLoadingParts(true);
    const res = await fetch('/api/admin/participantes', { headers: { 'x-admin-password': pass } });
    const data = await res.json();
    setParticipantes(data.participantes ?? []);
    setStats(data.stats ?? null);
    setLoadingParts(false);
  }

  async function cargarPartidos(pass: string) {
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
    const res = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ partido_id: -1, goles_local: 0, goles_visitante: 0 }),
    });
    if (res.status === 401) { alert('Contraseña incorrecta'); return; }
    sessionStorage.setItem('admin_pass', password);
    setAutenticado(true);
    cargarTodo(password);
  }

  async function cargarResultado(partidoId: number) {
    const res = resultados[partidoId];
    if (!res) return;
    const r = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ partido_id: partidoId, goles_local: parseInt(res.local) || 0, goles_visitante: parseInt(res.visitante) || 0 }),
    });
    const data = await r.json();
    if (data.ok) {
      setMensajes(prev => ({ ...prev, [partidoId]: `✓ ${data.prediccionesActualizadas} predicciones actualizadas` }));
      cargarPartidos(password);
      cargarParticipantes(password);
    } else {
      setMensajes(prev => ({ ...prev, [partidoId]: `Error: ${data.error}` }));
    }
  }

  async function buscarParticipante(q: string) {
    setBusqueda(q);
    if (q.length < 2) { setResultadosBusqueda([]); return; }
    const res = await fetch(`/api/admin/puntos-extra?q=${encodeURIComponent(q)}`, { headers: { 'x-admin-password': password } });
    const data = await res.json();
    setResultadosBusqueda(Array.isArray(data) ? data : []);
  }

  async function darPuntoConsumo(nombre_usuario: string) {
    const res = await fetch('/api/admin/puntos-extra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ nombre_usuario, puntos: 1 }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsgConsumo(prev => ({ ...prev, [nombre_usuario]: `✓ +1 pt → total: ${data.puntosNuevos} pts` }));
      setResultadosBusqueda(prev => prev.map(p => p.nombre_usuario === nombre_usuario ? { ...p, puntos: data.puntosNuevos } : p));
      cargarParticipantes(password);
    } else {
      setMsgConsumo(prev => ({ ...prev, [nombre_usuario]: `Error: ${data.error}` }));
    }
  }

  // Login
  if (!autenticado) {
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
      <div className="flex gap-2 border-b border-zinc-800 pb-0">
        {([
          { id: 'participantes', label: '👥 Participantes' },
          { id: 'resultados', label: '⚽ Resultados' },
          { id: 'consumos', label: '🍩 Consumos' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2 ${
              tab === t.id ? 'text-white border-green-500' : 'text-zinc-400 border-transparent hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Participantes */}
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
                      <td className="px-4 py-3 font-semibold text-white">@{p.nombre_usuario}</td>
                      <td className="px-4 py-3 text-zinc-300">{p.nombre_completo}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono">{p.dni}</td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/54${p.whatsapp}`} target="_blank" rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300">
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

      {/* Tab: Resultados */}
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

      {/* Tab: Consumos */}
      {tab === 'consumos' && (
        <div className="space-y-4">
          <div>
            <p className="text-zinc-400 text-sm">Buscá al cliente que vino al local durante un partido y dale +1 punto.</p>
          </div>
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
    </div>
  );
}
