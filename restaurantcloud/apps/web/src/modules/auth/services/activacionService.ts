/**
 * Servicio de Activación de Cuenta Pública (CU-PROP-05 / CU-AUTH-02)
 * Permite validar tokens temporales y completar la configuración de contraseñas.
 */
import { apiGet, apiPost } from '@/services/api/client';
import { IS_REAL_API } from '@/services/serviceAdapter';
import type { ApiResponse } from '@/types/api';
import type {
  ValidarTokenResponseDTO,
  CompletarActivacionDTO,
  CompletarActivacionResponseDTO,
} from '@/types/auth';

const ADMINS_STORAGE_KEY = 'restaurantcloud_propietario_admins_db';

class ActivacionService {
  /**
   * Valida la existencia y vigencia de un token de activación.
   */
  async validarToken(token: string): Promise<ApiResponse<ValidarTokenResponseDTO>> {
    if (IS_REAL_API) {
      try {
        return await apiGet<ValidarTokenResponseDTO>('/public/activar-cuenta/validar', { token });
      } catch (err: any) {
        if (err.response?.data) {
          return err.response.data;
        }
        return {
          exito: false,
          datos: null as unknown as ValidarTokenResponseDTO,
          errores: [
            {
              codigo: 'ERROR_CONEXION',
              mensaje: 'No fue posible conectar con el servidor para validar el enlace de activación.',
            },
          ],
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    // Fallback Mock LocalStorage
    await new Promise((r) => setTimeout(r, 200));
    try {
      const raw = localStorage.getItem(ADMINS_STORAGE_KEY);
      if (raw) {
        const admins = JSON.parse(raw);
        if (Array.isArray(admins)) {
          const admin = admins.find(
            (a: any) =>
              a.invitacion_token === token ||
              token.startsWith('inv_tok_') ||
              a.estado === 'pendiente_activacion'
          );

          if (admin) {
            return {
              exito: true,
              datos: {
                valido: true,
                token,
                usuario: {
                  id: admin.id,
                  nombre: admin.nombre,
                  correo: admin.correo,
                  rol: 'admin_local',
                },
                empresa: {
                  id: '00000000-0000-4000-8000-000000000001',
                  nombre: 'Restaurante ÁUREA S.A.C.',
                },
                expira_en: admin.invitacion_expira_en || new Date(Date.now() + 86400000).toISOString(),
              },
              meta: { timestamp: new Date().toISOString() },
            };
          }
        }
      }
    } catch {
      // ignore
    }

    // Default mock valid si no hay localStorage inicializado
    return {
      exito: true,
      datos: {
        valido: true,
        token,
        usuario: {
          id: 'usr-adm-mock',
          nombre: 'Colaborador Invitado',
          correo: 'admin.invitado@aurea.pe',
          rol: 'admin_local',
        },
        empresa: {
          id: '00000000-0000-4000-8000-000000000001',
          nombre: 'Restaurante ÁUREA S.A.C.',
        },
        expira_en: new Date(Date.now() + 86400000).toISOString(),
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Completa la activación configurando la contraseña personal y emitiendo la sesión.
   */
  async completarActivacion(
    payload: CompletarActivacionDTO
  ): Promise<ApiResponse<CompletarActivacionResponseDTO>> {
    if (IS_REAL_API) {
      try {
        return await apiPost<CompletarActivacionResponseDTO>(
          '/public/activar-cuenta/completar',
          payload
        );
      } catch (err: any) {
        if (err.response?.data) {
          return err.response.data;
        }
        return {
          exito: false,
          datos: null as unknown as CompletarActivacionResponseDTO,
          errores: [
            {
              codigo: 'ERROR_CONEXION',
              mensaje: 'No fue posible conectar con el servidor para activar la cuenta.',
            },
          ],
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    // Fallback Mock LocalStorage
    await new Promise((r) => setTimeout(r, 400));
    try {
      const raw = localStorage.getItem(ADMINS_STORAGE_KEY);
      if (raw) {
        const admins = JSON.parse(raw);
        if (Array.isArray(admins)) {
          const index = admins.findIndex(
            (a: any) => a.invitacion_token === payload.token || a.estado === 'pendiente_activacion'
          );
          if (index !== -1) {
            admins[index].estado = 'activo';
            admins[index].invitacion_token = undefined;
            admins[index].ultimo_login = 'Reciente';
            localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));

            const admin = admins[index];
            return {
              exito: true,
              datos: {
                token: 'mock_jwt_token_admin_' + Date.now(),
                refresh_token: 'mock_refresh_token_' + Date.now(),
                usuario: {
                  id: admin.id,
                  nombre: admin.nombre,
                  correo: admin.correo,
                  rol: 'admin_local',
                  empresa_id: '00000000-0000-4000-8000-000000000001',
                  local_id: admin.sede_asignada?.id || null,
                  telefono: admin.telefono,
                },
                mensaje: 'Cuenta activada exitosamente. Bienvenido a RestaurantCloud AI.',
              },
              meta: { timestamp: new Date().toISOString() },
            };
          }
        }
      }
    } catch {
      // ignore
    }

    return {
      exito: true,
      datos: {
        token: 'mock_jwt_token_admin_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        usuario: {
          id: 'usr-adm-mock',
          nombre: 'Colaborador Invitado',
          correo: 'admin.invitado@aurea.pe',
          rol: 'admin_local',
          empresa_id: '00000000-0000-4000-8000-000000000001',
          local_id: null,
        },
        mensaje: 'Cuenta activada exitosamente.',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

export const activacionService = new ActivacionService();
