import { NextRequest, NextResponse } from 'next/server';
import { checkModeratorAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import db from '@/lib/db';
import { fromApiName } from '@/lib/data/equipos-api';
import { calcularYGuardarPuntos } from '@/lib/scoringDb';
import { sincronizarEliminatorias } from '@/lib/syncEliminatorias';
import { errJson, getAdminId } from '@/lib/apiHelpers';

const FD_BASE = 'https://api.football-data.org/v4';
const FD_COMPETITION = 'WC';

interface FDMatch {
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home: number | null; away: number | null } };
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
      const gH = m.score.fullTime.home, gA = m.score.fullTime.away;
      if (gH === null || gA === null) continue;
      const esHome = fromApiName(m.homeTeam.name);
      const esAway = fromApiName(m.awayTeam.name);
      // Match directo o invertido: el fixture de la DB puede tener los equipos al revés que la API.
      const directo = pendientes.find(p =>
        p.local.toLowerCase() === esHome.toLowerCase() && p.visitante.toLowerCase() === esAway.toLowerCase()
      );
      const found = directo ?? pendientes.find(p =>
        p.local.toLowerCase() === esAway.toLowerCase() && p.visitante.toLowerCase() === esHome.toLowerCase()
      );
      if (!found) continue;
      // Si está invertido, los goles van al revés para respetar el orden guardado en la DB.
      const gL = directo ? gH : gA;
      const gV = directo ? gA : gH;
      await db.execute({ sql: 'UPDATE partidos SET goles_local=?, goles_visitante=?, jugado=1 WHERE id=?', args: [gL, gV, found.id] });
      const predsN = await calcularYGuardarPuntos(found.id, gL, gV);
      actualizados++;
      log.push(`${found.local} ${gL}-${gV} ${found.visitante} (${predsN} pred)`);
    }

    // Eliminatorias (aislado: si falla, no afecta a los grupos)
    try {
      const elimLog = await sincronizarEliminatorias(apiKey);
      log.push(...elimLog);
      actualizados += elimLog.length;
    } catch { /* silencioso */ }

    await audit(getAdminId(req), 'Sincronizó resultados', actualizados > 0 ? log.join(' | ') : 'Sin cambios');

    return NextResponse.json({ ok: true, actualizados, log });
  } catch (err) {
    return errJson(err);
  }
}
