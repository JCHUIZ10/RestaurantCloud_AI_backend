/**
 * Predicción de demanda y reposición de insumos. Forma de las respuestas del núcleo
 * (doc-2u/servicios/nucleo-laravel.md, «API nueva o modificada»).
 */

/** 0 esperando las primeras ventas, 1 en preparación, 2 casi a punto, 3 al punto (modelo propio). */
export type NivelPrediccion = 0 | 1 | 2 | 3;

export type PrioridadReposicion = 'urgente' | 'pronto' | 'cubierto';

export type EstadoRecomendacion = 'pendiente' | 'aceptada' | 'ajustada' | 'descartada';

export type DecisionReposicion = Exclude<EstadoRecomendacion, 'pendiente'>;

export type MetodoPronostico = 'modelo' | 'baseline' | 'cerrado' | 'sin_historial';

export interface ProveedorReposicionDTO {
  id: string;
  nombre: string;
  /** Precio de la última compra del insumo */
  precio: number;
  ultima_compra: string | null;
}

export interface LineaReposicionDTO {
  id: string;
  insumo_id: string;
  insumo: string;
  unidad_medida: string;
  prioridad: PrioridadReposicion;
  /** `bajo_minimo`: sin consumo previsto, pero por debajo de su stock mínimo */
  motivo: 'consumo' | 'bajo_minimo';
  /** Días seguidos que el stock cubre el consumo más probable; nulo si no hay consumo previsto */
  alcanza_dias: number | null;
  consumo_previsto: number;
  margen_seguridad: number;
  stock_al_calcular: number;
  stock_minimo: number;
  cantidad_sugerida: number;
  estado: EstadoRecomendacion;
  cantidad_final: number | null;
  decidido_en: string | null;
  costo_estimado: number;
  proveedor: ProveedorReposicionDTO | null;
}

export interface TotalesReposicionDTO {
  por_prioridad: Record<PrioridadReposicion, number>;
  costo: number;
  proveedores: number;
  decisiones: { pendientes: number; aceptadas: number; ajustadas: number; descartadas: number };
}

export interface DiaPronosticoDTO {
  fecha: string;
  p50: number;
  p90: number;
  metodo: MetodoPronostico;
  motivo: string | null;
}

export interface PlatoPronosticoDTO {
  producto_id: string;
  nombre: string;
  dias: DiaPronosticoDTO[];
}

export interface PronosticoDTO {
  ejecucion_id: string;
  fecha_inicio: string;
  horizonte_dias: number;
  modelo: { modelo_version: string; algoritmo: string; entrenado_hasta: string; publicado_en: string } | null;
  datos: { desde: string | null; hasta: string | null; actualizados_hasta: string | null };
  historial: { dias_con_ventas: number | null };
  resumen: Record<MetodoPronostico, number>;
  advertencias: string[];
  predicciones: PlatoPronosticoDTO[];
}

export interface PrediccionDTO {
  nivel: NivelPrediccion;
  cobertura_dias: 3 | 5 | 7;
  creada_en: string;
  /** Solo en el nivel 3 */
  confianza: { error_promedio: number; mejora_pct: number } | null;
  /** Solo en los niveles 0 a 2 */
  progreso: { dias_con_ventas: number; faltan_para_siguiente: number | null } | null;
  /** Nulo si ms-pronóstico no responde: la reposición sigue disponible */
  pronostico: PronosticoDTO | null;
  reposicion: LineaReposicionDTO[];
  totales: TotalesReposicionDTO;
}

export interface DecisionLoteDTO {
  id: string;
  estado: DecisionReposicion;
  cantidad_final?: number | null;
}

export type CoberturaDias = 3 | 5 | 7;

// --- Vista del propietario ---

export interface DiaSedeDTO {
  fecha: string;
  total_p50: number;
  total_p90: number;
}

export interface SedePrediccionDTO {
  local_id: string;
  nombre: string;
  estado: 'ok' | 'sin_pronostico' | 'no_disponible';
  nivel: NivelPrediccion | null;
  dias_con_ventas: number | null;
  creada_en: string | null;
  cobertura_dias: CoberturaDias | null;
  pronostico: {
    fecha_inicio: string;
    total_semana: number;
    dias: DiaSedeDTO[];
    platos: { nombre: string; total_p50: number }[];
    advertencias: string[];
  } | null;
  reposicion: TotalesReposicionDTO | null;
}

export interface PrediccionPropietarioDTO {
  sedes: SedePrediccionDTO[];
  panorama: {
    total_semana: number;
    dias: { fecha: string; total_p50: number; por_sede: Record<string, number> }[];
  };
}

// --- Traspaso hacia el formulario de Compras ---

export interface LineaCompraSugerida {
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
}

/** Lo que «Preparar la compra» le entrega a «Compras» (estado de navegación) para abrir el registro ya cargado. */
export interface CompraSugerida {
  proveedorId: string | null;
  lineas: LineaCompraSugerida[];
}
