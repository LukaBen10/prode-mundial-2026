'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        body: JSON.stringify({ nombre_completo: nombreCompleto, nombre_usuario: nombreUsuario, mail, whatsapp, dni, password }),
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

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="text-5xl">🏆</div>
        <h1 className="text-3xl font-bold">Sumate al prode</h1>
        <p className="text-zinc-400">
          Completá tus datos y en un momento ya estás cargando predicciones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
        {/* Nombre completo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Nombre completo
          </label>
          <input
            type="text"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Ej: Martín García"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Nombre de usuario */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Nombre de usuario
          </label>
          <input
            type="text"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            placeholder="Ej: martingol"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-zinc-500">Este es el nombre que aparece en el ranking. Tiene que ser único.</p>
        </div>

        {/* Mail */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Mail
          </label>
          <input
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="Ej: martin@gmail.com"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            WhatsApp
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Ej: 1123456789"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* DNI */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            DNI
          </label>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 38456789"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
          <p className="text-xs text-zinc-500">Solo para evitar multicuentas. No se muestra públicamente.</p>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Confirmá la contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetí la contraseña"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Checkbox IG */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sigueIG}
            onChange={(e) => setSigueIG(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-orange-500 cursor-pointer"
          />
          <span className="text-sm text-zinc-300">
            Ya sigo a{' '}
            <a
              href="https://www.instagram.com/donut.makers.caballito"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              @donut.makers.caballito
            </a>{' '}
            en Instagram
          </span>
        </label>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !sigueIG}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg transition-colors"
        >
          {loading ? 'Registrando...' : 'Entrar al prode ⚽'}
        </button>
      </form>

      <p className="text-center text-zinc-500 text-sm">
        Ya participás?{' '}
        <a href="/login" className="text-green-400 hover:text-green-300 underline">
          Iniciá sesión
        </a>
      </p>
    </div>
  );
}
