/**
 * Lógica de puntuación del prode.
 * Función pura — sin side effects, segura para importar en cliente y servidor.
 */
export function calcularPuntos(predL: number, predV: number, realL: number, realV: number): number {
  if (predL === realL && predV === realV) return 3;
  const realGan = realL > realV ? 'L' : realV > realL ? 'V' : 'E';
  const predGan = predL > predV ? 'L' : predV > predL ? 'V' : 'E';
  return realGan === predGan ? 1 : 0;
}
