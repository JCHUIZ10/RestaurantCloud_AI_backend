import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';
import { registrarMarcaServidor } from '@/shared/utils/fechaServidor';
import { obtenerJwt } from './jwtServicios';

/**
 * Cliente de los microservicios. Todo pasa por Kong (`/api/v1/analitica/...`), que valida el JWT; cada servicio lo
 * vuelve a validar. A diferencia del cliente del núcleo, no usa el token de sesión: usa el JWT de corta vida que
 * emite el núcleo (`jwtServicios`).
 */
export const clienteMicroservicios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { Accept: 'application/json' },
  timeout: 20_000,
});

/** Solo el propietario elige sede con `X-Local-Id`; quien tiene una sede fija ya la lleva en su JWT. */
function localElegido(): string | null {
  try {
    const rol = JSON.parse(localStorage.getItem('auth_usuario') ?? 'null')?.rol;
    return rol === 'propietario' ? localStorage.getItem('active_local_id') : null;
  } catch {
    return null;
  }
}

clienteMicroservicios.interceptors.request.use(async (config) => {
  const jwt = await obtenerJwt();
  config.headers.Authorization = `Bearer ${jwt}`;
  const local = localElegido();
  if (local && !config.headers['X-Local-Id']) config.headers['X-Local-Id'] = local;
  return config;
});

clienteMicroservicios.interceptors.response.use(
  (respuesta) => {
    const marca = respuesta.data?.meta?.timestamp;
    if (typeof marca === 'string') registrarMarcaServidor(marca);
    return respuesta;
  },
  async (error) => {
    const original = error.config;
    // Un 401 con un JWT que debía estar vigente: se pide uno nuevo y se reintenta una sola vez
    if (error.response?.status === 401 && original && !original._reintentado) {
      original._reintentado = true;
      const jwt = await obtenerJwt(true);
      original.headers.Authorization = `Bearer ${jwt}`;
      return clienteMicroservicios(original);
    }
    return Promise.reject(error);
  }
);

/**
 * Los errores de negocio de un microservicio (403 plan, 422, 503) llegan con el cuerpo del contrato propio
 * (`exito: false`): se devuelven como respuesta para que la pantalla muestre el código y el mensaje.
 * Los que genera el gateway (429, 401) o la red se lanzan como excepción.
 */
export async function microserviciosGet<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const respuesta = await clienteMicroservicios.get<ApiResponse<T>>(url, { params, ...config });
    return respuesta.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.exito === false) {
      return error.response.data as ApiResponse<T>;
    }
    throw error;
  }
}
