import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionParticipanteId } from '@/lib/userAuth';

/** GET — devuelve la preferencia de avisos del usuario logueado */
export async function GET(req: NextRequest) {
  const pid = await getSessionParticipanteId(req);
  if (!pid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const r = await db.execute({
    sql: 'SELECT acepta_avisos, avisos_definido FROM participantes WHERE id = ?',
    args: [pid],
  });
  const row = r.rows[0];
  return NextResponse.json({
    acepta_avisos: Number(row?.[0] ?? 0),
    avisos_definido: Number(row?.[1] ?? 0),
  });
}

/** POST — el usuario define si quiere recibir avisos por mail. { acepta: boolean } */
export async function POST(req: NextRequest) {
  const pid = await getSessionParticipanteId(req);
  if (!pid) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { acepta } = await req.json();
    await db.execute({
      sql: 'UPDATE participantes SET acepta_avisos = ?, avisos_definido = 1 WHERE id = ?',
      args: [acepta ? 1 : 0, pid],
    });
    return NextResponse.json({ ok: true, acepta_avisos: acepta ? 1 : 0 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
