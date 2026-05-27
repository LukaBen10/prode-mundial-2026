const GRUPOS: Record<string, string[]> = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'Chequia'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Arabia Saudita', 'Cabo Verde', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

// Fechas por grupo [jornada1, jornada2, jornada3]
const FECHAS: Record<string, [string, string, string]> = {
  A: ['2026-06-11', '2026-06-17', '2026-06-23'],
  B: ['2026-06-11', '2026-06-17', '2026-06-23'],
  C: ['2026-06-12', '2026-06-18', '2026-06-24'],
  D: ['2026-06-12', '2026-06-18', '2026-06-24'],
  E: ['2026-06-13', '2026-06-19', '2026-06-25'],
  F: ['2026-06-14', '2026-06-20', '2026-06-25'],
  G: ['2026-06-14', '2026-06-20', '2026-06-26'],
  H: ['2026-06-15', '2026-06-21', '2026-06-26'],
  I: ['2026-06-15', '2026-06-21', '2026-06-27'],
  J: ['2026-06-16', '2026-06-22', '2026-06-27'],
  K: ['2026-06-16', '2026-06-22', '2026-06-27'],
  L: ['2026-06-13', '2026-06-19', '2026-06-27'],
};

// Horarios y sedes por grupo — 6 partidos en orden: [J1M1, J1M2, J2M1, J2M2, J3M1, J3M2]
// Hora en ART (Argentina, UTC-3). J3 siempre simultáneo (misma hora).
type InfoPartido = { hora: string; estadio: string; ciudad: string };

const SCHEDULE: Record<string, [InfoPartido, InfoPartido, InfoPartido, InfoPartido, InfoPartido, InfoPartido]> = {
  A: [
    { hora: '22:00', estadio: 'Estadio Azteca', ciudad: 'Ciudad de México' },
    { hora: '19:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '22:00', estadio: 'Estadio Azteca', ciudad: 'Ciudad de México' },
    { hora: '19:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '19:00', estadio: 'Estadio Akron', ciudad: 'Guadalajara' },
    { hora: '19:00', estadio: 'Estadio BBVA', ciudad: 'Monterrey' },
  ],
  B: [
    { hora: '16:00', estadio: 'BMO Field', ciudad: 'Toronto' },
    { hora: '22:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
    { hora: '16:00', estadio: 'BMO Field', ciudad: 'Toronto' },
    { hora: '22:00', estadio: 'Lincoln Financial Field', ciudad: 'Filadelfia' },
    { hora: '19:00', estadio: "Levi's Stadium", ciudad: 'San Francisco' },
    { hora: '19:00', estadio: 'Lumen Field', ciudad: 'Seattle' },
  ],
  C: [
    { hora: '22:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
    { hora: '19:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '22:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
    { hora: '19:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: 'Rose Bowl', ciudad: 'Los Ángeles' },
  ],
  D: [
    { hora: '16:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
    { hora: '22:00', estadio: 'Lumen Field', ciudad: 'Seattle' },
    { hora: '16:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
    { hora: '22:00', estadio: 'Arrowhead Stadium', ciudad: 'Kansas City' },
    { hora: '19:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '19:00', estadio: 'Gillette Stadium', ciudad: 'Boston' },
  ],
  E: [
    { hora: '22:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '16:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '22:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
    { hora: '16:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: "Levi's Stadium", ciudad: 'San Francisco' },
  ],
  F: [
    { hora: '22:00', estadio: 'Lumen Field', ciudad: 'Seattle' },
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '22:00', estadio: 'BC Place', ciudad: 'Vancouver' },
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: 'Rose Bowl', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: 'BC Place', ciudad: 'Vancouver' },
  ],
  G: [
    { hora: '19:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '22:00', estadio: 'Lincoln Financial Field', ciudad: 'Filadelfia' },
    { hora: '19:00', estadio: 'Gillette Stadium', ciudad: 'Boston' },
    { hora: '22:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
    { hora: '19:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '19:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
  ],
  H: [
    { hora: '22:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '16:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
    { hora: '22:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '16:00', estadio: 'Lincoln Financial Field', ciudad: 'Filadelfia' },
    { hora: '19:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '19:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
  ],
  I: [
    { hora: '19:00', estadio: 'Gillette Stadium', ciudad: 'Boston' },
    { hora: '22:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
    { hora: '19:00', estadio: 'Gillette Stadium', ciudad: 'Boston' },
    { hora: '22:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '19:00', estadio: 'Lincoln Financial Field', ciudad: 'Filadelfia' },
    { hora: '19:00', estadio: 'Gillette Stadium', ciudad: 'Boston' },
  ],
  J: [
    { hora: '22:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '16:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
    { hora: '22:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '16:00', estadio: 'Rose Bowl', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
    { hora: '19:00', estadio: 'AT&T Stadium', ciudad: 'Dallas' },
  ],
  K: [
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '22:00', estadio: 'Rose Bowl', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '22:00', estadio: "Levi's Stadium", ciudad: 'San Francisco' },
    { hora: '19:00', estadio: 'SoFi Stadium', ciudad: 'Los Ángeles' },
    { hora: '19:00', estadio: 'Rose Bowl', ciudad: 'Los Ángeles' },
  ],
  L: [
    { hora: '22:00', estadio: 'Arrowhead Stadium', ciudad: 'Kansas City' },
    { hora: '16:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
    { hora: '22:00', estadio: 'Arrowhead Stadium', ciudad: 'Kansas City' },
    { hora: '16:00', estadio: 'Gillette Stadium', ciudad: 'Boston' },
    { hora: '19:00', estadio: 'Arrowhead Stadium', ciudad: 'Kansas City' },
    { hora: '19:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
  ],
};

export function generarPartidosGrupos() {
  const partidos: {
    fase: string;
    grupo: string;
    equipo_local: string;
    equipo_visitante: string;
    fecha: string;
    hora: string;
    estadio: string;
    ciudad: string;
  }[] = [];

  for (const [grupo, equipos] of Object.entries(GRUPOS)) {
    const fechas = FECHAS[grupo];
    const sched = SCHEDULE[grupo];

    // Jornada 1
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[1], fecha: fechas[0], ...sched[0] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[2], equipo_visitante: equipos[3], fecha: fechas[0], ...sched[1] });

    // Jornada 2
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[2], fecha: fechas[1], ...sched[2] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[1], equipo_visitante: equipos[3], fecha: fechas[1], ...sched[3] });

    // Jornada 3 (simultánea)
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[3], fecha: fechas[2], ...sched[4] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[1], equipo_visitante: equipos[2], fecha: fechas[2], ...sched[5] });
  }

  return partidos;
}

export const NOMBRES_GRUPOS = Object.keys(GRUPOS);
export { GRUPOS };
