import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { calcularYGuardarPuntos } from '@/lib/scoringDb';
import { errJson, getAdminId } from '@/lib/apiHelpers';

export async function POST(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { partido_id, goles_local, goles_visitante } = await req.json();
    if (partido_id == null || goles_local == null || goles_visitante == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    const gL = Number(goles_local), gV = Number(goles_visitante);
    if (!Number.isInteger(gL) || !Number.isInteger(gV) || gL < 0 || gV < 0 || gL > 99 || gV > 99) {
      return NextResponse.json({ error: 'Goles inválidos (deben ser enteros entre 0 y 99)' }, { status: 400 });
    }

    const partidoRes = await db.execute({ sql: 'SELECT equipo_local, equipo_visitante FROM partidos WHERE id = ?', args: [partido_id] });
    const local = partidoRes.rows[0]?.[0] as string ?? '?';
    const visitante = partidoRes.rows[0]?.[1] as string ?? '?';

    await db.execute({
      sql: 'UPDATE partidos SET goles_local = ?, goles_visitante = ?, jugado = 1 WHERE id = ?',
      args: [gL, gV, partido_id],
    });

    const prediccionesActualizadas = await calcularYGuardarPuntos(partido_id, gL, gV);

    await audit(getAdminId(req), 'Cargó resultado', `${local} ${gL}-${gV} ${visitante} (${prediccionesActualizadas} pred)`);

    return NextResponse.json({ ok: true, prediccionesActualizadas });
  } catch (err) {
    return errJson(err);
  }
}
