import Link from 'next/link';
import Countdown from '@/components/Countdown';

export default function Home() {
  return (
    <div className="space-y-20">

      {/* ── Hero ── */}
      <section className="text-center py-16 space-y-8">
        <Countdown />

        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none">
            El prode<br />
            <span className="text-orange-500">del barrio.</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium">
            72 partidos. Una sola copa.
          </p>
        </div>

        <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
          Los clientes de <span className="text-white font-semibold">Donut Makers</span> predicen
          el Mundial 2026. Cargá tus resultados antes de cada partido y a ver quién sabe más de fútbol.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/unirse"
            className="bg-orange-500 hover:bg-orange-400 text-white px-9 py-3.5 rounded-full font-bold text-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            Quiero participar
          </Link>
          <Link
            href="/ranking"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-9 py-3.5 rounded-full font-semibold text-lg transition-colors"
          >
            Ver el ranking
          </Link>
        </div>
      </section>

      {/* ── Highlight: punto extra en el local ── */}
      <section>
        <div className="bg-gradient-to-br from-orange-500/10 via-zinc-900 to-zinc-900 border border-orange-500/25 rounded-2xl p-7 flex items-start gap-5">
          <span className="text-4xl shrink-0">🍩</span>
          <div className="space-y-1.5">
            <h3 className="font-black text-lg text-orange-300">
              +1 punto por venir al local durante un partido
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Cada vez que venís a <strong className="text-white">Donut Makers</strong> a ver un partido
              del Mundial, te sumamos un punto extra. Donut + fútbol = combinación imbatible.
            </p>
            <p className="text-zinc-500 text-xs pt-1">
              📍 Av. La Plata 702, Caballito · CABA
            </p>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">¿Cómo funciona?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: '✍️',
              titulo: 'Te registrás',
              desc: 'Gratis, en menos de un minuto. Solo necesitás usuario, mail y contraseña.',
            },
            {
              icon: '⚽',
              titulo: 'Cargás tus predicciones',
              desc: 'Elegís el resultado de cada partido antes de que arranque. Una vez que empieza, se cierra.',
            },
            {
              icon: '🏆',
              titulo: 'Sumás puntos',
              desc: 'Resultado exacto = 3 pts. Ganador correcto = 1 pt. El que más acumule se lleva el premio.',
            },
          ].map((paso) => (
            <div
              key={paso.titulo}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 space-y-3 transition-colors"
            >
              <div className="text-3xl">{paso.icon}</div>
              <h3 className="font-bold text-lg">{paso.titulo}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sistema de puntos ── */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
        <h2 className="text-xl font-bold">Sistema de puntos</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-zinc-800/60 rounded-xl">
            <span className="text-3xl font-black text-green-400">3</span>
            <div>
              <div className="font-semibold text-sm">Resultado exacto</div>
              <div className="text-zinc-400 text-xs mt-0.5">Predijiste 2-1 y salió 2-1</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-zinc-800/60 rounded-xl">
            <span className="text-3xl font-black text-orange-400">1</span>
            <div>
              <div className="font-semibold text-sm">Ganador correcto</div>
              <div className="text-zinc-400 text-xs mt-0.5">Acertaste quién ganaba</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <span className="text-3xl font-black text-orange-300">+1</span>
            <div>
              <div className="font-semibold text-sm text-orange-200">Visitás el local</div>
              <div className="text-zinc-400 text-xs mt-0.5">Durante cualquier partido</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="text-center py-8 space-y-5">
        <div className="space-y-2">
          <p className="text-2xl font-bold">¿Qué esperás?</p>
          <p className="text-zinc-400">
            Gratis. Sin complicaciones. Solo para clientes del local 🍩
          </p>
        </div>
        <Link
          href="/unirse"
          className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-12 py-4 rounded-full font-bold text-xl transition-colors shadow-lg shadow-orange-500/20"
        >
          Me anoto ahora
        </Link>
      </section>

    </div>
  );
}
