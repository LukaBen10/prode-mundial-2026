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

interface CamposEdicion {
  nombre_completo: string;
  nombre_usuario: string;
  mail: string;
  whatsapp: string;
  dni: string;
  puntos: string;
}

type Tab = 'participantes' | 'resultados' | 'consumos' | 'admins';

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function waLink(numero: string): string {
  const clean = numero.replace(/\D/g, '').replace(/^0+/, '');
  return `https://wa.me/549${clean}`;
}

const inputCell = "w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-green-500 min-w-0";

export default function AdminPage() {
  const [authMode, setAuthMode] = useState<'participant' | null>(null);
  const [tab, setTab] = useState<Tab>('participantes');

  // Participantes
  const [participantes, setParticipantes] = useState<ParticipanteCompleto[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingParts, setLoadingParts] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [editando, setEditando] = useState<{ id: number; campos: CamposEdicion } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [msgEdit, setMsgEdit] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [ajustando, setAjustando] = useState<number | null>(null);

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
    const isAdmin = localStorage.getItem('prode_admin') === '1';
    const participanteId = localStorage.getItem('prode_id');
    if (isAdmin && participanteId) {
      setAuthMode('participant');
      cargarParticipantes(participanteId);
      cargarPartidos();
    } else {
      window.location.href = participanteId ? '/mi-prode' : '/login';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling cada 20 segundos — actualiza stats, participantes y partidos en vivo
  useEffect(() => {
    if (!authMode) return;
    const interval = setInterval(() => {
      cargarParticipantes();
      cargarPartidos();
    }, 20000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode]);

  function getHeaders(): Record<string, string> {
    return { 'x-admin-participante-id': localStorage.getItem('prode_id') ?? '' };
  }

  async function cargarParticipantes(pid?: string) {
    setLoadingParts(true);
    const id = pid ?? localStorage.getItem('prode_id') ?? '';
    const res = await fetch('/api/admin/participantes', {
      headers: { 'x-admin-participante-id': id },
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

  // ── Editar participante ──────────────────────────────────────────
  function iniciarEdicion(p: ParticipanteCompleto) {
    setEditando({
      id: p.id,
      campos: {
        nombre_completo: p.nombre_completo,
        nombre_usuario: p.nombre_usuario,
        mail: p.mail,
        whatsapp: p.whatsapp,
        dni: p.dni,
        puntos: String(p.puntos),
      },
    });
    setMsgEdit('');
    setConfirmDelete(null);
  }

  function cancelarEdicion() {
    setEditando(null);
    setMsgEdit('');
  }

  async function guardarEdicion() {
    if (!editando) return;
    setSavingEdit(true);
    const res = await fetch('/api/admin/participantes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({
        id: editando.id,
        ...editando.campos,
        puntos: parseInt(editando.campos.puntos) || 0,
      }),
    });
    const data = await res.json();
    setSavingEdit(false);
    if (data.ok) {
      setEditando(null);
      setMsgEdit('');
      cargarParticipantes();
    } else {
      setMsgEdit(data.error ?? 'Error al guardar');
    }
  }

  // ── Eliminar participante ────────────────────────────────────────
  async function eliminarParticipante(id: number) {
    setDeletingId(id);
    const res = await fetch('/api/admin/participantes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setDeletingId(null);
    setConfirmDelete(null);
    if (data.ok) {
      cargarParticipantes();
    } else {
      alert(`Error: ${data.error}`);
    }
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
      cargarParticipantes();
    } else {
      setMensajes(prev => ({ ...prev, [partidoId]: `Error: ${data.error}` }));
    }
  }

  async function ajustarPuntosRapido(nombre_usuario: string, id: number, delta: number) {
    setAjustando(id);
    const res = await fetch('/api/admin/puntos-extra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ nombre_usuario, puntos: delta }),
    });
    setAjustando(null);
    if ((await res.json()).ok) cargarParticipantes();
  }

  async function buscarParticipante(q: string) {
    setBusqueda(q);
    if (q.length < 2) { setResultadosBusqueda([]); return; }
    const res = await fetch(`/api/admin/puntos-extra?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
    const data = await res.json();
    setResultadosBusqueda(Array.isArray(data) ? data : []);
  }

  async function darPuntoConsumo(nombre_usuario: string, delta: number = 1) {
    const res = await fetch('/api/admin/puntos-extra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ nombre_usuario, puntos: delta }),
    });
    const data = await res.json();
    if (data.ok) {
      const signo = delta > 0 ? '+' : '';
      setMsgConsumo(prev => ({ ...prev, [nombre_usuario]: `✓ ${signo}${delta} pt → total: ${data.puntosNuevos} pts` }));
      setResultadosBusqueda(prev => prev.map(p => p.nombre_usuario === nombre_usuario ? { ...p, puntos: data.puntosNuevos } : p));
      cargarParticipantes();
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
      cargarParticipantes();
    } else {
      setMsgAdmin(prev => ({ ...prev, [id]: `Error: ${data.error}` }));
    }
  }

  if (!authMode) {
    return <div className="text-center py-20 text-zinc-500">Verificando acceso...</div>;
  }

  const pendientes = partidos.filter(p => !p.jugado);
  const jugados = partidos.filter(p => p.jugado);
  const participantesFiltrados = participantes.filter(p =>
    !filtroBusqueda ||
    p.nombre_completo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    p.nombre_usuario.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    p.dni.includes(filtroBusqueda) ||
    p.mail.toLowerCase().includes(filtroBusqueda.toLowerCase())
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
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="text-left px-3 py-3 font-medium">#</th>
                    <th className="text-left px-3 py-3 font-medium">Usuario</th>
                    <th className="text-left px-3 py-3 font-medium">Nombre completo</th>
                    <th className="text-left px-3 py-3 font-medium">DNI</th>
                    <th className="text-left px-3 py-3 font-medium">WhatsApp</th>
                    <th className="text-left px-3 py-3 font-medium">Mail</th>
                    <th className="text-right px-3 py-3 font-medium">Pts</th>
                    <th className="text-right px-3 py-3 font-medium">Inscripto</th>
                    <th className="text-right px-3 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {participantesFiltrados.map((p, i) => {
                    const isEditing = editando?.id === p.id;
                    const isConfirmingDelete = confirmDelete === p.id;
                    const isDeleting = deletingId === p.id;

                    if (isEditing) {
                      // Fila en modo edición
                      const c = editando.campos;
                      return (
                        <tr key={p.id} className="border-b border-zinc-800/50 bg-zinc-800/30">
                          <td className="px-3 py-2 text-zinc-500 font-mono">{i + 1}</td>
                          <td className="px-3 py-2">
                            <input className={inputCell} value={c.nombre_usuario}
                              onChange={e => setEditando(prev => prev && ({ ...prev, campos: { ...prev.campos, nombre_usuario: e.target.value } }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={inputCell} value={c.nombre_completo}
                              onChange={e => setEditando(prev => prev && ({ ...prev, campos: { ...prev.campos, nombre_completo: e.target.value } }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={inputCell} value={c.dni}
                              onChange={e => setEditando(prev => prev && ({ ...prev, campos: { ...prev.campos, dni: e.target.value } }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={inputCell} value={c.whatsapp}
                              onChange={e => setEditando(prev => prev && ({ ...prev, campos: { ...prev.campos, whatsapp: e.target.value } }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={inputCell} value={c.mail}
                              onChange={e => setEditando(prev => prev && ({ ...prev, campos: { ...prev.campos, mail: e.target.value } }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={`${inputCell} w-14 text-right`} type="number" value={c.puntos}
                              onChange={e => setEditando(prev => prev && ({ ...prev, campos: { ...prev.campos, puntos: e.target.value } }))} />
                          </td>
                          <td className="px-3 py-2 text-zinc-500 text-xs text-right">{formatFechaHora(p.created_at)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {msgEdit && <span className="text-xs text-red-400 mr-1">{msgEdit}</span>}
                              <button onClick={guardarEdicion} disabled={savingEdit}
                                className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                {savingEdit ? '...' : 'Guardar'}
                              </button>
                              <button onClick={cancelarEdicion}
                                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2.5 py-1 rounded text-xs font-semibold">
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={p.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-3 py-3 text-zinc-500 font-mono">{i + 1}</td>
                        <td className="px-3 py-3 font-semibold text-white">
                          @{p.nombre_usuario}
                          {p.is_admin ? <span className="ml-1 text-xs text-amber-400">🔑</span> : null}
                        </td>
                        <td className="px-3 py-3 text-zinc-300">{p.nombre_completo}</td>
                        <td className="px-3 py-3 text-zinc-400 font-mono">{p.dni}</td>
                        <td className="px-3 py-3">
                          <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 underline underline-offset-2">
                            {p.whatsapp}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-zinc-400">{p.mail}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => ajustarPuntosRapido(p.nombre_usuario, p.id, -1)}
                              disabled={ajustando === p.id}
                              className="w-6 h-6 flex items-center justify-center rounded bg-red-500/15 hover:bg-red-500/35 text-red-400 text-sm font-bold transition-colors disabled:opacity-40"
                            >−</button>
                            <span className={`font-bold w-7 text-center tabular-nums ${p.puntos > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                              {ajustando === p.id ? '…' : p.puntos}
                            </span>
                            <button
                              onClick={() => ajustarPuntosRapido(p.nombre_usuario, p.id, 1)}
                              disabled={ajustando === p.id}
                              className="w-6 h-6 flex items-center justify-center rounded bg-green-500/15 hover:bg-green-500/35 text-green-400 text-sm font-bold transition-colors disabled:opacity-40"
                            >+</button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-zinc-500 text-xs whitespace-nowrap">{formatFechaHora(p.created_at)}</td>
                        <td className="px-3 py-3">
                          {isConfirmingDelete ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-xs text-red-400 mr-1">¿Eliminar?</span>
                              <button onClick={() => eliminarParticipante(p.id)} disabled={isDeleting}
                                className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-semibold">
                                {isDeleting ? '...' : 'Sí'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2.5 py-1 rounded text-xs font-semibold">
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => iniciarEdicion(p)}
                                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-2.5 py-1 rounded text-xs font-semibold transition-colors">
                                Editar
                              </button>
                              <button onClick={() => { setConfirmDelete(p.id); setEditando(null); }}
                                className="bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-xs font-semibold transition-colors">
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                        onChange={e => setResultados(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], local: e.target.value } }))}
                        className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-green-500" />
                      <span className="text-zinc-500">-</span>
                      <input type="number" min={0} max={20} value={resultados[partido.id]?.visitante ?? ''}
                        onChange={e => setResultados(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], visitante: e.target.value } }))}
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
          <p className="text-zinc-400 text-sm">Buscá al cliente y sumale o restale puntos de visita al local.</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold min-w-[50px] text-right">{p.puntos} pts</span>
                    <button onClick={() => darPuntoConsumo(p.nombre_usuario, -1)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                      −1
                    </button>
                    <button onClick={() => darPuntoConsumo(p.nombre_usuario, 1)}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                      +1
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
                      <button onClick={() => toggleAdmin(p.id, false)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        Quitar admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
                          <button onClick={() => toggleAdmin(p.id, true)}
                            className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
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
