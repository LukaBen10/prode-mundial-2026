import { NextRequest } from 'next/server';
import db from '@/lib/db';

/**
 * Verifica si la request viene de un admin.
 * Acepta dos métodos:
 *  1. Header `x-admin-password` igual a ADMIN_PASSWORD (contraseña maestra)
 *  2. Header `x-admin-participante-id` con el ID de un participante con is_admin = 1
 */
export async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  // Método 1: contraseña maestra
  const password = req.headers.get('x-admin-password');
  if (password && password === process.env.ADMIN_PASSWORD) return true;

  // Método 2: participante con is_admin = 1
  const participanteId = req.headers.get('x-admin-participante-id');
  if (participanteId) {
    try {
      const result = await db.execute({
        sql: 'SELECT is_admin FROM participantes WHERE id = ? AND is_admin = 1',
        args: [participanteId],
      });
      if (result.rows.length > 0) return true;
    } catch {
      // si la columna no existe todavía, falla silenciosamente
    }
  }

  return false;
}
