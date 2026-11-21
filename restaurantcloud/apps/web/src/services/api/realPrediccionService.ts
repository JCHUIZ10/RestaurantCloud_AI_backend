import axios from 'axios';
import { apiClient, apiGet, apiPatch, apiPost } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  CoberturaDias,
  DecisionLoteDTO,
  DecisionReposicion,
  LineaReposicionDTO,
  PrediccionDTO,
  PrediccionPropietarioDTO,
} from '@/types/prediccion';

/** Calcular el pronóstico lee un año de ventas: tarda más que el resto de las llamadas. */
const ESPERA_CALCULO_MS = 90_000;

/**
 * Los errores de negocio (403, 404, 409, 422, 503) llegan como excepción de axios. Se devuelven como
 * respuesta con `exito: false` para que la pantalla muestre el mensaje y el código del servidor.
 * Los fallos de red se lanzan.
 */
async function respuesta<T>(llamada: Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await llamada;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.exito === false) {
      return error.response.data as ApiResponse<T>;
    }
    throw error;
  }
}

export interface ArchivoDescargado {
  blob: Blob;
  nombre: string;
}

function nombreDeContentDisposition(cabecera: string | undefined, porDefecto: string): string {
  const coincidencia = cabecera?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return coincidencia ? decodeURIComponent(coincidencia[1]) : porDefecto;
}

export const realPrediccionService = {
  /**
   * Calcula un pronóstico nuevo. `localId` solo lo usa el propietario, que no tiene una sede fija.
   */
  generar: (cobertura: CoberturaDias, localId?: string) =>
    respuesta(
      apiPost<PrediccionDTO>(
        '/admin/pronosticos',
        { cobertura_dias: cobertura },
        { timeout: ESPERA_CALCULO_MS, ...(localId ? { headers: { 'X-Local-Id': localId } } : {}) }
      )
    ),

  ultimo: () => respuesta(apiGet<PrediccionDTO>('/admin/pronosticos/ultimo', undefined, { timeout: ESPERA_CALCULO_MS })),

  decidir: (id: string, estado: DecisionReposicion, cantidadFinal?: number) =>
    respuesta(
      apiPatch<LineaReposicionDTO>(`/admin/reposiciones/${id}`, {
        estado,
        ...(estado === 'ajustada' ? { cantidad_final: cantidadFinal } : {}),
      })
    ),

  decidirLote: (decisiones: DecisionLoteDTO[]) =>
    respuesta(apiPost<LineaReposicionDTO[]>('/admin/reposiciones/decisiones', { decisiones })),

  /** Lista de compra del último pronóstico. Si no hay nada que descargar, devuelve el error del servidor. */
  async exportar(formato: 'xlsx' | 'pdf'): Promise<{ exito: true; archivo: ArchivoDescargado } | { exito: false; mensaje: string }> {
    try {
      const res = await apiClient.get<Blob>('/admin/pronosticos/ultimo/exportar', {
        params: { formato },
        responseType: 'blob',
      });
      return {
        exito: true,
        archivo: {
          blob: res.data,
          nombre: nombreDeContentDisposition(res.headers['content-disposition'], `compra_sugerida.${formato}`),
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        // El error de negocio llega como JSON dentro de un blob
        try {
          const cuerpo = JSON.parse(await error.response.data.text());
          return { exito: false, mensaje: cuerpo?.errores?.[0]?.mensaje ?? 'No se pudo generar la lista.' };
        } catch {
          /* se usa el mensaje por defecto */
        }
      }
      return { exito: false, mensaje: 'No se pudo generar la lista. Intenta de nuevo.' };
    }
  },

  propietario: () => respuesta(apiGet<PrediccionPropietarioDTO>('/propietario/pronosticos')),
};
