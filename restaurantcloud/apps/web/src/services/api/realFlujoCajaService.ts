import axios from 'axios';
import { apiGet, apiPost } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  AuditoriaTurnosKPIsDTO,
  CierreForzadoAdminRequestDTO,
  FiltroPeriodoFinanzas,
  FlujoCajaResumenDTO,
  GastoOperativoDTO,
  RegistrarGastoRequestDTO,
  TurnoCajaResumenDTO,
  VisarTurnoRequestDTO,
  LevantarObservacionRequestDTO,
} from '@/types/admin';
import type { BalancePreArqueoDTO, ReporteZDTO } from '@/types/caja';

const BASE = '/admin/finanzas';

/**
 * Los errores de negocio (409/422) llegan como excepción de axios. Se devuelven como respuesta con
 * `exito: false` para que la pantalla muestre el mensaje del servidor. Las validaciones de Laravel
 * (`{ errors: { campo: [mensaje] } }`) se normalizan al mismo formato. Los fallos de red se lanzan.
 */
async function conErroresDeNegocio<T>(llamada: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await llamada();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const cuerpo = error.response.data as {
        exito?: boolean;
        errores?: unknown[];
        errors?: Record<string, string[]>;
        message?: string;
      };

      if (Array.isArray(cuerpo.errores)) {
        return cuerpo as ApiResponse<T>;
      }

      if (error.response.status === 422 && cuerpo.errors) {
        const primerMensaje = Object.values(cuerpo.errors).flat()[0] ?? cuerpo.message ?? 'Los datos enviados no son válidos.';
        return {
          exito: false,
          datos: null as T,
          errores: [{ codigo: 'ERR_VALIDACION', mensaje: primerMensaje }],
        };
      }
    }
    throw error;
  }
}

/** Solo se envían las fechas cuando el periodo es personalizado. */
function paramsDePeriodo(filtro: FiltroPeriodoFinanzas): Record<string, unknown> {
  return filtro.periodo === 'personalizado'
    ? { periodo: filtro.periodo, desde: filtro.desde, hasta: filtro.hasta }
    : { periodo: filtro.periodo };
}

/**
 * CU-ADMIN-14: Flujo de caja, auditoría de turnos / cierres Z y gastos operativos.
 * 100% conectado a la API de Laravel (`/admin/finanzas`); no tiene respaldo simulado.
 */
export const realFlujoCajaService = {
  getFlujoCajaResumen: (filtro: FiltroPeriodoFinanzas): Promise<ApiResponse<FlujoCajaResumenDTO>> =>
    conErroresDeNegocio(() => apiGet<FlujoCajaResumenDTO>(`${BASE}/flujo-caja`, paramsDePeriodo(filtro))),

  getTurnosCajaHistorial: (
    filtro: FiltroPeriodoFinanzas
  ): Promise<ApiResponse<{ kpis: AuditoriaTurnosKPIsDTO; turnos: TurnoCajaResumenDTO[] }>> =>
    conErroresDeNegocio(() =>
      apiGet<{ kpis: AuditoriaTurnosKPIsDTO; turnos: TurnoCajaResumenDTO[] }>(`${BASE}/turnos`, paramsDePeriodo(filtro))
    ),

  getGastosOperativos: (filtro: FiltroPeriodoFinanzas): Promise<ApiResponse<GastoOperativoDTO[]>> =>
    conErroresDeNegocio(() => apiGet<GastoOperativoDTO[]>(`${BASE}/gastos`, paramsDePeriodo(filtro))),

  registrarGastoOperativo: (req: RegistrarGastoRequestDTO): Promise<ApiResponse<GastoOperativoDTO>> =>
    conErroresDeNegocio(() => apiPost<GastoOperativoDTO>(`${BASE}/gastos`, req)),

  /** Anula un gasto con motivo; uno pagado con efectivo de la gaveta solo mientras su turno siga abierto. */
  anularGastoOperativo: (gastoId: string, motivo: string): Promise<ApiResponse<GastoOperativoDTO>> =>
    conErroresDeNegocio(() => apiPost<GastoOperativoDTO>(`${BASE}/gastos/${gastoId}/anular`, { motivo })),

  getReporteZTurno: (turnoId: string): Promise<ApiResponse<ReporteZDTO>> =>
    conErroresDeNegocio(() => apiGet<ReporteZDTO>(`${BASE}/turnos/${turnoId}/reporte-z`)),

  /** Balance en vivo del turno abierto, previo a un cierre de rescate. */
  getBalanceTurno: (turnoId: string): Promise<ApiResponse<BalancePreArqueoDTO>> =>
    conErroresDeNegocio(() => apiGet<BalancePreArqueoDTO>(`${BASE}/turnos/${turnoId}/balance`)),

  visarTurnoZ: (turnoId: string, req: VisarTurnoRequestDTO): Promise<ApiResponse<TurnoCajaResumenDTO>> =>
    conErroresDeNegocio(() => apiPost<TurnoCajaResumenDTO>(`${BASE}/turnos/${turnoId}/visar`, req)),

  levantarObservacionTurno: (turnoId: string, req: LevantarObservacionRequestDTO): Promise<ApiResponse<TurnoCajaResumenDTO>> =>
    conErroresDeNegocio(() => apiPost<TurnoCajaResumenDTO>(`${BASE}/turnos/${turnoId}/levantar-observacion`, req)),

  ejecutarCierreForzadoAdmin: (
    turnoId: string,
    req: CierreForzadoAdminRequestDTO
  ): Promise<ApiResponse<TurnoCajaResumenDTO>> =>
    conErroresDeNegocio(() => apiPost<TurnoCajaResumenDTO>(`${BASE}/turnos/${turnoId}/cierre-forzado`, req)),
};
