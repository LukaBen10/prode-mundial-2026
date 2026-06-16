import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { errJson, getAdminId } from '@/lib/apiHelpers';

export async function POST(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { nombre_usuario, puntos, consumicion } = await req.json();
    if (!nombre_usuario || puntos == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const part = await db.execute({
      sql: 'SELECT id, nombre_usuario, puntos FROM participantes WHERE nombre_usuario = ?',
      args: [nombre_usuario.trim()],
    });

    if (part.rows.length === 0) {
      return NextResponse.json({ error: `No se encontró el usuario "${nombre_usuario}"` }, { status: 404 });
    }

    await db.execute({
      sql: 'UPDATE participantes SET puntos = puntos + ? WHERE nombre_usuario = ?',
      args: [puntos, nombre_usuario.trim()],
    });

    // Si es por venir al local, contar la(s) consumición(es) — sirve para el desempate del ranking.
    if (consumicion) {
      await db.execute({
        sql: 'UPDATE participantes SET consumiciones = MAX(0, consumiciones + ?) WHERE nombre_usuario = ?',
        args: [puntos, nombre_usuario.trim()],
      });
    }

    const puntosNuevos = (part.rows[0][2] as number) + puntos;
    const signo = puntos > 0 ? `+${puntos}` : String(puntos);
    await audit(getAdminId(req), 'Ajustó puntos', `@${nombre_usuario} ${signo} → total ${puntosNuevos}`);

    return NextResponse.json({ ok: true, nombre_usuario, puntosNuevos });
  } catch (err) {
    return errJson(err);
  }
}

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Lista completa de participantes (el filtro se hace en el cliente).
  const result = await db.execute(
    'SELECT id, nombre_usuario, nombre_completo, puntos, donas_especiales FROM participantes ORDER BY nombre_usuario COLLATE NOCASE'
  );

  return NextResponse.json(result.rows.map(r => ({
    id: r[0], nombre_usuario: r[1], nombre_completo: r[2], puntos: r[3], donas_especiales: r[4] ?? 0,
  })));
}
