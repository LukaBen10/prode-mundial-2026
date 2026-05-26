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

// Fechas aproximadas por grupo [jornada1, jornada2, jornada3]
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

export function generarPartidosGrupos() {
  const partidos: {
    fase: string;
    grupo: string;
    equipo_local: string;
    equipo_visitante: string;
    fecha: string;
  }[] = [];

  for (const [grupo, equipos] of Object.entries(GRUPOS)) {
    const fechas = FECHAS[grupo];

    // Jornada 1
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[1], fecha: fechas[0] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[2], equipo_visitante: equipos[3], fecha: fechas[0] });

    // Jornada 2
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[2], fecha: fechas[1] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[1], equipo_visitante: equipos[3], fecha: fechas[1] });

    // Jornada 3
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[3], fecha: fechas[2] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[1], equipo_visitante: equipos[2], fecha: fechas[2] });
  }

  return partidos;
}

export const NOMBRES_GRUPOS = Object.keys(GRUPOS);
export { GRUPOS };
