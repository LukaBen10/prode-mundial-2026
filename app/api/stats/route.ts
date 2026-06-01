import { NextResponse } from 'next/server';
import db from '@/lib/db';

/** Estadísticas públicas para la home — no requiere auth. */
export async function GET() {
  const r = await db.execute('SELECT COUNT(*) as c FROM participantes');
  const total = (r.rows[0]?.[0] as number) ?? 0;
  return NextResponse.json({ total });
}
