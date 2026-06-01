import db from '@/lib/db';
import { fromApiName } from '@/lib/data/equipos-api';
import { calcularYGuardarPuntos } from '@/lib/scoringDb';

const FD_BASE = 'https://api.football-data.org/v4';

// Mapeo de stage de football-data.org → fase interna
const STAGE_FASE: Record<string, string> = {
  LAST_32: 'dieciseisavos',
  LAST_16: 'octavos',
  QUARTER_FINALS: 'cuartos',
  SEMI_FINALS: 'semifinal',
  THIRD_PLACE: 'tercer_puesto',
  FINAL: 'final',
};

interface FDMatch {
  stage: string;
  status: string;
  utcDate: string;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
}

/** Convierte un timestamp UTC a la hora de pared en Argentina (UTC-3). */
function utcToART(utcDate: string): { fecha: string; hora: string } {
  const art = new Date(new Date(utcDate).getTime() - 3 * 3600 * 1000);
  return { fecha: art.toISOString().slice(0, 10), hora: art.toISOString().slice(11, 16) };
}

/**
 * Completa los partidos de eliminatoria (num >= 73) con los equipos reales
 * y resultados a medida que se definen en football-data.org.
 * Es independiente del sync de grupos — si falla, no afecta a los grupos.
 * Matchea por fase + fecha + hora (ART).
 * @returns Líneas de log de lo actualizado.
 */
export async function sincronizarEliminatorias(apiKey: string): Promise<string[]> {
  const log: string[] = [];

  const res = await fetch(`${FD_BASE}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': apiKey }, cache: 'no-store',
  });
  if (!res.ok) return log;
  const { matches = [] } = await res.json() as { matches: FDMatch[] };

  const dbRes = await db.execute(
    'SELECT id, fase, equipo_local, equipo_visitante, fecha, hora, jugado FROM partidos WHERE num_partido >= 73'
  );
  const elim = dbRes.rows.map(r => ({
    id: r[0] as number, fase: r[1] as string, local: r[2] as string,
    visitante: r[3] as string, fecha: r[4] as string, hora: r[5] as string, jugado: r[6] as number,
  }));

  for (const m of matches) {
    const fase = STAGE_FASE[m.stage];
    if (!fase) continue;

    const { fecha, hora } = utcToART(m.utcDate);
    const found = elim.find(p => p.fase === fase && p.fecha === fecha && p.hora === hora);
    if (!found) continue;

    const homeName = m.homeTeam.name ? fromApiName(m.homeTeam.name) : '';
    const awayName = m.awayTeam.name ? fromApiName(m.awayTeam.name) : '';

    // 1. Definir el cruce cuando se conocen los equipos
    if (homeName && awayName && (found.local !== homeName || found.visitante !== awayName)) {
      await db.execute({
        sql: 'UPDATE partidos SET equipo_local=?, equipo_visitante=? WHERE id=?',
        args: [homeName, awayName, found.id],
      });
      found.local = homeName;
      found.visitante = awayName;
      log.push(`Cruce: ${homeName} vs ${awayName}`);
    }

    // 2. Cargar resultado cuando el partido termina
    const gL = m.score.fullTime.home, gV = m.score.fullTime.away;
    if (m.status === 'FINISHED' && gL !== null && gV !== null && found.jugado === 0) {
      await db.execute({
        sql: 'UPDATE partidos SET goles_local=?, goles_visitante=?, jugado=1 WHERE id=?',
        args: [gL, gV, found.id],
      });
      await calcularYGuardarPuntos(found.id, gL, gV);
      log.push(`${homeName} ${gL}-${gV} ${awayName}`);
    }
  }

  return log;
}
