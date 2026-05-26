'use client';

import { useState, useEffect } from 'react';

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

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Record<number, { local: string; visitante: string }>>({});
  const [loading, setLoading] = useState(false);
  const [mensajes, setMensajes] = useState<Record<number, string>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pass');
    if (saved) { setPassword(saved); setAutenticado(true); cargarPartidos(saved); }
  }, []);

  async function cargarPartidos(pass: string) {
    setLoading(true);
    const res = await fetch('/api/partidos');
    const data = await res.json();
    setPartidos(data);
    const map: Record<number, { local: string; visitante: string }> = {};
    for (const p of data as Partido[]) {
      if (p.jugado) {
        map[p.id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
      }
    }
    setResultados(map);
    setLoading(false);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    // Verify by trying to post a dummy request
    const res = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ partido_id: -1, goles_local: 0, goles_visitante: 0 }),
    });
    if (res.status === 401) { alert('Contraseña incorrecta'); return; }
    sessionStorage.setItem('admin_pass', password);
    setAutenticado(true);
    cargarPartidos(password);
  }

  async function cargarResultado(partidoId: number) {
    const res = resultados[partidoId];
    if (!res) return;

    const r = await fetch('/api/admin/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({
        partido_id: partidoId,
        goles_local: parseInt(res.local) || 0,
        goles_visitante: parseInt(res.visitante) || 0,
      }),
    });
    const data = await r.json();
    if (data.ok) {
      setMensajes((prev) => ({ ...prev, [partidoId]: `✓ ${data.prediccionesActualizadas} predicciones actualizadas` }));
      cargarPartidos(password);
    } else {
      setMensajes((prev) => ({ ...prev, [partidoId]: `Error: ${data.error}` }));
    }
  }

  if (!autenticado) {
    return (
      <div className="max-w-sm mx-auto mt-16 space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin</h1>
        <form onSubmit={login} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-bold"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const pendientes = partidos.filter((p) => !p.jugado);
  const jugados = partidos.filter((p) => p.jugado);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel Admin</h1>
        <span className="text-zinc-400 text-sm">{jugados.length} partidos jugados · {pendientes.length} pendientes</span>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-zinc-300">Cargar resultados</h2>
        {loading ? (
          <p className="text-zinc-500">Cargando...</p>
        ) : pendientes.length === 0 ? (
          <p className="text-zinc-500">No hay partidos pendientes.</p>
        ) : (
          pendientes.map((partido) => (
            <div key={partido.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-zinc-500 w-16 shrink-0">{formatFecha(partido.fecha)}</span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">G {partido.grupo}</span>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate flex-1 text-right">{partido.equipo_local}</span>
                  <input
                    type="number" min={0} max={20}
                    value={resultados[partido.id]?.local ?? ''}
                    onChange={(e) => setResultados((p) => ({ ...p, [partido.id]: { ...p[partido.id], local: e.target.value } }))}
                    className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-green-500"
                  />
                  <span className="text-zinc-500">-</span>
                  <input
                    type="number" min={0} max={20}
                    value={resultados[partido.id]?.visitante ?? ''}
                    onChange={(e) => setResultados((p) => ({ ...p, [partido.id]: { ...p[partido.id], visitante: e.target.value } }))}
                    className="w-10 h-8 text-center bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-green-500"
                  />
                  <span className="text-sm font-medium truncate flex-1">{partido.equipo_visitante}</span>
                </div>
                <button
                  onClick={() => cargarResultado(partido.id)}
                  className="bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0"
                >
                  Guardar
                </button>
              </div>
              {mensajes[partido.id] && (
                <p className="text-xs text-green-400 mt-2 pl-20">{mensajes[partido.id]}</p>
              )}
            </div>
          ))
        )}
      </section>

      {jugados.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-zinc-400">Jugados</h2>
          {jugados.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm text-zinc-500 py-2 border-b border-zinc-800/50">
              <span className="w-16 shrink-0 text-xs">{formatFecha(p.fecha)}</span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">G {p.grupo}</span>
              <span className="flex-1 text-right">{p.equipo_local}</span>
              <span className="font-bold text-white">{p.goles_local} - {p.goles_visitante}</span>
              <span className="flex-1">{p.equipo_visitante}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
