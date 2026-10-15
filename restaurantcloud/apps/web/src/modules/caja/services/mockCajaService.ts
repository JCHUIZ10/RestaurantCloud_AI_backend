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
} from '@/types/caja';
import { CANONICAL_LOCAL_ID, CANONICAL_LOCAL_NOMBRE } from '@/modules/admin/services/mockAdminService';

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

const SEMILLAS_MESAS_CAJA: MesaCajaMonitorDTO[] = [
  {
    id: 'm-caja-004',
    numero: '04',
    piso_nombre: 'Salón Principal',
    estado: 'cuenta_pedida',
    mozo_nombre: 'Carlos M.',
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
  private mesas: MesaCajaMonitorDTO[] = JSON.parse(JSON.stringify(SEMILLAS_MESAS_CAJA));

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
   * Simulación de cobro rápido de una mesa para demostrar que el POS está desbloqueado
   */
  async cobrarMesaMock(mesaId: string): Promise<ApiResponse<{ mesa_numero: string; total_cobrado: number }>> {
    await new Promise((r) => setTimeout(r, 80));

    const index = this.mesas.findIndex((m) => m.id === mesaId);
    if (index === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada en la sala' }],
      };
    }

    const mesa = this.mesas[index];
    const monto = mesa.total_consumo;

    // Liberar mesa en el monitor
    this.mesas[index] = {
      ...mesa,
      estado: 'libre',
      total_consumo: 0.0,
      comensales: undefined,
      mozo_nombre: undefined,
      pedido_id: undefined,
      minutos_espera_cuenta: undefined,
    };

    // Actualizar ventas del turno activo
    if (this.turnoActivo) {
      this.turnoActivo.total_ventas = (this.turnoActivo.total_ventas || 0) + 1;
      this.turnoActivo.monto_ventas = Math.round(((this.turnoActivo.monto_ventas || 0) + monto) * 100) / 100;
      this.turnoActivo.efectivo_actual =
        Math.round(((this.turnoActivo.efectivo_actual || this.turnoActivo.monto_apertura) + monto) * 100) / 100;
    }

    return {
      exito: true,
      datos: {
        mesa_numero: mesa.numero,
        total_cobrado: monto,
      },
      meta: { timestamp: new Date().toISOString() },
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
    this.ultimoReporteZ = null;
  }
}

export const mockCajaService = new MockCajaService();
