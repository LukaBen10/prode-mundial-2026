import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, verifyPassword, generarToken } from '@/lib/hash';

const SESSION_DAYS = 90;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Acepta usuario, mail o DNI (campo "identificador"; compat con "nombre_usuario")
    const ident = String(body.identificador ?? body.nombre_usuario ?? '').trim();
    const password = body.password;

    if (!ident || !password?.trim()) {
      return NextResponse.json({ error: 'Completá tus datos y la contraseña' }, { status: 400 });
    }

    const result = await db.execute({
      sql: `SELECT id, nombre_completo, nombre_usuario, puntos, codigo, password_hash, is_admin
            FROM participantes
            WHERE LOWER(nombre_usuario) = LOWER(?) OR LOWER(mail) = LOWER(?) OR dni = ?
            LIMIT 1`,
      args: [ident, ident, ident],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Datos o contraseña incorrectos' }, { status: 401 });
    }

    const row = result.rows[0];
    const storedHash = row[5] as string;

    // Usuarios sin contraseña (legado): bloquear
    if (!storedHash || storedHash === '') {
      return NextResponse.json({ error: 'Tu cuenta necesita contraseña. Contactá al organizador.' }, { status: 403 });
    }

    if (!verifyPassword(password, storedHash)) {
      return NextResponse.json({ error: 'Datos o contraseña incorrectos' }, { status: 401 });
    }

    const participanteId = row[0] as number;

    // Migrar hash legacy SHA-256 → scrypt de forma transparente
    if (!storedHash.startsWith('scrypt:')) {
      const nuevoHash = hashPassword(password);
      await db.execute({ sql: 'UPDATE participantes SET password_hash = ? WHERE id = ?', args: [nuevoHash, participanteId] });
    }

    // Crear sesión
    const token = generarToken();
    await db.execute({
      sql: `INSERT INTO sessions (token, participante_id, expires_at)
            VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`,
      args: [token, participanteId],
    });

    return NextResponse.json({
      id: row[0],
      nombre_completo: row[1],
      nombre_usuario: row[2],
      puntos: row[3],
      codigo: row[4],
      is_admin: row[6] ?? 0,
      token,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
