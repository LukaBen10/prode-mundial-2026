import { NextRequest } from 'next/server';
import db from '@/lib/db';

/**
 * Cualquier admin (is_admin >= 1): acceso general al panel.
 */
export async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const password = req.headers.get('x-admin-password');
  if (password && password === process.env.ADMIN_PASSWORD) return true;

  const participanteId = req.headers.get('x-admin-participante-id');
  if (participanteId) {
    try {
      const result = await db.execute({
        sql: 'SELECT is_admin FROM participantes WHERE id = ? AND is_admin >= 1',
        args: [participanteId],
      });
      if (result.rows.length > 0) return true;
    } catch {
      // columna no existe todavía, falla silenciosamente
    }
  }
  return false;
}

/**
 * Solo superadmin (is_admin >= 2): operaciones destructivas/sensibles.
 */
export async function checkSuperAdminAuth(req: NextRequest): Promise<boolean> {
  const password = req.headers.get('x-admin-password');
  if (password && password === process.env.ADMIN_PASSWORD) return true;

  const participanteId = req.headers.get('x-admin-participante-id');
  if (participanteId) {
    try {
      const result = await db.execute({
        sql: 'SELECT is_admin FROM participantes WHERE id = ? AND is_admin >= 2',
        args: [participanteId],
      });
      if (result.rows.length > 0) return true;
    } catch { /* ignore */ }
  }
  return false;
}
