/**
 * Mapeo de nombres de equipos en español (DB) → nombres en inglés (football-data.org API).
 * Si un nombre no está en el mapa se usa el original (para los que coinciden directamente).
 */
export const NOMBRE_API: Record<string, string> = {
  // América
  'México':                'Mexico',
  'Canadá':                'Canada',
  'Estados Unidos':        'United States',
  'Paraguay':              'Paraguay',
  'Ecuador':               'Ecuador',
  'Uruguay':               'Uruguay',
  'Colombia':              'Colombia',
  'Argentina':             'Argentina',
  'Brasil':                'Brazil',
  'Haití':                 'Haiti',
  'Panamá':                'Panama',
  'Curazao':               'Curaçao',
  'Costa Rica':            'Costa Rica',
  'Honduras':              'Honduras',
  'Jamaica':               'Jamaica',
  'Bolivia':               'Bolivia',
  'Chile':                 'Chile',
  'Venezuela':             'Venezuela',
  'Perú':                  'Peru',

  // Europa
  'España':                'Spain',
  'Francia':               'France',
  'Alemania':              'Germany',
  'Portugal':              'Portugal',
  'Países Bajos':          'Netherlands',
  'Bélgica':               'Belgium',
  'Suiza':                 'Switzerland',
  'Croacia':               'Croatia',
  'Suecia':                'Sweden',
  'Noruega':               'Norway',
  'Austria':               'Austria',
  'República Checa':       'Czech Republic',
  'Escocia':               'Scotland',
  'Inglaterra':            'England',
  'Bosnia y Herzegovina':  'Bosnia and Herzegovina',
  'Eslovaquia':            'Slovakia',
  'Eslovenia':             'Slovenia',
  'Rumanía':               'Romania',
  'Dinamarca':             'Denmark',
  'Hungría':               'Hungary',
  'Ucrania':               'Ukraine',
  'Serbia':                'Serbia',
  'Albania':               'Albania',
  'Georgia':               'Georgia',
  'Turquía':               'Türkiye',

  // África
  'Sudáfrica':             'South Africa',
  'Marruecos':             'Morocco',
  'Senegal':               'Senegal',
  'Egipto':                'Egypt',
  'Ghana':                 'Ghana',
  'Costa de Marfil':       'Ivory Coast',
  'Argelia':               'Algeria',
  'Túnez':                 'Tunisia',
  'Camerún':               'Cameroon',
  'Nigeria':               'Nigeria',
  'Cabo Verde':            'Cabo Verde',
  'RD Congo':              'DR Congo',
  'Mali':                  'Mali',
  'Angola':                'Angola',

  // Asia / Oceanía
  'Arabia Saudita':        'Saudi Arabia',
  'Japón':                 'Japan',
  'Corea del Sur':         'Korea Republic',
  'Irán':                  'IR Iran',
  'Australia':             'Australia',
  'Nueva Zelanda':         'New Zealand',
  'Catar':                 'Qatar',
  'Irak':                  'Iraq',
  'Jordania':              'Jordan',
  'Uzbekistán':            'Uzbekistan',
  'Tailandia':             'Thailand',
  'Indonesia':             'Indonesia',
  'China':                 'China PR',
};

/** Devuelve el nombre para la API dado un nombre en español */
export function toApiName(nombreEs: string): string {
  return NOMBRE_API[nombreEs] ?? nombreEs;
}

/** Mapa inverso: nombre API → nombre en español */
const NOMBRE_ES: Record<string, string> = Object.fromEntries(
  Object.entries(NOMBRE_API).map(([es, en]) => [en.toLowerCase(), es])
);

/** Dado un nombre de la API, devuelve el nombre en español (para buscar en DB) */
export function fromApiName(nombreApi: string): string {
  return NOMBRE_ES[nombreApi.toLowerCase()] ?? nombreApi;
}
