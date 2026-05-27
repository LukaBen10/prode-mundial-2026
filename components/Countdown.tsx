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
      <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold px-4 py-2 rounded-full">
        ⚽ ¡El Mundial arrancó!
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm font-bold px-4 py-2 rounded-full">
      ⏳ El Mundial arranca en {dias} {dias === 1 ? 'día' : 'días'}
    </span>
  );
}
