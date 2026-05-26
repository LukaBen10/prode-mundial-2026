import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generarPartidosGrupos } from '@/lib/data/partidos';

export async function GET() {
  try {
    // Crear tablas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_completo TEXT NOT NULL,
        nombre_usuario TEXT NOT NULL UNIQUE,
        mail TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        dni TEXT NOT NULL UNIQUE,
        codigo TEXT NOT NULL UNIQUE,
        puntos INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS partidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fase TEXT NOT NULL,
        grupo TEXT,
        equipo_local TEXT NOT NULL,
        equipo_visitante TEXT NOT NULL,
        fecha TEXT NOT NULL,
        goles_local INTEGER,
        goles_visitante INTEGER,
        jugado INTEGER DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS predicciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participante_id INTEGER NOT NULL,
        partido_id INTEGER NOT NULL,
        goles_local INTEGER NOT NULL,
        goles_visitante INTEGER NOT NULL,
        puntos INTEGER DEFAULT 0,
        UNIQUE(participante_id, partido_id),
        FOREIGN KEY (participante_id) REFERENCES participantes(id),
        FOREIGN KEY (partido_id) REFERENCES partidos(id)
      )
    `);

    // Seed de partidos solo si la tabla está vacía
    const existing = await db.execute('SELECT COUNT(*) as count FROM partidos');
    const count = existing.rows[0][0] as number;

    if (count === 0) {
      const partidos = generarPartidosGrupos();
      for (const p of partidos) {
        await db.execute({
          sql: 'INSERT INTO partidos (fase, grupo, equipo_local, equipo_visitante, fecha) VALUES (?, ?, ?, ?, ?)',
          args: [p.fase, p.grupo, p.equipo_local, p.equipo_visitante, p.fecha],
        });
      }
      return NextResponse.json({ ok: true, message: `DB inicializada. ${partidos.length} partidos cargados.` });
    }

    return NextResponse.json({ ok: true, message: `DB ya inicializada. ${count} partidos existentes.` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
