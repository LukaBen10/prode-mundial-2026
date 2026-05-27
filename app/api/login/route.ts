import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export async function POST(req: NextRequest) {
  try {
    const { nombre_usuario, password } = await req.json();

    if (!nombre_usuario?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Completá usuario y contraseña' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'SELECT id, nombre_completo, nombre_usuario, puntos, codigo, password_hash, is_admin FROM participantes WHERE nombre_usuario = ?',
      args: [nombre_usuario.trim()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const row = result.rows[0];
    const storedHash = row[5] as string;

    // Usuarios viejos sin contraseña: permitir login con cualquier cosa hasta que la setteen
    if (storedHash && storedHash !== '' && storedHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    return NextResponse.json({ id: row[0], nombre_completo: row[1], nombre_usuario: row[2], puntos: row[3], codigo: row[4], is_admin: row[6] ?? 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
