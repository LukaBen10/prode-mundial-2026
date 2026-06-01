import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Iniciá sesión en el prode de Donut Makers para ver tus predicciones y el ranking.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
