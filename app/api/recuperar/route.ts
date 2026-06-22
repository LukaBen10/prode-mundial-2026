import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { generarToken } from '@/lib/hash';
import { enviarEmail, appUrl } from '@/lib/email';
import { errJson } from '@/lib/apiHelpers';

const RESET_TTL_MIN = 60; // el link de reseteo vale 1 hora

/**
 * POST — pedir recuperación de contraseña.
 * Recibe { identificador } (mail, usuario o DNI). Si la cuenta existe y tiene mail,
 * genera un token de un solo uso y manda el link por mail.
 * SIEMPRE responde ok aunque la cuenta no exista: no revela qué cuentas hay (anti-enumeración).
 */
export async function POST(req: NextRequest) {
  try {
    const { identificador } = await req.json();
    const ident = String(identificador ?? '').trim();
    if (!ident) return NextResponse.json({ error: 'Ingresá tu mail, usuario o DNI' }, { status: 400 });

    const r = await db.execute({
      sql: `SELECT id, nombre_usuario, mail FROM participantes
            WHERE LOWER(nombre_usuario) = LOWER(?) OR LOWER(mail) = LOWER(?) OR dni = ?
            LIMIT 1`,
      args: [ident, ident, ident],
    });

    if (r.rows.length > 0) {
      const id = r.rows[0][0] as number;
      const usuario = (r.rows[0][1] as string) ?? '';
      const mail = (r.rows[0][2] as string) ?? '';

      if (mail && mail.includes('@')) {
        // Anular pedidos anteriores que sigan abiertos: solo el último link vale.
        await db.execute({ sql: 'UPDATE password_resets SET used = 1 WHERE participante_id = ? AND used = 0', args: [id] });

        const token = generarToken();
        await db.execute({
          sql: `INSERT INTO password_resets (token, participante_id, expires_at)
                VALUES (?, ?, datetime('now', '+${RESET_TTL_MIN} minutes'))`,
          args: [token, id],
        });

        const link = `${appUrl()}/restablecer?token=${token}`;
        const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:8px;color:#18181b;">
          <div style="font-size:40px;text-align:center;">🍩⚽</div>
          <h1 style="font-size:20px;text-align:center;margin:8px 0 12px;">Recuperá tu contraseña</h1>
          <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 12px;">Hola${usuario ? ' ' + esc(usuario) : ''}, recibimos un pedido para cambiar la contraseña de tu cuenta del <strong>Prode Donut Makers</strong>.</p>
          <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 4px;">Tocá el botón para elegir una nueva:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="background:#fbbf24;color:#3b0764;text-decoration:none;font-weight:bold;font-size:16px;padding:13px 30px;border-radius:12px;display:inline-block;">Cambiar mi contraseña</a>
          </div>
          <p style="font-size:13px;color:#71717a;line-height:1.6;margin:0;">El link vence en 1 hora. Si no pediste esto, ignorá este mail — tu contraseña queda igual.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:22px 0;">
          <p style="font-size:13px;color:#71717a;margin:0;text-align:center;">Prode Mundial 2026 · Donut Makers 🍩</p>
        </div>`;

        await enviarEmail(mail, 'Recuperá tu contraseña — Prode Donut Makers', html);
      }
    }

    // Respuesta uniforme exista o no la cuenta.
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errJson(err);
  }
}
