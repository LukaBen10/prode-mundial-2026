import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const participanteId = req.nextUrl.searchParams.get('participanteId');
  if (!participanteId) return NextResponse.json({ error: 'Falta participanteId' }, { status: 400 });

  const result = await db.execute({
    sql: 'SELECT * FROM predicciones WHERE participante_id = ?',
    args: [parseInt(participanteId)],
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
    const { participanteId, predicciones } = await req.json();

    if (!participanteId || !Array.isArray(predicciones)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    for (const pred of predicciones) {
      const { partido_id, goles_local, goles_visitante } = pred;
      if (partido_id == null || goles_local == null || goles_visitante == null) continue;

      await db.execute({
        sql: `INSERT INTO predicciones (participante_id, partido_id, goles_local, goles_visitante)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(participante_id, partido_id)
              DO UPDATE SET goles_local = excluded.goles_local, goles_visitante = excluded.goles_visitante`,
        args: [participanteId, partido_id, goles_local, goles_visitante],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
