/** Avisos del personal (CU-TRANS-01): contrato de ms-notificaciones (doc-2u/servicios/ms-notificaciones.md). */

export type SeveridadAviso = 'info' | 'alerta' | 'critica';

export interface AvisoDTO {
  id: string;
  tipo: string;
  severidad: SeveridadAviso;
  titulo: string;
  mensaje: string;
  /** Identificadores y montos del evento que originó el aviso; su forma depende de `tipo`. */
  datos: Record<string, unknown>;
  local_id: string;
  /** Calculado para quien consulta: otro usuario del mismo rol puede tenerlo sin leer. */
  leida: boolean;
  leida_en: string | null;
  creada_en: string;
}

export interface ContadorAvisosDTO {
  total: number;
  criticas: number;
}

export interface ListarAvisosParams {
  pagina: number;
  porPagina: number;
  soloNoLeidas: boolean;
}

/** Estado del canal en tiempo real: «caido» significa que la campana consulta el contador cada 30 s. */
export type EstadoCanal = 'conectando' | 'vivo' | 'caido';
