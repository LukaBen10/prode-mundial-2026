import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ranking',
  description: 'El ranking actualizado del prode. Mirá quién va ganando y cuántos puntos tiene cada participante.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
