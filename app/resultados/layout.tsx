import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resultados',
  description: 'Resultados de los partidos del Mundial 2026 y cómo quedaron las predicciones del prode.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
