'use client';

import { useState, useEffect, useRef } from 'react';
import { TODOS_LOS_EQUIPOS, FASES_ELIM } from '@/lib/data/partidos';

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
  donas_especiales?: number;
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
  num_partido?: number;
  estadio?: string;
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

type Tab = 'participantes' | 'resultados' | 'consumos' | 'predicciones' | 'admins' | 'auditoria' | 'mensajes';

interface MensajeContacto {
  id: number;
  nombre: string;
  contacto: string;
  mensaje: string;
  leido: number;
  created_at: string;
}

interface PredAdmin {
  participante_id: number;
  nombre_usuario: string;
  nombre_completo: string;
  grupo: string;
  fase: string;
  fecha: string;
  equipo_local: string;
  equipo_visitante: string;
  pred_local: number;
  pred_visitante: number;
  puntos: number;
  real_local: number | null;
  real_visitante: number | null;
  jugado: number;
}

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

const inputCell = "w-full bg-violet-950/65 border border-violet-400/40 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400 min-w-0";

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
  const [crucesEdit, setCrucesEdit] = useState<Record<number, { local: string; visitante: string }>>({});
  const [cruceMsg, setCruceMsg] = useState<Record<number, string>>({});
  // Auto-guardado de resultados (reemplaza el botón Guardar)
  const [guardandoAuto, setGuardandoAuto] = useState<Record<number, boolean>>({});
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const visitanteRefs = useRef<Record<number, HTMLInputElement | null>>({});
  useEffect(() => {
    const timers = saveTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);
  const [filtroJugados, setFiltroJugados] = useState('');

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

  // Predicciones
  const [predicciones, setPredicciones] = useState<PredAdmin[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(false);
  const [personaExpandida, setPersonaExpandida] = useState<number | null>(null);
  const [filtroPreds, setFiltroPreds] = useState('');

  // Mensajes de contacto
  const [mensajesContacto, setMensajesContacto] = useState<MensajeContacto[]>([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [confirmDelMsg, setConfirmDelMsg] = useState<number | null>(null);

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

  async function cargarPredicciones() {
    setLoadingPreds(true);
    const res = await fetch('/api/admin/predicciones', { headers: getHeaders() });
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    setPredicciones(Array.isArray(data) ? data : []);
    setLoadingPreds(false);
  }

  function exportarPrediccionesCSV() {
    const headers = ['Usuario', 'Nombre completo', 'Fase/Grupo', 'Fecha', 'Partido', 'Pronóstico', 'Resultado real', 'Puntos'];
    const filas = predicciones.map(p => [
      p.nombre_usuario,
      p.nombre_completo,
      p.grupo ? `Grupo ${p.grupo}` : (p.fase || ''),
      p.fecha,
      `${p.equipo_local || 'Por definir'} vs ${p.equipo_visitante || 'Por definir'}`,
      `${p.pred_local}-${p.pred_visitante}`,
      p.jugado ? `${p.real_local}-${p.real_visitante}` : 'sin jugar',
      String(p.puntos ?? 0),
    ]);
    // Separador ; y BOM para que Excel (config. español) lo abra en columnas con tildes
    const csv = [headers, ...filas]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicciones-prode-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function cargarMensajes() {
    setLoadingMensajes(true);
    const res = await fetch('/api/admin/mensajes', { headers: getHeaders() });
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    setMensajesContacto(Array.isArray(data) ? data : []);
    setLoadingMensajes(false);
  }

  async function marcarLeido(id: number, leido: boolean) {
    await fetch('/api/admin/mensajes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id, leido }),
    });
    setMensajesContacto(prev => prev.map(m => m.id === id ? { ...m, leido: leido ? 1 : 0 } : m));
  }

  async function eliminarMensaje(id: number) {
    await fetch('/api/admin/mensajes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id }),
    });
    setMensajesContacto(prev => prev.filter(m => m.id !== id));
    setConfirmDelMsg(null);
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

  async function guardarCruce(partidoId: number, actualLocal: string, actualVisitante: string) {
    const edit = crucesEdit[partidoId];
    const local = edit?.local ?? actualLocal;
    const visitante = edit?.visitante ?? actualVisitante;
    const res = await fetch('/api/admin/partido', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ partido_id: partidoId, equipo_local: local, equipo_visitante: visitante }),
    });
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    if (data.ok) {
      setCruceMsg(prev => ({ ...prev, [partidoId]: '✓ Guardado' }));
      cargarPartidos();
    } else {
      setCruceMsg(prev => ({ ...prev, [partidoId]: `Error: ${data.error}` }));
    }
  }

  async function cargarResultado(partidoId: number, valores?: { local: string; visitante: string }) {
    const res = valores ?? resultados[partidoId];
    if (!res) return;
    setGuardandoAuto(prev => ({ ...prev, [partidoId]: true }));
    const r = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ partido_id: partidoId, goles_local: parseInt(res.local) || 0, goles_visitante: parseInt(res.visitante) || 0 }),
    });
    const data = await r.json();
    setGuardandoAuto(prev => ({ ...prev, [partidoId]: false }));
    if (data.ok) {
      setMensajes(prev => ({ ...prev, [partidoId]: `✓ ${data.prediccionesActualizadas} predicciones actualizadas` }));
      cargarPartidos();
      cargarParticipantes();
    } else {
      setMensajes(prev => ({ ...prev, [partidoId]: `Error: ${data.error}` }));
    }
  }

  // Cuando ya hay goles en los dos campos, guarda solo tras una breve pausa (debounce).
  function programarAutoguardado(partidoId: number, local: string, visitante: string) {
    if (saveTimers.current[partidoId]) clearTimeout(saveTimers.current[partidoId]);
    if (local.trim() === '' || visitante.trim() === '') return; // espera a que estén los dos goles
    saveTimers.current[partidoId] = setTimeout(() => {
      cargarResultado(partidoId, { local, visitante });
    }, 800);
  }

  // Fila editable de un partido — sirve para pendientes y jugados (cualquiera se puede corregir).
  // Auto-guarda al tener los dos goles y salta solo del local al visitante para anotar más rápido.
  const filaPartido = (partido: Partido) => (
    <div key={partido.id} className={`border rounded-xl p-4 ${partido.jugado ? 'bg-violet-950/50 border-amber-400/25' : 'bg-violet-950/70 border-white/15'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-violet-300 w-16 shrink-0">{formatFecha(partido.fecha)}</span>
        <span className="text-xs bg-violet-950/65 text-violet-300 px-2 py-0.5 rounded shrink-0">G {partido.grupo}</span>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate flex-1 text-right min-w-0">{partido.equipo_local}</span>
          <input type="number" inputMode="numeric" min={0} max={20} value={resultados[partido.id]?.local ?? ''}
            onChange={e => {
              const local = e.target.value;
              setResultados(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], local } }));
              programarAutoguardado(partido.id, local, resultados[partido.id]?.visitante ?? '');
              if (local.length === 1) visitanteRefs.current[partido.id]?.focus(); // auto-avance al visitante
            }}
            className="w-12 h-10 text-center bg-violet-950/65 border border-violet-400/40 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-amber-400 shrink-0" />
          <span className="text-violet-300 shrink-0">-</span>
          <input type="number" inputMode="numeric" min={0} max={20} value={resultados[partido.id]?.visitante ?? ''}
            ref={el => { visitanteRefs.current[partido.id] = el; }}
            onChange={e => {
              const visitante = e.target.value;
              setResultados(prev => ({ ...prev, [partido.id]: { ...prev[partido.id], visitante } }));
              programarAutoguardado(partido.id, resultados[partido.id]?.local ?? '', visitante);
            }}
            className="w-12 h-10 text-center bg-violet-950/65 border border-violet-400/40 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-amber-400 shrink-0" />
          <span className="text-sm font-medium truncate flex-1 min-w-0">{partido.equipo_visitante}</span>
        </div>
        <span className="text-xs shrink-0 w-24 text-right" aria-live="polite">
          {guardandoAuto[partido.id]
            ? <span className="text-amber-400 animate-pulse">💾 Guardando…</span>
            : partido.jugado
              ? <span className="text-emerald-400/80">✓ Cargado</span>
              : <span className="text-violet-400/70">Se guarda solo</span>}
        </span>
      </div>
      {mensajes[partido.id] && <p className="text-xs text-amber-400 mt-2 pl-20">{mensajes[partido.id]}</p>}
    </div>
  );

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

  async function darDona(p: ParticipanteBusqueda, delta: number) {
    const res = await fetch('/api/admin/donas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ id: p.id, delta }),
    });
    const data = await res.json();
    if (data.ok) {
      setResultadosBusqueda(prev => prev.map(x => x.id === p.id ? { ...x, donas_especiales: data.donas, puntos: data.puntos } : x));
      if (data.deltaPuntos > 0) setMsgConsumo(prev => ({ ...prev, [p.nombre_usuario]: '🍩 ¡4 donas! +1 punto' }));
      else if (data.deltaPuntos < 0) setMsgConsumo(prev => ({ ...prev, [p.nombre_usuario]: '🍩 −1 punto' }));
      cargarParticipantes();
    } else {
      setMsgConsumo(prev => ({ ...prev, [p.nombre_usuario]: `Error: ${data.error}` }));
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
    if (res.status === 401) { window.location.href = '/login'; return; }
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
    return <div className="text-center py-20 text-violet-300">Verificando acceso...</div>;
  }

  // Pendientes de cargar resultado: no jugados y con equipos ya definidos
  const pendientes = partidos.filter(p => !p.jugado && p.equipo_local && p.equipo_visitante);
  const jugados = partidos.filter(p => p.jugado);
  const jugadosFiltrados = filtroJugados.trim()
    ? jugados.filter(p => `${p.equipo_local} ${p.equipo_visitante}`.toLowerCase().includes(filtroJugados.trim().toLowerCase()))
    : jugados;
  // Partidos de eliminatoria (num 73-104) para definir cruces a mano
  const eliminatorias = partidos.filter(p => (p.num_partido ?? 0) >= 73);

  // Predicciones agrupadas por persona (para la tab Predicciones)
  const prediccionesPorPersona = (() => {
    const map = new Map<number, { id: number; usuario: string; nombre: string; preds: PredAdmin[]; puntos: number }>();
    for (const p of predicciones) {
      if (!map.has(p.participante_id)) {
        map.set(p.participante_id, { id: p.participante_id, usuario: p.nombre_usuario, nombre: p.nombre_completo, preds: [], puntos: 0 });
      }
      const g = map.get(p.participante_id)!;
      g.preds.push(p);
      g.puntos += p.puntos ?? 0;
    }
    return Array.from(map.values());
  })();
  const prediccionesPorPersonaFiltradas = prediccionesPorPersona.filter(g =>
    !filtroPreds ||
    g.usuario.toLowerCase().includes(filtroPreds.toLowerCase()) ||
    g.nombre.toLowerCase().includes(filtroPreds.toLowerCase())
  );
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
          {adminLevel === 1 && <span className="text-xs bg-violet-800/70 border border-violet-400/40 text-violet-200 px-2.5 py-1 rounded-full font-bold">admin</span>}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {stats && isSuperAdmin && (
            <div className="flex gap-4 text-sm text-violet-300">
              <span><strong className="text-white">{stats.total}</strong> inscriptos</span>
              <span><strong className="text-white">{stats.conPredicciones as number}</strong> con predicciones</span>
              <span><strong className="text-white">{jugados.length}</strong> partidos jugados</span>
            </div>
          )}
          <button
            onClick={() => cargarParticipantes()}
            disabled={loadingParts}
            className="text-xs bg-violet-950/65 hover:bg-violet-800/60 border border-violet-400/40 text-violet-200 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loadingParts ? '⏳' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Tabs por nivel: 1=consumos, 2=+participantes+resultados, 3=+admins+auditoría */}
      <div className="flex gap-2 border-b border-white/15 pb-0 flex-wrap">
        {([
          { id: 'participantes', label: '👥 Participantes', minLevel: 2 },
          { id: 'resultados',    label: '⚽ Resultados',    minLevel: 2 },
          { id: 'consumos',      label: '🍩 Consumos',      minLevel: 1 },
          { id: 'predicciones',  label: '📝 Predicciones',  minLevel: 2 },
          { id: 'mensajes',      label: '✉️ Mensajes',      minLevel: 3 },
          { id: 'admins',        label: '🔑 Admins',        minLevel: 3 },
          { id: 'auditoria',     label: '📋 Auditoría',     minLevel: 3 },
        ] as { id: Tab; label: string; minLevel: number }[])
          .filter(t => adminLevel >= t.minLevel)
          .map(t => (
            <button key={t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'auditoria' && auditLog.length === 0) cargarAuditLog();
                if (t.id === 'predicciones' && predicciones.length === 0) cargarPredicciones();
                if (t.id === 'mensajes' && mensajesContacto.length === 0) cargarMensajes();
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2 ${
                tab === t.id ? 'text-white border-amber-400' : 'text-violet-300 border-transparent hover:text-white'
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
            className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400" />

          {loadingParts ? (
            <p className="text-violet-300 py-8 text-center">Cargando...</p>
          ) : participantesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-violet-300">
              {participantes.length === 0 ? 'Todavía no se inscribió nadie.' : 'No hay resultados para ese filtro.'}
            </div>
          ) : (
            <div className="bg-violet-950/70 border border-white/15 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-white/15 text-violet-300">
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
                        <tr key={p.id} className="border-b border-white/15 bg-violet-900/55">
                          <td className="px-3 py-2 text-violet-300 font-mono">{i + 1}</td>
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
                          <td className="px-3 py-2 text-violet-300 text-xs text-right">{formatFechaHora(p.created_at)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {msgEdit && <span className="text-xs text-red-400 mr-1">{msgEdit}</span>}
                              <button onClick={guardarEdicion} disabled={savingEdit}
                                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-violet-950 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                {savingEdit ? '...' : 'Guardar'}
                              </button>
                              <button onClick={cancelarEdicion}
                                className="bg-violet-800/70 hover:bg-violet-700 text-violet-200 px-2.5 py-1 rounded text-xs font-semibold">
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const esSuperAdmin = (p.is_admin as number) >= 2;
                    return (
                      <tr key={p.id} className={`border-b border-white/15 last:border-0 transition-colors ${esSuperAdmin ? 'bg-amber-400/5' : 'hover:bg-violet-800/20'}`}>
                        <td className="px-3 py-3 text-violet-300 font-mono">{i + 1}</td>
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
                                  : 'bg-violet-950/65 text-violet-300 border border-violet-400/40 hover:text-violet-200'
                              }`}
                            >
                              {togglingPremios === p.id ? '…' : p.fuera_premios ? '🏠 sin premios' : '🏆 compite'}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-violet-200">{p.nombre_completo}</td>
                        <td className="px-3 py-3 text-violet-300 font-mono">{p.dni}</td>
                        <td className="px-3 py-3">
                          <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                            {p.whatsapp}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-violet-300 break-all">{p.mail}</td>
                        <td className="px-3 py-3">
                          {isSuperAdmin ? (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => ajustarPuntosRapido(p.nombre_usuario, p.id, -1)} disabled={ajustando === p.id}
                                className="w-6 h-6 flex items-center justify-center rounded bg-red-500/15 hover:bg-red-500/35 text-red-400 text-sm font-bold transition-colors disabled:opacity-40">−</button>
                              <span className={`font-bold w-7 text-center tabular-nums ${p.puntos > 0 ? 'text-amber-400' : 'text-violet-300'}`}>
                                {ajustando === p.id ? '…' : p.puntos}
                              </span>
                              <button onClick={() => ajustarPuntosRapido(p.nombre_usuario, p.id, 1)} disabled={ajustando === p.id}
                                className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/15 hover:bg-blue-500/35 text-blue-300 text-sm font-bold transition-colors disabled:opacity-40">+</button>
                            </div>
                          ) : (
                            <span className={`font-bold text-right block pr-2 tabular-nums ${p.puntos > 0 ? 'text-amber-400' : 'text-violet-300'}`}>{p.puntos}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-violet-300 text-xs whitespace-nowrap">{formatFechaHora(p.created_at)}</td>
                        <td className="px-3 py-3">
                          {esSuperAdmin ? (
                            <span className="text-xs text-amber-400/60 font-semibold pr-2">🔒 protegido</span>
                          ) : !isSuperAdmin ? (
                            <span className="text-xs text-violet-400 pr-2">—</span>
                          ) : isConfirmingDelete ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-xs text-red-400 mr-1">¿Eliminar?</span>
                              <button onClick={() => eliminarParticipante(p.id)} disabled={isDeleting}
                                className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-semibold">
                                {isDeleting ? '...' : 'Sí'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="bg-violet-800/70 hover:bg-violet-700 text-violet-200 px-2.5 py-1 rounded text-xs font-semibold">
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => iniciarEdicion(p)}
                                className="bg-violet-800/70 hover:bg-violet-700 text-violet-100 px-2.5 py-1 rounded text-xs font-semibold transition-colors">
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
          <div className="bg-violet-950/70 border border-white/15 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-white">🔄 Sincronización automática</p>
              <p className="text-xs text-violet-300 mt-0.5">Trae resultados reales de football-data.org y calcula puntos</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {syncMsg && (
                <span className={`text-xs font-medium max-w-xs ${syncMsg.startsWith('✓') ? 'text-amber-400' : 'text-red-400'}`}>
                  {syncMsg}
                </span>
              )}
              <button
                onClick={sincronizarResultados}
                disabled={syncing}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-violet-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar ahora'}
              </button>
            </div>
          </div>

          {/* Definir cruces de eliminatoria (a mano, respaldo del auto-sync) */}
          {eliminatorias.length > 0 && (
            <details className="bg-violet-950/70 border border-amber-500/20 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-white flex items-center justify-between gap-2">
                <span>🏆 Definir cruces de eliminatoria</span>
                <span className="text-xs text-violet-300">{eliminatorias.filter(p => p.equipo_local && p.equipo_visitante).length}/{eliminatorias.length} definidos</span>
              </summary>
              <div className="px-4 pb-4 space-y-4 border-t border-white/15 pt-3">
                <p className="text-xs text-violet-300">Normalmente se completan solos con la API. Acá podés definir o corregir quién juega cada partido a mano.</p>
                {FASES_ELIM.map(f => {
                  const pF = eliminatorias.filter(p => p.fase === f.fase);
                  if (pF.length === 0) return null;
                  return (
                    <div key={f.fase} className="space-y-2">
                      <h3 className="text-xs font-bold text-amber-400/80 uppercase tracking-wide">{f.label}</h3>
                      {pF.map(p => {
                        const edit = crucesEdit[p.id];
                        const localVal = edit?.local ?? p.equipo_local;
                        const visitanteVal = edit?.visitante ?? p.equipo_visitante;
                        const selCls = "bg-violet-950/65 border border-violet-400/40 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400 flex-1 min-w-[110px]";
                        return (
                          <div key={p.id} className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-violet-300 w-32 shrink-0">{formatFecha(p.fecha)} · {p.estadio}</span>
                            <select value={localVal} onChange={e => setCrucesEdit(prev => ({ ...prev, [p.id]: { local: e.target.value, visitante: visitanteVal } }))} className={selCls}>
                              <option value="">Por definir</option>
                              {TODOS_LOS_EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                            </select>
                            <span className="text-violet-300 text-xs">vs</span>
                            <select value={visitanteVal} onChange={e => setCrucesEdit(prev => ({ ...prev, [p.id]: { local: localVal, visitante: e.target.value } }))} className={selCls}>
                              <option value="">Por definir</option>
                              {TODOS_LOS_EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                            </select>
                            <button onClick={() => guardarCruce(p.id, p.equipo_local, p.equipo_visitante)}
                              className="bg-amber-500 hover:bg-amber-400 text-violet-950 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">Guardar</button>
                            {cruceMsg[p.id] && <span className="text-xs text-amber-400">{cruceMsg[p.id]}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          <section className="space-y-3">
            <h2 className="font-semibold text-violet-200">Partidos pendientes ({pendientes.length})</h2>
            {loadingPartidos ? <p className="text-violet-300">Cargando...</p> : pendientes.length === 0 ? (
              <p className="text-violet-300">No hay partidos pendientes.</p>
            ) : (
              pendientes.map(filaPartido)
            )}
          </section>

          {jugados.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold text-violet-300 hover:text-white transition-colors select-none">
                Jugados ({jugados.length}) <span className="text-xs text-violet-400 font-normal">— tocá para ver o corregir</span>
              </summary>
              <div className="space-y-3 mt-3">
                <input type="text" value={filtroJugados} onChange={e => setFiltroJugados(e.target.value)}
                  placeholder="🔎 Buscar por equipo…"
                  className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-2.5 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400" />
                {jugadosFiltrados.length === 0 ? (
                  <p className="text-violet-300 text-sm px-1">Ningún partido jugado coincide con “{filtroJugados}”.</p>
                ) : (
                  jugadosFiltrados.map(filaPartido)
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── Tab: Consumos ──────────────────────────────────────── */}
      {tab === 'consumos' && (
        <div className="space-y-4">
          <p className="text-violet-300 text-sm">Buscá al cliente y cargale puntos por venir al local o donas especiales del Mundial.</p>
          <input type="text" value={busqueda} onChange={e => buscarParticipante(e.target.value)}
            placeholder="Buscar por usuario o nombre..."
            className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400" />
          {resultadosBusqueda.length > 0 && (
            <div className="space-y-2">
              {resultadosBusqueda.map(p => {
                const donas = p.donas_especiales ?? 0;
                return (
                  <div key={p.id} className="bg-violet-950/70 border border-white/15 rounded-xl px-4 py-3 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                        <span className="text-violet-300 text-sm ml-2">{p.nombre_completo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {msgConsumo[p.nombre_usuario] && <span className="text-xs text-amber-300">{msgConsumo[p.nombre_usuario]}</span>}
                        <span className="text-amber-400 font-bold">{p.puntos} pts</span>
                      </div>
                    </div>

                    {/* Punto por venir al local */}
                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                      <span className="text-violet-200 text-sm">🏟️ Vino a ver un partido</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => darPuntoConsumo(p.nombre_usuario, -1)}
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">−1 pt</button>
                        <button onClick={() => darPuntoConsumo(p.nombre_usuario, 1)}
                          className="bg-amber-400 hover:bg-amber-300 text-violet-950 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">+1 pt</button>
                      </div>
                    </div>

                    {/* Donas especiales */}
                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                      <span className="text-violet-200 text-sm">
                        🍩 Donas especiales: <strong className="text-white tabular-nums">{donas}</strong>
                        <span className="text-violet-400 text-xs ml-1.5">({donas % 4}/4 para +1 punto)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => darDona(p, -1)} disabled={donas === 0}
                          className="bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 text-red-400 border border-red-500/30 w-8 h-8 rounded-lg text-base font-bold transition-colors">−</button>
                        <button onClick={() => darDona(p, 1)}
                          className="bg-amber-400 hover:bg-amber-300 text-violet-950 w-8 h-8 rounded-lg text-base font-bold transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {busqueda.length >= 2 && resultadosBusqueda.length === 0 && (
            <p className="text-violet-300 text-sm">No se encontró ningún usuario.</p>
          )}
        </div>
      )}

      {/* ── Tab: Predicciones ─────────────────────────────────── */}
      {tab === 'predicciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-violet-300">
              Predicciones de cada participante. Tocá un nombre para ver el detalle.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={cargarPredicciones} disabled={loadingPreds}
                className="text-xs bg-violet-950/65 hover:bg-violet-800/60 border border-violet-400/40 text-violet-200 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50">
                {loadingPreds ? '⏳' : '🔄 Actualizar'}
              </button>
              <button onClick={exportarPrediccionesCSV} disabled={predicciones.length === 0}
                className="text-xs bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-violet-950 px-3 py-1.5 rounded-lg font-bold transition-colors">
                ⬇️ Exportar Excel
              </button>
            </div>
          </div>

          <input type="text" value={filtroPreds} onChange={e => setFiltroPreds(e.target.value)}
            placeholder="Buscar participante por usuario o nombre..."
            className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400" />

          {loadingPreds ? (
            <p className="text-violet-300 py-8 text-center">Cargando...</p>
          ) : prediccionesPorPersonaFiltradas.length === 0 ? (
            <div className="text-center py-12 text-violet-300">
              {predicciones.length === 0 ? 'Todavía nadie cargó predicciones.' : 'No hay resultados para ese filtro.'}
            </div>
          ) : (
            <div className="space-y-2">
              {prediccionesPorPersonaFiltradas.map(g => {
                const abierto = personaExpandida === g.id;
                return (
                  <div key={g.id} className="bg-violet-950/70 border border-white/15 rounded-xl overflow-hidden">
                    <button onClick={() => setPersonaExpandida(abierto ? null : g.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-violet-800/30 transition-colors">
                      <div className="min-w-0">
                        <span className="font-semibold text-white">@{g.usuario}</span>
                        <span className="text-violet-300 text-sm ml-2">{g.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-violet-300">{g.preds.length} pred.</span>
                        <span className="text-sm font-bold text-amber-400">{g.puntos} pts</span>
                        <span className="text-violet-300 text-xs">{abierto ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {abierto && (
                      <div className="border-t border-white/15 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-violet-300 border-b border-white/15">
                              <th className="text-left px-3 py-2 font-medium">Fase</th>
                              <th className="text-left px-3 py-2 font-medium">Partido</th>
                              <th className="text-center px-3 py-2 font-medium">Pred.</th>
                              <th className="text-center px-3 py-2 font-medium">Real</th>
                              <th className="text-right px-3 py-2 font-medium">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.preds.map((p, i) => (
                              <tr key={i} className="border-b border-white/15 last:border-0">
                                <td className="px-3 py-2 text-violet-300 whitespace-nowrap">{p.grupo ? `G ${p.grupo}` : (p.fase || '')}</td>
                                <td className="px-3 py-2 text-violet-200">
                                  {(p.equipo_local || 'Por definir')} <span className="text-violet-400">vs</span> {(p.equipo_visitante || 'Por definir')}
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-white whitespace-nowrap">{p.pred_local}-{p.pred_visitante}</td>
                                <td className="px-3 py-2 text-center text-violet-300 whitespace-nowrap">{p.jugado ? `${p.real_local}-${p.real_visitante}` : '—'}</td>
                                <td className={`px-3 py-2 text-right font-bold ${p.puntos === 3 ? 'text-amber-400' : p.puntos === 1 ? 'text-amber-400' : 'text-violet-400'}`}>
                                  {p.jugado ? p.puntos : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Mensajes ─────────────────────────────────────── */}
      {tab === 'mensajes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-violet-300">Mensajes de gente que te quiere contactar (desde la página de contacto).</p>
            <button onClick={cargarMensajes} disabled={loadingMensajes}
              className="text-xs bg-violet-950/65 hover:bg-violet-800/60 border border-violet-400/40 text-violet-200 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loadingMensajes ? '⏳' : '🔄 Actualizar'}
            </button>
          </div>

          {loadingMensajes ? (
            <p className="text-violet-300 py-8 text-center">Cargando...</p>
          ) : mensajesContacto.length === 0 ? (
            <div className="text-center py-12 text-violet-300">
              <div className="text-4xl mb-3">✉️</div>
              <p>Todavía no recibiste ningún mensaje.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensajesContacto.map(m => (
                <div key={m.id} className={`rounded-xl p-4 border ${m.leido ? 'bg-violet-950/70 border-white/15' : 'bg-violet-950/70 border-amber-400/30'}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{m.nombre}</span>
                        {!m.leido && <span className="text-[10px] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">Nuevo</span>}
                      </div>
                      <p className="text-sm mt-0.5">
                        {m.contacto.includes('@') ? (
                          <a href={`mailto:${m.contacto}`} className="text-amber-400 hover:text-amber-300 underline break-all">{m.contacto}</a>
                        ) : (
                          <span className="text-violet-200 break-all">{m.contacto}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-violet-300 whitespace-nowrap">{formatFechaHora(m.created_at)}</span>
                  </div>

                  <p className="text-violet-200 text-sm mt-3 whitespace-pre-wrap leading-relaxed border-t border-white/15 pt-3">{m.mensaje}</p>

                  <div className="flex items-center justify-end gap-2 mt-3">
                    {confirmDelMsg === m.id ? (
                      <>
                        <span className="text-xs text-red-400 mr-1">¿Borrar?</span>
                        <button onClick={() => eliminarMensaje(m.id)} className="bg-red-500 hover:bg-red-400 text-white px-2.5 py-1 rounded text-xs font-semibold">Sí</button>
                        <button onClick={() => setConfirmDelMsg(null)} className="bg-violet-800/70 hover:bg-violet-700 text-violet-200 px-2.5 py-1 rounded text-xs font-semibold">No</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => marcarLeido(m.id, !m.leido)}
                          className="text-xs bg-violet-950/65 hover:bg-violet-800/60 border border-violet-400/40 text-violet-200 px-2.5 py-1 rounded font-semibold transition-colors">
                          {m.leido ? 'Marcar no leído' : 'Marcar leído'}
                        </button>
                        <button onClick={() => setConfirmDelMsg(m.id)}
                          className="text-xs bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-2.5 py-1 rounded font-semibold transition-colors">
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Auditoría ────────────────────────────────────── */}
      {tab === 'auditoria' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-300">Registro de todas las acciones de los administradores.</p>
            </div>
            <button onClick={cargarAuditLog} disabled={loadingAudit}
              className="text-xs bg-violet-950/65 hover:bg-violet-800/60 border border-violet-400/40 text-violet-200 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loadingAudit ? '⏳' : '🔄 Actualizar'}
            </button>
          </div>

          {loadingAudit ? (
            <p className="text-violet-300 py-8 text-center">Cargando...</p>
          ) : auditLog.length === 0 ? (
            <div className="text-center py-12 text-violet-300">
              <div className="text-4xl mb-3">📋</div>
              <p>Sin actividad registrada todavía.</p>
            </div>
          ) : (
            <div className="bg-violet-950/70 border border-white/15 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/15 text-violet-300">
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Admin</th>
                    <th className="text-left px-4 py-3 font-medium">Acción</th>
                    <th className="text-left px-4 py-3 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="border-b border-white/15 last:border-0 hover:bg-violet-800/20">
                      <td className="px-4 py-3 text-violet-300 text-xs whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-400 text-xs">@{entry.admin_nombre}</td>
                      <td className="px-4 py-3 text-white text-xs">{entry.accion}</td>
                      <td className="px-4 py-3 text-violet-300 text-xs">{entry.detalle}</td>
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
            <h2 className="font-semibold text-violet-200">Con rol admin ({adminsActuales.length})</h2>
            {adminsActuales.length === 0 ? (
              <p className="text-violet-300 text-sm">No hay admins asignados todavía.</p>
            ) : (
              <div className="space-y-2">
                {adminsActuales.map(p => {
                  const nivel = p.is_admin as number;
                  const esSA = nivel >= 3;
                  const rolLabel = nivel >= 3 ? '⭐ superadmin' : nivel === 2 ? '🛡️ moderador' : '🔑 admin';
                  return (
                    <div key={p.id} className="bg-violet-950/70 border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                        <span className="text-violet-300 text-sm ml-2">{p.nombre_completo}</span>
                        <span className={`ml-2 text-xs ${esSA ? 'text-amber-400' : nivel === 2 ? 'text-blue-400' : 'text-violet-300'}`}>{rolLabel}</span>
                      </div>
                      {!esSA && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {msgAdmin[p.id] && <span className="text-xs text-amber-400">{msgAdmin[p.id]}</span>}
                          {nivel !== 1 && <button onClick={() => setRol(p.id, 1)} className="bg-violet-800/70 hover:bg-violet-700 text-violet-200 px-2.5 py-1 rounded text-xs font-semibold">→ Admin</button>}
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
            <h2 className="font-semibold text-violet-200">Asignar rol a un participante</h2>
            <input type="text" value={busquedaAdmin} onChange={e => buscarAdmin(e.target.value)}
              placeholder="Buscar por usuario o nombre..."
              className="w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400" />
            {resultadosAdmin.length > 0 && (
              <div className="space-y-2">
                {resultadosAdmin.map(p => {
                  const nivelActual = (adminsActuales.find(a => a.id === p.id)?.is_admin as number) ?? 0;
                  const esSA = nivelActual >= 3;
                  return (
                    <div key={p.id} className="bg-violet-950/70 border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-semibold text-white">@{p.nombre_usuario}</span>
                        <span className="text-violet-300 text-sm ml-2">{p.nombre_completo}</span>
                        {nivelActual > 0 && !esSA && <span className="ml-2 text-violet-300 text-xs">actual: {nivelActual === 2 ? 'moderador' : 'admin'}</span>}
                      </div>
                      {!esSA && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {msgAdmin[p.id] && <span className="text-xs text-amber-400">{msgAdmin[p.id]}</span>}
                          {nivelActual !== 1 && <button onClick={() => setRol(p.id, 1)} className="bg-violet-800/70 hover:bg-violet-700 text-violet-200 border border-violet-400/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold">Admin</button>}
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
              <p className="text-violet-300 text-sm">No se encontró ningún usuario.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
