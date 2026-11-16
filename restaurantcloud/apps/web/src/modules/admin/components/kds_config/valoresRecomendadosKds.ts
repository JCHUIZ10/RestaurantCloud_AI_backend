import type { ActualizarConfiguracionKdsRequest } from '@/types/admin';

/**
 * Valores recomendados de la pantalla de cocina. Deben coincidir con
 * `ConfiguracionKdsService::VALORES_RECOMENDADOS` del backend (que es la fuente de verdad real).
 */
export const VALORES_RECOMENDADOS_KDS: Omit<ActualizarConfiguracionKdsRequest, 'updated_at'> = {
  tiempo_optimo_verde_min: 15,
  tiempo_alerta_ambar_min: 25,
  tiempo_maximo_pase_min: 3,
  alerta_sonora_nueva_comanda: true,
  alerta_sonora_comanda_roja: true,
  intervalo_sonido_rojo_seg: 60,
  vista_predeterminada: 'fifo',
};
