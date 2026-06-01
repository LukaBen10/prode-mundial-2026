import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkSuperAdminAuth } from '@/lib/adminAuth';
import { errJson } from '@/lib/apiHelpers';

/** GET — mensajes de contacto (solo superadmin = Luka) */
export async function GET(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const r = await db.execute('SELECT id, nombre, contacto, mensaje, leido, created_at FROM mensajes_contacto ORDER BY created_at DESC');
  return NextResponse.json(r.rows.map(row => ({
    id: row[0], nombre: row[1], contacto: row[2], mensaje: row[3], leido: row[4], created_at: row[5],
  })));
}

/** PATCH — marcar leído/no leído */
export async function PATCH(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { id, leido } = await req.json();
    if (id == null) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await db.execute({ sql: 'UPDATE mensajes_contacto SET leido = ? WHERE id = ?', args: [leido ? 1 : 0, id] });
    return NextResponse.json({ ok: true });
  } catch (err) { return errJson(err); }
}

/** DELETE — borrar un mensaje */
export async function DELETE(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { id } = await req.json();
    if (id == null) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await db.execute({ sql: 'DELETE FROM mensajes_contacto WHERE id = ?', args: [id] });
    return NextResponse.json({ ok: true });
  } catch (err) { return errJson(err); }
}
