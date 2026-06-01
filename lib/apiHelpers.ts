import { NextRequest, NextResponse } from 'next/server';

/** Respuesta de error 500 estandarizada para todas las rutas. */
export function errJson(err: unknown): NextResponse {
  return NextResponse.json(
    { error: err instanceof Error ? err.message : String(err) },
    { status: 500 }
  );
}

/** Lee el ID del admin desde el header estándar de la request. */
export function getAdminId(req: NextRequest): string {
  return req.headers.get('x-admin-participante-id') ?? '?';
}
