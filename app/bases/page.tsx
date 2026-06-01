import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bases y Condiciones · El Prode de Donut Makers Caballito',
  description: 'Reglamento oficial del prode del Mundial 2026 de Donut Makers Caballito.',
};

function Seccion({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-white flex items-baseline gap-2">
        <span className="text-orange-400 tabular-nums">{n}.</span> {titulo}
      </h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function BasesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">

      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl">📋</div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Bases y Condiciones</h1>
        <p className="text-zinc-500 text-sm">El Prode de Donut Makers Caballito · Mundial 2026</p>
        <p className="text-zinc-600 text-xs">Última actualización: 1 de junio de 2026</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">

        <Seccion n={1} titulo="Organizador">
          <p>
            El presente prode (en adelante, <strong className="text-white">&ldquo;el Prode&rdquo;</strong>) es organizado
            por <strong className="text-white">Donut Makers Caballito</strong>, con domicilio en Av. La Plata 702,
            Caballito, Ciudad Autónoma de Buenos Aires, Argentina (en adelante, &ldquo;el Organizador&rdquo;). Ante
            cualquier duda, escribinos por Instagram a{' '}
            <a href="https://www.instagram.com/donut.makers.caballito" target="_blank" rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline">@donut.makers.caballito</a>.
          </p>
        </Seccion>

        <Seccion n={2} titulo="En qué consiste">
          <p>
            El Prode es un juego de pronósticos de la Copa Mundial de la FIFA 2026. Cada participante predice el
            resultado de los partidos antes de que comiencen y suma puntos según sus aciertos. Gana quien más puntos
            acumule.
          </p>
        </Seccion>

        <Seccion n={3} titulo="Quién puede participar">
          <p>Pueden participar las personas que:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sean <strong className="text-white">mayores de 18 años</strong>.</li>
            <li>Completen el registro con todos sus datos reales (nombre, usuario, mail, WhatsApp y DNI).</li>
            <li>Sigan la cuenta de Instagram <strong className="text-white">@donut.makers.caballito</strong>.</li>
            <li>Acepten estas Bases y Condiciones.</li>
          </ul>
          <p>Cada persona puede tener una sola cuenta (ver punto 13).</p>
        </Seccion>

        <Seccion n={4} titulo="Participación gratuita">
          <p>
            La participación en el Prode es totalmente <strong className="text-white">gratuita</strong> y no requiere
            ninguna compra. Consumir en el local otorga puntos extra (ver punto 7), pero no es obligatorio para jugar ni
            para ganar.
          </p>
        </Seccion>

        <Seccion n={5} titulo="Inscripción y vigencia">
          <ul className="list-disc pl-5 space-y-1">
            <li>El Prode se desarrolla durante el Mundial 2026, del <strong className="text-white">11 de junio al 19 de julio de 2026</strong> (día de la final).</li>
            <li>No hay fecha límite de inscripción: podés sumarte en cualquier momento.</li>
            <li>Cada participante empieza a jugar a partir del momento de su registro. No se pueden predecir ni puntuar partidos que hayan comenzado antes de la inscripción. Los partidos anteriores se pueden ver, pero no modificar.</li>
          </ul>
        </Seccion>

        <Seccion n={6} titulo="Cómo se puntúa">
          <p>Por cada partido predicho:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-green-400">3 puntos</strong> — resultado exacto (el marcador igual al real).</li>
            <li><strong className="text-orange-400">1 punto</strong> — ganador correcto (acertás quién gana o el empate, pero no el marcador exacto).</li>
            <li><strong className="text-zinc-300">0 puntos</strong> — pronóstico equivocado.</li>
          </ul>
          <p>
            Las predicciones se pueden cargar y editar libremente hasta <strong className="text-white">1 minuto antes</strong> del
            inicio de cada partido. Una vez comenzado, la predicción queda cerrada.
          </p>
        </Seccion>

        <Seccion n={7} titulo="Puntos extra (consumo en el local)">
          <p>Además de los puntos por predicción, podés sumar puntos extra:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">+1 punto</strong> por cada partido del Mundial que vengas a ver al local consumiendo.</li>
            <li><strong className="text-white">+1 punto</strong> por cada <strong className="text-white">4 donas especiales del Mundial</strong> que compres. Se acumulan entre distintas compras; no se otorgan puntos por fracciones (3 donas no suman).</li>
          </ul>
          <p>
            Estos puntos los carga el Organizador manualmente cuando el participante se presenta en el local y lo
            solicita, identificándose con sus datos. No hay límite de puntos extra.
          </p>
        </Seccion>

        <Seccion n={8} titulo="Fase eliminatoria">
          <p>
            En los partidos de eliminación directa (de dieciseisavos a la final), la predicción corresponde al resultado
            al finalizar los <strong className="text-white">120 minutos</strong> (tiempo reglamentario más tiempo
            suplementario). Las definiciones por penales no se consideran: si tu predicción es un empate y el partido
            termina empatado a los 120 minutos (definiéndose luego por penales), tu pronóstico se considera acertado. El
            equipo que avance por penales no afecta la puntuación.
          </p>
        </Seccion>

        <Seccion n={9} titulo="Ranking y desempate">
          <p>El ranking se ordena por puntos acumulados. En caso de empate en puntos, el desempate se resuelve en este orden:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Mayor cantidad de visitas al local para ver partidos.</li>
            <li>Mayor cantidad de resultados exactos acertados.</li>
            <li>Si persiste el empate, por sorteo.</li>
          </ol>
        </Seccion>

        <Seccion n={10} titulo="Premios">
          <p>El Prode entrega premios en dos instancias:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Fase de grupos:</strong> los 3 primeros del ranking al finalizar la fase de grupos reciben un premio.</li>
            <li><strong className="text-white">Prode completo:</strong> los 3 primeros del ranking final (al terminar el Mundial) reciben el premio mayor.</li>
          </ul>
          <p>En total puede haber hasta 6 ganadores. Los premios serán anunciados por el Organizador a través de sus redes.</p>
        </Seccion>

        <Seccion n={11} titulo="Entrega de premios">
          <p>
            El Organizador contactará a los ganadores por los datos provistos en el registro (mail, WhatsApp o
            Instagram) y coordinará la entrega. Los ganadores tendrán un plazo de <strong className="text-white">15 días
            corridos</strong> desde la notificación para responder y reclamar su premio. Pasado ese plazo sin respuesta,
            el premio se considerará no reclamado y el Organizador podrá reasignarlo o declararlo desierto.
          </p>
        </Seccion>

        <Seccion n={12} titulo="Uso de nombre e imagen">
          <p>
            Los participantes que lo hayan autorizado expresamente al registrarse aceptan que el Organizador pueda
            publicar su nombre de usuario y/o imagen en las redes y canales de Donut Makers con fines de difusión del
            Prode y sus ganadores, sin que ello genere derecho a compensación alguna.
          </p>
        </Seccion>

        <Seccion n={13} titulo="Una cuenta por persona y descalificación">
          <p>
            Está permitida <strong className="text-white">una única cuenta por persona</strong>. El uso de múltiples
            cuentas, datos falsos o cualquier intento de fraude o manipulación dará lugar a la{' '}
            <strong className="text-white">descalificación automática e inmediata</strong> del participante, con pérdida
            de todos sus puntos y premios, a sola decisión del Organizador.
          </p>
        </Seccion>

        <Seccion n={14} titulo="Datos personales">
          <p>
            Los datos personales solicitados se utilizan <strong className="text-white">únicamente</strong> para la
            organización y el funcionamiento del Prode (identificación de participantes, contacto y entrega de premios).
            No se comparten, venden ni ceden a terceros bajo ninguna circunstancia.
          </p>
        </Seccion>

        <Seccion n={15} titulo="Resultados oficiales">
          <p>
            Los resultados de los partidos se toman de los <strong className="text-white">resultados oficiales de la
            FIFA</strong>. Ante cualquier modificación, anulación o corrección oficial, se considerará válido el
            resultado oficial final.
          </p>
        </Seccion>

        <Seccion n={16} titulo="Fuerza mayor y modificaciones">
          <p>
            El Organizador podrá modificar, suspender o cancelar el Prode, total o parcialmente, ante casos de fuerza
            mayor ajenos a su voluntad (cambios en el calendario del Mundial, suspensión de partidos, problemas técnicos,
            etc.), tomando los recaudos para no perjudicar a los participantes.
          </p>
        </Seccion>

        <Seccion n={17} titulo="Decisión del Organizador">
          <p>
            Toda situación no prevista en estas Bases será resuelta por el Organizador. Sus decisiones son{' '}
            <strong className="text-white">definitivas e inapelables</strong>.
          </p>
        </Seccion>

        <Seccion n={18} titulo="Aceptación">
          <p>
            La participación en el Prode implica el conocimiento y la aceptación total de estas Bases y Condiciones.
          </p>
        </Seccion>

      </div>

      <p className="text-center text-zinc-600 text-xs">
        Donut Makers Caballito · Av. La Plata 702, CABA ·{' '}
        <a href="https://www.instagram.com/donut.makers.caballito" target="_blank" rel="noopener noreferrer"
          className="text-orange-400/80 hover:text-orange-300 underline">@donut.makers.caballito</a>
      </p>

      <div className="text-center">
        <Link href="/unirse" className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-7 py-3 rounded-full font-bold transition-all shadow-lg shadow-orange-500/20">
          Sumarme al prode ⚽
        </Link>
      </div>

    </div>
  );
}
