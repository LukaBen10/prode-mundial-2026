import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'El Prode de Donut Makers Caballito',
    short_name: 'Prode Donut',
    description: 'Predecí los partidos del Mundial 2026 y ganá premios en Donut Makers Caballito.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#4c1d95',
    theme_color: '#6d28d9',
    orientation: 'portrait',
    icons: [
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
