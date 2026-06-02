export default function LoadingState({ texto = 'Cargando...' }: { texto?: string }) {
  return <div className="text-center py-20 text-violet-300">{texto}</div>;
}
