import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { errJson, getAdminId } from '@/lib/apiHelpers';

/**
 * Suma/resta donas especiales a un cliente. Cada 4 donas = 1 punto.
 * Al cruzar un múltiplo de 4 (para arriba o para abajo), ajusta los puntos
 * automáticamente. No se otorgan puntos por fracciones.
 * Body: { id, delta } con delta = 1 o -1.
 */
export async function POST(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const { id, delta } = await req.json();
    if (id == null || (delta !== 1 && delta !== -1)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const r = await db.execute({
      sql: 'SELECT nombre_usuario, puntos, donas_especiales FROM participantes WHERE id = ?',
      args: [id],
    });
    if (r.rows.length === 0) return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });

    const nombre = r.rows[0][0] as string;
    const puntos = (r.rows[0][1] as number) ?? 0;
    const donas = (r.rows[0][2] as number) ?? 0;

    const nuevasDonas = Math.max(0, donas + delta);
    // Puntos automáticos: cada 4 donas = 1 punto
    const deltaPuntos = Math.floor(nuevasDonas / 4) - Math.floor(donas / 4);
    const nuevosPuntos = puntos + deltaPuntos;

    await db.execute({
      sql: 'UPDATE participantes SET donas_especiales = ?, puntos = ? WHERE id = ?',
      args: [nuevasDonas, nuevosPuntos, id],
    });

    const detalle = `@${nombre}: ${donas} → ${nuevasDonas} donas${deltaPuntos !== 0 ? ` (${deltaPuntos > 0 ? '+' : ''}${deltaPuntos} pt)` : ''}`;
    await audit(getAdminId(req), 'Donas especiales', detalle);

    return NextResponse.json({ ok: true, donas: nuevasDonas, puntos: nuevosPuntos, deltaPuntos });
  } catch (err) {
    return errJson(err);
  }
}
