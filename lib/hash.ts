import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'crypto';

const SALT_LEN = 16;
const KEY_LEN  = 64;

/** Genera un hash seguro usando scrypt. Formato: "scrypt:<salt>:<hash>" */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const key  = scryptSync(password, salt, KEY_LEN).toString('hex');
  return `scrypt:${salt}:${key}`;
}

/**
 * Verifica una contraseña contra su hash almacenado.
 * Soporta el formato nuevo (scrypt) y el legacy (SHA-256 plano, sin prefijo).
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    try {
      const key = scryptSync(password, salt, KEY_LEN);
      return timingSafeEqual(Buffer.from(hash, 'hex'), key);
    } catch {
      return false;
    }
  }

  // Formato legacy: SHA-256 hex sin prefijo
  const sha = createHash('sha256').update(password).digest('hex');
  return timingSafeEqual(Buffer.from(sha), Buffer.from(stored));
}

/** Genera un token de sesión criptográficamente seguro (64 chars hex). */
export function generarToken(): string {
  return randomBytes(32).toString('hex');
}
