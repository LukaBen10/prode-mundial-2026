import { NextRequest, NextResponse } from 'next/server';
import { checkModeratorAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { sincronizarResultados } from '@/lib/syncResultados';
import { errJson, getAdminId } from '@/lib/apiHelpers';

/** Sync manual desde el panel (botón). Autenticado por moderador+. */
export async function POST(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY no configurada en Vercel' }, { status: 500 });
  }

  try {
    const { actualizados, log } = await sincronizarResultados(apiKey);
    await audit(getAdminId(req), 'Sincronizó resultados', actualizados > 0 ? log.join(' | ') : 'Sin cambios');
    return NextResponse.json({ ok: true, actualizados, log });
  } catch (err) {
    return errJson(err);
  }
}
