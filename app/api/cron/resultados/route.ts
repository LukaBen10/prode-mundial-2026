import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { fromApiName } from '@/lib/data/equipos-api';
import { calcularYGuardarPuntos } from '@/lib/scoringDb';
import { sincronizarEliminatorias } from '@/lib/syncEliminatorias';
import { errJson } from '@/lib/apiHelpers';

const FD_BASE = 'https://api.football-data.org/v4';
const FD_COMPETITION = 'WC';

interface FDMatch {
  id: number;
  status: string;
  utcDate: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

interface DBPartido {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
}

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
    const res = await fetch(
      `${FD_BASE}/competitions/${FD_COMPETITION}/matches?status=FINISHED`,
      { headers: { 'X-Auth-Token': apiKey }, next: { revalidate: 0 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}: ${await res.text()}` }, { status: 502 });
    }

    const { matches: terminados = [] } = await res.json() as { matches: FDMatch[] };

    if (terminados.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay partidos terminados en la API todavía', actualizados: 0 });
    }

    const dbRes = await db.execute('SELECT id, equipo_local, equipo_visitante FROM partidos WHERE jugado = 0');
    const dbPartidos = dbRes.rows.map(r => ({
      id: r[0] as number,
      equipo_local: r[1] as string,
      equipo_visitante: r[2] as string,
    })) as DBPartido[];

    if (dbPartidos.length === 0) {
      return NextResponse.json({ ok: true, message: 'Todos los partidos ya están jugados', actualizados: 0 });
    }

    let actualizados = 0;
    const log: string[] = [];

    for (const apiMatch of terminados) {
      const gL = apiMatch.score.fullTime.home;
      const gV = apiMatch.score.fullTime.away;
      if (gL === null || gV === null) continue;

      const esHome = fromApiName(apiMatch.homeTeam.name);
      const esAway = fromApiName(apiMatch.awayTeam.name);
      const match = dbPartidos.find(p =>
        p.equipo_local.toLowerCase() === esHome.toLowerCase() &&
        p.equipo_visitante.toLowerCase() === esAway.toLowerCase()
      );
      if (!match) continue;

      await db.execute({
        sql: 'UPDATE partidos SET goles_local = ?, goles_visitante = ?, jugado = 1 WHERE id = ?',
        args: [gL, gV, match.id],
      });

      const predsActualizadas = await calcularYGuardarPuntos(match.id, gL, gV);
      actualizados++;
      log.push(`${esHome} ${gL}-${gV} ${esAway} → ${predsActualizadas} pred`);
    }

    // Eliminatorias (aislado: si falla, no afecta a los grupos)
    try {
      const elimLog = await sincronizarEliminatorias(apiKey);
      log.push(...elimLog);
      actualizados += elimLog.length;
    } catch { /* silencioso */ }

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
