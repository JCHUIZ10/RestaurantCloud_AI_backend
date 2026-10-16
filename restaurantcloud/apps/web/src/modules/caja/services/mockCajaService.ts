import { ApiResponse } from '@/types/api';
import {
  CajaTurnoDTO,
  EstadoCajaSesionDTO,
  AbrirCajaRequest,
  MesaCajaMonitorDTO,
  CajaMetricasPosDTO,
  BalancePreArqueoDTO,
  CerrarCajaRequest,
  ReporteZDTO,
  PrecuentaItemDTO,
  DesgloseTributarioSUNATDTO,
  OpcionCobroPrecuentaDTO,
  PromocionAplicableDTO,
  PrecuentaResponseDTO,
  SubcuentaComandaDTO,
  ProcesarCobroFiscalRequest,
  ProcesarCobroFiscalResponseDTO,
  ClienteFiscalLookupDTO,
} from '@/types/caja';
import { CANONICAL_LOCAL_ID, CANONICAL_LOCAL_NOMBRE } from '@/shared/constants/canonical';

export const CAJERO_ACTUAL_MOCK = {
  id: '00000000-0000-4000-8000-000000000003',
  nombre: 'Carlos Mendoza',
  rol: 'Cajero Titular (Turno Tarde)',
  iniciales: 'CM',
};

export const CAJERO_PREVIO_MOCK = {
  id: '00000000-0000-4000-8000-000000000004',
  nombre: 'Juan Pérez',
  rol: 'Cajero Saliente (Turno Mañana)',
  iniciales: 'JP',
};

export const PROMOCIONES_CATALOGO_MOCK: PromocionAplicableDTO[] = [
  {
    id: 'promo-almuerzo-15',
    nombre: 'Descuento Almuerzo Ejecutivo (15% dscto)',
    tipo_descuento: 'porcentaje',
    valor: 15.0,
    ahorro_calculado: 15.0,
    aplicada: false,
    descripcion_condicion: 'Lunes a Viernes 12pm - 4pm',
  },
  {
    id: 'promo-chilcano-2x1',
    nombre: '2x1 Chilcanos Clásicos',
    tipo_descuento: 'monto_fijo',
    valor: 18.0,
    ahorro_calculado: 18.0,
    aplicada: false,
    descripcion_condicion: 'Happy Hour 5pm - 8pm',
  },
];

const SEMILLAS_MESAS_CAJA: MesaCajaMonitorDTO[] = [
  {
    id: 'm-caja-004',
    numero: '04',
    piso_nombre: 'Salón Principal',
    estado: 'cuenta_pedida',
    mozo_nombre: 'Marco Valdivia',
    comensales: 4,
    total_consumo: 100.0,
    pedido_id: 'ped-caja-104',
    minutos_en_mesa: 55,
    minutos_espera_cuenta: 4,
  },
  {
    id: 'm-caja-008',
    numero: '08',
    piso_nombre: 'Salón Principal',
    estado: 'cuenta_pedida',
    mozo_nombre: 'Rosa P.',
    comensales: 2,
    total_consumo: 145.0,
    pedido_id: 'ped-caja-108',
    minutos_en_mesa: 42,
    minutos_espera_cuenta: 7,
    subcuentas_count: 2,
  },
  {
    id: 'm-caja-002',
    numero: '02 ; 03',
    piso_nombre: 'Salón Principal',
    estado: 'ocupada',
    mozo_nombre: 'Carlos M.',
    comensales: 8,
    total_consumo: 285.0,
    pedido_id: 'ped-caja-102',
    minutos_en_mesa: 65,
  },
  {
    id: 'm-caja-001',
    numero: '01',
    piso_nombre: 'Salón Principal',
    estado: 'ocupada',
    mozo_nombre: 'Rosa P.',
    comensales: 2,
    total_consumo: 64.0,
    pedido_id: 'ped-caja-101',
    minutos_en_mesa: 28,
  },
  {
    id: 'm-caja-005',
    numero: '05',
    piso_nombre: 'Salón Principal',
    estado: 'ocupada',
    mozo_nombre: 'Diego L.',
    comensales: 4,
    total_consumo: 180.0,
    pedido_id: 'ped-caja-105',
    minutos_en_mesa: 50,
  },
  {
    id: 'm-caja-006',
    numero: '06',
    piso_nombre: 'Salón Principal',
    estado: 'ocupada',
    mozo_nombre: 'Diego L.',
    comensales: 3,
    total_consumo: 115.0,
    pedido_id: 'ped-caja-106',
    minutos_en_mesa: 35,
  },
  {
    id: 'm-caja-007',
    numero: '07',
    piso_nombre: 'Salón Principal',
    estado: 'ocupada',
    mozo_nombre: 'Carlos M.',
    comensales: 2,
    total_consumo: 92.0,
    pedido_id: 'ped-caja-107',
    minutos_en_mesa: 40,
  },
  {
    id: 'm-caja-009',
    numero: '09',
    piso_nombre: 'Terraza Jardín',
    estado: 'ocupada',
    mozo_nombre: 'Rosa P.',
    comensales: 4,
    total_consumo: 150.0,
    pedido_id: 'ped-caja-109',
    minutos_en_mesa: 48,
  },
  {
    id: 'm-caja-010',
    numero: '10',
    piso_nombre: 'Terraza Jardín',
    estado: 'ocupada',
    mozo_nombre: 'Diego L.',
    comensales: 2,
    total_consumo: 78.0,
    pedido_id: 'ped-caja-110',
    minutos_en_mesa: 22,
  },
  {
    id: 'm-caja-011',
    numero: '11',
    piso_nombre: 'Terraza Jardín',
    estado: 'ocupada',
    mozo_nombre: 'Carlos M.',
    comensales: 4,
    total_consumo: 130.0,
    pedido_id: 'ped-caja-111',
    minutos_en_mesa: 33,
  },
  {
    id: 'm-caja-012',
    numero: '12',
    piso_nombre: 'Salón Principal',
    estado: 'libre',
    total_consumo: 0.0,
  },
  {
    id: 'm-caja-013',
    numero: '13',
    piso_nombre: 'Salón Principal',
    estado: 'libre',
    total_consumo: 0.0,
  },
  {
    id: 'm-caja-014',
    numero: '14',
    piso_nombre: 'Salón Principal',
    estado: 'libre',
    total_consumo: 0.0,
  },
  {
    id: 'm-caja-015',
    numero: '15',
    piso_nombre: 'Terraza Jardín',
    estado: 'libre',
    total_consumo: 0.0,
  },
  {
    id: 'm-caja-016',
    numero: '16',
    piso_nombre: 'Terraza Jardín',
    estado: 'libre',
    total_consumo: 0.0,
  },
  {
    id: 'm-caja-017',
    numero: 'B01',
    piso_nombre: 'Barra Cócteles',
    estado: 'libre',
    total_consumo: 0.0,
  },
];

class MockCajaService {
  private turnoActivo: CajaTurnoDTO | null = null;
  private ultimoTurno: CajaTurnoDTO = {
    id: '00000000-0000-4000-8000-000000000541',
    local_id: CANONICAL_LOCAL_ID,
    cajero_id: CAJERO_PREVIO_MOCK.id,
    cajero_nombre: CAJERO_PREVIO_MOCK.nombre,
    cajero_rol: CAJERO_PREVIO_MOCK.rol,
    correlativo: 41,
    monto_apertura: 250.0,
    notas_apertura: 'Fondo de apertura entregado en sencillo para mañana.',
    estado: 'cerrada',
    fecha_apertura: '2026-10-14T08:30:00Z',
    fecha_cierre: '2026-10-14T16:00:00Z',
    monto_esperado: 2680.0,
    monto_real: 2680.0,
    discrepancia: 0.0,
    total_ventas: 24,
    monto_ventas: 2430.0,
    efectivo_actual: 0.0,
  };
  private correlativoContador: number = 42;
  private correlativoBoleta: number = 12894;
  private correlativoFactura: number = 4521;
  private correlativoNotaVenta: number = 8412;
  private mesas: MesaCajaMonitorDTO[] = JSON.parse(JSON.stringify(SEMILLAS_MESAS_CAJA));
  private promocionesPorMesa: Record<string, string | null> = {};
  private subcuentasPorMesa: Record<string, SubcuentaComandaDTO[]> = {};

  /**
   * Consulta el estado operativo de caja en la sede (GET /api/v1/caja/estado-sesion)
   */
  async getEstadoSesion(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<EstadoCajaSesionDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    const estadoCaja = this.turnoActivo ? 'abierta' : 'cerrada';
    const puedeAbrir = !this.turnoActivo;

    return {
      exito: true,
      datos: {
        estado_caja: estadoCaja,
        puede_abrir: puedeAbrir,
        turno_activo: this.turnoActivo ? JSON.parse(JSON.stringify(this.turnoActivo)) : null,
        ultimo_turno: JSON.parse(JSON.stringify(this.ultimoTurno)),
        total_ventas_actual: this.turnoActivo?.total_ventas || 0,
        monto_ventas_actual: this.turnoActivo?.monto_ventas || 0.0,
        sede_nombre: CANONICAL_LOCAL_NOMBRE,
        correlativo_proyectado: this.correlativoContador,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Registra la apertura de turno de caja (POST /api/v1/caja/apertura)
   * Valida monto_apertura >= 0 y regla de terminal única (uq_caja_abierta_local)
   */
  async abrirTurno(
    req: AbrirCajaRequest,
    _localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<CajaTurnoDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    // Validación de negocio RN-CAJA-02: Monto no negativo
    if (typeof req.monto_apertura !== 'number' || isNaN(req.monto_apertura) || req.monto_apertura < 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MONTO_APERTURA_INVALIDO',
            mensaje: 'El monto inicial de efectivo en caja no puede ser negativo ni inválido.',
          },
        ],
      };
    }

    // Validación de negocio RN-CAJA-01 (uq_caja_abierta_local): Terminal única por sede
    if (this.turnoActivo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_TURNO_PREVIO_NO_CERRADO',
            mensaje: `No es posible abrir un nuevo turno: la caja de la sede se encuentra abierta bajo la responsabilidad de ${this.turnoActivo.cajero_nombre}. Debe efectuarse el cierre formal previo.`,
          },
        ],
      };
    }

    const nuevoTurno: CajaTurnoDTO = {
      id: `00000000-0000-4000-8000-0000000005${this.correlativoContador}`,
      local_id: CANONICAL_LOCAL_ID,
      cajero_id: CAJERO_ACTUAL_MOCK.id,
      cajero_nombre: CAJERO_ACTUAL_MOCK.nombre,
      cajero_rol: CAJERO_ACTUAL_MOCK.rol,
      correlativo: this.correlativoContador,
      monto_apertura: Math.round(req.monto_apertura * 100) / 100,
      notas_apertura: req.notas?.trim() || undefined,
      estado: 'abierta',
      fecha_apertura: new Date().toISOString(),
      fecha_cierre: null,
      monto_esperado: req.monto_apertura,
      monto_real: null,
      discrepancia: null,
      total_ventas: 0,
      monto_ventas: 0.0,
      efectivo_actual: Math.round(req.monto_apertura * 100) / 100,
    };

    this.turnoActivo = nuevoTurno;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(nuevoTurno)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene los datos del turno actualmente en curso (GET /api/v1/caja/turno-activo)
   */
  async getTurnoActivo(): Promise<ApiResponse<CajaTurnoDTO | null>> {
    await new Promise((r) => setTimeout(r, 40));
    return {
      exito: true,
      datos: this.turnoActivo ? JSON.parse(JSON.stringify(this.turnoActivo)) : null,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene el listado de mesas del salón para el monitor POS
   */
  async getMesasMonitor(): Promise<ApiResponse<MesaCajaMonitorDTO[]>> {
    await new Promise((r) => setTimeout(r, 50));
    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.mesas)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene las métricas operativas consolidadas de la sala para el cajero
   */
  async getMetricasPos(): Promise<ApiResponse<CajaMetricasPosDTO>> {
    await new Promise((r) => setTimeout(r, 40));

    const mesasCuentaPedida = this.mesas.filter((m) => m.estado === 'cuenta_pedida');
    const mesasOcupadas = this.mesas.filter((m) => m.estado === 'ocupada' || m.estado === 'cuenta_pedida');

    const montoPorCobrar = mesasCuentaPedida.reduce((acc, m) => acc + m.total_consumo, 0);
    const efectivoEnCaja = this.turnoActivo ? this.turnoActivo.efectivo_actual || this.turnoActivo.monto_apertura : 0.0;

    return {
      exito: true,
      datos: {
        mesas_cuenta_pedida: mesasCuentaPedida.length,
        monto_por_cobrar: Math.round(montoPorCobrar * 100) / 100,
        efectivo_en_caja: Math.round(efectivoEnCaja * 100) / 100,
        mesas_ocupadas_count: mesasOcupadas.length,
        total_mesas_count: this.mesas.length,
        porcentaje_ocupacion: Math.round((mesasOcupadas.length / this.mesas.length) * 100),
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Consulta datos de cliente ante la BD local o simulación ApiPerú (CU-CAJA-03)
   */
  async consultarClienteFiscal(tipoDoc: 'DNI' | 'RUC', numeroDoc: string): Promise<ApiResponse<ClienteFiscalLookupDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    if (tipoDoc === 'DNI') {
      if (numeroDoc === '72819201') {
        return {
          exito: true,
          datos: {
            tipo_documento: 'DNI',
            numero_documento: '72819201',
            nombre_identificativo: 'CARLOS MENDOZA QUISPE',
            telefono: '+51 987 654 321',
            email: 'carlos.mendoza@gmail.com',
            existe_en_bd: true,
            origen: 'bd_local',
          },
        };
      }
      return {
        exito: true,
        datos: {
          tipo_documento: 'DNI',
          numero_documento: numeroDoc,
          nombre_identificativo: `CLIENTE DNI ${numeroDoc.slice(-4)}`,
          telefono: '',
          email: '',
          existe_en_bd: false,
          origen: 'api_peru',
        },
      };
    } else {
      if (numeroDoc === '20601234567') {
        return {
          exito: true,
          datos: {
            tipo_documento: 'RUC',
            numero_documento: '20601234567',
            nombre_identificativo: 'INVERSIONES GASTRONÓMICAS S.A.C.',
            direccion: 'AV. LARCO 1045, MIRAFLORES, LIMA',
            telefono: '+51 912 345 678',
            email: 'facturacion@gastronomicas.pe',
            existe_en_bd: true,
            origen: 'bd_local',
          },
        };
      }
      return {
        exito: true,
        datos: {
          tipo_documento: 'RUC',
          numero_documento: numeroDoc,
          nombre_identificativo: `EMPRESA CONSULTORA DEMO ${numeroDoc.slice(-4)} S.A.C.`,
          direccion: `CALLE LOS NEGOCIOS ${numeroDoc.slice(-3)}, SAN ISIDRO, LIMA`,
          telefono: '',
          email: '',
          existe_en_bd: false,
          origen: 'api_peru',
        },
      };
    }
  }

  /**
   * Ejecuta la emisión y liquidación del comprobante fiscal oficial (CU-CAJA-03)
   * Transacción atómica ACID: asigna correlativo, genera token QR, inserta caja_movimiento y libera mesa
   */
  async emitirComprobanteFiscal(request: ProcesarCobroFiscalRequest): Promise<ApiResponse<ProcesarCobroFiscalResponseDTO>> {
    await new Promise((r) => setTimeout(r, 180));

    const index = this.mesas.findIndex((m) => m.id === request.mesa_id);
    if (index === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada en la sala' }],
      };
    }

    const mesa = this.mesas[index];

    // Determinar correlativo según tipo
    let serie = 'B001';
    let corr = ++this.correlativoBoleta;
    if (request.tipo_comprobante === 'factura') {
      serie = 'F001';
      corr = ++this.correlativoFactura;
    } else if (request.tipo_comprobante === 'nota_venta') {
      serie = 'NV01';
      corr = ++this.correlativoNotaVenta;
    }

    const serieNumero = `${serie}-${String(corr).padStart(8, '0')}`;
    const tokenDigital = `0192d2f4-e7b8-8000-8000-${String(Date.now()).slice(-12)}`;
    const urlPublicaQr = `https://app.restaurantcloud.pe/c/${tokenDigital}`;

    // Obtener precuenta para calcular montos exactos
    const precuenta = this.calcularPrecuentaParaMesa(mesa.id);
    let totalCobrado = precuenta?.tributacion_sunat.total_neto || mesa.total_consumo;

    // Si es una subcuenta específica
    let subcuentasPendientes = 0;
    if (request.subcuenta_id && precuenta?.subcuentas) {
      const sub = precuenta.subcuentas.find((s) => s.id === request.subcuenta_id);
      if (sub) {
        totalCobrado = sub.total_neto;
        sub.estado = 'cobrado';
        sub.estado_pago = 'cobrado';
      }
      subcuentasPendientes = precuenta.subcuentas.filter((s) => s.estado !== 'cobrado' && s.estado_pago !== 'cobrado').length;
    }

    const baseImponible = Math.round((totalCobrado / 1.18) * 100) / 100;
    const igv = Math.round((totalCobrado - baseImponible) * 100) / 100;

    let vuelto = 0.0;
    if (request.metodo_pago_codigo === 'efectivo' && request.monto_recibido) {
      vuelto = Math.max(0, Math.round((request.monto_recibido - totalCobrado) * 100) / 100);
    }

    const mesaLiberada = subcuentasPendientes === 0;

    if (mesaLiberada) {
      this.mesas[index] = {
        ...mesa,
        estado: 'libre',
        total_consumo: 0.0,
        comensales: undefined,
        mozo_nombre: undefined,
        pedido_id: undefined,
        minutos_espera_cuenta: undefined,
        subcuentas_count: undefined,
      };
    } else {
      // Descontar consumo liquidado de la mesa
      this.mesas[index] = {
        ...mesa,
        total_consumo: Math.max(0, Math.round((mesa.total_consumo - totalCobrado) * 100) / 100),
        subcuentas_count: subcuentasPendientes,
      };
    }

    // Actualizar ventas del turno activo
    if (this.turnoActivo) {
      this.turnoActivo.total_ventas = (this.turnoActivo.total_ventas || 0) + 1;
      this.turnoActivo.monto_ventas = Math.round(((this.turnoActivo.monto_ventas || 0) + totalCobrado) * 100) / 100;
      if (request.metodo_pago_codigo === 'efectivo') {
        this.turnoActivo.efectivo_actual =
          Math.round(((this.turnoActivo.efectivo_actual || this.turnoActivo.monto_apertura) + totalCobrado) * 100) / 100;
      }
    }

    const responseData: ProcesarCobroFiscalResponseDTO = {
      comprobante_id: `comp-${corr}`,
      tipo_comprobante: request.tipo_comprobante,
      serie,
      correlativo: corr,
      serie_numero: serieNumero,
      total_cobrado: totalCobrado,
      base_imponible: baseImponible,
      igv,
      monto_recibido: request.monto_recibido,
      vuelto,
      cliente_nombre: request.cliente_nombre,
      cliente_documento: request.cliente_num_doc,
      telefono_registrado: request.telefono_envio,
      email_registrado: request.email_envio,
      token_digital: tokenDigital,
      url_publica_qr: urlPublicaQr,
      mesa_id: mesa.id,
      mesa_numero: mesa.numero,
      mesa_liberada: mesaLiberada,
      subcuenta_id: request.subcuenta_id,
      subcuentas_pendientes: subcuentasPendientes,
      emitido_at: new Date().toISOString(),
    };

    return {
      exito: true,
      datos: responseData,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Simulación básica de compatibilidad
   */
  async cobrarMesaMock(mesaId: string): Promise<ApiResponse<{ mesa_numero: string; total_cobrado: number }>> {
    const res = await this.emitirComprobanteFiscal({
      mesa_id: mesaId,
      pedido_id: 'ped-caja-mock',
      tipo_comprobante: 'boleta',
      serie: 'B001',
      cliente_nombre: 'CLIENTE MOSTRADOR',
      metodo_pago_codigo: 'efectivo',
    });
    if (!res.exito || !res.datos) {
      return {
        exito: false,
        datos: null as any,
        errores: res.errores,
      };
    }
    return {
      exito: true,
      datos: {
        mesa_numero: res.datos.mesa_numero,
        total_cobrado: res.datos.total_cobrado,
      },
    };
  }

  /**
   * Obtiene la precuenta digital consolidada de una mesa (GET /api/v1/caja/mesas/{mesa_id}/precuenta)
   * RN-CAJA-02-01: Consolida consumos, calcula desglose SUNAT y proyecta medios de pago
   */
  async getPrecuentaMesa(mesaId: string): Promise<ApiResponse<PrecuentaResponseDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    const precuenta = this.calcularPrecuentaParaMesa(mesaId);
    if (!precuenta) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_SIN_PEDIDOS', mensaje: 'La mesa seleccionada no tiene pedidos activos para liquidar.' }],
      };
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(precuenta)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Aplica una promoción comercial a la precuenta digital (POST /api/v1/caja/mesas/{mesa_id}/precuenta/promocion)
   * Recalcula en caliente Base Imponible e IGV según normativa SUNAT
   */
  async aplicarPromocionPrecuenta(
    mesaId: string,
    promocionId: string
  ): Promise<ApiResponse<PrecuentaResponseDTO>> {
    await new Promise((r) => setTimeout(r, 70));

    const promo = PROMOCIONES_CATALOGO_MOCK.find((p) => p.id === promocionId);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_PROMOCION_NO_VIGENTE', mensaje: 'La promoción seleccionada no se encuentra activa o no existe.' }],
      };
    }

    this.promocionesPorMesa[mesaId] = promocionId;
    const precuenta = this.calcularPrecuentaParaMesa(mesaId);
    if (!precuenta) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada.' }],
      };
    }

    // Actualizar total_consumo en la tarjeta del salón
    const idx = this.mesas.findIndex((m) => m.id === mesaId);
    if (idx !== -1) {
      this.mesas[idx].total_consumo = precuenta.tributacion_sunat.total_neto;
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(precuenta)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Remueve la promoción activa de la precuenta digital (DELETE /api/v1/caja/mesas/{mesa_id}/precuenta/promocion)
   * Restaura los importes brutos originales
   */
  async removerPromocionPrecuenta(mesaId: string): Promise<ApiResponse<PrecuentaResponseDTO>> {
    await new Promise((r) => setTimeout(r, 50));

    this.promocionesPorMesa[mesaId] = null;
    const precuenta = this.calcularPrecuentaParaMesa(mesaId);
    if (!precuenta) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada.' }],
      };
    }

    // Actualizar total_consumo en la tarjeta del salón
    const idx = this.mesas.findIndex((m) => m.id === mesaId);
    if (idx !== -1) {
      this.mesas[idx].total_consumo = precuenta.tributacion_sunat.consumo_bruto;
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(precuenta)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Conmuta una mesa de 'ocupada' a 'cuenta_pedida' tras confirmar la precuenta digital (CU-CAJA-02)
   */
  async conmutarACuentaPedida(mesaId: string, subcuentasCount?: number): Promise<ApiResponse<MesaCajaMonitorDTO>> {
    await new Promise((r) => setTimeout(r, 60));
    const mesa = this.mesas.find((m) => m.id === mesaId);
    if (!mesa) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada.' }],
      };
    }
    mesa.estado = 'cuenta_pedida';
    mesa.minutos_espera_cuenta = 1;
    if (subcuentasCount !== undefined) {
      mesa.subcuentas_count = subcuentasCount;
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(mesa)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Registra formalmente la subdivisión de cuenta en comanda (CU-MOZO-09 / CU-CAJA-04)
   * Asocia las subcuentas calculadas y conmuta la mesa a 'cuenta_pedida'
   */
  async registrarDivisionCuenta(
    mesaId: string,
    subcuentas: SubcuentaComandaDTO[]
  ): Promise<ApiResponse<MesaCajaMonitorDTO>> {
    await new Promise((r) => setTimeout(r, 80));
    const mesa = this.mesas.find((m) => m.id === mesaId);
    if (!mesa) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada.' }],
      };
    }

    this.subcuentasPorMesa[mesaId] = subcuentas;
    mesa.estado = 'cuenta_pedida';
    mesa.minutos_espera_cuenta = 1;
    mesa.subcuentas_count = subcuentas.length;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(mesa)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Motor determinista de cálculo tributario SUNAT e ítems para la precuenta
   */
  calcularPrecuentaParaMesa(mesaId: string): PrecuentaResponseDTO | null {
    const mesa = this.mesas.find((m) => m.id === mesaId);
    if (!mesa || mesa.estado === 'libre') return null;

    let items: PrecuentaItemDTO[] = [];
    let subcuentas: SubcuentaComandaDTO[] | undefined = undefined;
    let numeroComanda = 108;
    let horaPedido = '12:45 PM';
    let mozoNombre = mesa.mozo_nombre || 'Marco Valdivia';
    let tieneCocinaPendiente = false;
    let alertaCocina: string | undefined = undefined;

    if (mesa.id === 'm-caja-004' || mesa.numero === '04') {
      numeroComanda = 108;
      horaPedido = '12:45 PM';
      mozoNombre = 'Marco Valdivia';
      tieneCocinaPendiente = true;
      alertaCocina = "Aviso Informativo: 1 plato 'Lomo Saltado' en preparación en cocina. No bloquea la emisión ni el cobro de la cuenta.";
      items = [
        {
          producto_id: '00000000-0000-4000-8000-000000000201',
          nombre: 'Lomo Saltado Criollo',
          nota_cocina: 'Término 3/4, con papas',
          cantidad: 1,
          precio_unitario: 38.0,
          subtotal: 38.0,
          estado_cocina: 'en_preparacion',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000202',
          nombre: 'Arroz con Mariscos Especial',
          nota_cocina: 'Sin cebolla china',
          cantidad: 1,
          precio_unitario: 34.0,
          subtotal: 34.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000203',
          nombre: 'Chicha Morada Jarra 1L',
          cantidad: 1,
          precio_unitario: 16.0,
          subtotal: 16.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000204',
          nombre: 'Causa Limeña Clásica',
          nota_cocina: 'Entrada compartida',
          cantidad: 1,
          precio_unitario: 12.0,
          subtotal: 12.0,
          estado_cocina: 'entregado',
        },
      ];
    } else if (mesa.id === 'm-caja-008' || mesa.numero === '08') {
      numeroComanda = 109;
      horaPedido = '01:10 PM';
      mozoNombre = 'Rosa P.';
      tieneCocinaPendiente = false;
      items = [
        {
          producto_id: '00000000-0000-4000-8000-000000000205',
          nombre: 'Ceviche Mixto Tradicional',
          nota_cocina: 'Picante moderado',
          cantidad: 1,
          precio_unitario: 48.0,
          subtotal: 48.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000206',
          nombre: 'Arroz Chaufa Especial',
          cantidad: 1,
          precio_unitario: 42.0,
          subtotal: 42.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000207',
          nombre: 'Chilcano Clásico',
          cantidad: 2,
          precio_unitario: 20.0,
          subtotal: 40.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000208',
          nombre: 'Suspiro a la Limeña',
          cantidad: 1,
          precio_unitario: 15.0,
          subtotal: 15.0,
          estado_cocina: 'entregado',
        },
      ];
      subcuentas = [
        {
          id: 'sub-08-1',
          numero_subcuenta: 1,
          titular_referencia: 'Comensal 1 (Ceviche + Chilcano)',
          subtotal_bruto: 88.0,
          descuento: 0.0,
          total_neto: 88.0,
          tipo_comprobante_sugerido: 'BOLETA',
          estado_pago: 'pendiente',
          items: [
            { producto_id: '00000000-0000-4000-8000-000000000205', nombre: 'Ceviche Mixto Tradicional', cantidad: 1, precio_unitario: 48.0, subtotal: 48.0, estado_cocina: 'entregado' },
            { producto_id: '00000000-0000-4000-8000-000000000207', nombre: 'Chilcano Clásico', cantidad: 2, precio_unitario: 20.0, subtotal: 40.0, estado_cocina: 'entregado' },
          ],
        },
        {
          id: 'sub-08-2',
          numero_subcuenta: 2,
          titular_referencia: 'Comensal 2 (Chaufa + Suspiro)',
          subtotal_bruto: 57.0,
          descuento: 0.0,
          total_neto: 57.0,
          tipo_comprobante_sugerido: 'FACTURA',
          estado_pago: 'pendiente',
          items: [
            { producto_id: '00000000-0000-4000-8000-000000000206', nombre: 'Arroz Chaufa Especial', cantidad: 1, precio_unitario: 42.0, subtotal: 42.0, estado_cocina: 'entregado' },
            { producto_id: '00000000-0000-4000-8000-000000000208', nombre: 'Suspiro a la Limeña', cantidad: 1, precio_unitario: 15.0, subtotal: 15.0, estado_cocina: 'entregado' },
          ],
        },
      ];
    } else if (mesa.id === 'm-caja-002' || mesa.numero.includes(';')) {
      numeroComanda = 102;
      horaPedido = '12:15 PM';
      mozoNombre = 'Marco Valdivia';
      tieneCocinaPendiente = false;
      items = [
        {
          producto_id: '00000000-0000-4000-8000-000000000209',
          nombre: 'Bife Angosto Parrilla 350g',
          nota_cocina: 'Término medio',
          cantidad: 2,
          precio_unitario: 48.0,
          subtotal: 96.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000201',
          nombre: 'Lomo Saltado Criollo',
          cantidad: 2,
          precio_unitario: 38.0,
          subtotal: 76.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000210',
          nombre: 'Tacu Tacu con Sábana de Lomo',
          cantidad: 1,
          precio_unitario: 45.0,
          subtotal: 45.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000203',
          nombre: 'Chicha Morada Jarra 1L',
          cantidad: 2,
          precio_unitario: 16.0,
          subtotal: 32.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000211',
          nombre: 'Cerveza Cusqueña Trigo',
          cantidad: 3,
          precio_unitario: 12.0,
          subtotal: 36.0,
          estado_cocina: 'entregado',
        },
      ];
    } else {
      numeroComanda = 101;
      horaPedido = '01:20 PM';
      items = [
        {
          producto_id: '00000000-0000-4000-8000-000000000201',
          nombre: 'Lomo Saltado Criollo',
          cantidad: 1,
          precio_unitario: 38.0,
          subtotal: 38.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000203',
          nombre: 'Chicha Morada Jarra 1L',
          cantidad: 1,
          precio_unitario: 16.0,
          subtotal: 16.0,
          estado_cocina: 'entregado',
        },
        {
          producto_id: '00000000-0000-4000-8000-000000000212',
          nombre: 'Porción Tequeños de Queso (8 un)',
          cantidad: 1,
          precio_unitario: 10.0,
          subtotal: 10.0,
          estado_cocina: 'entregado',
        },
      ];
    }
    if (this.subcuentasPorMesa[mesaId]) {
      subcuentas = this.subcuentasPorMesa[mesaId];
    }

    const consumoBruto = Math.round(items.reduce((acc, it) => acc + it.subtotal, 0) * 100) / 100;
    const promoActivaId = this.promocionesPorMesa[mesaId] || null;

    let descuento = 0.0;
    if (promoActivaId === 'promo-almuerzo-15') {
      descuento = Math.round(consumoBruto * 0.15 * 100) / 100;
    } else if (promoActivaId === 'promo-chilcano-2x1') {
      descuento = Math.min(consumoBruto, 18.0);
    }

    const totalNeto = Math.round((consumoBruto - descuento) * 100) / 100;
    const baseImponible = Math.round((totalNeto / 1.18) * 100) / 100;
    const igv = Math.round((totalNeto - baseImponible) * 100) / 100;

    const tributacionSunat: DesgloseTributarioSUNATDTO = {
      consumo_bruto: consumoBruto,
      descuento_aplicado: descuento,
      total_neto: totalNeto,
      base_imponible: baseImponible,
      igv: igv,
      tasa_igv: 0.18,
    };

    const comisionTarjeta = Math.round(totalNeto * 0.035 * 100) / 100;
    const opcionesCobro: OpcionCobroPrecuentaDTO[] = [
      {
        metodo_pago_codigo: 'efectivo',
        metodo_pago_nombre: 'Efectivo',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
      },
      {
        metodo_pago_codigo: 'billetera_digital',
        metodo_pago_nombre: 'Yape / Plin',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
      },
      {
        metodo_pago_codigo: 'tarjeta',
        metodo_pago_nombre: 'Tarjeta POS',
        comision_porcentaje: 3.5,
        monto_comision: comisionTarjeta,
        total_estimado: Math.round((totalNeto + comisionTarjeta) * 100) / 100,
      },
    ];

    const promocionesDisponibles: PromocionAplicableDTO[] = PROMOCIONES_CATALOGO_MOCK.map((p) => {
      let ahorro = 0.0;
      if (p.tipo_descuento === 'porcentaje') {
        ahorro = Math.round(consumoBruto * (p.valor / 100) * 100) / 100;
      } else {
        ahorro = Math.min(consumoBruto, p.valor);
      }
      return {
        ...p,
        ahorro_calculado: ahorro,
        aplicada: p.id === promoActivaId,
      };
    });

    return {
      mesa_id: mesa.id,
      mesa_numero: mesa.numero,
      mesa_estado: mesa.estado,
      minutos_espera_cuenta: mesa.minutos_espera_cuenta,
      es_mesa_unida: mesa.numero.includes(';'),
      mozo_nombre: mozoNombre,
      comensales: mesa.comensales || 4,
      numero_comanda: numeroComanda,
      hora_pedido: horaPedido,
      items,
      tiene_cocina_pendiente: tieneCocinaPendiente,
      alerta_cocina: alertaCocina,
      promociones_disponibles: promocionesDisponibles,
      promocion_activa_id: promoActivaId,
      tributacion_sunat: tributacionSunat,
      opciones_cobro: opcionesCobro,
      subcuentas,
      generada_at: new Date().toISOString(),
    };
  }

  private ultimoReporteZ: ReporteZDTO | null = null;

  /**
   * Obtiene el balance operativo previo al arqueo de caja (GET /api/v1/caja/turnos/actual/balance-cierre)
   */
  async getBalancePreArqueo(): Promise<ApiResponse<BalancePreArqueoDTO>> {
    await new Promise((r) => setTimeout(r, 70));

    const turno = this.turnoActivo || {
      id: '00000000-0000-4000-8000-000000000542',
      local_id: CANONICAL_LOCAL_ID,
      cajero_id: CAJERO_ACTUAL_MOCK.id,
      cajero_nombre: CAJERO_ACTUAL_MOCK.nombre,
      cajero_rol: CAJERO_ACTUAL_MOCK.rol,
      correlativo: 42,
      monto_apertura: 300.0,
      estado: 'abierta' as const,
      fecha_apertura: '2026-10-15T11:30:00Z',
      total_ventas: 15,
      monto_ventas: 1485.0,
      efectivo_actual: 300.0,
    };

    const mesasPendientes = this.mesas.filter((m) => m.estado !== 'libre').length;
    const salonAlDia = mesasPendientes === 0;

    const montoApertura = turno.monto_apertura;
    const ingresosEfectivo = 85.0;
    const egresosDevolucionNC = 85.0;
    const efectivoEsperado = Math.round((montoApertura + ingresosEfectivo - egresosDevolucionNC) * 100) / 100;

    return {
      exito: true,
      datos: {
        caja_id: turno.id,
        turno_correlativo: turno.correlativo,
        cajero_nombre: turno.cajero_nombre,
        cajero_rol: turno.cajero_rol || 'Cajero Titular (Turno Tarde)',
        fecha_apertura: turno.fecha_apertura,
        monto_apertura: montoApertura,
        ingresos_efectivo: ingresosEfectivo,
        egresos_devolucion_nc: egresosDevolucionNC,
        efectivo_esperado: efectivoEsperado,
        tarjetas_pos_total: 245.0,
        tarjetas_operaciones: 1,
        billeteras_total: 54.0,
        otros_cobros_total: 1186.0,
        total_facturado_neto: 1485.0,
        base_imponible: 1258.47,
        igv_18: 226.53,
        total_comprobantes: 15,
        mesas_activas_pendientes: mesasPendientes,
        salon_al_dia: salonAlDia,
        sede_nombre: CANONICAL_LOCAL_NOMBRE,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Cierra formalmente el turno de caja (POST /api/v1/caja/turnos/actual/cerrar)
   * Valida monto físico, justificación obligatoria si hay discrepancia y ausencia de mesas activas
   */
  async cerrarTurno(req: CerrarCajaRequest): Promise<ApiResponse<ReporteZDTO>> {
    await new Promise((r) => setTimeout(r, 140));

    if (typeof req.monto_real_fisico !== 'number' || isNaN(req.monto_real_fisico) || req.monto_real_fisico < 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MONTO_REAL_INVALIDO',
            mensaje: 'El importe físico contado no puede ser negativo ni contener caracteres inválidos.',
          },
        ],
      };
    }

    const mesasPendientes = this.mesas.filter((m) => m.estado !== 'libre').length;
    if (mesasPendientes > 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_SALON_CON_MESAS_ACTIVAS',
            mensaje: `No se puede cerrar caja: existen ${mesasPendientes} mesas con pedidos activos pendientes de cobro en el salón.`,
          },
        ],
      };
    }

    const turno = this.turnoActivo || {
      id: '00000000-0000-4000-8000-000000000542',
      local_id: CANONICAL_LOCAL_ID,
      cajero_id: CAJERO_ACTUAL_MOCK.id,
      cajero_nombre: CAJERO_ACTUAL_MOCK.nombre,
      cajero_rol: CAJERO_ACTUAL_MOCK.rol,
      correlativo: 42,
      monto_apertura: 300.0,
      estado: 'abierta' as const,
      fecha_apertura: '2026-10-15T11:30:00Z',
    };

    const efectivoEsperado = 300.0;
    const discrepancia = Math.round((req.monto_real_fisico - efectivoEsperado) * 100) / 100;

    // Validación de negocio RN-CAJA-08: comentario obligatorio si dif != 0 (mínimo 10 caracteres)
    if (discrepancia !== 0) {
      if (!req.comentario_discrepancia || req.comentario_discrepancia.trim().length < 10) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_DISCREPANCIA_SIN_JUSTIFICAR',
              mensaje:
                'Existe una diferencia entre el efectivo real y el esperado; el comentario justificativo es obligatorio (mínimo 10 caracteres).',
            },
          ],
        };
      }
    }

    const fechaCierre = new Date().toISOString();
    const duracionStr = '8h 15m 07s';

    const reporteZ: ReporteZDTO = {
      caja_id: turno.id,
      turno_correlativo: turno.correlativo,
      local_nombre: CANONICAL_LOCAL_NOMBRE,
      empresa_ruc: '20609876543',
      cajero_nombre: turno.cajero_nombre,
      fecha_apertura: turno.fecha_apertura,
      fecha_cierre: fechaCierre,
      duracion_turno: duracionStr,
      monto_apertura: turno.monto_apertura,
      efectivo_esperado: efectivoEsperado,
      efectivo_real_contado: req.monto_real_fisico,
      discrepancia: discrepancia,
      comentario_discrepancia: req.comentario_discrepancia?.trim() || undefined,
      total_ventas_efectivo: 85.0,
      total_tarjetas_pos: 245.0,
      total_billeteras_digital: 54.0,
      otros_medios_total: 1186.0,
      total_neto_facturado: 1485.0,
      base_imponible_gravada: 1258.47,
      igv_18: 226.53,
      boletas_emitidas: 11,
      facturas_emitidas: 3,
      notas_venta_emitidas: 1,
      notas_credito_emitidas: 1,
      comprobantes_anulados: 1,
      notas_cierre: req.notas_cierre?.trim() || 'Turno entregado sin novedades. Fondo S/ 300 listo en gaveta.',
      url_descarga_pdf: `/api/v1/caja/turnos/${turno.id}/reporte-z/pdf`,
    };

    // Actualizar estado de servicio
    this.ultimoReporteZ = reporteZ;
    this.ultimoTurno = {
      ...turno,
      estado: 'cerrada',
      fecha_cierre: fechaCierre,
      monto_esperado: efectivoEsperado,
      monto_real: req.monto_real_fisico,
      discrepancia: discrepancia,
      comentario_discrepancia: req.comentario_discrepancia || null,
      notas_cierre: req.notas_cierre || null,
    };
    this.turnoActivo = null; // Libera uq_caja_abierta_local en PostgreSQL
    this.correlativoContador = turno.correlativo + 1; // Siguiente turno será #043

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(reporteZ)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene el último Reporte Z generado en la sesión
   */
  async getUltimoReporteZ(): Promise<ApiResponse<ReporteZDTO | null>> {
    await new Promise((r) => setTimeout(r, 40));
    return {
      exito: true,
      datos: this.ultimoReporteZ ? JSON.parse(JSON.stringify(this.ultimoReporteZ)) : null,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // =========================================================================
  // Herramientas QA para probar todos los estados del CU-CAJA-01 y CU-CAJA-05
  // =========================================================================

  /**
   * QA Helper: Simular que la caja está cerrada y lista para apertura (Vista 1)
   */
  simularCajaCerradaQA(): void {
    this.turnoActivo = null;
    this.mesas = JSON.parse(JSON.stringify(SEMILLAS_MESAS_CAJA));
  }

  /**
   * QA Helper: Provocar conflicto 409 (Turno previo de Juan Pérez sin cerrar - Vista 2)
   */
  simularTurnoPrevioAbiertoQA(): void {
    this.turnoActivo = {
      id: '00000000-0000-4000-8000-000000000541',
      local_id: CANONICAL_LOCAL_ID,
      cajero_id: CAJERO_PREVIO_MOCK.id,
      cajero_nombre: CAJERO_PREVIO_MOCK.nombre,
      cajero_rol: CAJERO_PREVIO_MOCK.rol,
      correlativo: 41,
      monto_apertura: 250.0,
      notas_apertura: 'Fondo de apertura entregado en sencillo para mañana.',
      estado: 'abierta',
      fecha_apertura: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Hace 5 horas
      fecha_cierre: null,
      monto_esperado: 2730.0,
      monto_real: null,
      discrepancia: null,
      total_ventas: 24,
      monto_ventas: 2480.0,
      efectivo_actual: 2730.0,
    };
  }

  /**
   * QA Helper: Simular turno activo de Carlos Mendoza con POS desbloqueado (Vista 3)
   */
  simularTurnoAbiertoOperativoQA(): void {
    this.turnoActivo = {
      id: '00000000-0000-4000-8000-000000000542',
      local_id: CANONICAL_LOCAL_ID,
      cajero_id: CAJERO_ACTUAL_MOCK.id,
      cajero_nombre: CAJERO_ACTUAL_MOCK.nombre,
      cajero_rol: CAJERO_ACTUAL_MOCK.rol,
      correlativo: 42,
      monto_apertura: 300.0,
      notas_apertura: 'Fondo recibido en sobre cerrado de administración.',
      estado: 'abierta',
      fecha_apertura: new Date().toISOString(),
      fecha_cierre: null,
      total_ventas: 0,
      monto_ventas: 0.0,
      efectivo_actual: 300.0,
    };
    this.mesas = JSON.parse(JSON.stringify(SEMILLAS_MESAS_CAJA));
    this.promocionesPorMesa = {};
  }

  /**
   * Notifica a la administradora de la sede sobre la caja bloqueada
   */
  async notificarAdministradorCajaBloqueada(_cajeroNombre: string): Promise<ApiResponse<{ notificado: boolean; admin_nombre: string; telefono: string }>> {
    await new Promise((r) => setTimeout(r, 60));
    return {
      exito: true,
      datos: {
        notificado: true,
        admin_nombre: 'Mariana Ramos',
        telefono: '+51 987 654 321',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * QA Helper: Simula que la Administradora Mariana Ramos ejecuta el cierre de caja en CU-ADMIN-14
   */
  simularCierreDesdeCuAdmin14QA(): void {
    if (this.turnoActivo) {
      this.ultimoTurno = {
        ...this.turnoActivo,
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_real: this.turnoActivo.efectivo_actual || 2730.0,
        notas_cierre: 'Cierre forzado y supervisado por Administradora Mariana Ramos en CU-ADMIN-14',
      };
      this.turnoActivo = null;
    }
  }

  /**
   * QA Helper: Supervisor/Admin fuerza el cierre del turno previo no cerrado (alias de CU-ADMIN-14)
   */
  forzarCierreTurnoPrevioQA(): void {
    this.simularCierreDesdeCuAdmin14QA();
  }

  /**
   * QA Helper: Simula salón al día (todas las mesas libres) para permitir arqueo en CU-CAJA-05
   */
  simularSalonAlDiaQA(): void {
    this.mesas = this.mesas.map((m) => ({
      ...m,
      estado: 'libre',
      total_consumo: 0.0,
      mozo_nombre: undefined,
      comensales: undefined,
      pedido_id: undefined,
      minutos_espera_cuenta: undefined,
    }));
  }

  /**
   * QA Helper: Simula salón con mesas pendientes para probar el bloqueo Poka-Yoke en CU-CAJA-05
   */
  simularSalonConMesasPendientesQA(): void {
    this.mesas = JSON.parse(JSON.stringify(SEMILLAS_MESAS_CAJA));
  }

  /**
   * QA Helper: Restablece semillas para el cierre de turno CU-CAJA-05
   */
  restablecerSemillasCierreQA(): void {
    this.simularTurnoAbiertoOperativoQA();
    this.simularSalonAlDiaQA();
    this.ultimoReporteZ = null;
  }

  /**
   * QA Helper: Restablece semillas a estado inicial
   */
  restablecerSemillasCajaQA(): void {
    this.turnoActivo = null;
    this.correlativoContador = 42;
    this.mesas = JSON.parse(JSON.stringify(SEMILLAS_MESAS_CAJA));
    this.promocionesPorMesa = {};
    this.subcuentasPorMesa = {};
    this.ultimoReporteZ = null;
  }
}

export const mockCajaService = new MockCajaService();
