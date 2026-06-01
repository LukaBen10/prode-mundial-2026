import { NextRequest } from 'next/server';
import db from '@/lib/db';

/**
 * Valida la sesión de un usuario normal (no admin) por su token.
 * Devuelve el participante_id si el token es válido y corresponde, o null.
 */
export async function getSessionParticipanteId(req: NextRequest): Promise<number | null> {
  const id = req.headers.get('x-participante-id');
  const token = req.headers.get('x-session-token');
  if (!id || !token) return null;
  try {
    const sess = await db.execute({
      sql: "SELECT participante_id FROM sessions WHERE token = ? AND participante_id = ? AND expires_at > datetime('now')",
      args: [token, id],
    });
    return sess.rows.length > 0 ? Number(id) : null;
  } catch {
    return null;
  }
}
