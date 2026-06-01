import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth } from '@/lib/adminAuth';

/** GET — todas las predicciones de todos, con su partido y resultado. Moderador+. */
export async function GET(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const result = await db.execute(`
    SELECT pa.id, pa.nombre_usuario, pa.nombre_completo,
           pt.grupo, pt.fase, pt.fecha,
           pt.equipo_local, pt.equipo_visitante,
           pr.goles_local, pr.goles_visitante, pr.puntos,
           pt.goles_local, pt.goles_visitante, pt.jugado
    FROM predicciones pr
    JOIN participantes pa ON pa.id = pr.participante_id
    JOIN partidos pt ON pt.id = pr.partido_id
    ORDER BY pa.nombre_usuario COLLATE NOCASE, pt.fecha, pr.partido_id
  `);

  const predicciones = result.rows.map(r => ({
    participante_id: r[0] as number,
    nombre_usuario: r[1] as string,
    nombre_completo: r[2] as string,
    grupo: r[3] as string,
    fase: r[4] as string,
    fecha: r[5] as string,
    equipo_local: r[6] as string,
    equipo_visitante: r[7] as string,
    pred_local: r[8] as number,
    pred_visitante: r[9] as number,
    puntos: (r[10] as number) ?? 0,
    real_local: r[11] as number | null,
    real_visitante: r[12] as number | null,
    jugado: r[13] as number,
  }));

  return NextResponse.json(predicciones);
}
