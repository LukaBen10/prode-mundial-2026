'use client';

import { useEffect, useState } from 'react';

interface BIPEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}

export default function GuardarApp() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [plataforma, setPlataforma] = useState<'ios' | 'otro'>('otro');
  const [yaInstalada, setYaInstalada] = useState(false);

  useEffect(() => {
    // Si ya está instalada (abierta como app), no mostrar nada
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) { setYaInstalada(true); return; }

    // Registrar el service worker (habilita la instalación)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setPlataforma('ios');

    const handler = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (yaInstalada) return null;

  async function instalar() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.12) 45%, rgba(46,16,101,0.85) 100%)',
        border: '1.5px solid rgba(96,165,250,0.40)',
      }}
    >
      <span className="text-4xl shrink-0">📲</span>
      <div className="space-y-2 min-w-0">
        <h3 className="font-black text-white text-lg">Guardá el prode en tu celu</h3>
        {deferred ? (
          <>
            <p className="text-violet-200 text-sm leading-relaxed">
              Agregalo a tu pantalla de inicio y entrás con un toque, como si fuera una app.
            </p>
            <button
              onClick={instalar}
              className="bg-amber-400 hover:bg-amber-300 text-violet-950 px-5 py-2.5 rounded-full font-bold text-sm transition-colors shadow-lg shadow-amber-400/30"
            >
              📲 Agregar a mi celular
            </button>
          </>
        ) : plataforma === 'ios' ? (
          <div className="text-violet-200 text-sm leading-relaxed space-y-1.5">
            <p>En iPhone se agrega en <strong className="text-white">2 pasos</strong> (Apple no deja hacerlo con un botón):</p>
            <p><strong className="text-white">1.</strong> Tocá <strong className="text-white">Compartir</strong> — el cuadradito con la flecha <span className="text-amber-300">↑</span>, abajo al centro.</p>
            <p><strong className="text-white">2.</strong> Bajá y tocá <strong className="text-amber-300">&ldquo;Agregar a inicio&rdquo;</strong> → <strong className="text-white">Agregar</strong>.</p>
            <p className="text-violet-300 text-xs">Te queda el ícono del prode en la pantalla, como una app. 🍩</p>
          </div>
        ) : (
          <p className="text-violet-200 text-sm leading-relaxed">
            En tu celular, abrí el menú del navegador (los <strong className="text-white">tres puntitos ⋮</strong>) y tocá{' '}
            <strong className="text-amber-300">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>. Así entrás con un toque. 🍩
          </p>
        )}
      </div>
    </div>
  );
}
