import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Prode',
  description: 'Tu perfil del prode: puntos acumulados, predicciones cargadas y posición en el ranking.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
