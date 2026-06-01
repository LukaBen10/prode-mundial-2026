export interface Partido {
  id: number;
  fase?: string;
  grupo: string;
  equipo_local: string;
  equipo_visitante: string;
  fecha: string;
  hora: string;
  estadio?: string;
  ciudad?: string;
  jugado: number;
  goles_local: number | null;
  goles_visitante: number | null;
}

export interface RankingEntry {
  posicion: number;
  id: number;
  nombre_usuario: string;
  puntos: number;
  fuera_premios?: number;
}
