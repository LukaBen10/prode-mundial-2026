import db from '@/lib/db';

/**
 * Registra una acción de admin en el audit_log.
 * No rompe si falla — la operación principal ya se completó.
 */
export async function audit(
  adminId: string | number,
  accion: string,
  detalle: string = ''
) {
  try {
    const r = await db.execute({ sql: 'SELECT nombre_usuario FROM participantes WHERE id = ?', args: [adminId] });
    const nombre = (r.rows[0]?.[0] as string) ?? `#${adminId}`;
    await db.execute({
      sql: 'INSERT INTO audit_log (admin_id, admin_nombre, accion, detalle) VALUES (?, ?, ?, ?)',
      args: [adminId, nombre, accion, detalle],
    });
  } catch { /* silencioso */ }
}
