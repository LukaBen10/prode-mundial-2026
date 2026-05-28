import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generarPartidosGrupos } from '@/lib/data/partidos';

export async function GET() {
  const results: { column: string; status: string }[] = [];

  // ── participantes ──────────────────────────────────────────────
  const colsParticipantes = [
    { name: 'nombre_completo', sql: 'ALTER TABLE participantes ADD COLUMN nombre_completo TEXT NOT NULL DEFAULT ""' },
    { name: 'nombre_usuario',  sql: 'ALTER TABLE participantes ADD COLUMN nombre_usuario TEXT NOT NULL DEFAULT ""' },
    { name: 'mail',            sql: 'ALTER TABLE participantes ADD COLUMN mail TEXT NOT NULL DEFAULT ""' },
    { name: 'dni',             sql: 'ALTER TABLE participantes ADD COLUMN dni TEXT NOT NULL DEFAULT ""' },
    { name: 'password_hash',   sql: 'ALTER TABLE participantes ADD COLUMN password_hash TEXT NOT NULL DEFAULT ""' },
    { name: 'is_admin',        sql: 'ALTER TABLE participantes ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0' },
  ];

  for (const col of colsParticipantes) {
    try {
      await db.execute(col.sql);
      results.push({ column: col.name, status: 'agregada' });
    } catch {
      results.push({ column: col.name, status: 'ya existía (ignorado)' });
    }
  }

  try {
    await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_participantes_nombre_usuario ON participantes(nombre_usuario)');
    results.push({ column: 'idx_nombre_usuario', status: 'índice UNIQUE creado' });
  } catch {
    results.push({ column: 'idx_nombre_usuario', status: 'índice ya existía (ignorado)' });
  }

  try {
    await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_participantes_dni ON participantes(dni)');
    results.push({ column: 'idx_dni', status: 'índice UNIQUE creado' });
  } catch {
    results.push({ column: 'idx_dni', status: 'índice ya existía (ignorado)' });
  }

  // ── partidos: nuevas columnas ──────────────────────────────────
  const colsPartidos = [
    { name: 'partidos.hora',    sql: 'ALTER TABLE partidos ADD COLUMN hora TEXT NOT NULL DEFAULT "19:00"' },
    { name: 'partidos.estadio', sql: 'ALTER TABLE partidos ADD COLUMN estadio TEXT NOT NULL DEFAULT ""' },
    { name: 'partidos.ciudad',  sql: 'ALTER TABLE partidos ADD COLUMN ciudad TEXT NOT NULL DEFAULT ""' },
  ];

  for (const col of colsPartidos) {
    try {
      await db.execute(col.sql);
      results.push({ column: col.name, status: 'agregada' });
    } catch {
      results.push({ column: col.name, status: 'ya existía (ignorado)' });
    }
  }

  // ── partidos: actualizar hora/estadio/ciudad ───────────────────
  let updatedCount = 0;
  try {
    const partidos = generarPartidosGrupos();
    for (const p of partidos) {
      const r = await db.execute({
        sql: `UPDATE partidos SET hora = ?, estadio = ?, ciudad = ?
              WHERE grupo = ? AND equipo_local = ? AND equipo_visitante = ?`,
        args: [p.hora, p.estadio, p.ciudad, p.grupo, p.equipo_local, p.equipo_visitante],
      });
      updatedCount += Number(r.rowsAffected ?? 0);
    }
    results.push({ column: 'partidos.schedule', status: `${updatedCount} partidos actualizados` });
  } catch (err) {
    results.push({ column: 'partidos.schedule', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── renombrar equipos ─────────────────────────────────────────
  const renombres = [
    { viejo: 'Chequia', nuevo: 'República Checa' },
  ];
  for (const { viejo, nuevo } of renombres) {
    try {
      await db.execute({ sql: 'UPDATE partidos SET equipo_local = ? WHERE equipo_local = ?', args: [nuevo, viejo] });
      await db.execute({ sql: 'UPDATE partidos SET equipo_visitante = ? WHERE equipo_visitante = ?', args: [nuevo, viejo] });
      results.push({ column: `rename.${viejo}`, status: `→ ${nuevo}` });
    } catch (err) {
      results.push({ column: `rename.${viejo}`, status: `error: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  // ── tabla audit_log ───────────────────────────────────────────
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        admin_nombre TEXT NOT NULL DEFAULT '',
        accion TEXT NOT NULL,
        detalle TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    results.push({ column: 'audit_log', status: 'tabla lista' });
  } catch (err) {
    results.push({ column: 'audit_log', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── marcar luka como superadmin (is_admin = 3) ────────────────
  try {
    const r = await db.execute({
      sql: "UPDATE participantes SET is_admin = 3 WHERE nombre_usuario = 'luka'",
      args: [],
    });
    results.push({ column: 'luka.is_admin', status: r.rowsAffected ? 'marcado como superadmin (3)' : 'usuario luka no encontrado' });
  } catch (err) {
    results.push({ column: 'luka.is_admin', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  return NextResponse.json({ ok: true, results });
}
