import db from '@/lib/db';
import { fromApiName } from '@/lib/data/equipos-api';
import { calcularYGuardarPuntos } from '@/lib/scoringDb';
import { sincronizarEliminatorias } from '@/lib/syncEliminatorias';

const FD_BASE = 'https://api.football-data.org/v4';
const FD_COMPETITION = 'WC';

interface FDMatch {
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

/**
 * Sincroniza los resultados de la fase de grupos desde football-data.org y,
 * a continuación, las eliminatorias.
 *
 * Es la ÚNICA fuente de la lógica de sync: la usan tanto el cron automático
 * (`/api/cron/resultados`) como el botón manual del panel
 * (`/api/admin/sync-resultados`). Al vivir en un solo lugar, el matcheo de
 * partidos y la carga de puntos nunca pueden divergir entre ambos caminos.
 *
 * Por cada partido terminado de la API, lo matchea contra el fixture pendiente
 * (jugado=0) probando el orden directo o invertido (el fixture puede tener los
 * equipos al revés que la API) y guarda los goles en el orden de la DB. El
 * recálculo de puntos es idempotente (delta) gracias a `calcularYGuardarPuntos`.
 *
 * @throws Error si la API de fútbol responde con un status no-ok.
 * @returns Cantidad de partidos actualizados y el log de cambios.
 */
export async function sincronizarResultados(
  apiKey: string,
): Promise<{ actualizados: number; log: string[] }> {
  const res = await fetch(
    `${FD_BASE}/competitions/${FD_COMPETITION}/matches?status=FINISHED`,
    { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`API fútbol: ${res.status}`);

  const { matches = [] } = (await res.json()) as { matches: FDMatch[] };
  const dbRes = await db.execute('SELECT id, equipo_local, equipo_visitante FROM partidos WHERE jugado = 0');
  const pendientes = dbRes.rows.map(r => ({ id: r[0] as number, local: r[1] as string, visitante: r[2] as string }));

  let actualizados = 0;
  const log: string[] = [];

  for (const m of matches) {
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

  // Eliminatorias (aislado: si falla, no afecta a los grupos).
  try {
    const elimLog = await sincronizarEliminatorias(apiKey);
    log.push(...elimLog);
    actualizados += elimLog.length;
  } catch { /* silencioso */ }

  return { actualizados, log };
}
