import { NextRequest, NextResponse } from 'next/server';
import { checkModeratorAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import db from '@/lib/db';
import { fromApiName } from '@/lib/data/equipos-api';

const FD_BASE = 'https://api.football-data.org/v4';
const FD_COMPETITION = 'WC';

interface FDMatch {
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

async function calcularPuntos(partido_id: number, gL: number, gV: number) {
  const preds = await db.execute({
    sql: 'SELECT id, participante_id, goles_local, goles_visitante FROM predicciones WHERE partido_id = ?',
    args: [partido_id],
  });
  for (const pred of preds.rows) {
    const pL = pred[2] as number, pV = pred[3] as number;
    let pts = 0;
    if (pL === gL && pV === gV) pts = 3;
    else {
      const rG = gL > gV ? 'L' : gV > gL ? 'V' : 'E';
      const pG = pL > pV ? 'L' : pV > pL ? 'V' : 'E';
      if (rG === pG) pts = 1;
    }
    await db.execute({ sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?', args: [pts, pred[0]] });
    if (pts > 0) await db.execute({ sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?', args: [pts, pred[1]] });
  }
  return preds.rows.length;
}

export async function POST(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY no configurada en Vercel' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${FD_BASE}/competitions/${FD_COMPETITION}/matches?status=FINISHED`,
      { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json({ error: `API fútbol: ${res.status}` }, { status: 502 });

    const { matches } = await res.json() as { matches: FDMatch[] };
    const dbRes = await db.execute('SELECT id, equipo_local, equipo_visitante FROM partidos WHERE jugado = 0');
    const pendientes = dbRes.rows.map(r => ({ id: r[0] as number, local: r[1] as string, visitante: r[2] as string }));

    let actualizados = 0;
    const log: string[] = [];

    for (const m of matches ?? []) {
      const gL = m.score.fullTime.home, gV = m.score.fullTime.away;
      if (gL === null || gV === null) continue;
      const esHome = fromApiName(m.homeTeam.name);
      const esAway = fromApiName(m.awayTeam.name);
      const found = pendientes.find(p =>
        p.local.toLowerCase() === esHome.toLowerCase() &&
        p.visitante.toLowerCase() === esAway.toLowerCase()
      );
      if (!found) continue;
      await db.execute({ sql: 'UPDATE partidos SET goles_local=?, goles_visitante=?, jugado=1 WHERE id=?', args: [gL, gV, found.id] });
      const predsN = await calcularPuntos(found.id, gL, gV);
      actualizados++;
      log.push(`${esHome} ${gL}-${gV} ${esAway} (${predsN} pred)`);
    }

    const adminId = req.headers.get('x-admin-participante-id') ?? '?';
    await audit(adminId, 'Sincronizó resultados', actualizados > 0 ? log.join(' | ') : 'Sin cambios');

    return NextResponse.json({ ok: true, actualizados, log });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
