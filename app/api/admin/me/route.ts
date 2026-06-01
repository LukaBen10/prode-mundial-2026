import { NextRequest, NextResponse } from 'next/server';
import { getAdminLevel } from '@/lib/adminAuth';

/**
 * Devuelve el nivel de admin REAL del usuario según su token de sesión.
 * El panel admin lo usa al montar para validar la sesión contra el servidor
 * (no confía en localStorage). Si level=0, la sesión es inválida → re-login.
 */
export async function GET(req: NextRequest) {
  const level = await getAdminLevel(req);
  return NextResponse.json({ level, ok: level >= 1 });
}
