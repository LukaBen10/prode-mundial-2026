import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth, checkSuperAdminAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { getAdminId } from '@/lib/apiHelpers';

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
           pt.goles_local, pt.goles_visitante, pt.jugado,
           pr.partido_id
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
    partido_id: r[14] as number,
  }));

  return NextResponse.json(predicciones);
}

/** POST — editar la predicción de un participante (SOLO superadmin). Si el partido ya se jugó, recalcula los puntos. */
export async function POST(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { participante_id, partido_id, goles_local, goles_visitante } = await req.json();
    if (participante_id == null || partido_id == null || goles_local == null || goles_visitante == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    const gL = parseInt(String(goles_local));
    const gV = parseInt(String(goles_visitante));
    if (!Number.isInteger(gL) || !Number.isInteger(gV) || gL < 0 || gV < 0 || gL > 99 || gV > 99) {
      return NextResponse.json({ error: 'Goles inválidos (enteros 0-99)' }, { status: 400 });
    }

    // Anti-trampa: igual que para los usuarios, no se puede editar la predicción de un
    // partido que ya arrancó o se jugó (evitaría darse el resultado exacto en retrospectiva).
    const partRes = await db.execute({ sql: 'SELECT fecha, hora, jugado FROM partidos WHERE id = ?', args: [partido_id] });
    const partido = partRes.rows[0];
    if (!partido) return NextResponse.json({ error: 'Partido inexistente' }, { status: 404 });
    const kickoffMs = new Date(`${partido[0]}T${(partido[1] as string) || '19:00'}:00-03:00`).getTime();
    if (Number(partido[2]) === 1 || Date.now() >= kickoffMs) {
      return NextResponse.json({ error: 'No se puede editar la predicción de un partido que ya arrancó o se jugó' }, { status: 400 });
    }

    const predRes = await db.execute({ sql: 'SELECT id FROM predicciones WHERE participante_id = ? AND partido_id = ?', args: [participante_id, partido_id] });
    if (predRes.rows.length === 0) return NextResponse.json({ error: 'No existe esa predicción' }, { status: 404 });
    const predId = predRes.rows[0][0] as number;

    await db.execute({ sql: 'UPDATE predicciones SET goles_local = ?, goles_visitante = ? WHERE id = ?', args: [gL, gV, predId] });

    await audit(getAdminId(req), 'Editó predicción', `participante ${participante_id} · partido ${partido_id} → ${gL}-${gV}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
