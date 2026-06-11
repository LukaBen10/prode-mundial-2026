import db from '@/lib/db';
import { calcularPuntos } from '@/lib/scoring';

/**
 * Calcula y persiste los puntos para todas las predicciones de un partido.
 * Solo servidor — importa db.
 * @returns Cantidad de predicciones actualizadas.
 */
export async function calcularYGuardarPuntos(partido_id: number, gL: number, gV: number): Promise<number> {
  // Trae también los puntos viejos para aplicar solo el DELTA al total del participante.
  // Así corregir/recargar un resultado no duplica puntos (idempotente) y preserva los
  // puntos extra (donas, ajustes manuales), que no dependen de las predicciones.
  const preds = await db.execute({
    sql: 'SELECT id, participante_id, goles_local, goles_visitante, puntos FROM predicciones WHERE partido_id = ?',
    args: [partido_id],
  });
  for (const pred of preds.rows) {
    const viejoPts = (pred[4] as number) ?? 0;
    const nuevoPts = calcularPuntos(pred[2] as number, pred[3] as number, gL, gV);
    await db.execute({ sql: 'UPDATE predicciones SET puntos = ? WHERE id = ?', args: [nuevoPts, pred[0]] });
    // Suma al total solo la diferencia: en la 1ª carga viejoPts=0 (igual que antes);
    // al corregir, resta lo viejo y suma lo nuevo sin tocar los puntos extra.
    if (nuevoPts !== viejoPts) {
      await db.execute({ sql: 'UPDATE participantes SET puntos = puntos + ? WHERE id = ?', args: [nuevoPts - viejoPts, pred[1]] });
    }
  }
  return preds.rows.length;
}
