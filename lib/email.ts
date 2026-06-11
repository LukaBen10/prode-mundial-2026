/**
 * Envío de emails vía Resend (https://resend.com).
 * Requiere las env vars RESEND_API_KEY y EMAIL_FROM en Vercel.
 * Si no están configuradas, no envía (devuelve false) — no rompe nada.
 */
export async function enviarEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  try {
    const body: Record<string, unknown> = { from, to, subject, html };
    if (replyTo) body.reply_to = replyTo; // las respuestas del destinatario llegan acá
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** URL base de la app, para los links dentro de los emails. */
export function appUrl(): string {
  return process.env.APP_URL ?? 'https://prodedonut.com.ar';
}
