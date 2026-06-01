export default function LoadingState({ texto = 'Cargando...' }: { texto?: string }) {
  return <div className="text-center py-20 text-zinc-400">{texto}</div>;
}
