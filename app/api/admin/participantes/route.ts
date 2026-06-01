import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkModeratorAuth, checkSuperAdminAuth } from '@/lib/adminAuth';
import { audit } from '@/lib/audit';
import { errJson, getAdminId } from '@/lib/apiHelpers';

/** GET — moderador+ puede ver la lista */
export async function GET(req: NextRequest) {
  if (!(await checkModeratorAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const result = await db.execute(
    `SELECT id, nombre_completo, nombre_usuario, mail, whatsapp, dni, puntos, created_at, is_admin
     FROM participantes ORDER BY puntos DESC, nombre_usuario ASC`
  );

  const participantes = result.rows.map((r) => ({
    id: r[0], nombre_completo: r[1], nombre_usuario: r[2], mail: r[3],
    whatsapp: r[4], dni: r[5], puntos: r[6], created_at: r[7], is_admin: r[8] ?? 0,
  }));

  const total = participantes.length;
  const conPredicciones = await db.execute('SELECT COUNT(DISTINCT participante_id) as c FROM predicciones');
  const totalPredicciones = await db.execute('SELECT COUNT(*) as c FROM predicciones');

  return NextResponse.json({
    participantes,
    stats: { total, conPredicciones: conPredicciones.rows[0][0], totalPredicciones: totalPredicciones.rows[0][0] },
  });
}

/** PUT — solo superadmin puede editar */
export async function PUT(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { id, nombre_completo, nombre_usuario, mail, whatsapp, dni, puntos } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const check = await db.execute({ sql: 'SELECT is_admin FROM participantes WHERE id = ?', args: [id] });
    if ((check.rows[0]?.[0] as number) >= 3) return NextResponse.json({ error: 'No se puede editar el superadmin' }, { status: 403 });

    await db.execute({
      sql: 'UPDATE participantes SET nombre_completo=?, nombre_usuario=?, mail=?, whatsapp=?, dni=?, puntos=? WHERE id=?',
      args: [nombre_completo, nombre_usuario, mail, whatsapp, dni, puntos ?? 0, id],
    });

    await audit(getAdminId(req), 'Editó participante', `@${nombre_usuario} (id ${id})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errJson(err);
  }
}

/** DELETE — solo superadmin, y nunca el superadmin mismo */
export async function DELETE(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const check = await db.execute({ sql: 'SELECT is_admin, nombre_usuario FROM participantes WHERE id = ?', args: [id] });
    if ((check.rows[0]?.[0] as number) >= 3) return NextResponse.json({ error: 'No se puede eliminar el superadmin' }, { status: 403 });

    const nombre = check.rows[0]?.[1] as string ?? '?';
    await db.execute({ sql: 'DELETE FROM predicciones WHERE participante_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM participantes WHERE id = ?', args: [id] });

    await audit(getAdminId(req), 'Eliminó participante', `@${nombre} (id ${id})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errJson(err);
  }
}

/** PATCH — toggle is_admin, solo superadmin */
export async function PATCH(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { id, is_admin } = await req.json();
    if (id == null || is_admin == null) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const check = await db.execute({ sql: 'SELECT is_admin, nombre_usuario FROM participantes WHERE id = ?', args: [id] });
    if ((check.rows[0]?.[0] as number) >= 3) return NextResponse.json({ error: 'No se puede modificar el superadmin' }, { status: 403 });

    const nombre = check.rows[0]?.[1] as string ?? '?';
    const nuevoNivel = typeof is_admin === 'number' ? is_admin : (is_admin ? 1 : 0);
    await db.execute({ sql: 'UPDATE participantes SET is_admin = ? WHERE id = ?', args: [nuevoNivel, id] });

    const roles = ['usuario', 'admin', 'moderador', 'superadmin'];
    await audit(getAdminId(req), 'Cambió rol', `@${nombre} → ${roles[nuevoNivel] ?? nuevoNivel}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errJson(err);
  }
}
