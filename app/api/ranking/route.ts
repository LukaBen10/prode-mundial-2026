import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const result = await db.execute(
    'SELECT id, nombre, puntos FROM participantes ORDER BY puntos DESC, nombre ASC LIMIT 50'
  );

  const ranking = result.rows.map((r, i) => ({
    posicion: i + 1,
    id: r[0],
    nombre: r[1],
    puntos: r[2],
  }));

  return NextResponse.json(ranking);
}
