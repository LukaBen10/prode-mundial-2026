import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { nombre_usuario, dni } = await req.json();

    if (!nombre_usuario?.trim() || !dni?.trim()) {
      return NextResponse.json({ error: 'Completá usuario y DNI' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'SELECT id, nombre_completo, nombre_usuario, puntos, codigo FROM participantes WHERE nombre_usuario = ? AND dni = ?',
      args: [nombre_usuario.trim(), dni.trim()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario o DNI incorrecto. Fijate que el usuario no lleve espacios ni mayúsculas.' }, { status: 401 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row[0],
      nombre_completo: row[1],
      nombre_usuario: row[2],
      puntos: row[3],
      codigo: row[4],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
