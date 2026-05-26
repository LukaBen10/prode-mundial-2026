import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, whatsapp } = await req.json();

    if (!nombre?.trim() || !whatsapp?.trim()) {
      return NextResponse.json({ error: 'Nombre y WhatsApp son obligatorios' }, { status: 400 });
    }

    let codigo = generarCodigo();
    let intentos = 0;
    while (intentos < 5) {
      const existing = await db.execute({ sql: 'SELECT id FROM participantes WHERE codigo = ?', args: [codigo] });
      if (existing.rows.length === 0) break;
      codigo = generarCodigo();
      intentos++;
    }

    const result = await db.execute({
      sql: 'INSERT INTO participantes (nombre, whatsapp, codigo) VALUES (?, ?, ?)',
      args: [nombre.trim(), whatsapp.trim(), codigo],
    });

    return NextResponse.json({ id: Number(result.lastInsertRowid), nombre: nombre.trim(), codigo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo');
  if (!codigo) return NextResponse.json({ error: 'Falta el código' }, { status: 400 });

  const result = await db.execute({ sql: 'SELECT * FROM participantes WHERE codigo = ?', args: [codigo] });
  if (result.rows.length === 0) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 });

  const row = result.rows[0];
  return NextResponse.json({ id: row[0], nombre: row[1], whatsapp: row[2], codigo: row[3], puntos: row[4] });
}
