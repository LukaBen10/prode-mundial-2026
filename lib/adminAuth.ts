import { NextRequest } from 'next/server';
import db from '@/lib/db';

/**
 * Verifica que el token de sesión y el participante_id sean un par válido en la DB.
 * Devuelve el nivel is_admin (0 = no autenticado o sesión inválida).
 */
async function getAuthLevel(req: NextRequest): Promise<number> {
  // Bypass de emergencia con password de admin (solo para operaciones internas)
  if (req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD) return 3;

  const id    = req.headers.get('x-admin-participante-id');
  const token = req.headers.get('x-session-token');
  if (!id || !token) return 0;

  try {
    // Valida token + participante_id + no expirado
    const sess = await db.execute({
      sql: `SELECT s.participante_id, p.is_admin
            FROM sessions s
            JOIN participantes p ON p.id = s.participante_id
            WHERE s.token = ?
              AND s.participante_id = ?
              AND s.expires_at > datetime('now')`,
      args: [token, id],
    });
    if (sess.rows.length === 0) return 0;
    return (sess.rows[0][1] as number) ?? 0;
  } catch {
    return 0;
  }
}

/** Cualquier admin (>=1) */
export async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  return (await getAuthLevel(req)) >= 1;
}

/** Moderador o superior (>=2) */
export async function checkModeratorAuth(req: NextRequest): Promise<boolean> {
  return (await getAuthLevel(req)) >= 2;
}

/** Solo superadmin (>=3) */
export async function checkSuperAdminAuth(req: NextRequest): Promise<boolean> {
  return (await getAuthLevel(req)) >= 3;
}

/** Devuelve el nivel real del admin (0 si no autenticado) */
export async function getAdminLevel(req: NextRequest): Promise<number> {
  return getAuthLevel(req);
}
