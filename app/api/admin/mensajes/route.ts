import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkSuperAdminAuth } from '@/lib/adminAuth';
import { errJson } from '@/lib/apiHelpers';
import { enviarEmail } from '@/lib/email';

/** GET — mensajes de contacto (solo superadmin = Luka) */
export async function GET(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const r = await db.execute('SELECT id, nombre, contacto, mensaje, leido, created_at FROM mensajes_contacto ORDER BY created_at DESC');
  return NextResponse.json(r.rows.map(row => ({
    id: row[0], nombre: row[1], contacto: row[2], mensaje: row[3], leido: row[4], created_at: row[5],
  })));
}

/** POST — responder un mensaje por mail (vía Resend) */
export async function POST(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { id, to, texto } = await req.json();
    if (!to || !String(to).includes('@')) return NextResponse.json({ error: 'El contacto no es un mail, no se puede responder por acá' }, { status: 400 });
    if (!texto?.trim()) return NextResponse.json({ error: 'Escribí una respuesta' }, { status: 400 });

    const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;color:#18181b;line-height:1.6;">
      ${esc(texto.trim()).replace(/\n/g, '<br>')}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:22px 0;">
      <p style="font-size:13px;color:#71717a;margin:0;">Te responde el equipo del <strong>Prode Donut Makers</strong> 🍩</p>
    </div>`;

    const ok = await enviarEmail(String(to).trim(), 'Respuesta a tu mensaje — Prode Donut Makers', html, process.env.CONTACTO_EMAIL);
    if (!ok) return NextResponse.json({ error: 'No se pudo enviar el mail (revisá la config de Resend)' }, { status: 502 });

    if (id != null) await db.execute({ sql: 'UPDATE mensajes_contacto SET leido = 1 WHERE id = ?', args: [id] });
    return NextResponse.json({ ok: true });
  } catch (err) { return errJson(err); }
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
