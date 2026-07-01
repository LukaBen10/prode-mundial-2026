import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionParticipanteId } from '@/lib/userAuth';

// Devuelve SOLO las predicciones del usuario logueado (no las de otros).
export async function GET(req: NextRequest) {
  const participanteId = await getSessionParticipanteId(req);
  if (!participanteId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const result = await db.execute({
    sql: 'SELECT id, participante_id, partido_id, goles_local, goles_visitante, puntos FROM predicciones WHERE participante_id = ?',
    args: [participanteId],
  });

  const predicciones = result.rows.map((r) => ({
    id: r[0],
    participante_id: r[1],
    partido_id: r[2],
    goles_local: r[3],
    goles_visitante: r[4],
    puntos: r[5],
  }));

  return NextResponse.json(predicciones);
}

export async function POST(req: NextRequest) {
  try {
    // El participante sale de la sesión, NUNCA del body (no se puede escribir por otro).
    const participanteId = await getSessionParticipanteId(req);
    if (!participanteId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { predicciones } = await req.json();
    if (!Array.isArray(predicciones)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Traigo fecha/hora/jugado de todos los partidos en una sola consulta.
    const ids = predicciones.map((p) => p?.partido_id).filter((x) => x != null);
    const info = new Map<number, { fecha: string; hora: string; jugado: number }>();
    if (ids.length > 0) {
      const ph = ids.map(() => '?').join(',');
      const res = await db.execute({ sql: `SELECT id, fecha, hora, jugado FROM partidos WHERE id IN (${ph})`, args: ids });
      for (const r of res.rows) {
        info.set(Number(r[0]), { fecha: r[1] as string, hora: (r[2] as string) || '19:00', jugado: Number(r[3]) });
      }
    }

    let guardadas = 0;
    let rechazadas = 0;
    for (const pred of predicciones) {
      const { partido_id, goles_local, goles_visitante } = pred ?? {};
      if (partido_id == null || goles_local == null || goles_visitante == null) continue;

      // Sanear los goles server-side: enteros 0-99. El front ya lo hace, pero un usuario
      // puede pegarle al endpoint a mano y mandar negativos, decimales, enormes o basura.
      const gl = Number(goles_local), gv = Number(goles_visitante);
      if (!Number.isInteger(gl) || !Number.isInteger(gv) || gl < 0 || gv < 0 || gl > 99 || gv > 99) { rechazadas++; continue; }

      // No se puede predecir un partido ya jugado o que ya arrancó (kickoff en hora Argentina).
      const p = info.get(Number(partido_id));
      if (!p) continue;
      const kickoffMs = new Date(`${p.fecha}T${p.hora}:00-03:00`).getTime();
      if (p.jugado === 1 || Date.now() >= kickoffMs) { rechazadas++; continue; }

      await db.execute({
        sql: `INSERT INTO predicciones (participante_id, partido_id, goles_local, goles_visitante)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(participante_id, partido_id)
              DO UPDATE SET goles_local = excluded.goles_local, goles_visitante = excluded.goles_visitante`,
        args: [participanteId, partido_id, gl, gv],
      });
      guardadas++;
    }

    return NextResponse.json({ ok: true, guardadas, rechazadas });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
