import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { nombre_completo, nombre_usuario, mail, whatsapp, dni } = await req.json();

    if (!nombre_completo?.trim()) return NextResponse.json({ error: 'El nombre completo es obligatorio' }, { status: 400 });
    if (!nombre_usuario?.trim()) return NextResponse.json({ error: 'El nombre de usuario es obligatorio' }, { status: 400 });
    if (!mail?.trim()) return NextResponse.json({ error: 'El mail es obligatorio' }, { status: 400 });
    if (!whatsapp?.trim()) return NextResponse.json({ error: 'El WhatsApp es obligatorio' }, { status: 400 });
    if (!dni?.trim()) return NextResponse.json({ error: 'El DNI es obligatorio' }, { status: 400 });

    // Validar unicidad de nombre_usuario
    const existingUsuario = await db.execute({
      sql: 'SELECT id FROM participantes WHERE nombre_usuario = ?',
      args: [nombre_usuario.trim()],
    });
    if (existingUsuario.rows.length > 0) {
      return NextResponse.json({ error: `El nombre de usuario "${nombre_usuario.trim()}" ya está en uso. Elegí otro.` }, { status: 409 });
    }

    // Validar unicidad de DNI
    const existingDni = await db.execute({
      sql: 'SELECT id FROM participantes WHERE dni = ?',
      args: [dni.trim()],
    });
    if (existingDni.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe una cuenta registrada con ese DNI.' }, { status: 409 });
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
      sql: 'INSERT INTO participantes (nombre, nombre_completo, nombre_usuario, mail, whatsapp, dni, codigo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [nombre_completo.trim(), nombre_completo.trim(), nombre_usuario.trim(), mail.trim(), whatsapp.trim(), dni.trim(), codigo],
    });

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      nombre_completo: nombre_completo.trim(),
      nombre_usuario: nombre_usuario.trim(),
      codigo,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo');
  if (!codigo) return NextResponse.json({ error: 'Falta el código' }, { status: 400 });

  const result = await db.execute({
    sql: 'SELECT id, nombre_completo, nombre_usuario, mail, whatsapp, dni, codigo, puntos FROM participantes WHERE codigo = ?',
    args: [codigo],
  });
  if (result.rows.length === 0) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 });

  const row = result.rows[0];
  return NextResponse.json({
    id: row[0],
    nombre_completo: row[1],
    nombre_usuario: row[2],
    mail: row[3],
    whatsapp: row[4],
    dni: row[5],
    codigo: row[6],
    puntos: row[7],
  });
}
