import { NextRequest } from 'next/server';
import db from '@/lib/db';

/**
 * Baja de avisos en un clic desde el link del email (sin login).
 * Usa el código único del participante. Devuelve una página de confirmación.
 */
export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo');

  let mensaje = 'No pudimos procesar la baja. El link no es válido.';
  if (codigo) {
    try {
      const r = await db.execute({
        sql: 'UPDATE participantes SET acepta_avisos = 0, avisos_definido = 1 WHERE codigo = ?',
        args: [codigo],
      });
      if (Number(r.rowsAffected ?? 0) > 0) {
        mensaje = 'Listo, no vas a recibir más recordatorios por mail. Podés volver a activarlos cuando quieras desde tu prode.';
      }
    } catch { /* mensaje por defecto */ }
  }

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Avisos · Prode Donut Makers</title>
<style>
  body { margin:0; font-family: system-ui, -apple-system, sans-serif; background:#09090b; color:#fafafa; display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px; }
  .card { max-width:420px; text-align:center; background:#18181b; border:1px solid #27272a; border-radius:20px; padding:40px 28px; }
  .emoji { font-size:44px; margin-bottom:12px; }
  h1 { font-size:20px; margin:0 0 12px; }
  p { color:#a1a1aa; font-size:14px; line-height:1.6; margin:0 0 20px; }
  a { display:inline-block; background:#f97316; color:#fff; text-decoration:none; padding:12px 24px; border-radius:9999px; font-weight:700; font-size:14px; }
</style></head>
<body><div class="card">
  <div class="emoji">🔕</div>
  <h1>Avisos por mail</h1>
  <p>${mensaje}</p>
  <a href="/">Ir al prode</a>
</div></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
