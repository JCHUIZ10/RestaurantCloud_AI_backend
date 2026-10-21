import { apiClient, apiGet, apiPost, apiPatch } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  PlanoCompletoMozoDTO,
  CrearPedidoRequest,
  MesaDetalleMozoDTO,
  CatalogoProductosMozoDTO,
  HistorialMesaComandaDTO,
  PrecuentaMozoResponseDTO,
  ItemsParaDividirResponseDTO,
  DividirCuentaRequestDTO,
  DividirCuentaResponseDTO,
} from '@/types/mozo';
import type {
  KDSComandaDTO,
  ConfiguracionKDSDTO,
  ConsolidadoAllDayDTO,
  MetricasDespachoDTO,
  KDSPedidoDespachadoDTO,
} from '@/types/cocina';
import type {
  CajaTurnoDTO,
  EstadoCajaSesionDTO,
  AbrirCajaRequest,
  MesaCajaMonitorDTO,
  CajaMetricasPosDTO,
  PrecuentaResponseDTO,
  ClienteFiscalLookupDTO,
} from '@/types/caja';
import type { ApiResponse as ApiEnvelope } from '@/types/api';
import type {
  ActualizarCategoriaRequest,
  CategoriaAdminDTO,
  CategoriasAdminResponseDTO,
  CargarPlantillaCategoriasRequest,
  CrearCategoriaRequest,
  CrearProductoRequest,
  DisponibilidadProducto,
  ListarProductosResponseDTO,
  ProductoAdminDTO,
  ReasignarYEliminarCategoriaRequest,
  ReordenarCategoriasRequest,
  ResultadoReasignacionCategoriaDTO,
  ActualizarEmpleadoRequestDTO,
  EmpleadoDetalleDTO,
  ListarPersonalResponseDTO,
  RegistrarEmpleadoRequestDTO,
  ResetPasswordResponseDTO,
} from '@/types/admin';

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
  // CU-MOZO-01: Plano de mesas y despacho en vivo
  async obtenerPlanoCompleto(pisoId?: string): Promise<ApiResponse<PlanoCompletoMozoDTO>> {
    const params = pisoId ? { piso_id: pisoId } : undefined;
    return apiGet<PlanoCompletoMozoDTO>('/mozo/plano', params);
  },

  async abrirMesa(mesaId: string, comensales: number): Promise<ApiResponse<{ pedido_id: string; pedidoId: string; mensaje: string }>> {
    return apiPost<{ pedido_id: string; pedidoId: string; mensaje: string }>(`/mozo/mesas/${mesaId}/abrir`, { comensales });
  },

  async obtenerDetalleMesa(mesaId: string): Promise<ApiResponse<MesaDetalleMozoDTO>> {
    return apiGet<MesaDetalleMozoDTO>(`/mozo/mesas/${mesaId}/detalle`);
  },

  async marcarItemServido(itemId: string): Promise<ApiResponse<{ item_id: string; estado: string; mensaje: string }>> {
    return apiPatch<{ item_id: string; estado: string; mensaje: string }>(`/mozo/items/${itemId}/servido`);
  },

  async solicitarCuenta(mesaId: string): Promise<ApiResponse<{ mesa_id: string; pedido_id: string; mensaje: string }>> {
    return apiPost<{ mesa_id: string; pedido_id: string; mensaje: string }>(`/mozo/mesas/${mesaId}/solicitar-cuenta`);
  },

  async solicitarCuentaMesaConDetalle(
    request: any
  ): Promise<ApiResponse<{ success: boolean; mesa_id: string; mensaje: string }>> {
    const res = await apiPost<any>(`/mozo/mesas/${request.mesa_id}/solicitar-cuenta`, request);
    return {
      exito: res.exito,
      datos: {
        success: res.exito,
        mesa_id: request.mesa_id,
        mensaje: res.datos?.mensaje || 'Cuenta solicitada exitosamente',
      },
      errores: res.errores,
      meta: res.meta,
    };
  },

  async liberarMesaSinConsumo(
    mesaId: string
  ): Promise<ApiResponse<{ mesa_id: string; numero?: string; mensaje: string }>> {
    return apiPost<{ mesa_id: string; numero?: string; mensaje: string }>(`/mozo/mesas/${mesaId}/liberar`);
  },

  // CU-MOZO-02: Carta, historial y comanda táctil
  async obtenerCarta(): Promise<ApiResponse<{ categorias: any[]; productos: any[] }>> {
    return apiGet<{ categorias: any[]; productos: any[] }>('/mozo/carta');
  },

  async obtenerCatalogoCarta(mesaId: string): Promise<ApiResponse<CatalogoProductosMozoDTO>> {
    return apiGet<CatalogoProductosMozoDTO>(`/mozo/mesas/${mesaId}/carta`);
  },

  async obtenerHistorialMesa(mesaId: string): Promise<ApiResponse<HistorialMesaComandaDTO>> {
    return apiGet<HistorialMesaComandaDTO>(`/mozo/mesas/${mesaId}/historial`);
  },

  async enviarPedidoCocina(
    payload: {
      mesa_id: string;
      comensales: number;
      numero_ronda?: number;
      items: Array<{
        producto_id: string;
        cantidad: number;
        nota_cocina?: string | null;
      }>;
    },
    forzarConflicto409?: boolean
  ): Promise<ApiResponse<any>> {
    if (forzarConflicto409) {
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_AGOTADO',
            mensaje: 'El insumo crítico se agotó en cocina hace segundos. La preparación no es posible.',
          },
        ],
      };
    }
    try {
      return await apiPost<any>(`/mozo/mesas/${payload.mesa_id}/pedidos`, payload);
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data as ApiResponse<any>;
      }
      return {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'No se pudo enviar la comanda al servidor.' }],
      };
    }
  },

  async crearPedido(datos: CrearPedidoRequest): Promise<ApiResponse<{ pedido_id: string; mensaje: string }>> {
    return apiPost<{ pedido_id: string; mensaje: string }>('/mozo/pedidos', datos);
  },

  // CU-MOZO-08: Precuenta digital
  async obtenerPrecuentaMesa(mesaId: string): Promise<ApiResponse<PrecuentaMozoResponseDTO>> {
    return apiGet<PrecuentaMozoResponseDTO>(`/mozo/mesas/${mesaId}/precuenta`);
  },

  async consultarClienteFiscal(tipoDoc: 'DNI' | 'RUC', numeroDoc: string): Promise<ApiResponse<ClienteFiscalLookupDTO>> {
    return apiGet<ClienteFiscalLookupDTO>(`/caja/clientes/buscar?tipo=${tipoDoc}&documento=${numeroDoc}`);
  },

  // CU-MOZO-09: Dividir Cuenta en Mesa (Subcuentas)
  async obtenerItemsParaDividir(mesaId: string): Promise<ApiResponse<ItemsParaDividirResponseDTO>> {
    return apiGet<ItemsParaDividirResponseDTO>(`/mozo/mesas/${mesaId}/items-dividir`);
  },

  async dividirCuentaMesa(payload: DividirCuentaRequestDTO): Promise<ApiResponse<DividirCuentaResponseDTO>> {
    return apiPost<DividirCuentaResponseDTO>(`/mozo/mesas/${payload.mesa_id}/dividir-cuenta`, payload);
  },
};

export const realCocinaService = {
  // CU-COCINA-01: Tablero KDS y Configuración
  async obtenerConfiguracion(): Promise<ApiResponse<ConfiguracionKDSDTO>> {
    return apiGet<ConfiguracionKDSDTO>('/cocina/configuracion');
  },

  async obtenerComandas(): Promise<ApiResponse<KDSComandaDTO[]>> {
    return apiGet<KDSComandaDTO[]>('/cocina/comandas');
  },

  async obtenerComandasKDS(): Promise<ApiResponse<KDSComandaDTO[]>> {
    return this.obtenerComandas();
  },

  async obtenerConsolidadoAllDay(): Promise<ApiResponse<ConsolidadoAllDayDTO[]>> {
    return apiGet<ConsolidadoAllDayDTO[]>('/cocina/consolidado-all-day');
  },

  async obtenerMetricasDespacho(): Promise<ApiResponse<MetricasDespachoDTO>> {
    return apiGet<MetricasDespachoDTO>('/cocina/metricas-despacho');
  },

  // CU-COCINA-02: Transiciones, Deshacer 30s, Despacho Completo y Recall
  async cambiarEstadoItem(itemId: string, estado: string): Promise<ApiResponse<any>> {
    return apiPatch<any>(`/cocina/items/${itemId}/estado`, { estado });
  },

  async deshacerListoItem(itemId: string): Promise<ApiResponse<any>> {
    return apiPost<any>(`/cocina/items/${itemId}/deshacer`);
  },

  async despacharComandaCompleta(pedidoId: string): Promise<ApiResponse<any>> {
    return apiPost<any>(`/cocina/pedidos/${pedidoId}/despachar`);
  },

  async obtenerPedidosDespachados(): Promise<ApiResponse<KDSPedidoDespachadoDTO[]>> {
    return apiGet<KDSPedidoDespachadoDTO[]>('/cocina/pedidos/despachados-recientes');
  },
};

export const realCajaService = {
  // CU-CAJA-01: Apertura de Turno y Estado de Sesión
  async getEstadoSesion(): Promise<ApiResponse<EstadoCajaSesionDTO>> {
    return apiGet<EstadoCajaSesionDTO>('/caja/estado-sesion');
  },

  async abrirTurno(datos: AbrirCajaRequest): Promise<ApiResponse<CajaTurnoDTO>> {
    return apiPost<CajaTurnoDTO>('/caja/apertura', datos);
  },

  // CU-CAJA-02: Monitor POS y Precuenta
  async getMesasMonitor(): Promise<ApiResponse<MesaCajaMonitorDTO[]>> {
    return apiGet<MesaCajaMonitorDTO[]>('/caja/mesas-monitor');
  },

  async getMetricasPos(): Promise<ApiResponse<CajaMetricasPosDTO>> {
    return apiGet<CajaMetricasPosDTO>('/caja/metricas-pos');
  },

  async getPrecuentaMesa(mesaId: string): Promise<ApiResponse<PrecuentaResponseDTO>> {
    return apiGet<PrecuentaResponseDTO>(`/caja/mesas/${mesaId}/cuenta`);
  },

  async obtenerPrecuentaMesa(mesaId: string): Promise<ApiResponse<PrecuentaResponseDTO>> {
    return this.getPrecuentaMesa(mesaId);
  },

  async conmutarACuentaPedida(mesaId: string): Promise<ApiResponse<{ id: string; numero: string; estado: string }>> {
    return apiPost<{ id: string; numero: string; estado: string }>(`/caja/mesas/${mesaId}/conmutar-cuenta-pedida`);
  },

  // CU-CAJA-03: Cobro y Facturación Fiscal SUNAT
  async cobrarComanda(datos: {
    pedido_id: string;
    tipo_comprobante: string;
    medio_pago: string;
    monto_recibido?: number;
    documento_cliente?: string;
    nombre_cliente?: string;
    subcuenta_id?: string;
  }): Promise<ApiResponse<any>> {
    return apiPost<any>('/caja/cobrar', datos);
  },

  async consultarClienteFiscal(tipoDoc: 'DNI' | 'RUC', numeroDoc: string): Promise<ApiResponse<ClienteFiscalLookupDTO>> {
    return apiGet<ClienteFiscalLookupDTO>(`/caja/clientes/buscar?tipo=${tipoDoc}&documento=${numeroDoc}`);
  },

  // CU-CAJA-04: Dividir Cuenta en POS (Subcuentas)
  async obtenerItemsParaDividir(mesaId: string): Promise<ApiResponse<ItemsParaDividirResponseDTO>> {
    return apiGet<ItemsParaDividirResponseDTO>(`/caja/mesas/${mesaId}/items-dividir`);
  },

  async dividirCuentaMesa(payload: DividirCuentaRequestDTO): Promise<ApiResponse<DividirCuentaResponseDTO>> {
    return apiPost<DividirCuentaResponseDTO>(`/caja/mesas/${payload.mesa_id}/dividir-cuenta`, payload);
  },
};

export const realAdminService = {
  obtenerCategorias: (): Promise<ApiEnvelope<CategoriasAdminResponseDTO>> => apiGet('/admin/categorias'),
  crearCategoria: (payload: CrearCategoriaRequest): Promise<ApiEnvelope<CategoriaAdminDTO>> => apiPost('/admin/categorias', payload),
  actualizarCategoria: (id: string, payload: ActualizarCategoriaRequest): Promise<ApiEnvelope<CategoriaAdminDTO>> => apiPatch(`/admin/categorias/${id}`, payload),
  conmutarVisibilidadCategoria: (id: string, activa: boolean): Promise<ApiEnvelope<CategoriaAdminDTO>> => apiPatch(`/admin/categorias/${id}/visibilidad`, { activa }),
  reordenarCategorias: (payload: ReordenarCategoriasRequest): Promise<ApiEnvelope<CategoriaAdminDTO[]>> => apiPatch('/admin/categorias/reordenar', payload),
  async eliminarCategoria(id: string): Promise<ApiEnvelope<{ mensaje: string; categoria_id: string }>> {
    try { return (await apiClient.delete(`/admin/categorias/${id}`)).data; } catch (error: any) { return error.response?.data ?? Promise.reject(error); }
  },
  reasignarYEliminarCategoria: (id: string, payload: ReasignarYEliminarCategoriaRequest): Promise<ApiEnvelope<ResultadoReasignacionCategoriaDTO>> => apiPost(`/admin/categorias/${id}/reasignar-y-eliminar`, payload),
  cargarPlantillaGastronomica: (payload: CargarPlantillaCategoriasRequest): Promise<ApiEnvelope<CategoriasAdminResponseDTO>> => apiPost('/admin/categorias/plantilla', payload),

  obtenerProductos: (
    _localId: string,
    categoriaId = 'todas',
    disponibilidad: 'todos' | DisponibilidadProducto = 'todos',
    busqueda = '',
    pagina = 1,
    limite = 10,
  ): Promise<ApiEnvelope<ListarProductosResponseDTO>> => apiGet('/admin/productos', {
    ...(categoriaId !== 'todas' ? { categoria_id: categoriaId } : {}),
    disponibilidad,
    busqueda,
    pagina,
    limite,
  }),
  crearProducto: (_localId: string, payload: CrearProductoRequest): Promise<ApiEnvelope<ProductoAdminDTO>> =>
    apiPost('/admin/productos', payload),
  actualizarProducto: (id: string, payload: CrearProductoRequest): Promise<ApiEnvelope<ProductoAdminDTO>> =>
    apiPatch(`/admin/productos/${id}`, payload),
  conmutarDisponibilidadProducto: (
    id: string,
    disponibilidad: DisponibilidadProducto,
  ): Promise<ApiEnvelope<ProductoAdminDTO>> =>
    apiPatch(`/admin/productos/${id}/disponibilidad`, { disponibilidad }),
  async archivarProducto(id: string): Promise<ApiEnvelope<{ producto_id: string; mensaje: string }>> {
    try {
      return (await apiClient.delete(`/admin/productos/${id}`)).data;
    } catch (error: any) {
      return error.response?.data ?? Promise.reject(error);
    }
  },
  getPersonal: (filtros: Record<string, unknown>): Promise<ApiEnvelope<ListarPersonalResponseDTO>> => apiGet('/admin/personal', filtros),
  registrarEmpleado: (payload: RegistrarEmpleadoRequestDTO): Promise<ApiEnvelope<EmpleadoDetalleDTO>> => apiPost('/admin/personal', payload),
  actualizarEmpleado: (id: string, payload: ActualizarEmpleadoRequestDTO): Promise<ApiEnvelope<EmpleadoDetalleDTO>> => apiPatch(`/admin/personal/${id}`, payload),
  reactivarEmpleado: (id: string): Promise<ApiEnvelope<EmpleadoDetalleDTO>> => apiPost(`/admin/personal/${id}/reactivar`),
  resetPasswordEmpleado: (id: string): Promise<ApiEnvelope<ResetPasswordResponseDTO>> => apiPost(`/admin/personal/${id}/reset-password`),
};

// CU-PROP-01: Onboarding y Registro de Empresa (Propietario)
export const realRegistroEmpresaService = {
  async getPlanes(): Promise<any[]> {
    try {
      const res = await apiGet<any[]>('/public/planes');
      return res.exito && res.datos ? res.datos : [];
    } catch {
      return [];
    }
  },

  async iniciarRegistro(req: any): Promise<any> {
    try {
      return await apiPost<any>('/public/registro/iniciar', req);
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERROR_CONEXION',
            mensaje: 'No se pudo conectar con el servidor. Por favor verifica tu conexión.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async modificarCorreo(req: any): Promise<any> {
    try {
      return await apiPatch<any>('/public/registro/modificar-correo', req);
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERROR_CONEXION',
            mensaje: 'No se pudo conectar con el servidor al actualizar el correo.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async verificarOTP(req: any): Promise<any> {
    try {
      return await apiPost<any>('/public/registro/verificar-otp', req);
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERROR_CONEXION',
            mensaje: 'No se pudo verificar el código con el servidor.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async completarRegistro(req: any): Promise<any> {
    try {
      return await apiPost<any>('/public/registro/completar', req);
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERROR_CONEXION',
            mensaje: 'No se pudo completar el registro con la pasarela bancaria.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },
};
