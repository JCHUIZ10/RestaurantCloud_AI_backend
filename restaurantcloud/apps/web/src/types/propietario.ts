/**
 * Tipos y DTOs para el Portal Propietario - Módulo de Incidentes de la Empresa (CU-PROP-06)
 * Basado en las especificaciones de wireframe.md y 02_schema_ddl.sql (tablas incidente e incidente_bitacora).
 */

import {
  CategoriaIncidente,
  GravedadIncidente,
  EstadoIncidente,
  TipoEventoBitacora,
  IncidenteBitacoraItemDTO,
  IncidenteDetalleDTO,
} from './admin';

export interface SedeResumenDTO {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  distrito: string;
  ciudad: string;
}

export interface IncidenteBandejaItemDTO {
  id: string;
  codigo: string; // ej. "INC-2026-084"
  local_id: string;
  local_nombre: string;
  piso_nombre?: string | null;
  gravedad: GravedadIncidente;
  categoria: CategoriaIncidente;
  titulo: string;
  involucrado_nombre?: string | null;
  involucrado_cargo?: string | null;
  estado: EstadoIncidente;
  visto_por_propietario: boolean;
  fecha_visto?: string | null;
  tiene_evidencia: boolean;
  total_avances: number;
  dias_en_curso: number;
  created_at: string;
}

export interface PropietarioDesgloseMesDTO {
  abiertos: number;
  en_revision: number;
  resueltos: number;
}

export interface PropietarioIncidentesKpisDTO {
  no_revisados: number;
  no_revisados_alta: number;
  gravedad_alta_activos: number;
  total_mes: number;
  desglose_mes: PropietarioDesgloseMesDTO;
  resueltos_por_sede: Record<string, { total_resueltos: number; no_revisados: number }>;
}

export interface PropietarioIncidentesFiltrosRequest {
  local_id?: string; // 'todas' o UUID específico
  gravedad?: GravedadIncidente | 'todas';
  categoria?: CategoriaIncidente | 'todas';
  estado?: EstadoIncidente | 'todos';
  no_vistos?: boolean;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

export interface PropietarioIncidentesBandejaResponse {
  kpis: PropietarioIncidentesKpisDTO;
  incidentes: IncidenteBandejaItemDTO[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

export interface PasarARevisionRequest {
  nota_propietario: string;
}

export interface IncidenteCriticoEvent {
  id: string;
  codigo: string;
  local_id: string;
  local_nombre: string;
  gravedad: GravedadIncidente;
  categoria: CategoriaIncidente;
  titulo: string;
  created_at: string;
}
export type SseIncidenteCriticoEvent = IncidenteCriticoEvent;

// Re-exportar tipos complementarios de admin para uso directo en módulos de propietario
export type {
  CategoriaIncidente,
  GravedadIncidente,
  EstadoIncidente,
  TipoEventoBitacora,
  IncidenteBitacoraItemDTO,
  IncidenteDetalleDTO,
};
