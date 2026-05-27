import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { fromApiName } from '@/lib/data/equipos-api';

// football-data.org — WC = FIFA World Cup (competition ID 2000)
const FD_BASE = 'https://api.football-data.org/v4';
const FD_COMPETITION = 'WC';

interface FDMatch {
  id: number;
  status: string;
  utcDate: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface DBPartido {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  jugado: number;
}

async function calcularYGuardarPuntos(
  partido_id: number,
  goles_local: number,
  goles_visitante: number
) {
  const preds = await db.execute({
    sql: 'SELECT id, participante_id, goles_local, goles_visitante FROM predicciones WHERE partido_id = ?',
    args: [partido_id],
  });

  for (const pred of preds.rows) {
    const predLocal = pred[2] as number;
    const predVisitante = pred[3] as number;
    const predId = pred[0] as number;
    const participanteId = pred[1] as number;

    let puntos = 0;
    if (predLocal === goles_local && predVisitante === goles_visitante) {
      puntos = 3;
    } else {
      const realGan = goles_local > goles_visitante ? 'L' : goles_visitante > goles_local ? 'V' : 'E';
      const predGan = predLocal > predVisitante ? 'L' : predVisitante > predLocal ? 'V' : 'E';
      if (realGan === predGan) puntos = 1;
    }

    await db.execute({
      sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?',
      args: [puntos, predId],
    });
    if (puntos > 0) {
      await db.execute({
        sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?',
        args: [puntos, participanteId],
      });
    }
  }
  return preds.rows.length;
}

export async function GET(req: NextRequest) {
  // Protección: solo llamadas con el cron secret o desde Vercel
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
    // 1. Obtener partidos TERMINADOS de la API
    const res = await fetch(
      `${FD_BASE}/competitions/${FD_COMPETITION}/matches?status=FINISHED`,
      { headers: { 'X-Auth-Token': apiKey }, next: { revalidate: 0 } }
    );

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `API error ${res.status}: ${txt}` }, { status: 502 });
    }

    const apiData = await res.json() as { matches: FDMatch[] };
    const terminados = apiData.matches ?? [];

    if (terminados.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay partidos terminados en la API todavía', actualizados: 0 });
    }

    // 2. Obtener partidos no-jugados de nuestra DB
    const dbRes = await db.execute(
      'SELECT id, equipo_local, equipo_visitante, jugado FROM partidos WHERE jugado = 0'
    );
    const dbPartidos = dbRes.rows.map((r) => ({
      id: r[0] as number,
      equipo_local: r[1] as string,
      equipo_visitante: r[2] as string,
      jugado: r[3] as number,
    })) as DBPartido[];

    if (dbPartidos.length === 0) {
      return NextResponse.json({ ok: true, message: 'Todos los partidos ya están jugados', actualizados: 0 });
    }

    let actualizados = 0;
    const log: string[] = [];

    // 3. Cruzar por nombres de equipo
    for (const apiMatch of terminados) {
      const apiHome = apiMatch.homeTeam.name;
      const apiAway = apiMatch.awayTeam.name;
      const golesLocal = apiMatch.score.fullTime.home;
      const golesVisitante = apiMatch.score.fullTime.away;

      if (golesLocal === null || golesVisitante === null) continue;

      // Convertir nombres API → español para buscar en DB
      const esHome = fromApiName(apiHome);
      const esAway = fromApiName(apiAway);

      const match = dbPartidos.find(
        (p) =>
          p.equipo_local.toLowerCase() === esHome.toLowerCase() &&
          p.equipo_visitante.toLowerCase() === esAway.toLowerCase()
      );

      if (!match) continue; // partido ya cargado o no encontrado

      // Actualizar resultado en DB
      await db.execute({
        sql: 'UPDATE partidos SET goles_local = ?, goles_visitante = ?, jugado = 1 WHERE id = ?',
        args: [golesLocal, golesVisitante, match.id],
      });

      const predsActualizadas = await calcularYGuardarPuntos(match.id, golesLocal, golesVisitante);
      actualizados++;
      log.push(`${esHome} ${golesLocal}-${golesVisitante} ${esAway} → ${predsActualizadas} pred`);
    }

    return NextResponse.json({
      ok: true,
      actualizados,
      log,
      message: actualizados > 0
        ? `${actualizados} partido${actualizados > 1 ? 's' : ''} actualizado${actualizados > 1 ? 's' : ''}`
        : 'Sin partidos nuevos para actualizar',
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
