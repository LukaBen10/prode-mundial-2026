import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const grupo = req.nextUrl.searchParams.get('grupo');
  const fase = req.nextUrl.searchParams.get('fase');

  let sql = 'SELECT * FROM partidos WHERE 1=1';
  const args: (string | number)[] = [];

  if (grupo) { sql += ' AND grupo = ?'; args.push(grupo); }
  if (fase) { sql += ' AND fase = ?'; args.push(fase); }

  sql += ' ORDER BY fecha ASC, id ASC';

  const result = await db.execute({ sql, args });

  const partidos = result.rows.map((r) => ({
    id: r[0],
    fase: r[1],
    grupo: r[2],
    equipo_local: r[3],
    equipo_visitante: r[4],
    fecha: r[5],
    goles_local: r[6],
    goles_visitante: r[7],
    jugado: r[8],
    hora: r[9] ?? '19:00',
    estadio: r[10] ?? '',
    ciudad: r[11] ?? '',
    num_partido: r[12] ?? 0,
  }));

  return NextResponse.json(partidos);
}
