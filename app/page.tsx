import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <div className="text-7xl mb-4">⚽</div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          El Prode del{' '}
          <span className="text-green-400">Mundial 2026</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-lg mx-auto">
          ¿Sabés de fútbol? Demostralo. Cargá tus predicciones, juntate con los
          clientes del local y a ver quién gana.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/unirse"
            className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-full font-bold text-lg transition-colors"
          >
            Quiero participar
          </Link>
          <Link
            href="/ranking"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors"
          >
            Ver el ranking
          </Link>
        </div>
        <p className="text-zinc-500 text-sm">
          El Mundial arranca el <strong className="text-zinc-300">11 de junio</strong> — registrate ya
        </p>
      </section>

      {/* Cómo funciona */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">¿Cómo funciona?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              num: '1',
              titulo: 'Te registrás',
              desc: 'Ponés tu nombre y WhatsApp. Listo, ya sos parte.',
            },
            {
              num: '2',
              titulo: 'Cargás tus predicciones',
              desc: 'Elegís los resultados de todos los partidos del grupo que quieras.',
            },
            {
              num: '3',
              titulo: 'Sumás puntos',
              desc: 'Resultado exacto = 3 pts. Ganador correcto = 1 pt. El que más acumule, gana.',
            },
          ].map((paso) => (
            <div
              key={paso.num}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center text-lg">
                {paso.num}
              </div>
              <h3 className="font-bold text-lg">{paso.titulo}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sistema de puntos */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-6">Sistema de puntos</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
            <span className="text-3xl font-bold text-green-400">3</span>
            <div>
              <div className="font-semibold">Resultado exacto</div>
              <div className="text-zinc-400 text-sm">Ej: predijiste 2-1 y salió 2-1</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
            <span className="text-3xl font-bold text-orange-400">1</span>
            <div>
              <div className="font-semibold">Ganador correcto</div>
              <div className="text-zinc-400 text-sm">Ej: predijiste victoria local y ganó el local</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-8 space-y-4">
        <p className="text-zinc-400 text-lg">
          Gratis. Sin complicaciones. Solo para clientes del local 🍩
        </p>
        <Link
          href="/unirse"
          className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-full font-bold text-xl transition-colors"
        >
          Me anoto ahora
        </Link>
      </section>
    </div>
  );
}
