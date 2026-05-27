import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { nombre_usuario, puntos } = await req.json();
    if (!nombre_usuario || !puntos) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const part = await db.execute({
      sql: 'SELECT id, nombre_usuario, puntos FROM participantes WHERE nombre_usuario = ?',
      args: [nombre_usuario.trim()],
    });

    if (part.rows.length === 0) {
      return NextResponse.json({ error: `No se encontró el usuario "${nombre_usuario}"` }, { status: 404 });
    }

    await db.execute({
      sql: 'UPDATE participantes SET puntos = puntos + ? WHERE nombre_usuario = ?',
      args: [puntos, nombre_usuario.trim()],
    });

    const puntosNuevos = (part.rows[0][2] as number) + puntos;
    return NextResponse.json({ ok: true, nombre_usuario, puntosNuevos });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get('q') ?? '';
  const result = await db.execute({
    sql: 'SELECT id, nombre_usuario, nombre_completo, puntos FROM participantes WHERE nombre_usuario LIKE ? OR nombre_completo LIKE ? LIMIT 10',
    args: [`%${query}%`, `%${query}%`],
  });

  return NextResponse.json(result.rows.map(r => ({
    id: r[0], nombre_usuario: r[1], nombre_completo: r[2], puntos: r[3],
  })));
}
