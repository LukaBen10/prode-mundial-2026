import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  // Desempate, en orden: puntos → resultados exactos (3 pts) → ganadores acertados (1 pt)
  // → consumiciones en el local → donas especiales → orden de inscripción (id) como último criterio.
  const result = await db.execute(`
    SELECT p.id, p.nombre_usuario, p.puntos, p.fuera_premios,
           COALESCE(SUM(CASE WHEN pr.puntos = 3 THEN 1 ELSE 0 END), 0) AS exactos,
           COALESCE(SUM(CASE WHEN pr.puntos = 1 THEN 1 ELSE 0 END), 0) AS ganadores,
           p.consumiciones, p.donas_especiales
    FROM participantes p
    LEFT JOIN predicciones pr ON pr.participante_id = p.id
    GROUP BY p.id, p.nombre_usuario, p.puntos, p.fuera_premios, p.consumiciones, p.donas_especiales
    ORDER BY p.puntos DESC, exactos DESC, ganadores DESC, p.consumiciones DESC, p.donas_especiales DESC, p.id ASC
    LIMIT 200
  `);

  const ranking = result.rows.map((r, i) => ({
    posicion: i + 1,
    id: r[0],
    nombre_usuario: r[1],
    puntos: r[2],
    fuera_premios: r[3] ?? 0,
    exactos: r[4],
    ganadores: r[5],
    consumiciones: r[6],
    donas: r[7],
  }));

  return NextResponse.json(ranking);
}
