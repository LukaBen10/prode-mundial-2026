const GRUPOS: Record<string, string[]> = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],  // orden corregido
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

// 6 fechas por grupo: [M1, M2, M3, M4, M5, M6]
// Horarios en ART (UTC-3). Fuentes: NBC Sports, FIFA.com, worldcuplocaltime.
const FECHAS: Record<string, [string, string, string, string, string, string]> = {
  A: ['2026-06-11', '2026-06-11', '2026-06-18', '2026-06-18', '2026-06-24', '2026-06-24'],
  B: ['2026-06-12', '2026-06-13', '2026-06-18', '2026-06-18', '2026-06-24', '2026-06-24'],
  C: ['2026-06-13', '2026-06-13', '2026-06-19', '2026-06-19', '2026-06-24', '2026-06-24'],
  D: ['2026-06-12', '2026-06-14', '2026-06-19', '2026-06-20', '2026-06-25', '2026-06-25'],
  E: ['2026-06-14', '2026-06-14', '2026-06-20', '2026-06-20', '2026-06-25', '2026-06-25'],
  F: ['2026-06-14', '2026-06-14', '2026-06-20', '2026-06-21', '2026-06-25', '2026-06-25'],
  G: ['2026-06-15', '2026-06-15', '2026-06-21', '2026-06-21', '2026-06-27', '2026-06-27'],
  H: ['2026-06-15', '2026-06-15', '2026-06-21', '2026-06-21', '2026-06-26', '2026-06-26'],
  I: ['2026-06-16', '2026-06-16', '2026-06-22', '2026-06-22', '2026-06-26', '2026-06-26'],
  J: ['2026-06-16', '2026-06-17', '2026-06-22', '2026-06-23', '2026-06-27', '2026-06-27'],
  K: ['2026-06-17', '2026-06-17', '2026-06-23', '2026-06-23', '2026-06-27', '2026-06-27'],
  L: ['2026-06-17', '2026-06-17', '2026-06-23', '2026-06-23', '2026-06-27', '2026-06-27'],
};

// Horarios y sedes por partido — 6 entradas en orden: [M1, M2, M3, M4, M5, M6]
// Hora ART (UTC-3). Madrugada (00:00-03:00) = apertura del día indicado en FECHAS.
type InfoPartido = { hora: string; estadio: string; ciudad: string };

const SCHEDULE: Record<string, [InfoPartido, InfoPartido, InfoPartido, InfoPartido, InfoPartido, InfoPartido]> = {
  // Grupo A: México, Sudáfrica, Corea del Sur, República Checa
  A: [
    { hora: '16:00', estadio: 'Estadio Azteca',        ciudad: 'Ciudad de México' }, // M1 MEX-SAF 11/6
    { hora: '23:00', estadio: 'Estadio Akron',          ciudad: 'Guadalajara'       }, // M2 KOR-CZE 11/6
    { hora: '22:00', estadio: 'Estadio Akron',          ciudad: 'Guadalajara'       }, // M3 MEX-KOR 18/6
    { hora: '13:00', estadio: 'Mercedes-Benz Stadium',  ciudad: 'Atlanta'           }, // M4 SAF-CZE 18/6
    { hora: '22:00', estadio: 'Estadio Azteca',        ciudad: 'Ciudad de México' }, // M5 MEX-CZE 24/6
    { hora: '22:00', estadio: 'Estadio BBVA',           ciudad: 'Monterrey'         }, // M6 SAF-KOR 24/6
  ],
  // Grupo B: Canadá, Bosnia y Herzegovina, Catar, Suiza
  B: [
    { hora: '16:00', estadio: 'BMO Field',              ciudad: 'Toronto'           }, // M1 CAN-BOS 12/6
    { hora: '16:00', estadio: "Levi's Stadium",         ciudad: 'San Francisco'     }, // M2 CAT-SUI 13/6
    { hora: '19:00', estadio: 'BC Place',               ciudad: 'Vancouver'         }, // M3 CAN-CAT 18/6
    { hora: '16:00', estadio: 'SoFi Stadium',           ciudad: 'Los Ángeles'       }, // M4 BOS-SUI 18/6
    { hora: '16:00', estadio: 'BC Place',               ciudad: 'Vancouver'         }, // M5 CAN-SUI 24/6
    { hora: '16:00', estadio: 'Lumen Field',            ciudad: 'Seattle'           }, // M6 BOS-CAT 24/6
  ],
  // Grupo C: Brasil, Marruecos, Haití, Escocia
  C: [
    { hora: '19:00', estadio: 'MetLife Stadium',        ciudad: 'Nueva York'        }, // M1 BRA-MAR 13/6
    { hora: '22:00', estadio: 'Gillette Stadium',       ciudad: 'Boston'            }, // M2 HAI-ESC 13/6
    { hora: '22:00', estadio: 'Lincoln Financial Field',ciudad: 'Filadelfia'        }, // M3 BRA-HAI 19/6
    { hora: '19:00', estadio: 'Gillette Stadium',       ciudad: 'Boston'            }, // M4 MAR-ESC 19/6
    { hora: '19:00', estadio: 'Hard Rock Stadium',      ciudad: 'Miami'             }, // M5 BRA-ESC 24/6
    { hora: '19:00', estadio: 'Mercedes-Benz Stadium',  ciudad: 'Atlanta'           }, // M6 MAR-HAI 24/6
  ],
  // Grupo D: Estados Unidos, Paraguay, Australia, Turquía
  D: [
    { hora: '22:00', estadio: 'SoFi Stadium',           ciudad: 'Los Ángeles'       }, // M1 USA-PAR 12/6
    { hora: '01:00', estadio: 'BC Place',               ciudad: 'Vancouver'         }, // M2 AUS-TUR 14/6 (madrugada)
    { hora: '16:00', estadio: 'Lumen Field',            ciudad: 'Seattle'           }, // M3 USA-AUS 19/6
    { hora: '01:00', estadio: "Levi's Stadium",         ciudad: 'San Francisco'     }, // M4 PAR-TUR 20/6 (madrugada)
    { hora: '23:00', estadio: 'SoFi Stadium',           ciudad: 'Los Ángeles'       }, // M5 USA-TUR 25/6
    { hora: '23:00', estadio: "Levi's Stadium",         ciudad: 'San Francisco'     }, // M6 PAR-AUS 25/6
  ],
  // Grupo E: Alemania, Curazao, Costa de Marfil, Ecuador
  E: [
    { hora: '14:00', estadio: 'NRG Stadium',            ciudad: 'Houston'           }, // M1 ALE-CUR 14/6
    { hora: '20:00', estadio: 'Lincoln Financial Field',ciudad: 'Filadelfia'        }, // M2 CDM-ECU 14/6
    { hora: '17:00', estadio: 'BMO Field',              ciudad: 'Toronto'           }, // M3 ALE-CDM 20/6
    { hora: '21:00', estadio: 'Arrowhead Stadium',      ciudad: 'Kansas City'       }, // M4 CUR-ECU 20/6
    { hora: '17:00', estadio: 'MetLife Stadium',        ciudad: 'Nueva York'        }, // M5 ALE-ECU 25/6
    { hora: '17:00', estadio: 'Lincoln Financial Field',ciudad: 'Filadelfia'        }, // M6 CUR-CDM 25/6
  ],
  // Grupo F: Países Bajos, Japón, Suecia, Túnez
  F: [
    { hora: '17:00', estadio: 'AT&T Stadium',           ciudad: 'Dallas'            }, // M1 PBA-JAP 14/6
    { hora: '23:00', estadio: 'Estadio BBVA',           ciudad: 'Monterrey'         }, // M2 SUE-TUN 14/6
    { hora: '14:00', estadio: 'NRG Stadium',            ciudad: 'Houston'           }, // M3 PBA-SUE 20/6
    { hora: '01:00', estadio: 'Estadio BBVA',           ciudad: 'Monterrey'         }, // M4 JAP-TUN 21/6 (madrugada)
    { hora: '20:00', estadio: 'Arrowhead Stadium',      ciudad: 'Kansas City'       }, // M5 PBA-TUN 25/6
    { hora: '20:00', estadio: 'AT&T Stadium',           ciudad: 'Dallas'            }, // M6 JAP-SUE 25/6
  ],
  // Grupo G: Bélgica, Egipto, Irán, Nueva Zelanda
  G: [
    { hora: '16:00', estadio: 'Lumen Field',            ciudad: 'Seattle'           }, // M1 BEL-EGY 15/6
    { hora: '22:00', estadio: 'SoFi Stadium',           ciudad: 'Los Ángeles'       }, // M2 IRA-NZL 15/6
    { hora: '16:00', estadio: 'SoFi Stadium',           ciudad: 'Los Ángeles'       }, // M3 BEL-IRA 21/6
    { hora: '22:00', estadio: 'BC Place',               ciudad: 'Vancouver'         }, // M4 EGY-NZL 21/6
    { hora: '00:00', estadio: 'BC Place',               ciudad: 'Vancouver'         }, // M5 BEL-NZL 27/6 (medianoche)
    { hora: '00:00', estadio: 'Lumen Field',            ciudad: 'Seattle'           }, // M6 EGY-IRA 27/6 (medianoche)
  ],
  // Grupo H: España, Cabo Verde, Arabia Saudita, Uruguay
  H: [
    { hora: '13:00', estadio: 'Mercedes-Benz Stadium',  ciudad: 'Atlanta'           }, // M1 ESP-CVE 15/6
    { hora: '19:00', estadio: 'Hard Rock Stadium',      ciudad: 'Miami'             }, // M2 ARB-URU 15/6
    { hora: '13:00', estadio: 'Mercedes-Benz Stadium',  ciudad: 'Atlanta'           }, // M3 ESP-ARB 21/6
    { hora: '19:00', estadio: 'Hard Rock Stadium',      ciudad: 'Miami'             }, // M4 CVE-URU 21/6
    { hora: '21:00', estadio: 'Estadio Akron',          ciudad: 'Guadalajara'       }, // M5 ESP-URU 26/6
    { hora: '21:00', estadio: 'NRG Stadium',            ciudad: 'Houston'           }, // M6 CVE-ARB 26/6
  ],
  // Grupo I: Francia, Senegal, Irak, Noruega
  I: [
    { hora: '16:00', estadio: 'MetLife Stadium',        ciudad: 'Nueva York'        }, // M1 FRA-SEN 16/6
    { hora: '19:00', estadio: 'Gillette Stadium',       ciudad: 'Boston'            }, // M2 IRA-NOR 16/6
    { hora: '18:00', estadio: 'Lincoln Financial Field',ciudad: 'Filadelfia'        }, // M3 FRA-IRA 22/6
    { hora: '21:00', estadio: 'MetLife Stadium',        ciudad: 'Nueva York'        }, // M4 SEN-NOR 22/6
    { hora: '16:00', estadio: 'Gillette Stadium',       ciudad: 'Boston'            }, // M5 FRA-NOR 26/6
    { hora: '16:00', estadio: 'BMO Field',              ciudad: 'Toronto'           }, // M6 SEN-IRA 26/6
  ],
  // Grupo J: Argentina, Argelia, Austria, Jordania
  J: [
    { hora: '22:00', estadio: 'Arrowhead Stadium',      ciudad: 'Kansas City'       }, // M1 ARG-ALG 16/6
    { hora: '01:00', estadio: "Levi's Stadium",         ciudad: 'San Francisco'     }, // M2 AUS-JOR 17/6 (madrugada)
    { hora: '14:00', estadio: 'AT&T Stadium',           ciudad: 'Dallas'            }, // M3 ARG-AUS 22/6
    { hora: '00:00', estadio: "Levi's Stadium",         ciudad: 'San Francisco'     }, // M4 JOR-ALG 23/6 (medianoche)
    { hora: '23:00', estadio: 'AT&T Stadium',           ciudad: 'Dallas'            }, // M5 ARG-JOR 27/6
    { hora: '23:00', estadio: 'Arrowhead Stadium',      ciudad: 'Kansas City'       }, // M6 ALG-AUS 27/6
  ],
  // Grupo K: Portugal, RD Congo, Uzbekistán, Colombia
  K: [
    { hora: '14:00', estadio: 'NRG Stadium',            ciudad: 'Houston'           }, // M1 POR-RDC 17/6
    { hora: '23:00', estadio: 'Estadio Azteca',        ciudad: 'Ciudad de México' }, // M2 UZB-COL 17/6
    { hora: '14:00', estadio: 'NRG Stadium',            ciudad: 'Houston'           }, // M3 POR-UZB 23/6
    { hora: '23:00', estadio: 'Estadio Akron',          ciudad: 'Guadalajara'       }, // M4 RDC-COL 23/6
    { hora: '20:30', estadio: 'Hard Rock Stadium',      ciudad: 'Miami'             }, // M5 POR-COL 27/6
    { hora: '20:30', estadio: 'Mercedes-Benz Stadium',  ciudad: 'Atlanta'           }, // M6 RDC-UZB 27/6
  ],
  // Grupo L: Inglaterra, Croacia, Ghana, Panamá
  L: [
    { hora: '17:00', estadio: 'AT&T Stadium',           ciudad: 'Dallas'            }, // M1 ING-CRO 17/6
    { hora: '20:00', estadio: 'BMO Field',              ciudad: 'Toronto'           }, // M2 GHA-PAN 17/6
    { hora: '17:00', estadio: 'Gillette Stadium',       ciudad: 'Boston'            }, // M3 ING-GHA 23/6
    { hora: '20:00', estadio: 'BMO Field',              ciudad: 'Toronto'           }, // M4 CRO-PAN 23/6
    { hora: '18:00', estadio: 'MetLife Stadium',        ciudad: 'Nueva York'        }, // M5 ING-PAN 27/6
    { hora: '18:00', estadio: 'Lincoln Financial Field',ciudad: 'Filadelfia'        }, // M6 CRO-GHA 27/6
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
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[2], equipo_visitante: equipos[3], fecha: fechas[1], ...sched[1] });

    // Jornada 2
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[2], fecha: fechas[2], ...sched[2] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[1], equipo_visitante: equipos[3], fecha: fechas[3], ...sched[3] });

    // Jornada 3 (simultánea dentro del mismo grupo)
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[0], equipo_visitante: equipos[3], fecha: fechas[4], ...sched[4] });
    partidos.push({ fase: 'grupos', grupo, equipo_local: equipos[1], equipo_visitante: equipos[2], fecha: fechas[5], ...sched[5] });
  }

  return partidos;
}

// ── FASE ELIMINATORIA ─────────────────────────────────────────
// 32 partidos (num 73-104). Equipos "" = por definir (se completan
// automáticamente vía la API o manualmente a medida que avanza el torneo).
// Horarios en ART (UTC-3). Fuentes: Wikipedia, NBC Sports, Al Jazeera.

export type FaseElim = 'dieciseisavos' | 'octavos' | 'cuartos' | 'semifinal' | 'tercer_puesto' | 'final';

interface PartidoElim {
  num: number;
  fase: FaseElim;
  fecha: string;
  hora: string;
  estadio: string;
  ciudad: string;
}

const ELIMINATORIAS: PartidoElim[] = [
  // Dieciseisavos (Ronda de 32) — 73-88
  { num: 73, fase: 'dieciseisavos', fecha: '2026-06-28', hora: '16:00', estadio: 'SoFi Stadium',            ciudad: 'Los Ángeles'       },
  { num: 74, fase: 'dieciseisavos', fecha: '2026-06-29', hora: '17:30', estadio: 'Gillette Stadium',        ciudad: 'Boston'            },
  { num: 75, fase: 'dieciseisavos', fecha: '2026-06-29', hora: '22:00', estadio: 'Estadio BBVA',            ciudad: 'Monterrey'         },
  { num: 76, fase: 'dieciseisavos', fecha: '2026-06-29', hora: '14:00', estadio: 'NRG Stadium',             ciudad: 'Houston'           },
  { num: 77, fase: 'dieciseisavos', fecha: '2026-06-30', hora: '18:00', estadio: 'MetLife Stadium',         ciudad: 'Nueva York'        },
  { num: 78, fase: 'dieciseisavos', fecha: '2026-06-30', hora: '14:00', estadio: 'AT&T Stadium',            ciudad: 'Dallas'            },
  { num: 79, fase: 'dieciseisavos', fecha: '2026-06-30', hora: '22:00', estadio: 'Estadio Azteca',          ciudad: 'Ciudad de México'  },
  { num: 80, fase: 'dieciseisavos', fecha: '2026-07-01', hora: '13:00', estadio: 'Mercedes-Benz Stadium',   ciudad: 'Atlanta'           },
  { num: 81, fase: 'dieciseisavos', fecha: '2026-07-01', hora: '21:00', estadio: "Levi's Stadium",          ciudad: 'San Francisco'     },
  { num: 82, fase: 'dieciseisavos', fecha: '2026-07-01', hora: '17:00', estadio: 'Lumen Field',             ciudad: 'Seattle'           },
  { num: 83, fase: 'dieciseisavos', fecha: '2026-07-02', hora: '20:00', estadio: 'BMO Field',               ciudad: 'Toronto'           },
  { num: 84, fase: 'dieciseisavos', fecha: '2026-07-02', hora: '16:00', estadio: 'SoFi Stadium',            ciudad: 'Los Ángeles'       },
  { num: 85, fase: 'dieciseisavos', fecha: '2026-07-03', hora: '00:00', estadio: 'BC Place',                ciudad: 'Vancouver'         },
  { num: 86, fase: 'dieciseisavos', fecha: '2026-07-03', hora: '19:00', estadio: 'Hard Rock Stadium',       ciudad: 'Miami'             },
  { num: 87, fase: 'dieciseisavos', fecha: '2026-07-03', hora: '22:30', estadio: 'Arrowhead Stadium',       ciudad: 'Kansas City'       },
  { num: 88, fase: 'dieciseisavos', fecha: '2026-07-03', hora: '15:00', estadio: 'AT&T Stadium',            ciudad: 'Dallas'            },
  // Octavos — 89-96
  { num: 89, fase: 'octavos', fecha: '2026-07-04', hora: '18:00', estadio: 'Lincoln Financial Field', ciudad: 'Filadelfia'       },
  { num: 90, fase: 'octavos', fecha: '2026-07-04', hora: '14:00', estadio: 'NRG Stadium',             ciudad: 'Houston'          },
  { num: 91, fase: 'octavos', fecha: '2026-07-05', hora: '17:00', estadio: 'MetLife Stadium',         ciudad: 'Nueva York'       },
  { num: 92, fase: 'octavos', fecha: '2026-07-05', hora: '21:00', estadio: 'Estadio Azteca',          ciudad: 'Ciudad de México' },
  { num: 93, fase: 'octavos', fecha: '2026-07-06', hora: '16:00', estadio: 'AT&T Stadium',            ciudad: 'Dallas'           },
  { num: 94, fase: 'octavos', fecha: '2026-07-06', hora: '21:00', estadio: 'Lumen Field',             ciudad: 'Seattle'          },
  { num: 95, fase: 'octavos', fecha: '2026-07-07', hora: '13:00', estadio: 'Mercedes-Benz Stadium',   ciudad: 'Atlanta'          },
  { num: 96, fase: 'octavos', fecha: '2026-07-07', hora: '17:00', estadio: 'BC Place',                ciudad: 'Vancouver'        },
  // Cuartos — 97-100
  { num: 97,  fase: 'cuartos', fecha: '2026-07-09', hora: '17:00', estadio: 'Gillette Stadium',  ciudad: 'Boston'      },
  { num: 98,  fase: 'cuartos', fecha: '2026-07-10', hora: '16:00', estadio: 'SoFi Stadium',      ciudad: 'Los Ángeles' },
  { num: 99,  fase: 'cuartos', fecha: '2026-07-11', hora: '18:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami'       },
  { num: 100, fase: 'cuartos', fecha: '2026-07-11', hora: '22:00', estadio: 'Arrowhead Stadium', ciudad: 'Kansas City' },
  // Semifinales — 101-102
  { num: 101, fase: 'semifinal', fecha: '2026-07-14', hora: '16:00', estadio: 'AT&T Stadium',          ciudad: 'Dallas'  },
  { num: 102, fase: 'semifinal', fecha: '2026-07-15', hora: '16:00', estadio: 'Mercedes-Benz Stadium', ciudad: 'Atlanta' },
  // Tercer puesto — 103
  { num: 103, fase: 'tercer_puesto', fecha: '2026-07-18', hora: '18:00', estadio: 'Hard Rock Stadium', ciudad: 'Miami' },
  // Final — 104
  { num: 104, fase: 'final', fecha: '2026-07-19', hora: '16:00', estadio: 'MetLife Stadium', ciudad: 'Nueva York' },
];

export function generarEliminatorias() {
  return ELIMINATORIAS.map((p) => ({
    num_partido: p.num,
    fase: p.fase,
    grupo: '',
    equipo_local: '',      // por definir
    equipo_visitante: '',  // por definir
    fecha: p.fecha,
    hora: p.hora,
    estadio: p.estadio,
    ciudad: p.ciudad,
  }));
}

// Orden y etiquetas de las fases eliminatorias para la UI
export const FASES_ELIM: { fase: FaseElim; label: string; corto: string }[] = [
  { fase: 'dieciseisavos', label: 'Dieciseisavos', corto: '16avos' },
  { fase: 'octavos',       label: 'Octavos',       corto: '8vos'   },
  { fase: 'cuartos',       label: 'Cuartos',       corto: '4tos'   },
  { fase: 'semifinal',     label: 'Semifinales',   corto: 'Semis'  },
  { fase: 'tercer_puesto', label: 'Tercer puesto', corto: '3er'    },
  { fase: 'final',         label: 'Final',         corto: 'Final'  },
];

export const NOMBRES_GRUPOS = Object.keys(GRUPOS);
export { GRUPOS };

// Lista plana de los 48 equipos, ordenada — para selects del admin
export const TODOS_LOS_EQUIPOS = Object.values(GRUPOS).flat().sort((a, b) => a.localeCompare(b, 'es'));
