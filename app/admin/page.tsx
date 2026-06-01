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
  fuera_premios: number;
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

type Tab = 'participantes' | 'resultados' | 'consumos' | 'admins' | 'auditoria';

interface AuditEntry {
  id: number;
  admin_id: number;
  admin_nombre: string;
  accion: string;
  detalle: string;
  created_at: string;
}

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
  const [togglingPremios, setTogglingPremios] = useState<number | null>(null);

  // Resultados
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Record<number, { local: string; visitante: string }>>({});
  const [loadingPartidos, setLoadingPartidos] = useState(false);
  const [mensajes, setMensajes] = useState<Record<number, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Consumos
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ParticipanteBusqueda[]>([]);
  const [msgConsumo, setMsgConsumo] = useState<Record<string, string>>({});

  // Admins
  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [resultadosAdmin, setResultadosAdmin] = useState<ParticipanteBusqueda[]>([]);
  const [msgAdmin, setMsgAdmin] = useState<Record<number, string>>({});

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState(0);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    const participanteId = localStorage.getItem('prode_id');
    const token = localStorage.getItem('prode_token');

    // Sin sesión → login
    if (!participanteId || !token) {
      window.location.href = '/login';
      return;
    }

    // Validar nivel REAL contra el servidor (no confiar en localStorage)
    (async () => {
      try {
        const res = await fetch('/api/admin/me', {
          headers: { 'x-admin-participante-id': participanteId, 'x-session-token': token },
        });
        const data = await res.json();
        const level = data.level ?? 0;

        if (level < 1) {
          // Sesión inválida o sin permisos de admin
          window.location.href = '/mi-prode';
          return;
        }

        // Sincronizar localStorage con el nivel real
        localStorage.setItem('prode_admin', String(level));
        setAuthMode('participant');
        setAdminLevel(level);
        setIsSuperAdmin(level >= 3);

        if (level >= 2) {
          cargarParticipantes(participanteId);
          cargarPartidos();
        } else {
          setTab('consumos');
        }
      } catch {
        window.location.href = '/mi-prode';
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function getHeaders(): Record<string, string> {
    return {
      'x-admin-participante-id': localStorage.getItem('prode_id') ?? '',
      'x-session-token': localStorage.getItem('prode_token') ?? '',
    };
  }

  async function cargarParticipantes(pid?: string) {
    setLoadingParts(true);
    const id = pid ?? localStorage.getItem('prode_id') ?? '';
    const res = await fetch('/api/admin/participantes', {
      headers: { 'x-admin-participante-id': id, 'x-session-token': localStorage.getItem('prode_token') ?? '' },
    });
    if (res.status === 401) { window.location.href = '/login'; return; }
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

  async function cargarAuditLog() {
    setLoadingAudit(true);
    const res = await fetch('/api/admin/audit', { headers: getHeaders() });
    const data = await res.json();
    setAuditLog(Array.isArray(data) ? data : []);
    setLoadingAudit(false);
  }

  async function sincronizarResultados() {
    setSyncing(true);
    setSyncMsg('');
    const res = await fetch('/api/admin/sync-resultados', {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    setSyncing(false);
    if (data.ok) {
      const n = data.actualizados ?? 0;
      setSyncMsg(n > 0
        ? `✓ ${n} partido${n > 1 ? 's' : ''} actualizado${n > 1 ? 's' : ''}: ${(data.log ?? []).join(' | ')}`
        : '✓ Sin partidos nuevos para actualizar'
      );
      if (n > 0) { cargarPartidos(); cargarParticipantes(); }
    } else {
      setSyncMsg(`✗ ${data.error ?? 'Error desconocido'}`);
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

  async function setRol(id: number, nuevoNivel: number) {
    const res = await fetch('/api/admin/participantes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id, is_admin: nuevoNivel }),
    });
    const data = await res.json();
    const roles = ['', 'admin', 'moderador', 'superadmin'];
    if (data.ok) {
      setMsgAdmin(prev => ({ ...prev, [id]: nuevoNivel === 0 ? '✓ Sin rol de admin' : `✓ Rol: ${roles[nuevoNivel]}` }));
      cargarParticipantes();
    } else {
      setMsgAdmin(prev => ({ ...prev, [id]: `Error: ${data.error}` }));
    }
  }

  async function setFueraPremios(id: number, fuera: boolean) {
    setTogglingPremios(id);
    const res = await fetch('/api/admin/participantes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id, fuera_premios: fuera ? 1 : 0 }),
    });
    setTogglingPremios(null);
    if ((await res.json()).ok) {
      // Optimista: actualizar la fila localmente sin recargar todo
      setParticipantes(prev => prev.map(p => p.id === id ? { ...p, fuera_premios: fuera ? 1 : 0 } : p));
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Panel Admin</h1>
          {adminLevel >= 3 && <span className="text-xs bg-amber-400/15 border border-amber-400/30 text-amber-400 px-2.5 py-1 rounded-full font-bold">⭐ superadmin</span>}
          {adminLevel === 2 && <span className="text-xs bg-blue-400/15 border border-blue-400/30 text-blue-400 px-2.5 py-1 rounded-full font-bold">🛡️ moderador</span>}
          {adminLevel === 1 && <span className="text-xs bg-zinc-700 border border-zinc-600 text-zinc-300 px-2.5 py-1 rounded-full font-bold">admin</span>}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {stats && isSuperAdmin && (
            <div className="flex gap-4 text-sm text-zinc-400">
              <span><strong className="text-white">{stats.total}</strong> inscriptos</span>
              <span><strong className="text-white">{stats.conPredicciones as number}</strong> con predicciones</span>
              <span><strong className="text-white">{jugados.length}</strong> partidos jugados</span>
            </div>
          )}
          <button
            onClick={() => cargarParticipantes()}
            disabled={loadingParts}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loadingParts ? '⏳' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Tabs por nivel: 1=consumos, 2=+participantes+resultados, 3=+admins+auditoría */}
      <div className="flex gap-2 border-b border-zinc-800 pb-0 flex-wrap">
        {([
          { id: 'participantes', label: '👥 Participantes', minLevel: 2 },
          { id: 'resultados',    label: '⚽ Resultados',    minLevel: 2 },
          { id: 'consumos',      label: '🍩 Consumos',      minLevel: 1 },
          { id: 'admins',        label: '🔑 Admins',        minLevel: 3 },
          { id: 'auditoria',     label: '📋 Auditoría',     minLevel: 3 },
        ] as { id: Tab; label: string; minLevel: number }[])
          .filter(t => adminLevel >= t.minLevel)
          .map(t => (
            <button key={t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'auditoria' && auditLog.length === 0) cargarAuditLog();
              }}
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
          {isSuperAdmin && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2.5 text-xs text-amber-200/90 flex items-center gap-2">
              <span>🏠</span>
              <span>Tocá <strong>&quot;🏆 compite&quot;</strong> en cualquier persona para marcarla como <strong>fuera de premios</strong> (vos, tu familia, el staff). Siguen jugando y aparecen en la tabla, pero no ganan premios.</span>
            </div>
          )}
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
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

                    const esSuperAdmin = (p.is_admin as number) >= 2;
                    return (
                      <tr key={p.id} className={`border-b border-zinc-800/50 last:border-0 transition-colors ${esSuperAdmin ? 'bg-amber-400/5' : 'hover:bg-zinc-800/20'}`}>
                        <td className="px-3 py-3 text-zinc-500 font-mono">{i + 1}</td>
                        <td className="px-3 py-3 font-semibold text-white">
                          <div className="flex items-center gap-1">
                            @{p.nombre_usuario}
                            {esSuperAdmin
                              ? <span className="text-xs text-amber-400">⭐</span>
                              : p.is_admin ? <span className="text-xs text-amber-400">🔑</span> : null}
                          </div>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setFueraPremios(p.id, !p.fuera_premios)}
                              disabled={togglingPremios === p.id}
                              title={p.fuera_premios ? 'No compite por premios — click para que compita' : 'Compite por premios — click para excluir'}
                              className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                                p.fuera_premios
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                              }`}
                            >
                              {togglingPremios === p.id ? '…' : p.fuera_premios ? '🏠 sin premios' : '🏆 compite'}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-zinc-300">{p.nombre_completo}</td>
                        <td className="px-3 py-3 text-zinc-400 font-mono">{p.dni}</td>
                        <td className="px-3 py-3">
                          <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300 underline underline-offset-2">
                            {p.whatsapp}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-zinc-400 break-all">{p.mail}</td>
                        <td className="px-3 py-3">
                          {isSuperAdmin ? (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => ajustarPuntosRapido(p.nombre_usuario, p.id, -1)} disabled={ajustando === p.id}
                                className="w-6 h-6 flex items-center justify-center rounded bg-red-500/15 hover:bg-red-500/35 text-red-400 text-sm font-bold transition-colors disabled:opacity-40">−</button>
                              <span className={`font-bold w-7 text-center tabular-nums ${p.puntos > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                {ajustando === p.id ? '…' : p.puntos}
                              </span>
                              <button onClick={() => ajustarPuntosRapido(p.nombre_usuario, p.id, 1)} disabled={ajustando === p.id}
                                className="w-6 h-6 flex items-center justify-center rounded bg-green-500/15 hover:bg-green-500/35 text-green-400 text-sm font-bold transition-colors disabled:opacity-40">+</button>
                            </div>
                          ) : (
                            <span className={`font-bold text-right block pr-2 tabular-nums ${p.puntos > 0 ? 'text-green-400' : 'text-zinc-500'}`}>{p.puntos}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-zinc-500 text-xs whitespace-nowrap">{formatFechaHora(p.created_at)}</td>
                        <td className="px-3 py-3">
                          {esSuperAdmin ? (
                            <span className="text-xs text-amber-400/60 font-semibold pr-2">🔒 protegido</span>
                          ) : !isSuperAdmin ? (
                            <span className="text-xs text-zinc-600 pr-2">—</span>
                          ) : isConfirmingDelete ? (
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

          {/* Sync automático */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-white">🔄 Sincronización automática</p>
              <p className="text-xs text-zinc-500 mt-0.5">Trae resultados reales de football-data.org y calcula puntos</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {syncMsg && (
                <span className={`text-xs font-medium max-w-xs ${syncMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                  {syncMsg}
                </span>
              )}
              <button
                onClick={sincronizarResultados}
                disabled={syncing}
                className="bg-green-500 hover:bg-green-400 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar ahora'}
              </button>
            </div>
          </div>

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
                      <span className="text-sm font-medium truncate flex-1 text-right min-w-0">{partido.equipo_local}</span>
                      <input type="number" min={0} max={20} value={resultados[partido.id]?.local ?? ''}
                        onChange={e => setResultados(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], local: e.target.value } }))}
                        className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-base focus:outline-none focus:border-green-500 shrink-0" />
                      <span className="text-zinc-500 shrink-0">-</span>
                      <input type="number" min={0} max={20} value={resultados[partido.id]?.visitante ?? ''}
                        onChange={e => setResultados(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], visitante: e.target.value } }))}
                        className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-base focus:outline-none focus:border-green-500 shrink-0" />
                      <span className="text-sm font-medium truncate flex-1 min-w-0">{partido.equipo_visitante}</span>
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

      {/* ── Tab: Auditoría ────────────────────────────────────── */}
      {tab === 'auditoria' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Registro de todas las acciones de los administradores.</p>
            </div>
            <button onClick={cargarAuditLog} disabled={loadingAudit}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loadingAudit ? '⏳' : '🔄 Actualizar'}
            </button>
          </div>

          {loadingAudit ? (
            <p className="text-zinc-500 py-8 text-center">Cargando...</p>
          ) : auditLog.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="text-4xl mb-3">📋</div>
              <p>Sin actividad registrada todavía.</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Admin</th>
                    <th className="text-left px-4 py-3 font-medium">Acción</th>
                    <th className="text-left px-4 py-3 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                      <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-400 text-xs">@{entry.admin_nombre}</td>
                      <td className="px-4 py-3 text-white text-xs">{entry.accion}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{entry.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Admins ────────────────────────────────────────── */}
      {tab === 'admins' && (
        <div className="space-y-6">

          {/* Admins actuales */}
          <section className="space-y-3">
            <h2 className="font-semibold text-zinc-300">Con rol admin ({adminsActuales.length})</h2>
            {adminsActuales.length === 0 ? (
              <p className="text-zinc-500 text-sm">No hay admins asignados todavía.</p>
            ) : (
              <div className="space-y-2">
                {adminsActuales.map(p => {
                  const nivel = p.is_admin as number;
                  const esSA = nivel >= 3;
                  const rolLabel = nivel >= 3 ? '⭐ superadmin' : nivel === 2 ? '🛡️ moderador' : '🔑 admin';
                  return (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                        <span className="text-zinc-400 text-sm ml-2">{p.nombre_completo}</span>
                        <span className={`ml-2 text-xs ${esSA ? 'text-amber-400' : nivel === 2 ? 'text-blue-400' : 'text-zinc-400'}`}>{rolLabel}</span>
                      </div>
                      {!esSA && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {msgAdmin[p.id] && <span className="text-xs text-green-400">{msgAdmin[p.id]}</span>}
                          {nivel !== 1 && <button onClick={() => setRol(p.id, 1)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2.5 py-1 rounded text-xs font-semibold">→ Admin</button>}
                          {nivel !== 2 && <button onClick={() => setRol(p.id, 2)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded text-xs font-semibold">→ Moderador</button>}
                          <button onClick={() => setRol(p.id, 0)} className="bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-xs font-semibold">Quitar rol</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Asignar rol a usuario */}
          <section className="space-y-3">
            <h2 className="font-semibold text-zinc-300">Asignar rol a un participante</h2>
            <input type="text" value={busquedaAdmin} onChange={e => buscarAdmin(e.target.value)}
              placeholder="Buscar por usuario o nombre..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500" />
            {resultadosAdmin.length > 0 && (
              <div className="space-y-2">
                {resultadosAdmin.map(p => {
                  const nivelActual = (adminsActuales.find(a => a.id === p.id)?.is_admin as number) ?? 0;
                  const esSA = nivelActual >= 3;
                  return (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                        <span className="text-zinc-400 text-sm ml-2">{p.nombre_completo}</span>
                        {nivelActual > 0 && !esSA && <span className="ml-2 text-zinc-500 text-xs">actual: {nivelActual === 2 ? 'moderador' : 'admin'}</span>}
                      </div>
                      {!esSA && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {msgAdmin[p.id] && <span className="text-xs text-green-400">{msgAdmin[p.id]}</span>}
                          {nivelActual !== 1 && <button onClick={() => setRol(p.id, 1)} className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold">Admin</button>}
                          {nivelActual !== 2 && <button onClick={() => setRol(p.id, 2)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold">Moderador</button>}
                          {nivelActual > 0 && <button onClick={() => setRol(p.id, 0)} className="bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold">Quitar</button>}
                        </div>
                      )}
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
