'use client';

import { useState } from 'react';

export default function ContactoPage() {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [website, setWebsite] = useState(''); // honeypot anti-bot
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, contacto, mensaje, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar');
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal, probá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-violet-900/40 border border-violet-400/25 rounded-xl px-4 py-3 text-white placeholder-violet-300/60 focus:outline-none focus:border-amber-400 transition-colors";

  if (enviado) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="text-6xl">🙌</div>
        <h1 className="text-2xl font-black">¡Mensaje enviado!</h1>
        <p className="text-violet-300">Te voy a responder lo antes posible. ¡Gracias por escribir!</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8">

      <div className="text-center space-y-3">
        <div className="text-5xl">👋</div>
        <h1 className="text-3xl font-black tracking-tight">¿Te gustó el prode?</h1>
        <p className="text-violet-300 text-sm leading-relaxed">
          Lo armé yo, de cero. Si tenés un negocio y querés una <strong className="text-violet-100">web</strong>, una{' '}
          <strong className="text-violet-100">app</strong> o <strong className="text-violet-100">automatizar algo con IA</strong>,
          escribime y lo charlamos. Dejame tu contacto y te respondo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-violet-950/40 border border-white/10 rounded-2xl p-5 sm:p-8 space-y-5">

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Tu nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Martín García" required maxLength={100} className={inputClass} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Tu contacto</label>
          <input type="text" value={contacto} onChange={(e) => setContacto(e.target.value)}
            placeholder="Tu mail o WhatsApp" required maxLength={150} className={inputClass} />
          <p className="text-xs text-violet-300">Por acá te respondo. Mail o número, lo que prefieras.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-violet-200">Tu mensaje</label>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)}
            placeholder="Contame qué tenés en mente..." required maxLength={2000} rows={4}
            className={`${inputClass} resize-none`} />
        </div>

        {/* Honeypot anti-bot — oculto para humanos */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
          <label>No completar este campo
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-violet-950 py-3.5 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-amber-400/20">
          {loading ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>

    </div>
  );
}
