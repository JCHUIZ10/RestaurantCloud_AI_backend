/**
 * Servicio Mock y Motor de Datos para Supervisión de Tenants SaaS (CU-SAAS-01)
 *
 * Implementa:
 * - Algoritmo matemático local de Módulo 11 para validación de RUC SUNAT Perú (cero APIs externas).
 * - Semillas canónicas basadas en 06_seed_initial_data.sql y 07_seed_local_aurea_completo.sql.
 * - Recálculo determinista de métricas KPI y MRR.
 * - Registro atómico de altas manuales con pago verificado en la tabla 'pago'.
 * - Persistencia local sincronizada en localStorage ('saas_tenants_db').
 */

import type {
  TenantItemDTO,
  TenantDetailResponseDTO,
  MetricasSaaSResumenDTO,
  ParametrosFiltroTenants,
  TenantListApiResponse,
  TenantDetailApiResponse,
  AltaManualTenantRequestDTO,
  AltaManualTenantApiResponse,
  PagoHistorialItemDTO,
} from '@/types/saasTenants';
import type { ApiResponse } from '@/types/api';

const STORAGE_KEY = 'restaurantcloud_saas_tenants_v1';

/**
 * Validador oficial del algoritmo Módulo 11 para RUC peruano (11 dígitos).
 * No realiza peticiones a SUNAT ni ApiPerú, garantizando respuesta en < 1ms.
 */
export function validarRucModulo11(ruc: string): {
  valido: boolean;
  mensaje?: string;
  tipo?: 'RUC_20' | 'RUC_10';
  tipoLabel?: string;
} {
  const rucLimpio = ruc.trim().replace(/\D/g, '');

  if (rucLimpio.length !== 11) {
    return { valido: false, mensaje: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
  }

  const prefijo = rucLimpio.substring(0, 2);
  let tipo: 'RUC_20' | 'RUC_10';
  let tipoLabel: string;

  if (prefijo === '20') {
    tipo = 'RUC_20';
    tipoLabel = 'RUC 20 — Persona Jurídica (Empresa)';
  } else if (prefijo === '10' || prefijo === '15' || prefijo === '17') {
    tipo = 'RUC_10';
    tipoLabel = 'RUC 10 — Persona Natural con Negocio';
  } else {
    return { valido: false, mensaje: 'El prefijo del RUC debe iniciar con 10, 15, 17 o 20.' };
  }

  // Factores de ponderación para Módulo 11 SUNAT
  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(rucLimpio.charAt(i), 10) * factores[i];
  }

  const residuo = 11 - (suma % 11);
  let digitoVerificadorEsperado = residuo;
  if (residuo === 10) digitoVerificadorEsperado = 0;
  if (residuo === 11) digitoVerificadorEsperado = 1;

  const digitoReal = parseInt(rucLimpio.charAt(10), 10);

  if (digitoReal !== digitoVerificadorEsperado) {
    return {
      valido: false,
      mensaje: `Dígito verificador inválido. Se esperaba ${digitoVerificadorEsperado} pero se ingresó ${digitoReal}.`,
    };
  }

  return { valido: true, tipo, tipoLabel };
}

/**
 * Semillas iniciales canónicas de tenants de la plataforma
 */
const SEMILLAS_TENANTS: TenantItemDTO[] = [
  {
    empresa_id: '00000000-0000-4000-8000-000000000001',
    codigo_display: 'EMP-001AUREA',
    razon_social: 'Restaurante ÁUREA S.A.C.',
    nombre_comercial_sede: 'ÁUREA Miraflores',
    ruc: '20612345678',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 2,
    plan_nombre: 'Plan Pro',
    locales_activos: 2,
    estado_suscripcion: 'activa',
    dias_gracia_restantes: 5,
    dia_gracia_actual: 1,
    fecha_proximo_cobro: '2026-11-01T00:00:00Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Visa •••• 4242',
    origen_alta: 'manual_admin',
    fecha_registro: '2026-08-15T14:30:00Z',
  },
  {
    empresa_id: 'e1010101-1234-5678-9abc-000000000002',
    codigo_display: 'EMP-002BRAS',
    razon_social: 'Pollería Las Brasas S.A.C.',
    nombre_comercial_sede: 'Las Brasas San Isidro',
    ruc: '20491823012',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 2,
    plan_nombre: 'Plan Pro',
    locales_activos: 3,
    estado_suscripcion: 'activa',
    dias_gracia_restantes: 5,
    dia_gracia_actual: 1,
    fecha_proximo_cobro: '2026-10-20T23:59:00Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Visa •••• 1881',
    origen_alta: 'autoservicio_stripe',
    fecha_registro: '2026-07-10T10:00:00Z',
  },
  {
    empresa_id: 'e9a8b7c6-1234-5678-9abc-def012345678',
    codigo_display: 'EMP-004TENE',
    razon_social: 'El Tenedor Gourmet S.A.C.',
    nombre_comercial_sede: 'El Tenedor Miraflores',
    ruc: '20601234567',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 2,
    plan_nombre: 'Plan Pro',
    locales_activos: 2,
    estado_suscripcion: 'periodo_gracia',
    dias_gracia_restantes: 4, // 6 - 4 = Día 2 de 5
    dia_gracia_actual: 2,
    fecha_proximo_cobro: '2026-10-09T22:30:00Z',
    fecha_corte_gracia: '2026-10-14T23:59:59Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Visa •••• 4242',
    origen_alta: 'autoservicio_stripe',
    fecha_registro: '2026-09-15T18:45:00Z',
  },
  {
    empresa_id: 'f3030303-1234-5678-9abc-000000000004',
    codigo_display: 'EMP-005TRAT',
    razon_social: 'Trattoria Bella Italia E.I.R.L.',
    nombre_comercial_sede: 'Bella Italia Chacarilla',
    ruc: '20102938475',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 3,
    plan_nombre: 'Enterprise',
    locales_activos: 5,
    estado_suscripcion: 'activa',
    dias_gracia_restantes: 5,
    dia_gracia_actual: 1,
    fecha_proximo_cobro: '2026-10-28T00:00:00Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Mastercard •••• 9920',
    origen_alta: 'autoservicio_stripe',
    fecha_registro: '2026-05-02T12:00:00Z',
  },
  {
    empresa_id: 'b4040404-1234-5678-9abc-000000000005',
    codigo_display: 'EMP-006BIST',
    razon_social: 'Café Bistró Francés S.A.C.',
    nombre_comercial_sede: 'Bistró Barranco',
    ruc: '20601928472',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 1,
    plan_nombre: 'Starter',
    locales_activos: 1,
    estado_suscripcion: 'periodo_gracia',
    dias_gracia_restantes: 2, // 6 - 2 = Día 4 de 5
    dia_gracia_actual: 4,
    fecha_proximo_cobro: '2026-10-07T15:00:00Z',
    fecha_corte_gracia: '2026-10-12T23:59:59Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Amex •••• 3001',
    origen_alta: 'autoservicio_stripe',
    fecha_registro: '2026-06-20T09:15:00Z',
  },
  {
    empresa_id: 'c5050505-1234-5678-9abc-000000000006',
    codigo_display: 'EMP-007RUST',
    razon_social: 'Rústika Burger Bar S.A.C.',
    nombre_comercial_sede: 'Rústika Surco',
    ruc: '20394819201',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 2,
    plan_nombre: 'Plan Pro',
    locales_activos: 2,
    estado_suscripcion: 'suspendida',
    dias_gracia_restantes: 0,
    dia_gracia_actual: 5,
    fecha_proximo_cobro: '2026-10-01T00:00:00Z',
    fecha_corte_gracia: '2026-10-06T23:59:59Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Visa •••• 0049',
    origen_alta: 'autoservicio_stripe',
    fecha_registro: '2026-04-12T11:20:00Z',
  },
  {
    empresa_id: 'd6060606-1234-5678-9abc-000000000007',
    codigo_display: 'EMP-008CHIN',
    razon_social: 'Sanguchería El Chinito S.A.C.',
    nombre_comercial_sede: 'El Chinito Centro',
    ruc: '20481920394',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 2,
    plan_nombre: 'Plan Pro',
    locales_activos: 3,
    estado_suscripcion: 'activa',
    dias_gracia_restantes: 5,
    dia_gracia_actual: 1,
    fecha_proximo_cobro: '2026-10-23T00:00:00Z',
    origen_pago_tipo: 'transferencia_bancaria',
    metodo_pago_detalle: 'BCP Cta. Cte.',
    origen_alta: 'manual_admin',
    fecha_registro: '2026-03-01T16:00:00Z',
  },
  {
    empresa_id: 'a7070707-1234-5678-9abc-000000000008',
    codigo_display: 'EMP-009NAPO',
    razon_social: 'Pizzería Bella Napoli S.A.C.',
    nombre_comercial_sede: 'Bella Napoli Magdalena',
    ruc: '20519283019',
    tipo_identidad_fiscal: 'RUC_20',
    plan_id: 1,
    plan_nombre: 'Starter',
    locales_activos: 1,
    estado_suscripcion: 'pendiente_baja',
    dias_gracia_restantes: 5,
    dia_gracia_actual: 1,
    fecha_proximo_cobro: '2026-09-30T23:59:00Z',
    origen_pago_tipo: 'stripe',
    metodo_pago_detalle: 'Visa •••• 5551',
    origen_alta: 'autoservicio_stripe',
    fecha_registro: '2026-02-14T08:30:00Z',
  },
];

class MockSaasTenantsService {
  private getTenantsFromStorage(): TenantItemDTO[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading saas tenants storage:', e);
    }
    this.saveTenantsToStorage(SEMILLAS_TENANTS);
    return SEMILLAS_TENANTS;
  }

  private saveTenantsToStorage(tenants: TenantItemDTO[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
    } catch (e) {
      console.warn('Error saving saas tenants to storage:', e);
    }
  }

  /**
   * Recalcula métricas consolidadas en base a los tenants activos
   */
  public calcularMetricas(tenants: TenantItemDTO[]): MetricasSaaSResumenDTO {
    const total_empresas = tenants.length;
    let mrr_total = 0;
    let mrr_en_riesgo = 0;
    let activas = 0;
    let en_gracia = 0;
    let suspendidas = 0;
    let sedes_totales = 0;

    for (const t of tenants) {
      sedes_totales += t.locales_activos;
      let precioMensual = 249; // Default Pro
      if (t.plan_id === 1) precioMensual = 99;
      if (t.plan_id === 3) precioMensual = 499;

      if (t.estado_suscripcion === 'activa') {
        activas++;
        mrr_total += precioMensual;
      } else if (t.estado_suscripcion === 'periodo_gracia') {
        en_gracia++;
        mrr_en_riesgo += precioMensual;
        mrr_total += precioMensual;
      } else if (t.estado_suscripcion === 'suspendida') {
        suspendidas++;
      }
    }

    const promedio = total_empresas > 0 ? Number((sedes_totales / total_empresas).toFixed(1)) : 0;

    return {
      total_empresas,
      nuevas_empresas_este_mes: 4,
      mrr_total_pen: mrr_total,
      suscripciones_activas: activas,
      suscripciones_en_gracia: en_gracia,
      mrr_en_riesgo_pen: mrr_en_riesgo,
      suscripciones_suspendidas: suspendidas,
      sedes_operativas_totales: sedes_totales,
      promedio_sedes_por_tenant: promedio,
    };
  }

  /**
   * Lista tenants aplicando filtros de pestañas, búsqueda y plan
   */
  public async listarTenants(filtros: ParametrosFiltroTenants): Promise<TenantListApiResponse> {
    await new Promise((r) => setTimeout(r, 200)); // Latencia realista
    const todos = this.getTenantsFromStorage();

    let filtrados = todos;

    // 1. Filtro por pestaña de estado
    if (filtros.tab_estado && filtros.tab_estado !== 'todos') {
      filtrados = filtrados.filter((t) => t.estado_suscripcion === filtros.tab_estado);
    }

    // 2. Filtro por plan
    if (filtros.plan_id && filtros.plan_id !== 'todos') {
      filtrados = filtrados.filter((t) => t.plan_id === filtros.plan_id);
    }

    // 3. Filtro por buscador (RUC, Razón Social, Nombre Comercial)
    if (filtros.buscar && filtros.buscar.trim()) {
      const q = filtros.buscar.trim().toLowerCase();
      filtrados = filtrados.filter(
        (t) =>
          t.razon_social.toLowerCase().includes(q) ||
          t.ruc.includes(q) ||
          (t.nombre_comercial_sede && t.nombre_comercial_sede.toLowerCase().includes(q)) ||
          t.codigo_display.toLowerCase().includes(q)
      );
    }

    const metricas = this.calcularMetricas(todos);

    return {
      exito: true,
      datos: {
        metricas,
        tenants: filtrados,
        total_filas: filtrados.length,
        pagina: filtros.pagina ?? 1,
        total_paginas: 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        total: filtrados.length,
      },
    };
  }

  /**
   * Obtiene el expediente 360° detallado de un tenant
   */
  public async obtenerExpedienteTenant(empresaId: string): Promise<TenantDetailApiResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const todos = this.getTenantsFromStorage();
    const t = todos.find((item) => item.empresa_id === empresaId);

    if (!t) {
      return {
        exito: false,
        datos: null as unknown as TenantDetailResponseDTO,
        errores: [{ codigo: 'ERR_TENANT_NOT_FOUND', mensaje: 'Empresa no encontrada.' }],
      };
    }

    // Historial simulado de pagos para la empresa
    const historial_pagos: PagoHistorialItemDTO[] = [
      {
        id: 'p-01-' + t.empresa_id.slice(0, 8),
        comprobante_codigo: 'REC-RENOV-02',
        fecha: t.estado_suscripcion === 'periodo_gracia' ? '2026-10-09T22:30:00Z' : '2026-10-01T10:00:00Z',
        monto_pen: t.plan_id === 1 ? 99.0 : t.plan_id === 2 ? 249.0 : 499.0,
        origen_pago: t.origen_pago_tipo,
        medio_detalle: t.metodo_pago_detalle,
        estado: t.estado_suscripcion === 'periodo_gracia' ? 'fallido' : 'exitoso',
        stripe_payment_id: 'ch_3MzaBc2eZvKYlo2C99',
        numero_operacion: t.origen_pago_tipo === 'transferencia_bancaria' ? 'OP-90481239-BCP' : undefined,
        nota:
          t.estado_suscripcion === 'periodo_gracia'
            ? 'Fondos insuficientes reportados por el banco emisor.'
            : 'Renovación mensual regularizada satisfactoriamente.',
      },
      {
        id: 'p-02-' + t.empresa_id.slice(0, 8),
        comprobante_codigo: 'REC-ALTA-01',
        fecha: t.fecha_registro,
        monto_pen: t.plan_id === 1 ? 99.0 : t.plan_id === 2 ? 249.0 : 499.0,
        origen_pago: t.origen_pago_tipo,
        medio_detalle: t.metodo_pago_detalle,
        estado: 'exitoso',
        stripe_payment_id: 'ch_3MxyZ82eZvKYlo1A00',
        numero_operacion: t.origen_pago_tipo === 'transferencia_bancaria' ? 'OP-11223344-BCP' : undefined,
        nota: 'Cargo inicial por activación de suscripción.',
      },
    ];

    const consumo = {
      locales_actuales: t.locales_activos,
      locales_limite: t.plan_id === 1 ? 1 : t.plan_id === 2 ? 3 : 10,
      mesas_actuales: t.locales_activos * 14,
      mesas_limite: t.plan_id === 1 ? 25 : t.plan_id === 2 ? 30 : 60,
      usuarios_actuales: t.locales_activos * 4,
      usuarios_limite: t.plan_id === 1 ? 5 : t.plan_id === 2 ? 15 : 40,
    };

    const detalle: TenantDetailResponseDTO = {
      empresa_id: t.empresa_id,
      codigo_display: t.codigo_display,
      ruc: t.ruc,
      tipo_contribuyente_label:
        t.tipo_identidad_fiscal === 'RUC_20'
          ? 'RUC 20 — Persona Jurídica (Empresa)'
          : 'RUC 10 — Persona Natural con Negocio',
      razon_social: t.razon_social,
      direccion_sede_principal:
        t.nombre_comercial_sede === 'ÁUREA Miraflores'
          ? 'Av. Larco 450, Miraflores, Lima'
          : 'Av. Mariscal La Mar 1285, Miraflores, Lima',
      telefono_contacto: '+51 1 445-8920',
      correo_contacto: 'contacto@' + t.razon_social.toLowerCase().replace(/[^a-z]/g, '') + '.pe',
      propietario_titular: {
        nombre:
          t.nombre_comercial_sede === 'ÁUREA Miraflores' ? 'Rodrigo De Las Casas' : 'Manuel García Mendoza',
        correo:
          t.nombre_comercial_sede === 'ÁUREA Miraflores' ? 'propietario@aurea.local' : 'mgarcia@eltenedor.pe',
        telefono: '+51 987 654 321',
        activo: t.estado_suscripcion !== 'suspendida',
      },
      plan: {
        id: t.plan_id,
        nombre: t.plan_nombre,
        precio_mensual: t.plan_id === 1 ? 99.0 : t.plan_id === 2 ? 249.0 : 499.0,
        ciclo: 'mensual',
      },
      estado_suscripcion: t.estado_suscripcion,
      dias_gracia_restantes: t.dias_gracia_restantes,
      dia_gracia_actual: t.dia_gracia_actual,
      fecha_registro: t.fecha_registro,
      fecha_proximo_cobro: t.fecha_proximo_cobro,
      fecha_corte_gracia: t.fecha_corte_gracia,
      stripe_customer_id: t.origen_pago_tipo === 'stripe' ? 'cus_Q8x9L2k1mP09' : null,
      stripe_subscription_id: t.origen_pago_tipo === 'stripe' ? 'sub_1N9a8b2c4e5f6' : null,
      metodo_pago_detalle: t.metodo_pago_detalle,
      origen_alta: t.origen_alta,
      historial_pagos,
      consumo,
    };

    return {
      exito: true,
      datos: detalle,
    };
  }

  /**
   * Reenvía notificación de cobro con capability token al titular
   */
  public async reenviarNotificacionCobro(
    empresaId: string
  ): Promise<ApiResponse<{ mensaje: string; correo: string }>> {
    await new Promise((r) => setTimeout(r, 200));
    const todos = this.getTenantsFromStorage();
    const t = todos.find((x) => x.empresa_id === empresaId);
    if (!t) {
      return {
        exito: false,
        datos: { mensaje: 'Empresa no encontrada', correo: '' },
        errores: [{ codigo: 'NOT_FOUND', mensaje: 'Empresa no encontrada' }],
      };
    }

    return {
      exito: true,
      datos: {
        mensaje: `Recordatorio de cobro despachado al titular con capability token activo por 72h.`,
        correo: 'propietario@' + t.razon_social.toLowerCase().replace(/[^a-z]/g, '') + '.pe',
      },
    };
  }

  /**
   * Suspende preventivamente una empresa
   */
  public async suspenderEmpresaPreventiva(
    empresaId: string,
    motivo: string
  ): Promise<ApiResponse<{ empresa_id: string; estado: string }>> {
    await new Promise((r) => setTimeout(r, 200));
    const todos = this.getTenantsFromStorage();
    const index = todos.findIndex((x) => x.empresa_id === empresaId);
    if (index === -1) {
      return {
        exito: false,
        datos: { empresa_id: empresaId, estado: '' },
        errores: [{ codigo: 'NOT_FOUND', mensaje: 'Empresa no encontrada' }],
      };
    }

    todos[index].estado_suscripcion = 'suspendida';
    todos[index].dias_gracia_restantes = 0;
    this.saveTenantsToStorage(todos);

    console.info(`[SAAS] Empresa ${empresaId} suspendida preventivamente. Motivo: ${motivo}`);

    return {
      exito: true,
      datos: { empresa_id: empresaId, estado: 'suspendida' },
    };
  }

  /**
   * Registra una nueva empresa corporativa B2B con pago verificado en la tabla 'pago'
   */
  public async registrarAltaManualB2B(
    request: AltaManualTenantRequestDTO
  ): Promise<AltaManualTenantApiResponse> {
    await new Promise((r) => setTimeout(r, 300));

    // Validación Módulo 11 en Backend/Servicio
    const valRuc = validarRucModulo11(request.ruc);
    if (!valRuc.valido) {
      return {
        exito: false,
        datos: null as unknown as any,
        errores: [{ codigo: 'ERR_RUC_INVALIDO', mensaje: valRuc.mensaje ?? 'RUC Inválido' }],
      };
    }

    // Regla de integridad contable: El pago debe ser verificado y con monto > 0
    if (request.monto_cobrado_pen <= 0) {
      return {
        exito: false,
        datos: null as unknown as any,
        errores: [
          {
            codigo: 'ERR_PAGO_REQUERIDO',
            mensaje: 'No se admiten altas manuales sin respaldo económico. El monto debe ser mayor a 0.',
          },
        ],
      };
    }

    if (!request.numero_operacion || request.numero_operacion.trim().length < 4) {
      return {
        exito: false,
        datos: null as unknown as any,
        errores: [
          {
            codigo: 'ERR_OPERACION_REQUERIDA',
            mensaje: 'El número de operación bancaria es obligatorio para asentar el pago.',
          },
        ],
      };
    }

    const uuid = 'corp-' + Math.random().toString(36).substring(2, 10);
    const planNombres: Record<number, string> = { 1: 'Starter', 2: 'Plan Pro', 3: 'Enterprise' };

    const nuevoTenant: TenantItemDTO = {
      empresa_id: uuid,
      codigo_display: 'EMP-' + request.ruc.substring(3, 8).toUpperCase(),
      razon_social: request.razon_social,
      nombre_comercial_sede: request.razon_social.split(' ')[0] + ' Sede Principal',
      ruc: request.ruc,
      tipo_identidad_fiscal: valRuc.tipo ?? 'RUC_20',
      plan_id: request.plan_id,
      plan_nombre: planNombres[request.plan_id] || 'Plan Pro',
      locales_activos: 1,
      estado_suscripcion: 'activa',
      dias_gracia_restantes: 5,
      dia_gracia_actual: 1,
      fecha_proximo_cobro: request.fecha_fin_periodo,
      origen_pago_tipo: request.origen_pago,
      metodo_pago_detalle: `${request.origen_pago.replace('_', ' ').toUpperCase()} (${request.numero_operacion})`,
      origen_alta: 'manual_admin',
      fecha_registro: new Date().toISOString(),
    };

    const todos = this.getTenantsFromStorage();
    todos.unshift(nuevoTenant);
    this.saveTenantsToStorage(todos);

    return {
      exito: true,
      datos: {
        empresa_id: uuid,
        codigo_display: nuevoTenant.codigo_display,
        usuario_id: 'usr-' + uuid.slice(0, 6),
        pago_id: 'pag-' + uuid.slice(0, 6),
        email_enviado: request.enviar_email_bienvenida,
        mensaje: `Empresa ${request.razon_social} registrada con éxito. Pago asentado bajo operación ${request.numero_operacion}.`,
      },
    };
  }

  // =========================================================================
  // Controladores Sandbox QA para pruebas de demostración
  // =========================================================================

  /**
   * Conmuta a Estado Vacío en Gracia (Vista 4)
   */
  public vaciarPeriodoGracia(): void {
    const todos = this.getTenantsFromStorage();
    for (const t of todos) {
      if (t.estado_suscripcion === 'periodo_gracia') {
        t.estado_suscripcion = 'activa';
        t.dias_gracia_restantes = 5;
        t.dia_gracia_actual = 1;
      }
    }
    this.saveTenantsToStorage(todos);
  }

  /**
   * Fuerza el estado de último día de gracia (Día 5/5) para probar alerta urgente
   */
  public forzarCasoDia5Gracia(): void {
    const todos = this.getTenantsFromStorage();
    if (todos.length > 0) {
      todos[0].estado_suscripcion = 'periodo_gracia';
      todos[0].dias_gracia_restantes = 1; // 6 - 1 = Día 5 de 5
      todos[0].dia_gracia_actual = 5;
      todos[0].fecha_corte_gracia = new Date(Date.now() + 6 * 3600 * 1000).toISOString(); // Vence en 6 horas
      this.saveTenantsToStorage(todos);
    }
  }

  /**
   * Regulariza el cobro pendiente de El Tenedor Gourmet
   */
  public regularizarCobroElTenedor(): void {
    const todos = this.getTenantsFromStorage();
    const tenedor = todos.find((x) => x.ruc === '20601234567');
    if (tenedor) {
      tenedor.estado_suscripcion = 'activa';
      tenedor.dias_gracia_restantes = 5;
      tenedor.dia_gracia_actual = 1;
      tenedor.fecha_proximo_cobro = '2026-11-09T00:00:00Z';
      this.saveTenantsToStorage(todos);
    }
  }

  /**
   * Restablece las semillas canónicas originales
   */
  public restablecerSemillas(): void {
    this.saveTenantsToStorage(SEMILLAS_TENANTS);
  }
}

export const mockSaasTenantsService = new MockSaasTenantsService();
