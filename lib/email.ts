/**
 * Envío de emails vía Resend (https://resend.com).
 * Requiere las env vars RESEND_API_KEY y EMAIL_FROM en Vercel.
 * Si no están configuradas, no envía (devuelve false) — no rompe nada.
 */
export async function enviarEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** URL base de la app, para los links dentro de los emails. */
export function appUrl(): string {
  return process.env.APP_URL ?? 'https://prode-mundial-2026-henna-zeta.vercel.app';
}
