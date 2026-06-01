import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Participar',
  description: 'Registrate en el prode del Mundial 2026 de Donut Makers Caballito. Gratis, en menos de un minuto.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
