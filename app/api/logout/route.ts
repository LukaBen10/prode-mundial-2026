import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-session-token');
    if (token) {
      await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // siempre exitoso desde el cliente
  }
}
