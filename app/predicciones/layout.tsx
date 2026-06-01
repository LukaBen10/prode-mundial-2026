import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Predicciones',
  description: 'Cargá tus predicciones para los partidos del Mundial 2026. Resultado exacto = 3 puntos. Ganador correcto = 1 punto.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
