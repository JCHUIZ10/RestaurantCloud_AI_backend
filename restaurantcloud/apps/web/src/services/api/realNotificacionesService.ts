import { microserviciosEnviar, microserviciosGet } from './clienteMicroservicios';
import type { AvisoDTO, ContadorAvisosDTO, ListarAvisosParams } from '@/types/notificaciones';

/** Bandeja de avisos del personal (CU-TRANS-01): ms-notificaciones, por Kong. */
export const realNotificacionesService = {
  /** Bandeja de quien llama, de la más reciente a la más antigua; `meta.total` trae el total de la consulta. */
  listar: ({ pagina, porPagina, soloNoLeidas }: ListarAvisosParams) =>
    microserviciosGet<AvisoDTO[]>('/notificaciones', {
      pagina,
      por_pagina: porPagina,
      solo_no_leidas: soloNoLeidas,
    }),

  /** Contador de la campana y respaldo del canal en tiempo real. */
  contador: () => microserviciosGet<ContadorAvisosDTO>('/notificaciones/no-leidas/total'),

  marcarLeida: (id: string) =>
    microserviciosEnviar<{ id: string; leida: boolean }>('PATCH', `/notificaciones/${encodeURIComponent(id)}/leida`),

  marcarTodasLeidas: () => microserviciosEnviar<{ afectadas: number }>('POST', '/notificaciones/marcar-todas-leidas'),
};

export type NotificacionesService = typeof realNotificacionesService;
