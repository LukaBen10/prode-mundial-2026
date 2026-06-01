import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generarPartidosGrupos, generarEliminatorias } from '@/lib/data/partidos';

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
    { name: 'fuera_premios',   sql: 'ALTER TABLE participantes ADD COLUMN fuera_premios INTEGER NOT NULL DEFAULT 0' },
    { name: 'mayor_edad',      sql: 'ALTER TABLE participantes ADD COLUMN mayor_edad INTEGER NOT NULL DEFAULT 0' },
    { name: 'autoriza_imagen', sql: 'ALTER TABLE participantes ADD COLUMN autoriza_imagen INTEGER NOT NULL DEFAULT 0' },
    { name: 'acepta_bases',    sql: 'ALTER TABLE participantes ADD COLUMN acepta_bases INTEGER NOT NULL DEFAULT 0' },
    { name: 'sigue_ig',        sql: 'ALTER TABLE participantes ADD COLUMN sigue_ig INTEGER NOT NULL DEFAULT 0' },
    // Avisos por email — opt-in explícito. acepta_avisos: 1 si quiere recibir. avisos_definido: 1 si ya eligió (sí o no)
    { name: 'acepta_avisos',   sql: 'ALTER TABLE participantes ADD COLUMN acepta_avisos INTEGER NOT NULL DEFAULT 0' },
    { name: 'avisos_definido', sql: 'ALTER TABLE participantes ADD COLUMN avisos_definido INTEGER NOT NULL DEFAULT 0' },
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
  for (const col of [
    { name: 'partidos.hora',        sql: 'ALTER TABLE partidos ADD COLUMN hora TEXT NOT NULL DEFAULT "19:00"' },
    { name: 'partidos.estadio',     sql: 'ALTER TABLE partidos ADD COLUMN estadio TEXT NOT NULL DEFAULT ""' },
    { name: 'partidos.ciudad',      sql: 'ALTER TABLE partidos ADD COLUMN ciudad TEXT NOT NULL DEFAULT ""' },
    { name: 'partidos.num_partido', sql: 'ALTER TABLE partidos ADD COLUMN num_partido INTEGER NOT NULL DEFAULT 0' },
  ]) {
    try { await db.execute(col.sql); results.push({ column: col.name, status: 'agregada' }); }
    catch { results.push({ column: col.name, status: 'ya existía (ignorado)' }); }
  }

  // ── insertar partidos de eliminatoria (num 73-104) si no existen ──
  let elimInsertados = 0;
  try {
    for (const p of generarEliminatorias()) {
      const ex = await db.execute({ sql: 'SELECT id FROM partidos WHERE num_partido = ?', args: [p.num_partido] });
      if (ex.rows.length > 0) continue;
      await db.execute({
        sql: `INSERT INTO partidos (fase, grupo, equipo_local, equipo_visitante, fecha, hora, estadio, ciudad, jugado, num_partido)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [p.fase, p.grupo, p.equipo_local, p.equipo_visitante, p.fecha, p.hora, p.estadio, p.ciudad, p.num_partido],
      });
      elimInsertados++;
    }
    results.push({ column: 'eliminatorias', status: `${elimInsertados} partidos de eliminatoria insertados (32 en total)` });
  } catch (err) {
    results.push({ column: 'eliminatorias', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── tabla sessions ────────────────────────────────────────────
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        token          TEXT    NOT NULL UNIQUE,
        participante_id INTEGER NOT NULL,
        created_at     TEXT    DEFAULT (datetime('now')),
        expires_at     TEXT    NOT NULL
      )
    `);
    await db.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token       ON sessions(token)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_sessions_participante ON sessions(participante_id)');
    results.push({ column: 'sessions', status: 'tabla lista' });
  } catch (err) {
    results.push({ column: 'sessions', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── tabla audit_log ───────────────────────────────────────────
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id     INTEGER NOT NULL,
        admin_nombre TEXT    NOT NULL DEFAULT '',
        accion       TEXT    NOT NULL,
        detalle      TEXT    DEFAULT '',
        created_at   TEXT    DEFAULT (datetime('now'))
      )
    `);
    results.push({ column: 'audit_log', status: 'tabla lista' });
  } catch (err) {
    results.push({ column: 'audit_log', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── tabla mensajes_contacto (formulario "contratar al creador") ──
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS mensajes_contacto (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre     TEXT    NOT NULL DEFAULT '',
        contacto   TEXT    NOT NULL DEFAULT '',
        mensaje    TEXT    NOT NULL DEFAULT '',
        leido      INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    DEFAULT (datetime('now'))
      )
    `);
    results.push({ column: 'mensajes_contacto', status: 'tabla lista' });
  } catch (err) {
    results.push({ column: 'mensajes_contacto', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── superadmin ────────────────────────────────────────────────
  try {
    const r = await db.execute({ sql: "UPDATE participantes SET is_admin = 3 WHERE nombre_usuario = 'luka'", args: [] });
    results.push({ column: 'luka.is_admin', status: r.rowsAffected ? 'superadmin (3)' : 'usuario no encontrado' });
  } catch (err) {
    results.push({ column: 'luka.is_admin', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── renombrar equipos ─────────────────────────────────────────
  for (const { viejo, nuevo } of [{ viejo: 'Chequia', nuevo: 'República Checa' }]) {
    try {
      await db.execute({ sql: 'UPDATE partidos SET equipo_local = ? WHERE equipo_local = ?', args: [nuevo, viejo] });
      await db.execute({ sql: 'UPDATE partidos SET equipo_visitante = ? WHERE equipo_visitante = ?', args: [nuevo, viejo] });
      results.push({ column: `rename.${viejo}`, status: `→ ${nuevo}` });
    } catch (err) {
      results.push({ column: `rename.${viejo}`, status: `error: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  // ── fix Grupo H: emparejamientos incorrectos ──────────────────
  // Orden correcto: España, Cabo Verde, Arabia Saudita, Uruguay
  // DB viejo tenía: España, Arabia Saudita, Cabo Verde, Uruguay
  const hFixes = [
    { mL: 'España',       mV: 'Arabia Saudita', mF: '2026-06-15', nL: 'España',       nV: 'Cabo Verde',     h: '13:00', est: 'Mercedes-Benz Stadium', ciu: 'Atlanta',     f: '2026-06-15' },
    { mL: 'Cabo Verde',   mV: 'Uruguay',        mF: '2026-06-15', nL: 'Arabia Saudita',nV: 'Uruguay',        h: '19:00', est: 'Hard Rock Stadium',    ciu: 'Miami',       f: '2026-06-15' },
    { mL: 'España',       mV: 'Cabo Verde',     mF: '2026-06-21', nL: 'España',       nV: 'Arabia Saudita', h: '13:00', est: 'Mercedes-Benz Stadium', ciu: 'Atlanta',     f: '2026-06-21' },
    { mL: 'Arabia Saudita',mV: 'Uruguay',       mF: '2026-06-21', nL: 'Cabo Verde',   nV: 'Uruguay',        h: '19:00', est: 'Hard Rock Stadium',    ciu: 'Miami',       f: '2026-06-21' },
    { mL: 'España',       mV: 'Uruguay',        mF: '2026-06-26', nL: 'España',       nV: 'Uruguay',        h: '21:00', est: 'Estadio Akron',        ciu: 'Guadalajara', f: '2026-06-26' },
    { mL: 'Arabia Saudita',mV: 'Cabo Verde',    mF: '2026-06-26', nL: 'Cabo Verde',   nV: 'Arabia Saudita', h: '21:00', est: 'NRG Stadium',          ciu: 'Houston',     f: '2026-06-26' },
  ];
  let hFixed = 0;
  for (const fx of hFixes) {
    try {
      const r = await db.execute({
        sql: `UPDATE partidos SET equipo_local=?, equipo_visitante=?, hora=?, estadio=?, ciudad=?, fecha=?
              WHERE grupo='H' AND equipo_local=? AND equipo_visitante=? AND fecha=?`,
        args: [fx.nL, fx.nV, fx.h, fx.est, fx.ciu, fx.f, fx.mL, fx.mV, fx.mF],
      });
      hFixed += Number(r.rowsAffected ?? 0);
    } catch (err) {
      results.push({ column: `h_fix.${fx.mL}`, status: `error: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  results.push({ column: 'grupo_H_fix', status: `${hFixed} partidos del Grupo H corregidos` });

  // ── actualizar fechas + horarios + estadios para todos los grupos ──
  let updatedCount = 0;
  try {
    const partidos = generarPartidosGrupos();
    for (const p of partidos) {
      const r = await db.execute({
        sql: `UPDATE partidos SET hora=?, estadio=?, ciudad=?, fecha=?
              WHERE grupo=? AND equipo_local=? AND equipo_visitante=?`,
        args: [p.hora, p.estadio, p.ciudad, p.fecha, p.grupo, p.equipo_local, p.equipo_visitante],
      });
      updatedCount += Number(r.rowsAffected ?? 0);
    }
    results.push({ column: 'partidos.schedule', status: `${updatedCount} partidos actualizados` });
  } catch (err) {
    results.push({ column: 'partidos.schedule', status: `error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // ── limpiar sesiones vencidas ─────────────────────────────────
  try {
    const r = await db.execute("DELETE FROM sessions WHERE expires_at < datetime('now')");
    results.push({ column: 'sessions.cleanup', status: `${r.rowsAffected ?? 0} sesiones vencidas eliminadas` });
  } catch {
    results.push({ column: 'sessions.cleanup', status: 'tabla sessions pendiente (OK)' });
  }

  return NextResponse.json({ ok: true, results });
}
