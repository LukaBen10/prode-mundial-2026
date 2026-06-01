import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { errJson, getAdminId } from '@/lib/apiHelpers';

/** PATCH — define/corrige los equipos de un partido (cruces de eliminatoria). Moderador+. */
export async function PATCH(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const { partido_id, equipo_local, equipo_visitante } = await req.json();
    if (partido_id == null) return NextResponse.json({ error: 'Falta partido_id' }, { status: 400 });

    await db.execute({
      sql: 'UPDATE partidos SET equipo_local = ?, equipo_visitante = ? WHERE id = ?',
      args: [equipo_local ?? '', equipo_visitante ?? '', partido_id],
    });

    await audit(getAdminId(req), 'Definió cruce', `#${partido_id}: ${equipo_local || '?'} vs ${equipo_visitante || '?'}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errJson(err);
  }
}
