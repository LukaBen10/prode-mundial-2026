import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkSuperAdminAuth } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { partido_id, goles_local, goles_visitante } = await req.json();

    if (partido_id == null || goles_local == null || goles_visitante == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Guardar resultado
    await db.execute({
      sql: 'UPDATE partidos SET goles_local = ?, goles_visitante = ?, jugado = 1 WHERE id = ?',
      args: [goles_local, goles_visitante, partido_id],
    });

    // Calcular puntos para todas las predicciones de este partido
    const preds = await db.execute({
      sql: 'SELECT id, participante_id, goles_local, goles_visitante FROM predicciones WHERE partido_id = ?',
      args: [partido_id],
    });

    for (const pred of preds.rows) {
      const predLocal = pred[2] as number;
      const predVisitante = pred[3] as number;
      const predId = pred[0] as number;
      const participanteId = pred[1] as number;

      let puntos = 0;

      if (predLocal === goles_local && predVisitante === goles_visitante) {
        puntos = 3; // resultado exacto
      } else {
        const realGanador = goles_local > goles_visitante ? 'L' : goles_visitante > goles_local ? 'V' : 'E';
        const predGanador = predLocal > predVisitante ? 'L' : predVisitante > predLocal ? 'V' : 'E';
        if (realGanador === predGanador) puntos = 1; // ganador correcto
      }

      await db.execute({
        sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?',
        args: [puntos, predId],
      });

      if (puntos > 0) {
        await db.execute({
          sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?',
          args: [puntos, participanteId],
        });
      }
    }

    return NextResponse.json({ ok: true, prediccionesActualizadas: preds.rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
