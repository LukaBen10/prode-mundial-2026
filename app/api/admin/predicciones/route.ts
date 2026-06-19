import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth, checkSuperAdminAuth } from '@/lib/adminAuth';
import { calcularPuntos } from '@/lib/scoring';
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
    const gL = parseInt(String(goles_local)) || 0;
    const gV = parseInt(String(goles_visitante)) || 0;

    const predRes = await db.execute({ sql: 'SELECT id, puntos FROM predicciones WHERE participante_id = ? AND partido_id = ?', args: [participante_id, partido_id] });
    if (predRes.rows.length === 0) return NextResponse.json({ error: 'No existe esa predicción' }, { status: 404 });
    const predId = predRes.rows[0][0] as number;
    const viejoPts = (predRes.rows[0][1] as number) ?? 0;

    await db.execute({ sql: 'UPDATE predicciones SET goles_local = ?, goles_visitante = ? WHERE id = ?', args: [gL, gV, predId] });

    // Si el partido ya se jugó, recalcular los puntos de esta predicción (delta, idempotente).
    const partRes = await db.execute({ sql: 'SELECT jugado, goles_local, goles_visitante FROM partidos WHERE id = ?', args: [partido_id] });
    const partido = partRes.rows[0];
    let nuevoPts = viejoPts;
    if (partido && Number(partido[0]) === 1) {
      nuevoPts = calcularPuntos(gL, gV, partido[1] as number, partido[2] as number);
      await db.execute({ sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?', args: [nuevoPts, predId] });
      if (nuevoPts !== viejoPts) {
        await db.execute({ sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?', args: [nuevoPts - viejoPts, participante_id] });
      }
    }

    await audit(getAdminId(req), 'Editó predicción', `participante ${participante_id} · partido ${partido_id} → ${gL}-${gV}`);
    return NextResponse.json({ ok: true, puntos: nuevoPts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
