import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const results: { column: string; status: string }[] = [];

  const columns = [
    { name: 'nombre_completo', sql: 'ALTER TABLE participantes ADD COLUMN nombre_completo TEXT NOT NULL DEFAULT ""' },
    { name: 'nombre_usuario', sql: 'ALTER TABLE participantes ADD COLUMN nombre_usuario TEXT NOT NULL DEFAULT ""' },
    { name: 'mail', sql: 'ALTER TABLE participantes ADD COLUMN mail TEXT NOT NULL DEFAULT ""' },
    { name: 'dni', sql: 'ALTER TABLE participantes ADD COLUMN dni TEXT NOT NULL DEFAULT ""' },
  ];

  for (const col of columns) {
    try {
      await db.execute(col.sql);
      results.push({ column: col.name, status: 'agregada' });
    } catch {
      results.push({ column: col.name, status: 'ya existía (ignorado)' });
    }
  }

  // Intentar agregar UNIQUE index por separado (no falla si ya existe en SQLite)
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

  return NextResponse.json({ ok: true, results });
}
