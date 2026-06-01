'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Verifica que el usuario esté logueado.
 * Si no hay ID en localStorage, redirige a /login.
 * Devuelve el participanteId o null mientras verifica.
 */
export function useAuthRedirect(): string | null {
  const router = useRouter();
  const [participanteId, setParticipanteId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('prode_id');
    if (!id) { router.push('/login'); return; }
    setParticipanteId(id);
  }, [router]);

  return participanteId;
}
