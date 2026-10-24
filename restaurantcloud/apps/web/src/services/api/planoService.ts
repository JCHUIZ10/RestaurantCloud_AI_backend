import axios from 'axios';
import { apiGet, apiPatch, apiPost, apiPut } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  PlanoMesasResponseDTO, PisoAdminDTO, MesaAdminDTO, CrearPisoRequest,
  CrearMesaLoteRequest, CrearMesaIndividualRequest, ActualizarMesaRequest,
  ActualizarDimensionesPisoRequest,
} from '@/types/admin';

// Los errores HTTP de negocio mantienen el mismo contrato que el modo de demostración.
async function respuesta<T>(request: Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await request;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.exito === false) {
      return error.response.data as ApiResponse<T>;
    }
    throw error;
  }
}

export const realPlanoService = {
  obtenerPlanoMesas: () => respuesta(apiGet<PlanoMesasResponseDTO>('/admin/pisos')),
  crearPiso: (_localId: string, payload: CrearPisoRequest) =>
    respuesta(apiPost<PisoAdminDTO>('/admin/pisos', payload)),
  actualizarNombrePiso: (id: string, nombre: string) =>
    respuesta(apiPatch<PisoAdminDTO>(`/admin/pisos/${id}/nombre`, { nombre })),
  actualizarDimensionesPiso: (id: string, payload: ActualizarDimensionesPisoRequest) =>
    respuesta(apiPatch<PisoAdminDTO>(`/admin/pisos/${id}/dimensiones`, payload)),
  desactivarPiso: (id: string) =>
    respuesta(apiPatch<{ mensaje: string; piso_id: string }>(`/admin/pisos/${id}/desactivar`)),
  crearMesaIndividual: (id: string, payload: CrearMesaIndividualRequest) =>
    respuesta(apiPost<MesaAdminDTO>(`/admin/pisos/${id}/mesas`, payload)),
  generarMesasEnLote: (id: string, payload: CrearMesaLoteRequest) =>
    respuesta(apiPost<{ piso: PisoAdminDTO; mesas_creadas: number }>(`/admin/pisos/${id}/mesas/lote`, payload)),
  actualizarMesa: (id: string, payload: ActualizarMesaRequest) =>
    respuesta(apiPut<MesaAdminDTO>(`/admin/mesas/${id}`, payload)),
  desactivarMesa: (id: string) =>
    respuesta(apiPatch<{ mensaje: string; mesa_id: string }>(`/admin/mesas/${id}/desactivar`)),
};
