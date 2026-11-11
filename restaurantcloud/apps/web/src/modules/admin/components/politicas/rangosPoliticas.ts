import { PoliticasReservaDTO } from '@/types/admin';

/**
 * Rangos permitidos de los parámetros de las políticas de reserva.
 * Es la única referencia para el panel, el simulador y los mensajes de error, y debe coincidir con
 * las reglas del servidor (PoliticaReservaController).
 */
export type CampoPolitica =
  | 'duracion_reserva_min'
  | 'buffer_reserva_min'
  | 'tolerancia_no_show_min'
  | 'minutos_bloqueo_previo'
  | 'margen_recordatorio_min'
  | 'anticipacion_maxima_dias';

export interface RangoPolitica {
  min: number;
  max: number;
  unidad: 'minutos' | 'días';
  /** Nombre del parámetro tal como se muestra en la pantalla. */
  etiqueta: string;
}

export const RANGOS_POLITICAS: Record<CampoPolitica, RangoPolitica> = {
  duracion_reserva_min: { min: 30, max: 240, unidad: 'minutos', etiqueta: 'Duración estándar' },
  buffer_reserva_min: { min: 0, max: 60, unidad: 'minutos', etiqueta: 'Buffer de limpieza' },
  tolerancia_no_show_min: { min: 5, max: 60, unidad: 'minutos', etiqueta: 'Tolerancia No-Show' },
  minutos_bloqueo_previo: { min: 0, max: 120, unidad: 'minutos', etiqueta: 'Bloqueo previo' },
  margen_recordatorio_min: { min: 15, max: 1440, unidad: 'minutos', etiqueta: 'Margen de recordatorio' },
  anticipacion_maxima_dias: { min: 1, max: 90, unidad: 'días', etiqueta: 'Anticipación máxima' },
};

export const CAMPOS_POLITICA = Object.keys(RANGOS_POLITICAS) as CampoPolitica[];

/** Error de validación por campo; los campos válidos no aparecen. */
export type ErroresPoliticas = Partial<Record<CampoPolitica, string>>;

const unidadCorta = (unidad: RangoPolitica['unidad']) => (unidad === 'minutos' ? 'min' : unidad);

/** Texto breve del rango permitido: "30 a 240 min". */
export function textoRango(campo: CampoPolitica): string {
  const { min, max, unidad } = RANGOS_POLITICAS[campo];
  return `${min} a ${max} ${unidadCorta(unidad)}`;
}

/** Mensaje de error de un valor, o null si es válido. */
export function validarCampo(campo: CampoPolitica, valor: number): string | null {
  const { min, max, unidad } = RANGOS_POLITICAS[campo];

  if (!Number.isFinite(valor)) return 'Ingresa un número.';
  if (!Number.isInteger(valor)) return 'Debe ser un número entero.';
  if (valor < min || valor > max) return `Debe estar entre ${min} y ${max} ${unidad}.`;

  return null;
}

/** Errores de todos los parámetros de las políticas. */
export function validarPoliticas(politicas: Pick<PoliticasReservaDTO, CampoPolitica>): ErroresPoliticas {
  const errores: ErroresPoliticas = {};

  for (const campo of CAMPOS_POLITICA) {
    const error = validarCampo(campo, politicas[campo]);
    if (error) errores[campo] = error;
  }

  return errores;
}

/** Lleva un valor al rango permitido (y a entero). Un valor no numérico pasa al mínimo. */
export function ajustarARango(campo: CampoPolitica, valor: number): number {
  const { min, max } = RANGOS_POLITICAS[campo];
  if (!Number.isFinite(valor)) return min;

  return Math.min(max, Math.max(min, Math.round(valor)));
}
