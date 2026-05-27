import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const result = await db.execute(
    `SELECT id, nombre_completo, nombre_usuario, mail, whatsapp, dni, puntos, created_at, is_admin
     FROM participantes
     ORDER BY puntos DESC, nombre_usuario ASC`
  );

  const participantes = result.rows.map((r) => ({
    id: r[0],
    nombre_completo: r[1],
    nombre_usuario: r[2],
    mail: r[3],
    whatsapp: r[4],
    dni: r[5],
    puntos: r[6],
    created_at: r[7],
    is_admin: r[8] ?? 0,
  }));

  // Stats generales
  const total = participantes.length;
  const conPredicciones = await db.execute(
    'SELECT COUNT(DISTINCT participante_id) as c FROM predicciones'
  );
  const totalPredicciones = await db.execute('SELECT COUNT(*) as c FROM predicciones');

  return NextResponse.json({
    participantes,
    stats: {
      total,
      conPredicciones: conPredicciones.rows[0][0],
      totalPredicciones: totalPredicciones.rows[0][0],
    },
  });
}

/** PATCH /api/admin/participantes — toggle is_admin de un usuario */
export async function PATCH(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id, is_admin } = await req.json();
    if (id == null || is_admin == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await db.execute({
      sql: 'UPDATE participantes SET is_admin = ? WHERE id = ?',
      args: [is_admin ? 1 : 0, id],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
