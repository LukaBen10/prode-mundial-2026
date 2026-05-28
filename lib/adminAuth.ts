import { NextRequest } from 'next/server';
import db from '@/lib/db';

async function getLevel(id: string): Promise<number> {
  try {
    const r = await db.execute({ sql: 'SELECT is_admin FROM participantes WHERE id = ?', args: [id] });
    return (r.rows[0]?.[0] as number) ?? 0;
  } catch { return 0; }
}

/** Cualquier admin (>=1) */
export async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD) return true;
  const id = req.headers.get('x-admin-participante-id');
  return id ? (await getLevel(id)) >= 1 : false;
}

/** Moderador o superior (>=2): puede ver participantes y gestionar resultados */
export async function checkModeratorAuth(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD) return true;
  const id = req.headers.get('x-admin-participante-id');
  return id ? (await getLevel(id)) >= 2 : false;
}

/** Solo superadmin (>=3): operaciones destructivas y gestión de roles */
export async function checkSuperAdminAuth(req: NextRequest): Promise<boolean> {
  if (req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD) return true;
  const id = req.headers.get('x-admin-participante-id');
  return id ? (await getLevel(id)) >= 3 : false;
}

/** Devuelve el nivel real del admin que hace la request (0 si no autenticado) */
export async function getAdminLevel(req: NextRequest): Promise<number> {
  if (req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD) return 3;
  const id = req.headers.get('x-admin-participante-id');
  return id ? await getLevel(id) : 0;
}
