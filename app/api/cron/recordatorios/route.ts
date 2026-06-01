import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { enviarEmail, appUrl } from '@/lib/email';

interface PartidoHoy {
  id: number;
  local: string;
  visitante: string;
  hora: string;
}

function emailHTML(usuario: string, partidos: PartidoHoy[], codigo: string): string {
  const base = appUrl();
  const filas = partidos.map(p =>
    `<tr><td style="padding:8px 0;color:#27272a;font-size:15px;">
      <strong>${p.local}</strong> vs <strong>${p.visitante}</strong>
      <span style="color:#71717a;">· ${p.hora}hs</span>
    </td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:#18181b;padding:20px 24px;">
        <span style="font-size:18px;font-weight:800;color:#ffffff;">🍩⚽ El Prode de Donut Makers</span>
      </div>
      <div style="padding:24px;">
        <p style="font-size:16px;color:#18181b;margin:0 0 8px;">¡Hola <strong>@${usuario}</strong>! 👋</p>
        <p style="font-size:15px;color:#3f3f46;margin:0 0 16px;line-height:1.5;">
          Hoy juega tu prode y todavía te faltan cargar estas predicciones:
        </p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">${filas}</table>
        <a href="${base}/predicciones" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:9999px;font-weight:700;font-size:15px;">
          Cargar mis predicciones ⚽
        </a>
        <p style="font-size:13px;color:#a1a1aa;margin:16px 0 0;">
          Recordá que cada predicción se cierra 1 minuto antes de que arranque el partido.
        </p>
      </div>
      <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7;">
        <p style="font-size:12px;color:#a1a1aa;margin:0;line-height:1.5;">
          Recibís este mail porque te registraste en el prode y activaste los recordatorios.
          <a href="${base}/api/avisos/baja?codigo=${codigo}" style="color:#71717a;">Darme de baja</a>.
        </p>
      </div>
    </div>
  </div>
  </body></html>`;
}

export async function GET(req: NextRequest) {
  // Protección igual que el cron de resultados
  const secret = req.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManualCall = cronSecret && secret === cronSecret;
  if (!isVercelCron && !isManualCall) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Fecha de hoy en Argentina (UTC-3)
    const hoyART = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

    // Partidos de hoy, no jugados y con equipos definidos
    const pRes = await db.execute({
      sql: `SELECT id, equipo_local, equipo_visitante, hora FROM partidos
            WHERE fecha = ? AND jugado = 0 AND equipo_local != '' AND equipo_visitante != ''
            ORDER BY hora ASC`,
      args: [hoyART],
    });
    const partidosHoy: PartidoHoy[] = pRes.rows.map(r => ({
      id: r[0] as number, local: r[1] as string, visitante: r[2] as string, hora: r[3] as string,
    }));

    if (partidosHoy.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay partidos hoy', enviados: 0 });
    }

    const idsHoy = partidosHoy.map(p => p.id);
    const placeholders = idsHoy.map(() => '?').join(',');

    // Quién ya predijo qué (de los partidos de hoy)
    const predRes = await db.execute({
      sql: `SELECT participante_id, partido_id FROM predicciones WHERE partido_id IN (${placeholders})`,
      args: idsHoy,
    });
    const predPorUsuario = new Map<number, Set<number>>();
    for (const row of predRes.rows) {
      const uid = row[0] as number, pid = row[1] as number;
      if (!predPorUsuario.has(uid)) predPorUsuario.set(uid, new Set());
      predPorUsuario.get(uid)!.add(pid);
    }

    // ⚠️ SOLO los que activaron avisos explícitamente (acepta_avisos = 1)
    const uRes = await db.execute(
      "SELECT id, nombre_usuario, mail, codigo FROM participantes WHERE acepta_avisos = 1 AND mail != ''"
    );

    let enviados = 0, sinFaltantes = 0, fallidos = 0;

    for (const row of uRes.rows) {
      const uid = row[0] as number;
      const usuario = row[1] as string;
      const mail = row[2] as string;
      const codigo = row[3] as string;

      const yaPredijo = predPorUsuario.get(uid) ?? new Set<number>();
      const faltantes = partidosHoy.filter(p => !yaPredijo.has(p.id));
      if (faltantes.length === 0) { sinFaltantes++; continue; }

      const ok = await enviarEmail(
        mail,
        `🍩⚽ Hoy juega tu prode — cargá tus predicciones`,
        emailHTML(usuario, faltantes, codigo)
      );
      if (ok) enviados++; else fallidos++;
    }

    return NextResponse.json({
      ok: true,
      fecha: hoyART,
      partidos_hoy: partidosHoy.length,
      enviados,
      sin_faltantes: sinFaltantes,
      fallidos,
      nota: fallidos > 0 ? 'Algunos no se enviaron (revisá RESEND_API_KEY y EMAIL_FROM en Vercel)' : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
