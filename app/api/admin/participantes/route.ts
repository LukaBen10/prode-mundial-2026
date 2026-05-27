import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const result = await db.execute(
    `SELECT id, nombre_completo, nombre_usuario, mail, whatsapp, dni, puntos, created_at
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
