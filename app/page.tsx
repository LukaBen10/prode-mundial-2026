import Link from 'next/link';
import Countdown from '@/components/Countdown';

export default function Home() {
  return (
    <div className="space-y-24">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="text-center pt-12 pb-4 space-y-8 relative">

        {/* Glow de fondo sutil */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(251,146,60,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Badge host */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 bg-zinc-900/80 border border-zinc-700/60 text-zinc-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-widest uppercase">
            🌎 USA · Canada · México · 2026
          </span>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight leading-[0.9]">
            El prode<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)' }}
            >
              del barrio.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl font-medium pt-2">
            72 partidos · 48 equipos · una sola copa
          </p>
        </div>

        {/* Countdown */}
        <div className="flex justify-center">
          <Countdown />
        </div>

        {/* Descripción */}
        <p className="text-zinc-400 max-w-sm mx-auto text-sm sm:text-base leading-relaxed">
          Los clientes de <span className="text-white font-bold">Donut Makers</span> predicen
          el Mundial. Cargá tus resultados antes de cada partido y demostrá que sabés de fútbol.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/unirse"
            className="bg-orange-500 hover:bg-orange-400 text-white px-10 py-3.5 rounded-full font-bold text-lg transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
          >
            Quiero participar
          </Link>
          <Link
            href="/ranking"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-10 py-3.5 rounded-full font-semibold text-lg transition-colors"
          >
            Ver el ranking
          </Link>
        </div>
      </section>

      {/* ── Punto extra en el local ────────────────────────────── */}
      <section>
        <div
          className="rounded-2xl p-7 flex items-start gap-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(24,24,27,0.95) 60%)',
            border: '1px solid rgba(249,115,22,0.25)',
          }}
        >
          {/* Glow decorativo */}
          <div
            className="absolute top-0 left-0 w-32 h-32 -translate-x-8 -translate-y-8 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)' }}
          />
          <span className="text-5xl shrink-0 relative">🍩</span>
          <div className="space-y-2 relative">
            <div className="flex items-center gap-2">
              <span
                className="text-3xl font-black text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #fb923c, #fbbf24)' }}
              >
                +1
              </span>
              <span className="font-black text-lg text-white">punto por venir al local</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Cada vez que venís a <strong className="text-white">Donut Makers</strong> a ver un partido
              del Mundial, te sumamos un punto extra al ranking. Donut + fútbol = combinación imbatible.
            </p>
            <p className="text-orange-400/70 text-xs font-medium pt-1">
              📍 Av. La Plata 702, Caballito · CABA
            </p>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ──────────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-3xl font-black tracking-tight text-center">¿Cómo funciona?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: '01',
              icon: '✍️',
              titulo: 'Te registrás',
              desc: 'Gratis, en menos de un minuto. Usuario, mail y listo.',
            },
            {
              n: '02',
              icon: '⚽',
              titulo: 'Cargás tus predicciones',
              desc: 'Elegís el resultado de cada partido antes de que arranque. Cuando empieza, se cierra.',
            },
            {
              n: '03',
              icon: '🏆',
              titulo: 'Sumás puntos',
              desc: 'Resultado exacto = 3 pts. Ganador correcto = 1 pt. El que más acumule se lleva el premio.',
            },
          ].map((paso) => (
            <div
              key={paso.n}
              className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{paso.icon}</span>
                <span
                  className="text-4xl font-black opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ color: '#fbbf24' }}
                >
                  {paso.n}
                </span>
              </div>
              <h3 className="font-bold text-lg">{paso.titulo}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sistema de puntos ──────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-3xl font-black tracking-tight text-center">Sistema de puntos</h2>
        <div className="grid sm:grid-cols-3 gap-4">

          <div
            className="rounded-2xl p-6 text-center space-y-2"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(24,24,27,0.9))', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <div className="text-6xl font-black text-green-400 leading-none">3</div>
            <div className="font-bold text-white">Resultado exacto</div>
            <div className="text-zinc-500 text-xs">Predijiste 2-1 y salió 2-1</div>
          </div>

          <div
            className="rounded-2xl p-6 text-center space-y-2"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(24,24,27,0.9))', border: '1px solid rgba(249,115,22,0.2)' }}
          >
            <div className="text-6xl font-black text-orange-400 leading-none">1</div>
            <div className="font-bold text-white">Ganador correcto</div>
            <div className="text-zinc-500 text-xs">Acertaste quién ganaba</div>
          </div>

          <div
            className="rounded-2xl p-6 text-center space-y-2"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(24,24,27,0.9))', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <div
              className="text-6xl font-black leading-none text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #fb923c, #fbbf24)' }}
            >
              +1
            </div>
            <div className="font-bold text-white">Visitás el local</div>
            <div className="text-zinc-500 text-xs">Durante cualquier partido</div>
          </div>

        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────── */}
      <section className="text-center py-10 space-y-5">
        <div className="space-y-2">
          <p className="text-3xl font-black tracking-tight">¿Qué esperás?</p>
          <p className="text-zinc-400">Gratis. Sin complicaciones. Solo para clientes del local 🍩</p>
        </div>
        <Link
          href="/unirse"
          className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-14 py-4 rounded-full font-bold text-xl transition-all shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
        >
          Me anoto ahora
        </Link>
      </section>

    </div>
  );
}
