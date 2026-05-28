import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkSuperAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!(await checkSuperAdminAuth(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100');
    const result = await db.execute({
      sql: 'SELECT id, admin_id, admin_nombre, accion, detalle, created_at FROM audit_log ORDER BY created_at DESC LIMIT ?',
      args: [Math.min(limit, 500)],
    });

    const entries = result.rows.map(r => ({
      id: r[0],
      admin_id: r[1],
      admin_nombre: r[2],
      accion: r[3],
      detalle: r[4],
      created_at: r[5],
    }));

    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
