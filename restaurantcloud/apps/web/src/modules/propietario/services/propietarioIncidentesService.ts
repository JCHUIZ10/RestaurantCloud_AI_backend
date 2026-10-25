/**
 * Servicio de Incidentes Corporativos para el Portal Propietario (CU-PROP-06)
 * Se conecta con la capa de datos en memoria compartida para sincronización total con CU-ADMIN-11.
 */

import { mockAdminService } from '@/modules/admin/services/mockAdminService';
import { ApiResponse } from '@/types/api';
import {
  PropietarioIncidentesFiltrosRequest,
  PropietarioIncidentesBandejaResponse,
  PasarARevisionRequest,
  SseIncidenteCriticoEvent,
  SedeResumenDTO,
  IncidenteDetalleDTO,
} from '@/types/propietario';

type SseListener = (evento: SseIncidenteCriticoEvent) => void;

class PropietarioIncidentesService {
  private sseListeners: Set<SseListener> = new Set();

  /**
   * Obtiene la lista de sedes de la empresa para poblar el selector de filtros
   */
  getSedes(): SedeResumenDTO[] {
    return mockAdminService.getSedesEmpresa();
  }

  /**
   * GET /api/v1/propietario/incidentes
   * Retorna la bandeja consolidada multi-sede con KPIs ejecutivos
   */
  async getBandejaIncidentes(
    filtros: PropietarioIncidentesFiltrosRequest = {}
  ): Promise<ApiResponse<PropietarioIncidentesBandejaResponse>> {
    return mockAdminService.getIncidentesEmpresa(filtros);
  }

  /**
   * GET /api/v1/propietario/incidentes/{id}
   * Obtiene el detalle de un incidente y ejecuta el marcado transparente de lectura en DB (visto_por_propietario = true)
   */
  async getIncidenteDetalle(id: string): Promise<ApiResponse<IncidenteDetalleDTO>> {
    return mockAdminService.getIncidenteDetallePropietario(id);
  }

  /**
   * PATCH /api/v1/propietario/incidentes/{id}/pasar-a-revision
   * Emite directiva ejecutiva y transiciona el incidente a 'en_revision'
   */
  async pasarARevisionConDirectiva(
    id: string,
    req: PasarARevisionRequest
  ): Promise<ApiResponse<IncidenteDetalleDTO>> {
    return mockAdminService.pasarIncidenteARevisionPropietario(id, req);
  }

  /**
   * Suscripción reactiva a eventos en memoria
   */
  subscribirSSE(listener: SseListener): () => void {
    this.sseListeners.add(listener);
    return () => {
      this.sseListeners.delete(listener);
    };
  }

  /**
   * Dispara un evento en tiempo real a todos los suscriptores activos
   */
  emitirAlertaSse(evento: SseIncidenteCriticoEvent) {
    this.sseListeners.forEach((listener) => {
      try {
        listener(evento);
      } catch (err) {
        console.error('Error al emitir evento a oyente:', err);
      }
    });
  }

  /**
   * Simula la creación concurrente de un incidente crítico en una sede
   */
  simularLlegadaIncidenteCritico(sedeId?: string): IncidenteDetalleDTO {
    const inc = mockAdminService.simularNuevoIncidenteCriticoSse(sedeId);
    const sedeNombre = inc.local_id === '00000000-0000-4000-8000-000000000020'
      ? 'Sede San Isidro'
      : 'Sede Miraflores';

    const evento: SseIncidenteCriticoEvent = {
      id: inc.id,
      codigo: inc.codigo,
      local_id: inc.local_id,
      local_nombre: sedeNombre,
      gravedad: inc.gravedad,
      categoria: inc.categoria,
      titulo: inc.titulo,
      created_at: inc.created_at,
    };

    this.emitirAlertaSse(evento);
    return inc;
  }

  /**
   * Restablece las semillas a su estado original de demostración
   */
  restablecerSemillas() {
    mockAdminService.restablecerSemillasIncidentes();
  }
}

export const propietarioIncidentesService = new PropietarioIncidentesService();
