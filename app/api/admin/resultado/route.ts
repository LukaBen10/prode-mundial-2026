import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { partido_id, goles_local, goles_visitante } = await req.json();
    if (partido_id == null || goles_local == null || goles_visitante == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Obtener nombres de equipos para el log
    const partidoRes = await db.execute({ sql: 'SELECT equipo_local, equipo_visitante FROM partidos WHERE id = ?', args: [partido_id] });
    const local = partidoRes.rows[0]?.[0] as string ?? '?';
    const visitante = partidoRes.rows[0]?.[1] as string ?? '?';

    await db.execute({
      sql: 'UPDATE partidos SET goles_local = ?, goles_visitante = ?, jugado = 1 WHERE id = ?',
      args: [goles_local, goles_visitante, partido_id],
    });

    const preds = await db.execute({
      sql: 'SELECT id, participante_id, goles_local, goles_visitante FROM predicciones WHERE partido_id = ?',
      args: [partido_id],
    });

    for (const pred of preds.rows) {
      const predLocal = pred[2] as number, predVisitante = pred[3] as number;
      let puntos = 0;
      if (predLocal === goles_local && predVisitante === goles_visitante) {
        puntos = 3;
      } else {
        const rG = goles_local > goles_visitante ? 'L' : goles_visitante > goles_local ? 'V' : 'E';
        const pG = predLocal > predVisitante ? 'L' : predVisitante > predLocal ? 'V' : 'E';
        if (rG === pG) puntos = 1;
      }
      await db.execute({ sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?', args: [puntos, pred[0]] });
      if (puntos > 0) await db.execute({ sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?', args: [puntos, pred[1]] });
    }

    const adminId = req.headers.get('x-admin-participante-id') ?? '?';
    await audit(adminId, 'Cargó resultado', `${local} ${goles_local}-${goles_visitante} ${visitante} (${preds.rows.length} pred)`);

    return NextResponse.json({ ok: true, prediccionesActualizadas: preds.rows.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
