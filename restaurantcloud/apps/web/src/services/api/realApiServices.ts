import { apiClient, apiGet, apiPost, apiPatch, apiPut, apiDelete } from './client';
import { realPlanoService } from './planoService';
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
  CandidatasUnionResponseDTO,
  UnirMesasRequestDTO,
  UnirMesasResponseDTO,
  ValidacionSeparacionMesaDTO,
  DividirMesasResponseDTO,
  AnularItemRequestDTO,
  AnularPedidoCompletoRequestDTO,
  ItemAnuladoResponseDTO,
  PedidoAnuladoResponseDTO,
  PoliticasReservaDTO,
  ReservaCardDTO,
  MesasDisponiblesResponseDTO,
  CrearReservaRequestDTO,
  SentarReservaResponseDTO,
  RegistrarNoShowRequestDTO,
  CancelarReservaRequestDTO,
  ReasignarMesaReservaRequestDTO,
  CatalogoSustitucionResponseDTO,
  SustituirPlatoRequestDTO,
  SustituirPlatoResponseDTO,
  AnularPorQuiebreRequestDTO,
  AnularPorQuiebreResponseDTO,
} from '@/types/mozo';
import type {
  KDSComandaDTO,
  ConfiguracionKDSDTO,
  ConsolidadoAllDayDTO,
  MetricasDespachoDTO,
  KDSPedidoDespachadoDTO,
  PlatoDisponibilidadDTO,
  ItemEnFuegoResolucionDTO,
} from '@/types/cocina';
import type {
  CajaTurnoDTO,
  EstadoCajaSesionDTO,
  AbrirCajaRequest,
  MesaCajaMonitorDTO,
  CajaMetricasPosDTO,
  PrecuentaResponseDTO,
  ClienteFiscalLookupDTO,
  ProcesarCobroFiscalRequest,
  ProcesarCobroFiscalResponseDTO,
  ComprobanteHistorialItemDTO,
  FiltrosHistorialComprobantesDTO,
  PrepararAnulacionResponseDTO,
  EmitirNotaCreditoRequest,
  EmitirNotaCreditoResponseDTO,
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
  AplicarPlantillaRequest,
  ConfigSemanaHorariaRequest,
  ExcepcionHorarioDTO,
  HorarioSemanaResponse,
  ActualizarConfiguracionKdsRequest,
  ConfiguracionKdsDTO,
  InsumosAdminResponseDTO,
  InsumoAdminDTO,
  CrearInsumoRequest,
  ActualizarInsumoRequest,
  AjustarStockInsumoRequest,
  ConmutarEstadoInsumoRequest,
  AjusteStockResultDTO,
  AuditoriaStockAjusteDTO,
  ActualizarCatalogoMetodosRequest,
  CatalogoMetodosPagoResponseDTO,
  ProveedorResumenDTO,
  ProveedoresListDTO,
  CrearProveedorRequestDTO,
  ActualizarProveedorRequestDTO,
  ProveedorHistorialComprasDTO,
  FichaCompraResumenDTO,
  RegistrarFichaCompraRequestDTO,
  ListarFichasCompraResponseDTO,
  FichaCompraDetalleCompletoDTO,
  ImpactoAnulacionDTO,
  AnularFichaCompraRequestDTO,
  PlatoReactivableDTO,
  PromocionesBandejaResponseDTO,
  BuscarPromocionesResponseDTO,
  PromocionAdminDTO,
  CrearPromocionRequest,
  ActualizarPromocionRequest,
  PromocionRendimientoDTO,
  FiltrosPromocionesRequest,
  FiltroEstadoPromocion,
  FiltroTipoPromocion,
  FiltrosAnulacionesRequest,
  AnulacionesBandejaResponseDTO,
  PedidoAnulacionItemDTO,
  MarcarRevisadoRequestDTO,
  EscalarIncidenteAnulacionRequest,
  IncidenteDetalleDTO,
  NotificacionCampanaDTO,
} from '@/types/admin';
import type {
  DirectorioAdminsApiResponse,
  DirectorioAdminsResponseDTO,
  FormularioDatosApiResponse,
  InvitarAdminRequestDTO,
  InvitarAdminApiResponse,
  ReenviarInvitacionApiResponse,
  CancelarInvitacionApiResponse,
  EnlaceInvitacionApiResponse,
  CambiarEstadoAdminRequestDTO,
  CambiarEstadoAdminApiResponse,
} from '@/types/propietarioAdmins';

import type {
  DirectorioLocalesApiResponse,
  DirectorioLocalesResponseDTO,
  VerificarDisponibilidadApiResponse,
  VerificarDisponibilidadResponseDTO,
  VerificarSlugApiResponse,
  VerificarSlugResponseDTO,
  CrearLocalRequestDTO,
  CrearLocalApiResponse,
  CrearLocalResponseDTO,
  ActualizarLocalRequestDTO,
  ActualizarLocalApiResponse,
  LocalItemDTO,
  ValidarBajaApiResponse,
  ValidarBajaResponseDTO,
  CambiarEstadoLocalRequestDTO,
  CambiarEstadoApiResponse,
} from '@/types/propietarioLocales';

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

  // CU-MOZO-04: Unión y Separación de Mesas en Salón
  async obtenerCandidatasUnion(mesaId: string): Promise<ApiResponse<CandidatasUnionResponseDTO>> {
    return apiGet<CandidatasUnionResponseDTO>(`/mozo/mesas/${mesaId}/candidatas-union`);
  },

  async unirMesas(request: UnirMesasRequestDTO): Promise<ApiResponse<UnirMesasResponseDTO>> {
    return apiPost<UnirMesasResponseDTO>('/mozo/mesas/unir', request);
  },

  async validarSeparacionMesa(mesaId: string): Promise<ApiResponse<ValidacionSeparacionMesaDTO>> {
    return apiGet<ValidacionSeparacionMesaDTO>(`/mozo/mesas/${mesaId}/validar-separacion`);
  },

  async dividirMesas(
    mesaId: string,
    secundariasIds?: string[],
    forzar = false
  ): Promise<ApiResponse<DividirMesasResponseDTO>> {
    return apiPost<DividirMesasResponseDTO>(`/mozo/mesas/${mesaId}/separar`, {
      mesas_secundarias_ids: secundariasIds,
      forzar,
    });
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

  async enviarPedidoCocina(payload: {
    mesa_id: string;
    comensales: number;
    numero_ronda?: number;
    items: Array<{
      producto_id: string;
      cantidad: number;
      nota_cocina?: string | null;
    }>;
  }): Promise<ApiResponse<any>> {
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
    return apiGet<ClienteFiscalLookupDTO>(`/mozo/clientes/buscar?tipo=${tipoDoc}&documento=${numeroDoc}`);
  },

  // CU-MOZO-09: Dividir Cuenta en Mesa (Subcuentas)
  async obtenerItemsParaDividir(mesaId: string): Promise<ApiResponse<ItemsParaDividirResponseDTO>> {
    return apiGet<ItemsParaDividirResponseDTO>(`/mozo/mesas/${mesaId}/items-dividir`);
  },

  async dividirCuentaMesa(payload: DividirCuentaRequestDTO): Promise<ApiResponse<DividirCuentaResponseDTO>> {
    return apiPost<DividirCuentaResponseDTO>(`/mozo/mesas/${payload.mesa_id}/dividir-cuenta`, payload);
  },

  // CU-MOZO-06: Anulación de Ítems y Comandas con Auditoría Inmutable y Control de Merma
  async anularItemComanda(
    mesaId: string,
    itemId: string,
    request: AnularItemRequestDTO
  ): Promise<ApiResponse<ItemAnuladoResponseDTO>> {
    return apiPost<ItemAnuladoResponseDTO>(`/mozo/mesas/${mesaId}/items/${itemId}/anular`, request);
  },

  async anularComandaCompleta(
    mesaId: string,
    request: AnularPedidoCompletoRequestDTO
  ): Promise<ApiResponse<PedidoAnuladoResponseDTO>> {
    return apiPost<PedidoAnuladoResponseDTO>(`/mozo/mesas/${mesaId}/anular-comanda`, request);
  },

  // CU-MOZO-05: Gestión Integral de Reservas y Recepción en Salón
  async obtenerPoliticasReserva(): Promise<ApiResponse<PoliticasReservaDTO>> {
    return apiGet<PoliticasReservaDTO>('/mozo/reservas/politicas');
  },

  async obtenerReservas(
    fecha?: string,
    turno: 'almuerzo' | 'cena' | 'todos' = 'todos'
  ): Promise<ApiResponse<ReservaCardDTO[]>> {
    const params = fecha ? { fecha, turno } : { turno };
    return apiGet<ReservaCardDTO[]>('/mozo/reservas', params);
  },

  async obtenerMesasDisponiblesReserva(
    fecha: string,
    hora: string,
    comensales: number
  ): Promise<ApiResponse<MesasDisponiblesResponseDTO>> {
    return apiGet<MesasDisponiblesResponseDTO>('/mozo/reservas/mesas-disponibles', {
      fecha,
      hora,
      comensales,
    });
  },

  async crearReserva(payload: CrearReservaRequestDTO): Promise<ApiResponse<ReservaCardDTO>> {
    return apiPost<ReservaCardDTO>('/mozo/reservas', payload);
  },

  async sentarReserva(reservaId: string): Promise<ApiResponse<SentarReservaResponseDTO>> {
    return apiPost<SentarReservaResponseDTO>(`/mozo/reservas/${reservaId}/sentar`);
  },

  async registrarNoShow(
    reservaId: string,
    request?: RegistrarNoShowRequestDTO | string
  ): Promise<ApiResponse<{ reservaId: string; mesaLiberada: boolean; mensaje: string }>> {
    const payload = typeof request === 'string' ? { motivo_inasistencia: request } : request;
    return apiPost<{ reservaId: string; mesaLiberada: boolean; mensaje: string }>(
      `/mozo/reservas/${reservaId}/no-show`,
      payload
    );
  },

  async cancelarReserva(
    reservaId: string,
    request: CancelarReservaRequestDTO | string
  ): Promise<ApiResponse<{ reservaId: string; mensaje: string }>> {
    const payload = typeof request === 'string' ? { motivo_cancelacion: request } : request;
    return apiPost<{ reservaId: string; mensaje: string }>(
      `/mozo/reservas/${reservaId}/cancelar`,
      payload
    );
  },

  async reasignarMesaReserva(
    reservaId: string,
    request: ReasignarMesaReservaRequestDTO | string,
    motivoOpcional?: string
  ): Promise<ApiResponse<ReservaCardDTO>> {
    const payload = typeof request === 'string'
      ? { nueva_mesa_id: request, motivo: motivoOpcional }
      : request;
    return apiPatch<ReservaCardDTO>(`/mozo/reservas/${reservaId}/reasignar-mesa`, payload);
  },

  // CU-MOZO-07: Quiebres de Cocina y Sustitución de Carta
  async obtenerCatalogoSustitucion(
    mesaId: string,
    itemId: string,
    categoriaId?: string,
    query?: string
  ): Promise<ApiResponse<CatalogoSustitucionResponseDTO>> {
    const params: Record<string, string> = {};
    if (categoriaId && categoriaId !== 'todas') params.categoria_id = categoriaId;
    if (query && query.trim()) params.query = query.trim();
    return apiGet<CatalogoSustitucionResponseDTO>(
      `/mozo/mesas/${mesaId}/items/${itemId}/catalogo-sustitucion`,
      Object.keys(params).length > 0 ? params : undefined
    );
  },

  async sustituirPlato(
    mesaId: string,
    itemId: string,
    payload: SustituirPlatoRequestDTO
  ): Promise<ApiResponse<SustituirPlatoResponseDTO>> {
    return apiPost<SustituirPlatoResponseDTO>(
      `/mozo/mesas/${mesaId}/items/${itemId}/sustituir`,
      payload
    );
  },

  async anularPorQuiebreCocina(
    mesaId: string,
    itemId: string,
    payload: AnularPorQuiebreRequestDTO
  ): Promise<ApiResponse<AnularPorQuiebreResponseDTO>> {
    return apiPost<AnularPorQuiebreResponseDTO>(
      `/mozo/mesas/${mesaId}/items/${itemId}/anular-quiebre`,
      payload
    );
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

  // CU-COCINA-04: Gestión Táctil de Disponibilidad y Quiebres
  async obtenerCatalogoDisponibilidad(): Promise<ApiResponse<PlatoDisponibilidadDTO[]>> {
    return apiGet<PlatoDisponibilidadDTO[]>('/cocina/productos/disponibilidad');
  },

  async obtenerItemsEnFuegoDeProducto(productoId: string): Promise<ApiResponse<ItemEnFuegoResolucionDTO[]>> {
    return apiGet<ItemEnFuegoResolucionDTO[]>(`/cocina/productos/${productoId}/items-fuego`);
  },

  async conmutarDisponibilidadPlatoDirecto(
    productoId: string,
    nuevoEstado: 'disponible' | 'agotado',
    motivo?: string
  ): Promise<ApiResponse<any>> {
    if (nuevoEstado === 'disponible') {
      return apiPost<any>(`/cocina/productos/${productoId}/reactivar`);
    }
    return apiPost<any>(`/cocina/productos/${productoId}/marcar-agotado`, { motivo });
  },

  async confirmarResolucionFuego(
    productoId: string,
    itemsEnFuegoNoAlcanzadosIds: string[],
    motivo?: string
  ): Promise<ApiResponse<any>> {
    return apiPost<any>(`/cocina/productos/${productoId}/resolver-fuego`, {
      items_no_alcanzados_ids: itemsEnFuegoNoAlcanzadosIds,
      motivo,
    });
  },

  // CU-COCINA-02: Acciones por Tandas All-Day
  async ponerEnFuegoPorTanda(
    productoId: string,
    cantidad?: number
  ): Promise<ApiResponse<{ producto_id: string; actualizados: number; items_afectados: string[] }>> {
    return apiPost<{ producto_id: string; actualizados: number; items_afectados: string[] }>(
      '/cocina/consolidado/poner-en-fuego',
      { producto_id: productoId, cantidad }
    );
  },

  async marcarListoPorTanda(
    productoId: string,
    cantidad: number
  ): Promise<ApiResponse<{ producto_id: string; listos: number; items_afectados: string[] }>> {
    return apiPost<{ producto_id: string; listos: number; items_afectados: string[] }>(
      '/cocina/consolidado/marcar-listo',
      { producto_id: productoId, cantidad }
    );
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

  async emitirComprobanteFiscal(
    datos: ProcesarCobroFiscalRequest,
  ): Promise<ApiResponse<ProcesarCobroFiscalResponseDTO>> {
    const response = await apiPost<any>('/caja/cobrar', {
      pedido_id: datos.pedido_id,
      subcuenta_id: datos.subcuenta_id,
      tipo_comprobante: datos.tipo_comprobante,
      medio_pago: datos.metodo_pago_codigo,
      monto_recibido: datos.monto_recibido,
      documento_cliente: datos.cliente_num_doc,
      nombre_cliente: datos.cliente_nombre,
      telefono_envio: datos.telefono_envio,
      email_envio: datos.email_envio,
    });

    if (!response.exito || !response.datos) {
      return response;
    }

    const comprobante = response.datos;

    return {
      ...response,
      datos: {
        comprobante_id: comprobante.comprobante_id,
        tipo_comprobante: comprobante.tipo_comprobante,
        serie: comprobante.serie,
        correlativo: comprobante.correlativo,
        serie_numero: comprobante.serie_numero,
        total_cobrado: Number(comprobante.total_cobrado),
        base_imponible: Number(comprobante.base_imponible),
        igv: Number(comprobante.igv),
        monto_recibido: Number(comprobante.monto_recibido),
        vuelto: Number(comprobante.vuelto),
        cliente_nombre: comprobante.cliente_nombre,
        cliente_documento: comprobante.cliente_documento ?? undefined,
        telefono_registrado: comprobante.telefono_registrado ?? undefined,
        email_registrado: comprobante.email_registrado ?? undefined,
        token_digital: comprobante.token_digital,
        // La URL se habilitará al almacenar PDF/XML durante CU-CAJA-03B.
        url_publica_qr: '',
        mesa_id: comprobante.mesa_id,
        mesa_numero: comprobante.mesa_numero,
        mesa_liberada: comprobante.mesa_liberada,
        subcuenta_id: comprobante.subcuenta_id ?? undefined,
        subcuentas_pendientes: comprobante.subcuentas_pendientes,
        emitido_at: comprobante.emitido_at,
      },
    };
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

  // CU-CAJA-04: Gestión de Comprobantes, Anulaciones y Notas de Crédito
  async getComprobantesTurno(
    filtros: FiltrosHistorialComprobantesDTO = { estado: 'todos', tipo: 'todos' }
  ): Promise<ApiResponse<ComprobanteHistorialItemDTO[]>> {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.tipo && filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);
    if (filtros.q) params.append('q', filtros.q);
    const qs = params.toString();
    return apiGet<ComprobanteHistorialItemDTO[]>(`/caja/comprobantes${qs ? `?${qs}` : ''}`);
  },

  async prepararAnulacionComprobante(id: string): Promise<ApiResponse<PrepararAnulacionResponseDTO>> {
    return apiGet<PrepararAnulacionResponseDTO>(`/caja/comprobantes/${id}/preparar-anulacion`);
  },

  async emitirNotaCredito(
    comprobanteId: string,
    datos: EmitirNotaCreditoRequest
  ): Promise<ApiResponse<EmitirNotaCreditoResponseDTO>> {
    return apiPost<EmitirNotaCreditoResponseDTO>(`/caja/comprobantes/${comprobanteId}/nota-credito`, datos);
  },

  async actualizarContactoComprobante(
    id: string,
    req: { telefono_envio?: string; email_envio?: string }
  ): Promise<ApiResponse<{ id: string; telefono_envio?: string; email_envio?: string }>> {
    return apiPatch<{ id: string; telefono_envio?: string; email_envio?: string }>(`/caja/comprobantes/${id}/contacto`, req);
  },
};

export const realAdminService = {
  ...realPlanoService,
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
  getHorarioSemana: (): Promise<ApiEnvelope<HorarioSemanaResponse>> => apiGet('/admin/horario'),
  guardarHorarioSemana: (payload: ConfigSemanaHorariaRequest): Promise<ApiEnvelope<HorarioSemanaResponse>> =>
    apiPut('/admin/horario', payload),
  aplicarPlantillaHorario: (payload: AplicarPlantillaRequest): Promise<ApiEnvelope<HorarioSemanaResponse>> =>
    apiPost('/admin/horario/plantilla', payload),
  getExcepcionesHorario: (): Promise<ApiEnvelope<ExcepcionHorarioDTO[]>> =>
    apiGet('/admin/horario/excepciones'),
  crearExcepcion: (payload: {
    fecha: string;
    cerrado: boolean;
    hora_inicio?: string;
    hora_fin?: string;
    motivo: string;
  }): Promise<ApiEnvelope<ExcepcionHorarioDTO>> => apiPost('/admin/horario/excepciones', payload),
  async eliminarExcepcion(id: string): Promise<ApiEnvelope<{ id: string; eliminado: boolean }>> {
    try {
      return (await apiClient.delete(`/admin/horario/excepciones/${id}`)).data;
    } catch (error: any) {
      return error.response?.data ?? Promise.reject(error);
    }
  },
  cargarFeriadosNacionalesPeru: (): Promise<ApiEnvelope<{ agregados: number; total: number }>> =>
    apiPost('/admin/horario/feriados-peru/cargar'),
  getConfiguracionKds: (): Promise<ApiEnvelope<ConfiguracionKdsDTO>> =>
    apiGet('/admin/configuracion-kds'),
  actualizarConfiguracionKds: (
    payload: ActualizarConfiguracionKdsRequest,
  ): Promise<ApiEnvelope<ConfiguracionKdsDTO>> =>
    apiPut('/admin/configuracion-kds', payload),
  restaurarDefaultsConfiguracionKds: (): Promise<ApiEnvelope<ConfiguracionKdsDTO>> =>
    apiPost('/admin/configuracion-kds/restaurar-valores-recomendados'),

  // CU-ADMIN-03: Catálogo de Insumos y Gestión de Stock
  obtenerInsumos: (
    _localId: string,
    filtro: 'activo' | 'agotado' | 'inactivo' | 'todos' = 'activo',
    busqueda = '',
    pagina = 1,
    limite = 10,
  ): Promise<ApiEnvelope<InsumosAdminResponseDTO>> =>
    apiGet('/admin/insumos', {
      estado: filtro,
      ...(busqueda ? { busqueda } : {}),
      pagina,
      limite,
    }),
  crearInsumo: (_localId: string, payload: CrearInsumoRequest): Promise<ApiEnvelope<InsumoAdminDTO>> =>
    apiPost('/admin/insumos', payload),
  actualizarInsumo: (id: string, payload: ActualizarInsumoRequest): Promise<ApiEnvelope<InsumoAdminDTO>> =>
    apiPut(`/admin/insumos/${id}`, payload),
  ajustarStockInsumo: (id: string, payload: AjustarStockInsumoRequest): Promise<ApiEnvelope<AjusteStockResultDTO>> =>
    apiPost(`/admin/insumos/${id}/ajuste`, payload),
  conmutarEstadoInsumo: (id: string, payload: ConmutarEstadoInsumoRequest): Promise<ApiEnvelope<InsumoAdminDTO>> =>
    apiPatch(`/admin/insumos/${id}/estado`, payload),
  obtenerAuditoriaAjustes: (insumoId?: string): Promise<ApiEnvelope<AuditoriaStockAjusteDTO[]>> =>
    apiGet('/admin/insumos/auditoria', insumoId ? { insumo_id: insumoId } : {}),

  // CU-ADMIN-04: Recetas Culinarias y Simulación de Capacidad de Bodega
  obtenerReceta: (productoId: string): Promise<ApiEnvelope<any>> =>
    apiGet(`/admin/productos/${productoId}/receta`),
  actualizarReceta: (
    productoId: string,
    payload: any,
  ): Promise<ApiEnvelope<any>> =>
    apiPut(`/admin/productos/${productoId}/receta`, payload),
  simularCapacidadBodega: (productoId: string): Promise<ApiEnvelope<any>> =>
    apiGet(`/admin/productos/${productoId}/capacidad`),
  getMetodosPago: (): Promise<ApiEnvelope<CatalogoMetodosPagoResponseDTO>> =>
    apiGet('/admin/metodos-pago'),
  actualizarMetodosPago: (
    payload: ActualizarCatalogoMetodosRequest,
  ): Promise<ApiEnvelope<CatalogoMetodosPagoResponseDTO>> =>
    apiPut('/admin/metodos-pago', payload),

  // CU-ADMIN-05: Directorio y Catálogo de Proveedores de Insumos
  getProveedores: (
    localIdOrParams?:
      | string
      | {
          estado?: 'activos' | 'inactivos' | 'todos';
          query?: string;
          pagina?: number;
          limite?: number;
        },
    paramsMaybe?: {
      estado?: 'activos' | 'inactivos' | 'todos';
      query?: string;
      pagina?: number;
      limite?: number;
    }
  ): Promise<ApiEnvelope<ProveedoresListDTO>> => {
    const params =
      typeof localIdOrParams === 'object' && localIdOrParams !== null
        ? localIdOrParams
        : paramsMaybe;
    return apiGet('/admin/proveedores', {
      estado: params?.estado ?? 'activos',
      ...(params?.query ? { query: params.query } : {}),
      pagina: params?.pagina ?? 1,
      limite: params?.limite ?? 10,
    });
  },
  crearProveedor: (
    _localId: string,
    payload: CrearProveedorRequestDTO
  ): Promise<ApiEnvelope<ProveedorResumenDTO>> =>
    apiPost('/admin/proveedores', payload),
  actualizarProveedor: (
    id: string,
    payload: ActualizarProveedorRequestDTO
  ): Promise<ApiEnvelope<ProveedorResumenDTO>> =>
    apiPut(`/admin/proveedores/${id}`, payload),
  conmutarEstadoProveedor: (
    id: string,
    activo: boolean
  ): Promise<ApiEnvelope<ProveedorResumenDTO>> =>
    apiPatch(`/admin/proveedores/${id}/estado`, { activo }),
  async eliminarProveedor(id: string): Promise<ApiEnvelope<{ id: string; mensaje: string } | null>> {
    try {
      return (await apiClient.delete(`/admin/proveedores/${id}`)).data;
    } catch (error: any) {
      return error.response?.data ?? Promise.reject(error);
    }
  },
  getHistorialComprasProveedor: (
    id: string
  ): Promise<ApiEnvelope<ProveedorHistorialComprasDTO>> =>
    apiGet(`/admin/proveedores/${id}/historial`),

  // CU-ADMIN-06: Abastecimiento, Fichas de Compra y Reposición de Inventario
  getFichasCompra: (filtros?: {
    busqueda?: string;
    criterioBusqueda?: string;
    tipoComprobante?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiEnvelope<ListarFichasCompraResponseDTO>> =>
    apiGet('/admin/compras', filtros),

  registrarFichaCompra: (
    payload: RegistrarFichaCompraRequestDTO
  ): Promise<ApiEnvelope<{ ficha: FichaCompraResumenDTO; platosReactivables: PlatoReactivableDTO[] }>> =>
    apiPost('/admin/compras', payload),

  getFichaCompraDetalle: (id: string): Promise<ApiEnvelope<FichaCompraDetalleCompletoDTO>> =>
    apiGet(`/admin/compras/${id}`),

  obtenerImpactoAnulacion: (id: string): Promise<ApiEnvelope<ImpactoAnulacionDTO>> =>
    apiGet(`/admin/compras/${id}/impacto-anulacion`),

  anularFichaCompra: (
    request: AnularFichaCompraRequestDTO
  ): Promise<ApiEnvelope<FichaCompraResumenDTO>> =>
    apiPost(`/admin/compras/${request.ficha_id}/anular`, { motivo: request.motivo }),

  reactivarPlatosCompra: (
    platoIds: string[]
  ): Promise<ApiEnvelope<{ actualizados: number }>> =>
    apiPost('/admin/compras/reactivar-platos', { plato_ids: platoIds }),
  // CU-ADMIN-17: Gestión de Promociones del Local
  async getBandejaPromociones(
    filtros: FiltrosPromocionesRequest = {}
  ): Promise<ApiEnvelope<PromocionesBandejaResponseDTO>> {
    try {
      const params: Record<string, unknown> = {};
      if (filtros.estado && filtros.estado !== 'todas') params.estado = filtros.estado;
      if (filtros.tipo_descuento && filtros.tipo_descuento !== 'todos') params.tipo_descuento = filtros.tipo_descuento;
      if (filtros.busqueda) params.busqueda = filtros.busqueda;
      if (filtros.mes) params.mes = filtros.mes;
      return await apiGet<PromocionesBandejaResponseDTO>('/admin/promociones', params);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: { kpis: { vigentes_hoy: 0, campanas_programadas: 0, descuentos_mes: 0, cuentas_beneficiadas: 0 }, promociones: [], total: 0 },
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al consultar la bandeja de promociones.' }],
      };
    }
  },

  async buscarPromociones(
    busqueda: string,
    estado?: FiltroEstadoPromocion,
    tipo?: FiltroTipoPromocion
  ): Promise<ApiEnvelope<BuscarPromocionesResponseDTO>> {
    try {
      const params: Record<string, unknown> = { q: busqueda };
      if (estado && estado !== 'todas') params.estado = estado;
      if (tipo && tipo !== 'todos') params.tipo = tipo;
      return await apiGet<BuscarPromocionesResponseDTO>('/admin/promociones/buscar', params);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: { resultados: [], total: 0 },
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al buscar promociones.' }],
      };
    }
  },

  async getPromocionDetalle(id: string): Promise<ApiEnvelope<PromocionAdminDTO>> {
    try {
      return await apiGet<PromocionAdminDTO>(`/admin/promociones/${id}`);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al obtener detalle de la promoción.' }],
      };
    }
  },

  async crearPromocion(payload: CrearPromocionRequest): Promise<ApiEnvelope<PromocionAdminDTO>> {
    try {
      return await apiPost<PromocionAdminDTO>('/admin/promociones', payload);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al crear la promoción.' }],
      };
    }
  },

  async actualizarPromocion(id: string, payload: ActualizarPromocionRequest): Promise<ApiEnvelope<PromocionAdminDTO>> {
    try {
      return await apiPut<PromocionAdminDTO>(`/admin/promociones/${id}`, payload);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al actualizar la promoción.' }],
      };
    }
  },

  async toggleEstadoPromocion(id: string, activa: boolean): Promise<ApiEnvelope<PromocionAdminDTO>> {
    try {
      return await apiPatch<PromocionAdminDTO>(`/admin/promociones/${id}/estado`, { activa });
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al modificar el estado de la promoción.' }],
      };
    }
  },

  async eliminarPromocion(id: string): Promise<ApiEnvelope<{ id: string; mensaje: string }>> {
    try {
      return await apiDelete<{ id: string; mensaje: string }>(`/admin/promociones/${id}`);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al eliminar la promoción.' }],
      };
    }
  },

  // CU-ADMIN-04 / CU-ADMIN-11: Bandeja y Auditoría de Anulaciones y Mermas
  getBandejaAnulaciones: (
    filtros: FiltrosAnulacionesRequest = {}
  ): Promise<ApiEnvelope<AnulacionesBandejaResponseDTO>> => {
    const params: Record<string, unknown> = {};
    if (filtros.fecha) params.fecha = filtros.fecha;
    if (filtros.filtro_rapido && filtros.filtro_rapido !== 'todas') params.filtro_rapido = filtros.filtro_rapido;
    if (filtros.mozo_id && filtros.mozo_id !== 'todos') params.mozo_id = filtros.mozo_id;
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    return apiGet('/admin/anulaciones', params);
  },

  getAnulacionDetalle: (id: string): Promise<ApiEnvelope<PedidoAnulacionItemDTO>> =>
    apiGet(`/admin/anulaciones/${id}`),

  marcarAnulacionRevisada: (
    id: string,
    req?: MarcarRevisadoRequestDTO
  ): Promise<ApiEnvelope<PedidoAnulacionItemDTO>> =>
    apiPost(`/admin/anulaciones/${id}/revisar`, req ?? {}),

  escalarAnulacionAIncidente: (
    id: string,
    req: EscalarIncidenteAnulacionRequest
  ): Promise<ApiEnvelope<{ anulacion: PedidoAnulacionItemDTO; incidente: IncidenteDetalleDTO }>> =>
    apiPost(`/admin/anulaciones/${id}/escalar-incidente`, req),

  subscribirNotificacionesSse: (_callback: (notif: any) => void) => {
    return () => {};
  },

  async getNotificacionesCampana(): Promise<ApiEnvelope<NotificacionCampanaDTO[]>> {
    return {
      exito: true,
      datos: [],
      meta: { timestamp: new Date().toISOString() },
    };
  },

  async marcarTodasNotificacionesLeidas(): Promise<ApiEnvelope<{ actualizados: number }>> {
    return {
      exito: true,
      datos: { actualizados: 0 },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  async marcarNotificacionLeida(_id: string): Promise<ApiEnvelope<{ leido: boolean }>> {
    return {
      exito: true,
      datos: { leido: true },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  async getRendimientoPromocion(id: string): Promise<ApiEnvelope<PromocionRendimientoDTO>> {
    try {
      return await apiGet<PromocionRendimientoDTO>(`/admin/promociones/${id}/rendimiento`);
    } catch (err: any) {
      return err.response?.data ?? {
        exito: false,
        datos: null,
        errores: [{ codigo: 'ERR_CONEXION', mensaje: 'Error al obtener rendimiento de la promoción.' }],
      };
    }
  },
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

// CU-PROP-05: Gestión de Administradores de Local (Propietario)
export const realPropietarioAdminsService = {
  async getDirectorioAdministradores(filtros?: {
    estado?: string;
    busqueda?: string;
  }): Promise<DirectorioAdminsApiResponse> {
    try {
      return await apiGet<DirectorioAdminsResponseDTO>(
        '/propietario/administradores',
        filtros as Record<string, unknown>
      );
    } catch (err: any) {
      return (
        err.response?.data || {
          exito: false,
          datos: { cuota_usuarios: {} as any, administradores: [] },
          errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al consultar administradores.' }],
          meta: { timestamp: new Date().toISOString() },
        }
      );
    }
  },

  async getFormularioDatos(): Promise<FormularioDatosApiResponse> {
    try {
      const res = await apiGet<any>('/propietario/administradores/cuota-personal');
      return {
        exito: res.exito,
        datos: {
          puede_invitar: res.datos?.puede_invitar ?? true,
          cupos_libres: res.datos?.cupos_libres ?? 1,
          sedes_disponibles: [],
          sedes_ocupadas: [],
        },
        meta: res.meta,
      };
    } catch (err: any) {
      return (
        err.response?.data || {
          exito: false,
          datos: { puede_invitar: false, cupos_libres: 0, sedes_disponibles: [], sedes_ocupadas: [] },
          errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al consultar cuota de personal.' }],
          meta: { timestamp: new Date().toISOString() },
        }
      );
    }
  },

  async invitarAdministrador(dto: InvitarAdminRequestDTO): Promise<InvitarAdminApiResponse> {
    try {
      return await apiPost<any>('/propietario/administradores', {
        nombre: dto.nombre,
        correo: dto.correo,
        telefono: dto.telefono,
      });
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'No se pudo conectar con el servidor para enviar la invitación.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async reenviarInvitacion(adminId: string): Promise<ReenviarInvitacionApiResponse> {
    try {
      return await apiPost<any>(`/propietario/administradores/${adminId}/reenviar-invitacion`);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al reenviar la invitación.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async cancelarInvitacion(adminId: string): Promise<CancelarInvitacionApiResponse> {
    try {
      return await apiPost<any>(`/propietario/administradores/${adminId}/cancelar-invitacion`);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al cancelar la invitación.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async obtenerEnlaceInvitacion(adminId: string): Promise<EnlaceInvitacionApiResponse> {
    try {
      return await apiGet<any>(`/propietario/administradores/${adminId}/enlace-invitacion`);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al obtener el enlace de invitación.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async cambiarEstado(
    adminId: string,
    req: CambiarEstadoAdminRequestDTO
  ): Promise<CambiarEstadoAdminApiResponse> {
    try {
      return await apiPatch<any>(`/propietario/administradores/${adminId}/cambiar-estado`, {
        nuevo_estado: req.nuevo_estado,
      });
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al actualizar el estado del administrador.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },
};

/**
 * Servicio Real para Propietario Locales y Sedes (CU-PROP-04 - 100% Backend)
 */
export const realPropietarioLocalesService = {
  async getDirectorioLocales(): Promise<DirectorioLocalesApiResponse> {
    try {
      return await apiGet<DirectorioLocalesResponseDTO>('/propietario/locales');
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al consultar el directorio de sedes.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async verificarDisponibilidad(): Promise<VerificarDisponibilidadApiResponse> {
    try {
      return await apiGet<VerificarDisponibilidadResponseDTO>('/propietario/locales/verificar-disponibilidad');
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al comprobar disponibilidad de cupos.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async verificarSlug(slug: string, excluirLocalId?: string): Promise<VerificarSlugApiResponse> {
    try {
      const params: Record<string, string> = { slug };
      if (excluirLocalId) {
        params.excluir_id = excluirLocalId;
      }
      return await apiGet<VerificarSlugResponseDTO>('/propietario/locales/verificar-slug', params);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al verificar la dirección web de la carta.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async crearLocal(req: CrearLocalRequestDTO): Promise<CrearLocalApiResponse> {
    try {
      return await apiPost<CrearLocalResponseDTO>('/propietario/locales', req);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'No se pudo conectar con el servidor para registrar el local.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async actualizarLocal(id: string, req: ActualizarLocalRequestDTO): Promise<ActualizarLocalApiResponse> {
    try {
      return await apiPut<LocalItemDTO>(`/propietario/locales/${id}`, req);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al actualizar los datos de la sede.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async validarBajaLocal(id: string): Promise<ValidarBajaApiResponse> {
    try {
      return await apiGet<ValidarBajaResponseDTO>(`/propietario/locales/${id}/validar-baja`);
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al auditar el estado operativo de la sede.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  async cambiarEstadoLocal(id: string, req: CambiarEstadoLocalRequestDTO): Promise<CambiarEstadoApiResponse> {
    try {
      return await apiPatch<any>(`/propietario/locales/${id}/cambiar-estado`, {
        nuevo_estado: req.nuevo_estado,
      });
    } catch (err: any) {
      if (err.response?.data) return err.response.data;
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERROR_CONEXION', mensaje: 'Error al cambiar el estado del local.' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },
};
