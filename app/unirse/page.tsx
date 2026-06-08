'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Recordatorios por mail: activo (Resend configurado con dominio prodedonut.com.ar).
const MAILS_HABILITADOS = true;

export default function UnirsePage() {
  const router = useRouter();
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [mail, setMail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sigueIG, setSigueIG] = useState(false);
  const [mayorEdad, setMayorEdad] = useState(false);
  const [aceptaBases, setAceptaBases] = useState(false);
  const [autorizaImagen, setAutorizaImagen] = useState(false);
  const [aceptaAvisos, setAceptaAvisos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/participantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo: nombreCompleto, nombre_usuario: nombreUsuario, mail, whatsapp, dni, password, mayor_edad: mayorEdad, sigue_ig: sigueIG, acepta_bases: aceptaBases, autoriza_imagen: autorizaImagen, acepta_avisos: aceptaAvisos }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');

      localStorage.setItem('prode_id', String(data.id));
      localStorage.setItem('prode_codigo', data.codigo);
      localStorage.setItem('prode_nombre', data.nombre_usuario);

      router.push(`/predicciones?participanteId=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-violet-950/65 border border-violet-400/40 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400 transition-colors";

  return (
    <div className="max-w-md mx-auto space-y-8">

      <div className="text-center space-y-3">
        <div className="text-5xl">🍩⚽</div>
        <h1 className="text-3xl font-black tracking-tight">Sumate al prode</h1>
        <p className="text-violet-300 text-sm">
          Gratis. Tarda menos de 1 minuto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-violet-950/70 border border-white/15 rounded-2xl p-5 sm:p-8 space-y-5">

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Nombre completo</label>
          <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Ej: Martín García" required className={inputClass} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Usuario</label>
          <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)}
            placeholder="Ej: martingol" required className={inputClass} />
          <p className="text-xs text-violet-300">Es lo que aparece en el ranking. Tiene que ser único.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Mail</label>
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)}
            placeholder="Ej: martin@gmail.com" required className={inputClass} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">WhatsApp</label>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 1123456789" required className={inputClass} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">DNI</label>
          <input type="text" value={dni} onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 38456789" required className={inputClass} />
          <p className="text-xs text-violet-300">Solo para evitar multicuentas. No se muestra públicamente.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres" required autoComplete="new-password" className={inputClass} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Confirmá la contraseña</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetí la contraseña" required autoComplete="new-password" className={inputClass} />
        </div>

        {/* Checkbox IG */}
        <label className="flex items-start gap-3 cursor-pointer bg-violet-900/55 rounded-xl p-4">
          <input
            type="checkbox"
            checked={sigueIG}
            onChange={(e) => setSigueIG(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 rounded border-violet-400/40 bg-violet-950/65 accent-amber-400 cursor-pointer shrink-0"
          />
          <span className="text-sm text-violet-200 leading-relaxed">
            Ya sigo a{' '}
            <a href="https://www.instagram.com/donut.makers.caballito" target="_blank" rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline font-semibold">
              @donut.makers.caballito
            </a>{' '}
            en Instagram.{' '}
            <span className="text-violet-300">(Imprescindible para recibir el premio)</span>
          </span>
        </label>

        {/* Checkbox mayor de edad */}
        <label className="flex items-start gap-3 cursor-pointer bg-violet-900/55 rounded-xl p-4">
          <input
            type="checkbox"
            checked={mayorEdad}
            onChange={(e) => setMayorEdad(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 rounded border-violet-400/40 bg-violet-950/65 accent-amber-400 cursor-pointer shrink-0"
          />
          <span className="text-sm text-violet-200 leading-relaxed">
            Confirmo que soy <strong className="text-white">mayor de 18 años</strong>.
          </span>
        </label>

        {/* Checkbox bases y condiciones */}
        <label className="flex items-start gap-3 cursor-pointer bg-violet-900/55 rounded-xl p-4">
          <input
            type="checkbox"
            checked={aceptaBases}
            onChange={(e) => setAceptaBases(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 rounded border-violet-400/40 bg-violet-950/65 accent-amber-400 cursor-pointer shrink-0"
          />
          <span className="text-sm text-violet-200 leading-relaxed">
            Leí y acepto las{' '}
            <Link href="/bases" target="_blank" className="text-amber-400 hover:text-amber-300 underline font-semibold">
              Bases y Condiciones
            </Link>.
          </span>
        </label>

        {/* Checkbox uso de imagen (opcional) */}
        <label className="flex items-start gap-3 cursor-pointer bg-violet-900/55 rounded-xl p-4">
          <input
            type="checkbox"
            checked={autorizaImagen}
            onChange={(e) => setAutorizaImagen(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-violet-400/40 bg-violet-950/65 accent-amber-400 cursor-pointer shrink-0"
          />
          <span className="text-sm text-violet-200 leading-relaxed">
            Autorizo que, si gano, se publique mi nombre y foto en las redes de Donut Makers.{' '}
            <span className="text-violet-300">(Opcional)</span>
          </span>
        </label>

        {/* Checkbox avisos por mail — OCULTO hasta configurar Resend (poner true para reactivar) */}
        {MAILS_HABILITADOS && (
          <label className="flex items-start gap-3 cursor-pointer bg-violet-900/55 rounded-xl p-4">
            <input
              type="checkbox"
              checked={aceptaAvisos}
              onChange={(e) => setAceptaAvisos(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-violet-400/40 bg-violet-950/65 accent-amber-400 cursor-pointer shrink-0"
            />
            <span className="text-sm text-violet-200 leading-relaxed">
              📧 Avisame por mail los días que juego, así no me olvido de cargar mis predicciones.{' '}
              <span className="text-violet-300">(Opcional · te podés dar de baja cuando quieras)</span>
            </span>
          </label>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !sigueIG || !mayorEdad || !aceptaBases}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-violet-950 py-3.5 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-amber-400/20"
        >
          {loading ? 'Registrando...' : 'Entrar al prode ⚽'}
        </button>
      </form>

      <p className="text-center text-violet-300 text-sm">
        ¿Ya participás?{' '}
        <Link href="/login" className="text-amber-400 hover:text-amber-300 underline">
          Iniciá sesión
        </Link>
      </p>

    </div>
  );
}
