import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/hash';

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { nombre_completo, nombre_usuario, mail, whatsapp, dni, password, mayor_edad, acepta_bases, sigue_ig, autoriza_imagen } = await req.json();

    if (!nombre_completo?.trim()) return NextResponse.json({ error: 'El nombre completo es obligatorio' }, { status: 400 });
    if (!nombre_usuario?.trim()) return NextResponse.json({ error: 'El nombre de usuario es obligatorio' }, { status: 400 });
    if (!mail?.trim()) return NextResponse.json({ error: 'El mail es obligatorio' }, { status: 400 });
    if (!whatsapp?.trim()) return NextResponse.json({ error: 'El WhatsApp es obligatorio' }, { status: 400 });
    if (!dni?.trim()) return NextResponse.json({ error: 'El DNI es obligatorio' }, { status: 400 });
    if (!password?.trim() || password.length < 6) return NextResponse.json({ error: 'La contraseña tiene que tener al menos 6 caracteres' }, { status: 400 });
    if (!mayor_edad) return NextResponse.json({ error: 'Tenés que confirmar que sos mayor de edad' }, { status: 400 });
    if (!sigue_ig) return NextResponse.json({ error: 'Tenés que seguir la cuenta de Instagram' }, { status: 400 });
    if (!acepta_bases) return NextResponse.json({ error: 'Tenés que aceptar las Bases y Condiciones' }, { status: 400 });

    const existingUsuario = await db.execute({ sql: 'SELECT id FROM participantes WHERE nombre_usuario = ?', args: [nombre_usuario.trim()] });
    if (existingUsuario.rows.length > 0) return NextResponse.json({ error: `El usuario "${nombre_usuario.trim()}" ya está en uso. Elegí otro.` }, { status: 409 });

    const existingDni = await db.execute({ sql: 'SELECT id FROM participantes WHERE dni = ?', args: [dni.trim()] });
    if (existingDni.rows.length > 0) return NextResponse.json({ error: 'Ya hay una cuenta con ese DNI.' }, { status: 409 });

    let codigo = generarCodigo();
    for (let i = 0; i < 5; i++) {
      const ex = await db.execute({ sql: 'SELECT id FROM participantes WHERE codigo = ?', args: [codigo] });
      if (ex.rows.length === 0) break;
      codigo = generarCodigo();
    }

    const result = await db.execute({
      sql: `INSERT INTO participantes
            (nombre, nombre_completo, nombre_usuario, mail, whatsapp, dni, password_hash, codigo, mayor_edad, sigue_ig, acepta_bases, autoriza_imagen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?)`,
      args: [nombre_completo.trim(), nombre_completo.trim(), nombre_usuario.trim(), mail.trim(), whatsapp.trim(), dni.trim(), hashPassword(password), codigo, autoriza_imagen ? 1 : 0],
    });

    return NextResponse.json({ id: Number(result.lastInsertRowid), nombre_completo: nombre_completo.trim(), nombre_usuario: nombre_usuario.trim(), codigo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo');
  if (!codigo) return NextResponse.json({ error: 'Falta el código' }, { status: 400 });

  const result = await db.execute({ sql: 'SELECT id, nombre_completo, nombre_usuario, mail, whatsapp, dni, codigo, puntos FROM participantes WHERE codigo = ?', args: [codigo] });
  if (result.rows.length === 0) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 });

  const row = result.rows[0];
  return NextResponse.json({ id: row[0], nombre_completo: row[1], nombre_usuario: row[2], mail: row[3], whatsapp: row[4], dni: row[5], codigo: row[6], puntos: row[7] });
}
