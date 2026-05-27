'use client';

import { useEffect, useState } from 'react';

export default function Countdown() {
  const [dias, setDias] = useState<number | null>(null);

  useEffect(() => {
    const mundial = new Date('2026-06-11T00:00:00-03:00');
    const diff = mundial.getTime() - Date.now();
    setDias(diff > 0 ? Math.ceil(diff / 86400000) : 0);
  }, []);

  if (dias === null) return null;

  if (dias === 0) {
    return (
      <div className="inline-flex items-center gap-2.5 bg-green-500/10 border border-green-500/30 text-green-400 font-bold px-6 py-3 rounded-full text-base">
        ⚽ ¡El Mundial arrancó!
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-3 px-6 py-3 rounded-full border"
      style={{
        background: 'rgba(251,191,36,0.07)',
        borderColor: 'rgba(251,191,36,0.25)',
      }}
    >
      <span className="text-zinc-500 text-sm font-semibold tracking-wide uppercase">Faltan</span>
      <span
        className="text-4xl font-black leading-none text-transparent bg-clip-text"
        style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
      >
        {dias}
      </span>
      <span className="text-zinc-500 text-sm font-semibold tracking-wide uppercase">
        {dias === 1 ? 'día' : 'días'}
      </span>
    </div>
  );
}
