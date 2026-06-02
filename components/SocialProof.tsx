'use client';

import { useEffect, useState } from 'react';

export default function SocialProof() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setTotal(d.total ?? 0))
      .catch(() => {});
  }, []);

  if (total === null || total === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
      </span>
      <span>
        <span className="text-white">{total}</span>
        {total === 1 ? ' persona ya se anotó' : ' personas ya se anotaron'} 🔥
      </span>
    </div>
  );
}
