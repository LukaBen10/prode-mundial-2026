import db from '@/lib/db';
import { calcularPuntos } from '@/lib/scoring';

/**
 * Calcula y persiste los puntos para todas las predicciones de un partido.
 * Solo servidor — importa db.
 * @returns Cantidad de predicciones actualizadas.
 */
export async function calcularYGuardarPuntos(partido_id: number, gL: number, gV: number): Promise<number> {
  const preds = await db.execute({
    sql: 'SELECT id, participante_id, goles_local, goles_visitante FROM predicciones WHERE partido_id = ?',
    args: [partido_id],
  });
  for (const pred of preds.rows) {
    const pts = calcularPuntos(pred[2] as number, pred[3] as number, gL, gV);
    await db.execute({ sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?', args: [pts, pred[0]] });
    if (pts > 0) {
      await db.execute({ sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?', args: [pts, pred[1]] });
    }
  }
  return preds.rows.length;
}
