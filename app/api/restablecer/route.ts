import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { errJson } from '@/lib/apiHelpers';

/**
 * POST — efectuar el cambio de contraseña con un token de reseteo.
 * Recibe { token, password }. Valida que el token exista, no esté usado y no haya vencido.
 * Cambia la contraseña, quema el token y cierra todas las sesiones abiertas del usuario.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token) return NextResponse.json({ error: 'Falta el token' }, { status: 400 });
    if (!password?.trim() || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña tiene que tener al menos 6 caracteres' }, { status: 400 });
    }

    const r = await db.execute({
      sql: `SELECT id, participante_id FROM password_resets
            WHERE token = ? AND used = 0 AND expires_at > datetime('now')
            LIMIT 1`,
      args: [token],
    });
    if (r.rows.length === 0) {
      return NextResponse.json({ error: 'El link no es válido o ya venció. Pedí uno nuevo.' }, { status: 400 });
    }

    const resetId = r.rows[0][0] as number;
    const participanteId = r.rows[0][1] as number;

    await db.execute({ sql: 'UPDATE participantes SET password_hash = ? WHERE id = ?', args: [hashPassword(password), participanteId] });
    await db.execute({ sql: 'UPDATE password_resets SET used = 1 WHERE id = ?', args: [resetId] });
    // Cerrar sesiones abiertas: si alguien más tenía acceso, se corta al cambiar la clave.
    await db.execute({ sql: 'DELETE FROM sessions WHERE participante_id = ?', args: [participanteId] });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errJson(err);
  }
}
