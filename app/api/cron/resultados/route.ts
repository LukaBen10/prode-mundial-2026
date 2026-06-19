import { NextRequest, NextResponse } from 'next/server';
import { sincronizarResultados } from '@/lib/syncResultados';
import { errJson } from '@/lib/apiHelpers';

/** Sync automático (cron cada 5 min + Vercel cron). Autenticado por CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManualCall = cronSecret && secret === cronSecret;

  if (!isVercelCron && !isManualCall) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY no configurada' }, { status: 500 });
  }

  try {
    const { actualizados, log } = await sincronizarResultados(apiKey);
    return NextResponse.json({
      ok: true,
      actualizados,
      log,
      message: actualizados > 0
        ? `${actualizados} partido${actualizados > 1 ? 's' : ''} actualizado${actualizados > 1 ? 's' : ''}`
        : 'Sin partidos nuevos para actualizar',
    });
  } catch (err) {
    return errJson(err);
  }
}
