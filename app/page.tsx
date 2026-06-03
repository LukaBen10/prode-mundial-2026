import Link from 'next/link';
import Countdown from '@/components/Countdown';
import SocialProof from '@/components/SocialProof';
import GuardarApp from '@/components/GuardarApp';

export default function Home() {
  return (
    <div className="space-y-20">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="text-center pt-10 pb-4 space-y-7 relative">

        {/* Luces de estadio — glow azul/violeta arriba */}
        <div className="absolute inset-0 -z-10 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 90% 65% at 50% 20%, rgba(96,165,250,0.32) 0%, rgba(139,92,246,0.14) 55%, transparent 80%)',
        }} />
        {/* Luces laterales ambientales */}
        <div className="absolute inset-0 -z-10 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 40% 50% at 10% 50%, rgba(139,92,246,0.14) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 -z-10 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 40% 50% at 90% 50%, rgba(212,175,55,0.10) 0%, transparent 70%)',
        }} />

        {/* Badge host */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-2 text-xs font-black px-5 py-2 rounded-full tracking-widest uppercase"
            style={{
              background: 'rgba(59,130,246,0.22)',
              border: '1.5px solid rgba(59,130,246,0.55)',
              color: '#93c5fd',
              boxShadow: '0 0 20px rgba(59,130,246,0.15)',
            }}
          >
            🌎 USA · Canada · México · 2026
          </span>
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight leading-[0.88]">
            El prode de<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 40%, #d4af37 100%)' }}
            >
              Donut Makers
            </span>
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 40%, #d4af37 100%)' }}
            >
              Caballito.
            </span>
          </h1>
          <p className="text-violet-100 text-lg sm:text-xl font-semibold pt-3">
            104 partidos · 48 equipos · una sola copa
          </p>
          <p className="text-violet-200 max-w-md mx-auto text-sm sm:text-base leading-relaxed pt-3">
            Los clientes de <span className="text-amber-300 font-bold">Donut Makers</span> predicen
            el Mundial. Cargá tus resultados antes de cada partido y demostrá que sos el que más sabe.
          </p>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-2">
          <Countdown />
          <p className="text-amber-400 font-bold text-sm tracking-wide">🍩 Donut Makers · Caballito</p>
        </div>

        {/* Social proof */}
        <div className="flex justify-center">
          <SocialProof />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Link
            href="/unirse"
            className="bg-amber-400 hover:bg-amber-300 text-violet-950 px-10 py-3.5 rounded-full font-bold text-lg transition-all shadow-xl shadow-amber-400/40 hover:shadow-amber-400/60 hover:-translate-y-0.5"
          >
            Quiero participar
          </Link>
          <Link
            href="/login"
            className="border border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/15 text-white px-10 py-3.5 rounded-full font-semibold text-lg transition-all backdrop-blur-sm"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-violet-300 text-sm pt-1">
          ¿Primera vez? <Link href="/unirse" className="text-amber-400 hover:text-amber-300 underline font-semibold">Registrate gratis</Link> · ¿Ya jugás? <Link href="/login" className="text-amber-400 hover:text-amber-300 underline font-semibold">Iniciá sesión</Link>
        </p>
      </section>

      {/* ── Guardar en el celu (PWA) ───────────────────────────── */}
      <section>
        <GuardarApp />
      </section>

      {/* ── Premios ────────────────────────────────────────────── */}
      <section>
        <div
          className="rounded-2xl p-7 relative overflow-hidden space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(139,92,246,0.12) 50%, rgba(46,16,101,0.80) 100%)',
            border: '1.5px solid rgba(212,175,55,0.45)',
            boxShadow: '0 0 40px rgba(212,175,55,0.12)',
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.20) 0%, transparent 70%)' }} />
          <div className="flex items-center gap-3 relative z-10">
            <span className="text-4xl">🏆</span>
            <div>
              <h2 className="text-xl font-black text-white">¡Ganá premios, no solo gloria!</h2>
              <p className="text-amber-300/90 text-sm font-semibold">Los que la rompen en el ranking se llevan grandes premios</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 relative z-10">
            {[
              { pos: '🥇', label: '1er lugar', premio: 'Premio sorpresa de Donut Makers' },
              { pos: '🥈', label: '2do lugar', premio: 'Premio sorpresa de Donut Makers' },
              { pos: '🥉', label: '3er lugar', premio: 'Premio sorpresa de Donut Makers' },
            ].map((p) => (
              <div key={p.pos} className="rounded-xl p-4 text-center space-y-1 border border-amber-400/20" style={{ background: 'rgba(46,16,101,0.45)' }}>
                <div className="text-3xl">{p.pos}</div>
                <div className="text-white font-bold text-sm">{p.label}</div>
                <div className="text-violet-300 text-xs">{p.premio}</div>
              </div>
            ))}
          </div>
          <p className="text-violet-300 text-xs text-center relative z-10">
            Los premios se anuncian antes de que arranque el Mundial. ¡Seguinos en{' '}
            <a
              href="https://www.instagram.com/donut.makers.caballito"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
            >
              @donut.makers.caballito
            </a>{' '}
            para enterarte!
          </p>
        </div>
      </section>

      {/* ── Punto extra en el local ────────────────────────────── */}
      <section>
        <div
          className="rounded-2xl p-7 flex items-start gap-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(139,92,246,0.12) 40%, rgba(46,16,101,0.75) 100%)',
            border: '1.5px solid rgba(212,175,55,0.45)',
            boxShadow: '0 0 40px rgba(212,175,55,0.10)',
          }}
        >
          <div
            className="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)' }}
          />
          <span className="text-5xl shrink-0 relative z-10">🍩</span>
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-4xl font-black text-transparent bg-clip-text leading-none"
                style={{ backgroundImage: 'linear-gradient(135deg, #fcd34d, #d4af37)' }}
              >
                +1
              </span>
              <span className="font-black text-xl text-white">puntos EXTRA</span>
            </div>
            <p className="text-violet-200 text-sm leading-relaxed">
              Sumá puntos al ranking sin predecir: <strong className="text-amber-300">+1 punto por cada partido</strong> del
              Mundial que vengas a ver a <strong className="text-amber-300">Donut Makers</strong> con consumo, y{' '}
              <strong className="text-amber-300">+1 punto</strong> más por cada 4 donas especiales del Mundial que compres.
              Donut + fútbol = imbatible.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Av.+La+Plata+702+Caballito+CABA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-xs font-bold pt-1 inline-block underline underline-offset-2 transition-colors"
            >
              📍 Av. La Plata 702, Caballito · CABA
            </a>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ──────────────────────────────────────── */}
      <section className="space-y-7">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black tracking-tight">¿Cómo funciona?</h2>
          <p className="text-violet-300 text-sm">Tres pasos, cero complicaciones</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: '01', icon: '✍️', titulo: 'Te registrás',
              desc: 'Gratis, en menos de un minuto. Usuario, mail y listo.',
              bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.45)',
              glow: 'rgba(59,130,246,0.12)', numColor: '#60a5fa',
            },
            {
              n: '02', icon: '⚽', titulo: 'Armás tu prode',
              desc: 'Elegís el resultado de cada partido antes de que arranque. Cuando empieza, se cierra.',
              bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.45)',
              glow: 'rgba(167,139,250,0.10)', numColor: '#a78bfa',
            },
            {
              n: '03', icon: '🏆', titulo: 'Comienza el juego',
              desc: 'Resultado exacto = 3 pts. Ganador correcto = 1 pt. El que más acumule gana.',
              bg: 'rgba(212,175,55,0.18)', border: 'rgba(212,175,55,0.45)',
              glow: 'rgba(212,175,55,0.10)', numColor: '#fbbf24',
            },
          ].map((paso) => (
            <div
              key={paso.n}
              className="rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1"
              style={{
                background: paso.bg,
                border: `1.5px solid ${paso.border}`,
                boxShadow: `0 8px 32px ${paso.glow}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{paso.icon}</span>
                <span className="text-5xl font-black opacity-25" style={{ color: paso.numColor }}>{paso.n}</span>
              </div>
              <h3 className="font-bold text-lg text-white">{paso.titulo}</h3>
              <p className="text-violet-200 text-sm leading-relaxed">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sistema de puntos ──────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Sistema de puntos</h2>
          <p className="text-violet-300 text-sm">Simple y directo — sin trampas</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">

          <div
            className="rounded-2xl p-8 text-center space-y-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(212,175,55,0.28) 0%, rgba(46,16,101,0.70) 100%)',
              border: '1.5px solid rgba(212,175,55,0.50)',
              boxShadow: '0 0 40px rgba(212,175,55,0.12)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
            <div className="leading-none relative">
              <span className="text-7xl font-black text-amber-400">3</span>
              <span className="text-2xl font-black text-amber-400"> puntos</span>
            </div>
            <div className="font-bold text-white text-base">Resultado exacto</div>
            <div className="text-violet-300 text-xs">Predijiste 2-1 y salió 2-1</div>
          </div>

          <div
            className="rounded-2xl p-8 text-center space-y-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(59,130,246,0.28) 0%, rgba(46,16,101,0.70) 100%)',
              border: '1.5px solid rgba(59,130,246,0.50)',
              boxShadow: '0 0 40px rgba(59,130,246,0.12)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
            <div className="leading-none relative">
              <span className="text-7xl font-black text-blue-400">1</span>
              <span className="text-2xl font-black text-blue-400"> punto</span>
            </div>
            <div className="font-bold text-white text-base">Ganador correcto</div>
            <div className="text-violet-300 text-xs">Acertaste quién ganaba</div>
          </div>

          <div
            className="rounded-2xl p-8 text-center space-y-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(167,139,250,0.28) 0%, rgba(46,16,101,0.70) 100%)',
              border: '1.5px solid rgba(167,139,250,0.50)',
              boxShadow: '0 0 40px rgba(167,139,250,0.12)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
            <div className="leading-none relative">
              <span className="text-7xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #c4b5fd, #a78bfa)' }}>+1</span>
              <span className="text-2xl font-black text-violet-300"> punto extra</span>
            </div>
            <div className="font-bold text-white text-base">En el local</div>
            <div className="text-violet-300 text-xs">Por consumir viendo un partido, y cada 4 donas especiales del Mundial</div>
          </div>

        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────── */}
      <section className="text-center py-10 space-y-5 relative">
        <div className="absolute inset-0 -z-10 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(212,175,55,0.10) 0%, transparent 70%)',
        }} />
        <p className="text-3xl font-black tracking-tight">¿Qué esperás?</p>
        <p className="text-violet-200">Gratis. Sin complicaciones. Solo para clientes del local 🍩</p>
        <Link
          href="/unirse"
          className="inline-block bg-amber-400 hover:bg-amber-300 text-violet-950 px-14 py-4 rounded-full font-bold text-xl transition-all shadow-xl shadow-amber-400/40 hover:-translate-y-0.5"
        >
          Me anoto ahora
        </Link>
      </section>

    </div>
  );
}
