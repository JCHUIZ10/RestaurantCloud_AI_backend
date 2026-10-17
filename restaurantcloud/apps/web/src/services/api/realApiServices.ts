import { apiGet, apiPost, apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { PlanoCompletoMozoDTO, CrearPedidoRequest } from '@/types/mozo';
import type { KDSComandaDTO } from '@/types/cocina';

export interface LoginParams {
  correo: string;
  password: string;
}

export interface LoginResult {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    empresa_id: string;
    local_id: string;
    telefono?: string;
  };
}

export const realAuthService = {
  async loginWithCredentials(credenciales: LoginParams): Promise<ApiResponse<any>> {
    try {
      const res = await apiPost<any>('/auth/login', credenciales);
      if (res.exito && res.datos) {
        if (res.datos.requiere_seleccion) {
          return {
            exito: true,
            datos: {
              requiere_seleccion: true,
              temp_token: res.datos.temp_token,
              expira_en_segundos: res.datos.expira_en_segundos,
              cuentas: res.datos.cuentas,
            },
            meta: res.meta,
          };
        }

        if (res.datos.token) {
          localStorage.setItem('auth_token', res.datos.token);
          localStorage.setItem('usuario_rol', res.datos.usuario.rol);
          localStorage.setItem('usuario_id', res.datos.usuario.id);
          localStorage.setItem('usuario_nombre', res.datos.usuario.nombre);
          if (res.datos.refresh_token) {
            localStorage.setItem('refresh_token', res.datos.refresh_token);
          }
        }

        return {
          exito: true,
          datos: {
            requiere_seleccion: false,
            usuario: res.datos.usuario,
            token: res.datos.token,
            refresh_token: res.datos.refresh_token,
          },
          meta: res.meta,
        };
      }
      return res;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data as ApiResponse<any>;
      }
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERROR_CONEXION',
            mensaje: 'No se pudo conectar con el servidor. Revisa tu conexión.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async seleccionarCuenta(payload: { usuario_id: string }, tempToken?: string): Promise<ApiResponse<any>> {
    const headers = tempToken ? { Authorization: `Bearer ${tempToken}` } : undefined;
    const res = await apiPost<any>('/auth/seleccionar-cuenta', payload, { headers });
    if (res.exito && res.datos?.token) {
      localStorage.setItem('auth_token', res.datos.token);
      localStorage.setItem('usuario_rol', res.datos.usuario.rol);
      localStorage.setItem('usuario_id', res.datos.usuario.id);
      localStorage.setItem('usuario_nombre', res.datos.usuario.nombre);
      if (res.datos.refresh_token) {
        localStorage.setItem('refresh_token', res.datos.refresh_token);
      }
    }
    return res;
  },

  async refreshToken(): Promise<ApiResponse<any>> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return {
        exito: false,
        datos: null,
        errores: [{ codigo: 'NO_REFRESH_TOKEN', mensaje: 'No hay token de renovación disponible.' }],
      };
    }
    const res = await apiPost<any>('/auth/refresh', { refresh_token: refreshToken });
    if (res.exito && res.datos?.token) {
      localStorage.setItem('auth_token', res.datos.token);
      if (res.datos.refresh_token) {
        localStorage.setItem('refresh_token', res.datos.refresh_token);
      }
    }
    return res;
  },



  async login(credenciales: LoginParams): Promise<ApiResponse<LoginResult>> {
    const res = await apiPost<LoginResult>('/auth/login', credenciales);
    if (res.exito && res.datos?.token) {
      localStorage.setItem('auth_token', res.datos.token);
      localStorage.setItem('usuario_rol', res.datos.usuario.rol);
      localStorage.setItem('usuario_id', res.datos.usuario.id);
      localStorage.setItem('usuario_nombre', res.datos.usuario.nombre);
    }
    return res;
  },

  async getPerfil(): Promise<ApiResponse<LoginResult['usuario']>> {
    return apiGet<LoginResult['usuario']>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('usuario_rol');
      localStorage.removeItem('usuario_id');
      localStorage.removeItem('usuario_nombre');
    }
  },
};


export const realMozoService = {
  async obtenerPlanoCompleto(pisoId?: string): Promise<ApiResponse<PlanoCompletoMozoDTO>> {
    const params = pisoId ? { piso_id: pisoId } : undefined;
    return apiGet<PlanoCompletoMozoDTO>('/mozo/plano', params);
  },

  async obtenerCarta(): Promise<ApiResponse<{ categorias: any[]; productos: any[] }>> {
    return apiGet<{ categorias: any[]; productos: any[] }>('/mozo/carta');
  },

  async crearPedido(datos: CrearPedidoRequest): Promise<ApiResponse<{ pedido_id: string; mensaje: string }>> {
    return apiPost<{ pedido_id: string; mensaje: string }>('/mozo/pedidos', datos);
  },
};

export const realCocinaService = {
  async obtenerComandasKDS(): Promise<ApiResponse<KDSComandaDTO[]>> {
    return apiGet<KDSComandaDTO[]>('/cocina/comandas');
  },

  async cambiarEstadoItem(itemId: string, estado: string): Promise<ApiResponse<any>> {
    const response = await apiClient.patch<ApiResponse<any>>(`/cocina/items/${itemId}/estado`, { estado });
    return response.data;
  },
};

export const realCajaService = {
  async obtenerPrecuentaMesa(mesaId: string): Promise<ApiResponse<any>> {
    return apiGet<any>(`/caja/mesas/${mesaId}/cuenta`);
  },

  async cobrarComanda(datos: {
    pedido_id: string;
    tipo_comprobante: string;
    medio_pago: string;
    monto_recibido?: number;
    documento_cliente?: string;
    nombre_cliente?: string;
  }): Promise<ApiResponse<any>> {
    return apiPost<any>('/caja/cobrar', datos);
  },
};
