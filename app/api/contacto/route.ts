import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { enviarEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { nombre, contacto, mensaje, website } = await req.json();

    // Honeypot: 'website' es un campo oculto. Si viene lleno, es un bot → descartar en silencio.
    if (website) return NextResponse.json({ ok: true });

    if (!nombre?.trim() || !contacto?.trim() || !mensaje?.trim()) {
      return NextResponse.json({ error: 'Completá todos los campos' }, { status: 400 });
    }
    if (nombre.length > 100 || contacto.length > 150 || mensaje.length > 2000) {
      return NextResponse.json({ error: 'Algún campo es demasiado largo' }, { status: 400 });
    }

    await db.execute({
      sql: 'INSERT INTO mensajes_contacto (nombre, contacto, mensaje) VALUES (?, ?, ?)',
      args: [nombre.trim(), contacto.trim(), mensaje.trim()],
    });

    // Notificación por mail al creador (si está configurado Resend + CONTACTO_EMAIL)
    const dest = process.env.CONTACTO_EMAIL;
    if (dest) {
      const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      await enviarEmail(
        dest,
        `Nuevo contacto desde el prode: ${nombre.trim()}`,
        `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#18181b;">
          <p><strong>${esc(nombre.trim())}</strong> te escribió desde el prode 👇</p>
          <p><strong>Contacto:</strong> ${esc(contacto.trim())}</p>
          <p><strong>Mensaje:</strong><br>${esc(mensaje.trim()).replace(/\n/g, '<br>')}</p>
        </div>`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
