/**
 * Servicio Mock para CU-PROP-02: Gestionar Suscripción y Método de Pago
 * Sincronizado con PostgreSQL 16 (02_schema_ddl.sql y 07_seed_local_aurea_completo.sql)
 * Persiste datos en localStorage con claves segregadas por tenant.
 */

import type {
  SuscripcionDashboardDTO,
  SuscripcionDashboardApiResponse,
  SetupMetodoPagoApiResponse,
  ConfirmarTarjetaRequestDTO,
  ConfirmarTarjetaApiResponse,
  MetodoPagoDTO,
  FacturaSuscripcionDTO,
  UsoRecursosDTO,
  EstadoSuscripcion,
} from '@/types/propietarioSuscripcion';
import type {
  PlanesComparativaApiResponse,
  PlanComparativoDTO,
  SimularUpgradeRequestDTO,
  SimularUpgradeApiResponse,
  EjecutarUpgradeRequestDTO,
  EjecutarUpgradeApiResponse,
  RecursosConciliacionApiResponse,
  ProgramarDowngradeRequestDTO,
  ProgramarDowngradeApiResponse,
  CancelarDowngradeApiResponse,
  ConfiguracionDowngradeDTO,
  PeriodicidadFacturacion,
} from '@/types/propietarioCambiarPlan';

const SUSCRIPCION_STORAGE_KEY = 'restaurantcloud_propietario_suscripcion_db';
const LOCALES_STORAGE_KEY = 'restaurantcloud_locales_propietario_db';
const ADMINS_STORAGE_KEY = 'restaurantcloud_propietario_admins_db';

interface SuscripcionStoreData {
  plan_id?: number; // 1: Starter, 2: Pro, 3: Enterprise
  periodicidad?: PeriodicidadFacturacion;
  proximo_plan_id?: number | null;
  config_downgrade?: ConfiguracionDowngradeDTO | null;
  recursos_conciliados?: boolean;
  stripe_schedule_id?: string | null;
  suscripcion_estado: EstadoSuscripcion;
  metodo_pago: MetodoPagoDTO;
  al_dia: boolean;
  en_periodo_gracia: boolean;
  dias_gracia_restantes: number;
  fecha_corte_gracia: string | null;
  monto_pendiente: number;
  ultimo_error_cobro: string | null;
  reintentos_fallidos: number;
  historial_pagos: FacturaSuscripcionDTO[];
}

const DEFAULT_STORE_DATA: SuscripcionStoreData = {
  plan_id: 2,
  periodicidad: 'mensual',
  proximo_plan_id: null,
  config_downgrade: null,
  recursos_conciliados: false,
  stripe_schedule_id: null,
  suscripcion_estado: 'activa',
  metodo_pago: {
    marca: 'visa',
    ultimos_4: '4242',
    exp_mes: 12,
    exp_ano: 2028,
    titular: 'Rodrigo De Las Casas',
    proximo_a_vencer: false,
    estado_cobro_tarjeta: 'al_dia',
  },
  al_dia: true,
  en_periodo_gracia: false,
  dias_gracia_restantes: 5,
  fecha_corte_gracia: null,
  monto_pendiente: 0.00,
  ultimo_error_cobro: null,
  reintentos_fallidos: 0,
  historial_pagos: [
    {
      id: 'p1a2b3c4-0001-0000-0000-000000000001',
      numero_comprobante: 'F-100456',
      fecha: '2026-10-01T10:00:00Z',
      monto: 249.00,
      moneda: 'PEN',
      estado: 'exitoso',
      origen_pago: 'stripe',
      stripe_payment_id: 'py_1NxyzProOctubre',
      descripcion: 'Suscripción Plan Pro — Mensual (Octubre 2026)',
    },
    {
      id: 'p1a2b3c4-0001-0000-0000-000000000002',
      numero_comprobante: 'F-100389',
      fecha: '2026-09-01T10:00:00Z',
      monto: 249.00,
      moneda: 'PEN',
      estado: 'exitoso',
      origen_pago: 'stripe',
      stripe_payment_id: 'py_1NxyzProSeptiembre',
      descripcion: 'Suscripción Plan Pro — Mensual (Septiembre 2026)',
    },
    {
      id: 'p1a2b3c4-0001-0000-0000-000000000003',
      numero_comprobante: 'F-100321',
      fecha: '2026-08-01T10:00:00Z',
      monto: 249.00,
      moneda: 'PEN',
      estado: 'exitoso',
      origen_pago: 'stripe',
      stripe_payment_id: 'py_1NxyzProAgosto',
      descripcion: 'Suscripción Plan Pro — Mensual (Agosto 2026)',
    },
  ],
};

class PropietarioSuscripcionService {
  private loadData(): SuscripcionStoreData {
    try {
      const raw = localStorage.getItem(SUSCRIPCION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    this.saveData(DEFAULT_STORE_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_STORE_DATA));
  }

  private saveData(data: SuscripcionStoreData): void {
    try {
      localStorage.setItem(SUSCRIPCION_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  // Sincronizar consumo real de recursos de la plataforma
  private getUsoRecursosReal(planId?: number): UsoRecursosDTO {
    // 1. Locales reales
    let localesActivos = 2; // Áurea Miraflores + San Isidro
    try {
      const localesData = localStorage.getItem(LOCALES_STORAGE_KEY);
      if (localesData) {
        const parsed = JSON.parse(localesData);
        if (Array.isArray(parsed)) {
          localesActivos = parsed.filter((l: any) => l.estado === 'activo').length;
        }
      }
    } catch {
      // fallback
    }

    // 2. Mesas reales
    let mesasActivas = 26; // 18 en Miraflores + 8 en San Isidro
    try {
      const localesData = localStorage.getItem(LOCALES_STORAGE_KEY);
      if (localesData) {
        const parsed = JSON.parse(localesData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          mesasActivas = parsed.reduce(
            (acc: number, l: any) => acc + (l.metricas?.total_mesas || 0),
            0
          );
        }
      }
    } catch {
      // fallback
    }

    // 3. Colaboradores / staff real
    let personalActivo = 8; // Rodrigo (propietario) + mozo + cocina + cajero + personal base + admins
    try {
      const adminsData = localStorage.getItem(ADMINS_STORAGE_KEY);
      if (adminsData) {
        const parsed = JSON.parse(adminsData);
        if (Array.isArray(parsed)) {
          const adminsNoInactivos = parsed.filter((a: any) => a.estado !== 'inactivo').length;
          personalActivo = 6 + adminsNoInactivos;
        }
      }
    } catch {
      // fallback
    }

    // Límites según plan contratado (06_seed_initial_data.sql)
    let maxLocales = 3;
    let maxMesas = 30;
    let maxPersonal = 15;
    let incluyeReservas = true;
    let incluyeReportes = true;
    let incluyeAsistenteIa = true;
    let incluyePrediccionIa = false;

    if (planId === 1) {
      // Starter
      maxLocales = 1;
      maxMesas = 25;
      maxPersonal = 5;
      incluyeReservas = false;
      incluyeReportes = false;
      incluyeAsistenteIa = false;
      incluyePrediccionIa = false;
    } else if (planId === 3) {
      // Enterprise
      maxLocales = 10;
      maxMesas = 60;
      maxPersonal = 40;
      incluyeReservas = true;
      incluyeReportes = true;
      incluyeAsistenteIa = true;
      incluyePrediccionIa = true;
    }

    return {
      locales: {
        usados: localesActivos,
        maximo: maxLocales,
        porcentaje: Math.min(100, Math.round((localesActivos / maxLocales) * 100)),
        limite_alcanzado: localesActivos >= maxLocales,
      },
      mesas: {
        usados: mesasActivas,
        maximo: maxMesas,
        porcentaje: Math.min(100, Math.round((mesasActivas / maxMesas) * 100)),
        limite_alcanzado: mesasActivas >= maxMesas,
      },
      usuarios_personal: {
        usados: personalActivo,
        maximo: maxPersonal,
        porcentaje: Math.min(100, Math.round((personalActivo / maxPersonal) * 100)),
        limite_alcanzado: personalActivo >= maxPersonal,
      },
      incluye_reservas: incluyeReservas,
      incluye_reportes_avanzados: incluyeReportes,
      incluye_asistente_ia: incluyeAsistenteIa,
      incluye_prediccion_ia: incluyePrediccionIa,
    };
  }

  // 1. Consultar Dashboard General de Suscripción
  async getDashboardSuscripcion(): Promise<SuscripcionDashboardApiResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const store = this.loadData();
    const planId = store.plan_id ?? 2;
    const recursos = this.getUsoRecursosReal(planId);

    const planNombre = planId === 3 ? 'Enterprise' : planId === 1 ? 'Starter' : 'Pro';
    const planSlug = planId === 3 ? 'plan-enterprise' : planId === 1 ? 'plan-starter' : 'plan-pro';
    const precioMensual = planId === 3 ? 499.00 : planId === 1 ? 99.00 : 249.00;
    const precioAnual = planId === 3 ? 4990.00 : planId === 1 ? 990.00 : 2490.00;
    const periodicidad = store.periodicidad ?? 'mensual';

    let proximoPlanInfo = null;
    if (store.proximo_plan_id) {
      const pId = store.proximo_plan_id;
      proximoPlanInfo = {
        id: pId,
        nombre: pId === 1 ? 'Starter' : pId === 2 ? 'Pro' : 'Enterprise',
        precio_mensual: pId === 1 ? 99.00 : pId === 2 ? 249.00 : 499.00,
        fecha_efectiva: '2026-11-01T23:59:59Z',
      };
    }

    const datos: SuscripcionDashboardDTO = {
      empresa: {
        id: '00000000-0000-4000-8000-000000000001',
        razon_social: 'Restaurante ÁUREA S.A.C.',
        ruc: '20612345678',
        tipo_identidad_fiscal: 'RUC_20',
        correo_contacto: 'contacto@aurea.local',
        telefono: '+51 987 654 321',
        estado: store.suscripcion_estado === 'suspendida' ? 'suspendida' : 'activa',
      },
      plan: {
        id: planId,
        nombre: planNombre,
        slug: planSlug,
        precio_mensual: precioMensual,
        precio_anual: precioAnual,
        periodicidad: periodicidad,
        proximo_cobro: '2026-11-01T23:59:59Z',
        proximo_plan: proximoPlanInfo,
      },
      suscripcion_estado: store.suscripcion_estado,
      metodo_pago: store.metodo_pago,
      uso_recursos: recursos,
      estado_cobro: {
        al_dia: store.al_dia,
        en_periodo_gracia: store.en_periodo_gracia,
        dias_gracia_restantes: store.dias_gracia_restantes,
        fecha_corte_gracia: store.fecha_corte_gracia,
        monto_pendiente: store.monto_pendiente,
        ultimo_error_cobro: store.ultimo_error_cobro,
        reintentos_fallidos: store.reintentos_fallidos,
      },
      historial_pagos: store.historial_pagos,
    };

    return {
      exito: true,
      datos,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 2. Solicitar SetupIntent para Stripe Elements
  async solicitarSetupTarjeta(): Promise<SetupMetodoPagoApiResponse> {
    await new Promise((r) => setTimeout(r, 180));
    const secret = 'seti_mock_' + Math.random().toString(36).substring(2, 12);

    return {
      exito: true,
      datos: {
        client_secret: secret,
        stripe_public_key: 'pk_test_restaurantcloud_aurea_mock',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 3. Confirmar Nueva Tarjeta y Regularizar Cobros Pendientes
  async confirmarTarjeta(dto: ConfirmarTarjetaRequestDTO): Promise<ConfirmarTarjetaApiResponse> {
    await new Promise((r) => setTimeout(r, 400));
    const store = this.loadData();

    // Detectar marca según primer dígito
    const numLimpio = dto.numero_tarjeta.replace(/\s+/g, '');
    let marca: MetodoPagoDTO['marca'] = 'visa';
    if (numLimpio.startsWith('5')) {
      marca = 'mastercard';
    } else if (numLimpio.startsWith('3')) {
      marca = 'amex';
    }

    const ultimos4 = numLimpio.length >= 4 ? numLimpio.slice(-4) : '8899';

    // Verificar si está próxima a vencer (< 30 días)
    const fechaActual = new Date();
    const anoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;
    const expAnoFull = dto.ano_expiracion < 100 ? 2000 + dto.ano_expiracion : dto.ano_expiracion;
    const proximoAVencer = expAnoFull === anoActual && dto.mes_expiracion === mesActual;

    const nuevoMetodo: MetodoPagoDTO = {
      marca,
      ultimos_4: ultimos4,
      exp_mes: dto.mes_expiracion,
      exp_ano: expAnoFull,
      titular: dto.titular.trim() || 'Rodrigo De Las Casas',
      proximo_a_vencer: proximoAVencer,
      estado_cobro_tarjeta: 'al_dia',
    };

    store.metodo_pago = nuevoMetodo;

    let cobroRegularizado = false;
    let nuevoPagoId: string | undefined;

    // Si había cobro pendiente / periodo de gracia, se liquida de inmediato
    if (!store.al_dia || store.monto_pendiente > 0 || store.suscripcion_estado === 'en_gracia') {
      cobroRegularizado = true;
      store.al_dia = true;
      store.en_periodo_gracia = false;
      store.dias_gracia_restantes = 5;
      store.fecha_corte_gracia = null;
      store.monto_pendiente = 0.00;
      store.ultimo_error_cobro = null;
      store.reintentos_fallidos = 0;
      store.suscripcion_estado = 'activa';

      nuevoPagoId = 'p1a2b3c4-pago-regularizado-' + Date.now().toString(36);
      const nuevaFactura: FacturaSuscripcionDTO = {
        id: nuevoPagoId,
        numero_comprobante: `F-100${Math.floor(100 + Math.random() * 900)}`,
        fecha: new Date().toISOString(),
        monto: 249.00,
        moneda: 'PEN',
        estado: 'exitoso',
        origen_pago: 'stripe',
        stripe_payment_id: 'py_regularizado_' + Math.random().toString(36).substring(2, 8),
        descripcion: 'Suscripción Plan Pro — Mensual (Regularizado)',
      };
      store.historial_pagos.unshift(nuevaFactura);
    }

    this.saveData(store);

    return {
      exito: true,
      datos: {
        mensaje: cobroRegularizado
          ? 'Método de pago actualizado exitosamente. El cobro pendiente de S/ 249.00 ha sido regularizado.'
          : 'Método de pago actualizado exitosamente. Tus próximos cobros se debitarán de esta tarjeta.',
        metodo_pago: nuevoMetodo,
        cobro_pendiente_regularizado: cobroRegularizado,
        nuevo_pago_id: nuevoPagoId,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 4. Descargar Factura de Suscripción (Emisión Formato Oficial PDF/TXT)
  descargarFactura(factura: FacturaSuscripcionDTO): void {
    const contenido = `
================================================================================
RESTAURANTCLOUD AI — COMPROBANTE TRIBUTARIO DE SUSCRIPCIÓN SAAS
FACTURA ELECTRÓNICA: ${factura.numero_comprobante}
================================================================================
FECHA DE EMISIÓN: ${new Date(factura.fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}
ESTADO: ${factura.estado.toUpperCase()}
MONEDA: SOLES (PEN)
ORIGEN DE PAGO: PASARELA STRIPE BILLING (PCI-DSS)
TRANSACCIÓN STRIPE: ${factura.stripe_payment_id || 'ch_3NxyzStripeDoc'}

--------------------------------------------------------------------------------
DATOS DEL CLIENTE / RECEPTOR:
--------------------------------------------------------------------------------
EMPRESA:           Restaurante ÁUREA S.A.C.
RUC:               20612345678
TIPO CONTRIBUYENTE:PERSONA JURÍDICA (RUC 20)
DIRECCIÓN FISCAL:  Av. Larco 450, Miraflores, Lima - Perú
CORREO FACTURACIÓN:contacto@aurea.local

--------------------------------------------------------------------------------
DETALLE DEL SERVICIO:
--------------------------------------------------------------------------------
ITEM  DESCRIPCIÓN                          CANT.   V. UNIT.     TOTAL
01    Suscripción RestaurantCloud AI         1     S/ 211.02    S/ 211.02
      • Nivel: Plan Pro Mensual
      • Hasta 3 locales y 30 mesas
      • KDS y Asistente IA Predictivo

--------------------------------------------------------------------------------
DESGLOSE TRIBUTARIO OFICIAL SUNAT:
--------------------------------------------------------------------------------
OPERACIÓN GRAVADA:                     S/ 211.02
IGV (18.00%):                          S/  37.98
TOTAL A PAGAR:                         S/ 249.00

SON: DOSCIENTOS CUARENTA Y NUEVE Y 00/100 SOLES
================================================================================
Hash Criptográfico SHA-256: 7f8a9b2c3d4e5f601a2b3c4d5e6f7a8b
Representación impresa de la Factura Electrónica consultable en www.restaurantcloud.pe
================================================================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factura_${factura.numero_comprobante}_Aurea.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Métodos Sandbox QA
  simularCobroFallido(): void {
    const store = this.loadData();
    const fechaCorte = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();

    store.suscripcion_estado = 'en_gracia';
    store.al_dia = false;
    store.en_periodo_gracia = true;
    store.dias_gracia_restantes = 5;
    store.fecha_corte_gracia = fechaCorte;
    store.monto_pendiente = 249.00;
    store.ultimo_error_cobro =
      'Fondos insuficientes en la cuenta bancaria (Stripe decline code: insufficient_funds).';
    store.reintentos_fallidos = 1;
    store.metodo_pago.estado_cobro_tarjeta = 'rechazado';

    const facturaFallida: FacturaSuscripcionDTO = {
      id: 'p1a2b3c4-fallido-' + Date.now().toString(36),
      numero_comprobante: 'F-100499',
      fecha: new Date().toISOString(),
      monto: 249.00,
      moneda: 'PEN',
      estado: 'fallido',
      origen_pago: 'stripe',
      stripe_payment_id: 'py_failed_fondos',
      descripcion: 'Cobro de suscripción no procesado — Fondos insuficientes',
    };

    store.historial_pagos.unshift(facturaFallida);
    this.saveData(store);
  }

  simularSuspension(): void {
    const store = this.loadData();
    store.suscripcion_estado = 'suspendida';
    store.al_dia = false;
    store.en_periodo_gracia = false;
    store.dias_gracia_restantes = 0;
    store.monto_pendiente = 249.00;
    store.ultimo_error_cobro =
      'Periodo de gracia agotado sin regularización. Suscripción suspendida.';
    this.saveData(store);
  }

  simularTarjetaPorVencer(): void {
    const store = this.loadData();
    const now = new Date();
    store.metodo_pago.exp_mes = now.getMonth() + 1;
    store.metodo_pago.exp_ano = now.getFullYear();
    store.metodo_pago.proximo_a_vencer = true;
    this.saveData(store);
  }

  // =========================================================================
  // MÉTODOS CU-PROP-03: Cambiar Plan de Suscripción
  // =========================================================================

  // 5. Consultar Catálogo Comparativo de Planes y Límites
  async getPlanesComparativa(): Promise<PlanesComparativaApiResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const store = this.loadData();
    const planIdActual = store.plan_id ?? 2;
    const uso = this.getUsoRecursosReal(planIdActual);

    const periodicidad = store.periodicidad ?? 'mensual';
    const planActualNombre = planIdActual === 3 ? 'Enterprise' : planIdActual === 1 ? 'Starter' : 'Pro';
    const precioMensual = planIdActual === 3 ? 499.00 : planIdActual === 1 ? 99.00 : 249.00;
    const precioAnual = planIdActual === 3 ? 4990.00 : planIdActual === 1 ? 990.00 : 2490.00;

    const tieneDowngrade = !!store.proximo_plan_id;
    let proximoPlan = null;
    if (tieneDowngrade) {
      const pId = store.proximo_plan_id!;
      proximoPlan = {
        id: pId,
        nombre: pId === 1 ? 'Starter' : pId === 2 ? 'Pro' : 'Enterprise',
        precio_mensual: pId === 1 ? 99.00 : pId === 2 ? 249.00 : 499.00,
      };
    }

    const recursosEnUso = {
      locales_activos: uso.locales.usados,
      pisos_activos: 3, // Miraflores: 2 pisos + San Isidro: 1 piso
      mesas_activas: uso.mesas.usados,
      usuarios_activos: uso.usuarios_personal.usados,
    };

    // Determinar qué excede Starter
    const excedidosStarter: string[] = [];
    if (recursosEnUso.locales_activos > 1) excedidosStarter.push('locales');
    if (recursosEnUso.pisos_activos > 1) excedidosStarter.push('pisos');
    if (recursosEnUso.mesas_activas > 25) excedidosStarter.push('mesas');
    if (recursosEnUso.usuarios_activos > 5) excedidosStarter.push('usuarios');

    const planes: PlanComparativoDTO[] = [
      {
        id: 1,
        nombre: 'Starter',
        slug: 'plan-starter',
        descripcion: 'Ideal para restaurantes pequeños y pollerías de salón único con hasta 25 mesas.',
        precio_mensual: 99.00,
        precio_anual: 990.00,
        limites: {
          max_locales: 1,
          max_pisos: 1,
          max_mesas: 25,
          max_usuarios: 5,
          incluye_reservas: false,
          incluye_reportes_avanzados: false,
          incluye_asistente_ia: false,
          incluye_prediccion_ia: false,
          tipo_reportes: 'Básico (CSV)',
          tipo_soporte: 'Correo (48h)',
        },
        es_plan_actual: planIdActual === 1,
        tipo_accion: planIdActual === 1 ? 'actual' : 'downgrade',
        requiere_conciliacion: planIdActual > 1 && excedidosStarter.length > 0,
        recursos_excedidos: excedidosStarter,
      },
      {
        id: 2,
        nombre: 'Pro',
        slug: 'plan-pro',
        descripcion: 'Para restaurantes en expansión con múltiples ambientes, reservas de salón y KDS.',
        precio_mensual: 249.00,
        precio_anual: 2490.00,
        limites: {
          max_locales: 3,
          max_pisos: 2,
          max_mesas: 30,
          max_usuarios: 15,
          incluye_reservas: true,
          incluye_reportes_avanzados: true,
          incluye_asistente_ia: true,
          incluye_prediccion_ia: false,
          tipo_reportes: 'Avanzado (PDF/Excel)',
          tipo_soporte: 'Chat (24h)',
        },
        es_plan_actual: planIdActual === 2,
        tipo_accion: planIdActual === 2 ? 'actual' : planIdActual === 1 ? 'upgrade' : 'downgrade',
        requiere_conciliacion: planIdActual === 3,
        recursos_excedidos: [],
        destacado: true,
      },
      {
        id: 3,
        nombre: 'Enterprise',
        slug: 'plan-enterprise',
        descripcion: 'Para cadenas gastronómicas y franquicias con operaciones complejas y suite completa de IA.',
        precio_mensual: 499.00,
        precio_anual: 4990.00,
        limites: {
          max_locales: 10,
          max_pisos: 5,
          max_mesas: 60,
          max_usuarios: 40,
          incluye_reservas: true,
          incluye_reportes_avanzados: true,
          incluye_asistente_ia: true,
          incluye_prediccion_ia: true,
          tipo_reportes: 'Auditoría + BI',
          tipo_soporte: 'Prioritario 24/7',
        },
        es_plan_actual: planIdActual === 3,
        tipo_accion: planIdActual === 3 ? 'actual' : 'upgrade',
        requiere_conciliacion: false,
        recursos_excedidos: [],
      },
    ];

    return {
      exito: true,
      datos: {
        plan_actual: {
          id: planIdActual,
          nombre: planActualNombre,
          precio_mensual: precioMensual,
          precio_anual: precioAnual,
          periodicidad,
          dias_restantes_ciclo: 15,
          dias_totales_ciclo: 30,
          fecha_renovacion: '2026-11-01T23:59:59Z',
          downgrade_programado: tieneDowngrade,
          proximo_plan: proximoPlan,
        },
        recursos_en_uso: recursosEnUso,
        planes,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 6. Simular Prorrateo de Upgrade (Stripe Invoice Preview)
  async simularUpgrade(dto: SimularUpgradeRequestDTO): Promise<SimularUpgradeApiResponse> {
    await new Promise((r) => setTimeout(r, 220));
    const store = this.loadData();
    const planIdActual = store.plan_id ?? 2;
    const planOrigen = planIdActual === 1 ? 'Starter' : planIdActual === 2 ? 'Pro' : 'Enterprise';
    const planDestino = dto.nuevo_plan_id === 3 ? 'Enterprise' : 'Pro';

    const esAnual = dto.periodicidad === 'anual';
    const precioOrigen = esAnual ? (planIdActual === 1 ? 990 : 2490) : (planIdActual === 1 ? 99 : 249);
    const precioDestino = esAnual ? (dto.nuevo_plan_id === 3 ? 4990 : 2490) : (dto.nuevo_plan_id === 3 ? 499 : 249);

    const diasRestantes = 15;
    const diasTotales = 30;
    const factorDias = diasRestantes / diasTotales;

    // Prorrateo Stripe canónico
    const creditoActual = Math.round(precioOrigen * factorDias * 100) / 100;
    const costoProporcional = Math.round(precioDestino * factorDias * 100) / 100;
    const netoAPagar = Math.max(0, Math.round((costoProporcional - creditoActual) * 100) / 100);

    return {
      exito: true,
      datos: {
        plan_origen: planOrigen,
        plan_destino: planDestino,
        dias_restantes_ciclo: diasRestantes,
        dias_totales_ciclo: diasTotales,
        fecha_proximo_ciclo: '2026-11-01T23:59:59Z',
        credito_plan_actual: creditoActual,
        costo_nuevo_plan_proporcional: costoProporcional,
        monto_neto_a_pagar_hoy: netoAPagar,
        moneda: 'PEN',
        nuevo_monto_recurrente: precioDestino,
        metodo_pago_defecto: store.metodo_pago,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 7. Ejecutar Upgrade Inmediato
  async ejecutarUpgrade(dto: EjecutarUpgradeRequestDTO): Promise<EjecutarUpgradeApiResponse> {
    await new Promise((r) => setTimeout(r, 450));
    const store = this.loadData();

    // Actualizar plan activo
    store.plan_id = dto.nuevo_plan_id;
    store.periodicidad = dto.periodicidad;
    // Si tenía downgrade programado, se cancela al hacer upgrade
    store.proximo_plan_id = null;
    store.config_downgrade = null;
    store.recursos_conciliados = false;
    store.stripe_schedule_id = null;

    const planNombre = dto.nuevo_plan_id === 3 ? 'Enterprise' : 'Pro';
    const montoCobrado = dto.nuevo_plan_id === 3 ? 125.00 : 75.00;
    const pagoId = 'p1a2b3c4-upgrade-' + Date.now().toString(36);
    const numFactura = `F-100${Math.floor(500 + Math.random() * 400)}`;

    const nuevaFactura: FacturaSuscripcionDTO = {
      id: pagoId,
      numero_comprobante: numFactura,
      fecha: new Date().toISOString(),
      monto: montoCobrado,
      moneda: 'PEN',
      estado: 'exitoso',
      origen_pago: 'stripe',
      stripe_payment_id: 'py_upgrade_' + Math.random().toString(36).substring(2, 9),
      descripcion: `Upgrade Inmediato a Plan ${planNombre} — Cargo Prorrateado (15 días)`,
    };

    store.historial_pagos.unshift(nuevaFactura);
    this.saveData(store);

    return {
      exito: true,
      datos: {
        suscripcion_id: '00000000-0000-4000-8000-000000000001',
        plan_id: dto.nuevo_plan_id,
        plan_nombre: planNombre,
        estado: 'activa',
        comprobante_pago: {
          pago_id: pagoId,
          numero_factura: numFactura,
          monto_cobrado: montoCobrado,
          moneda: 'PEN',
          url_recibo_pdf: `/api/v1/propietario/suscripcion/facturas/${pagoId}/descargar`,
          descripcion: `Upgrade a Plan ${planNombre} (Prorrateo)`,
        },
        modulos_activados: [
          'asistente_conversacional_ia',
          'prediccion_diaria_demanda',
          'reportes_auditoria_bi',
          'capacidad_multisede_10_locales',
        ],
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 8. Previsualizar Árbol de Recursos para Conciliación de Downgrade
  async getRecursosConciliacion(nuevoPlanId: number): Promise<RecursosConciliacionApiResponse> {
    await new Promise((r) => setTimeout(r, 200));

    // Datos canónicos sincronizados con 07_seed_local_aurea_completo.sql
    const arbolLocales = [
      {
        id: '00000000-0000-4000-8000-000000000010',
        nombre: 'Sede Principal - Miraflores',
        slug: 'aurea-miraflores',
        es_casa_matriz: true,
        pisos: [
          {
            id: '00000000-0000-4000-8000-000000000301',
            nombre: 'Salón Principal (Piso 1)',
            mesas: [
              { id: 'mes-0001', etiqueta: 'Mesa 01', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0002', etiqueta: 'Mesa 02', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0003', etiqueta: 'Mesa 03', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0004', etiqueta: 'Mesa 04', capacidad: 6, forma: 'rectangular', estado_actual: 'activa' },
              { id: 'mes-0005', etiqueta: 'Mesa 05', capacidad: 4, forma: 'redonda', estado_actual: 'activa' },
              { id: 'mes-0006', etiqueta: 'Mesa 06', capacidad: 2, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0007', etiqueta: 'Mesa 07', capacidad: 2, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0008', etiqueta: 'Mesa 08', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0009', etiqueta: 'Mesa 09', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0010', etiqueta: 'Mesa 10', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0011', etiqueta: 'Mesa 11', capacidad: 6, forma: 'rectangular', estado_actual: 'activa' },
              { id: 'mes-0012', etiqueta: 'Mesa 12', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
            ],
          },
          {
            id: '00000000-0000-4000-8000-000000000302',
            nombre: 'Terraza VIP (Piso 2)',
            mesas: [
              { id: 'mes-0021', etiqueta: 'Terraza 01', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0022', etiqueta: 'Terraza 02', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0023', etiqueta: 'Terraza 03', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0024', etiqueta: 'Terraza 04', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-0025', etiqueta: 'Terraza 05', capacidad: 6, forma: 'rectangular', estado_actual: 'activa' },
              { id: 'mes-0026', etiqueta: 'Terraza 06', capacidad: 2, forma: 'cuadrada', estado_actual: 'activa' },
            ],
          },
        ],
      },
      {
        id: '00000000-0000-4000-8000-000000000020',
        nombre: 'Sucursal San Isidro',
        slug: 'aurea-san-isidro',
        es_casa_matriz: false,
        pisos: [
          {
            id: '00000000-0000-4000-8000-000000000303',
            nombre: 'Planta Baja',
            mesas: [
              { id: 'mes-si-01', etiqueta: 'Mesa SI-01', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-si-02', etiqueta: 'Mesa SI-02', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-si-03', etiqueta: 'Mesa SI-03', capacidad: 2, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-si-04', etiqueta: 'Mesa SI-04', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-si-05', etiqueta: 'Mesa SI-05', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-si-06', etiqueta: 'Mesa SI-06', capacidad: 6, forma: 'rectangular', estado_actual: 'activa' },
              { id: 'mes-si-07', etiqueta: 'Mesa SI-07', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
              { id: 'mes-si-08', etiqueta: 'Mesa SI-08', capacidad: 4, forma: 'cuadrada', estado_actual: 'activa' },
            ],
          },
        ],
      },
    ];

    const usuariosStaff = [
      {
        id: 'usr-prop-01',
        nombre: 'Rodrigo De Las Casas',
        email: 'rodrigo@aurea.local',
        rol: 'propietario',
        protegido: true,
      },
      {
        id: 'usr-adm-01',
        nombre: 'Carlos Mendoza',
        email: 'admin@aurea.local',
        rol: 'admin_local',
        protegido: false,
        local_asignado: 'Miraflores',
      },
      {
        id: 'usr-adm-02',
        nombre: 'Elena Ramos',
        email: 'elena.ramos@aurea.local',
        rol: 'admin_local',
        protegido: false,
        local_asignado: 'San Isidro',
      },
      {
        id: 'usr-moz-01',
        nombre: 'Mateo Silva',
        email: 'mozo1@aurea.local',
        rol: 'mozo',
        protegido: false,
        local_asignado: 'Miraflores',
      },
      {
        id: 'usr-coc-01',
        nombre: 'Chef Javier Peña',
        email: 'cocina@aurea.local',
        rol: 'cocina',
        protegido: false,
        local_asignado: 'Miraflores',
      },
      {
        id: 'usr-caj-01',
        nombre: 'Valeria Solís',
        email: 'cajero@aurea.local',
        rol: 'cajero',
        protegido: false,
        local_asignado: 'Miraflores',
      },
      {
        id: 'usr-caj-02',
        nombre: 'Lucía Flores',
        email: 'lucia.flores@aurea.local',
        rol: 'cajero',
        protegido: false,
        local_asignado: 'San Isidro',
      },
      {
        id: 'usr-coc-02',
        nombre: 'Rosa Morales',
        email: 'rosa.morales@aurea.local',
        rol: 'cocina',
        protegido: false,
        local_asignado: 'San Isidro',
      },
    ];

    const limites = nuevoPlanId === 1
      ? { max_locales: 1, max_pisos: 1, max_mesas: 25, max_usuarios: 5 }
      : { max_locales: 3, max_pisos: 2, max_mesas: 30, max_usuarios: 15 };

    return {
      exito: true,
      datos: {
        nuevo_plan: {
          id: nuevoPlanId,
          nombre: nuevoPlanId === 1 ? 'Starter' : 'Pro',
          limites,
        },
        arbol_locales: arbolLocales,
        usuarios_staff: usuariosStaff,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 9. Programar Downgrade con Conciliación de Recursos
  async programarDowngrade(dto: ProgramarDowngradeRequestDTO): Promise<ProgramarDowngradeApiResponse> {
    await new Promise((r) => setTimeout(r, 380));
    const store = this.loadData();

    store.proximo_plan_id = dto.nuevo_plan_id;
    store.config_downgrade = dto.config_downgrade;
    store.recursos_conciliados = true;
    store.stripe_schedule_id = 'sub_sched_' + Math.random().toString(36).substring(2, 9);

    this.saveData(store);

    const planActualNombre = store.plan_id === 3 ? 'Enterprise' : 'Pro';
    const nuevoPlanNombre = dto.nuevo_plan_id === 1 ? 'Starter' : 'Pro';

    return {
      exito: true,
      datos: {
        programado: true,
        plan_actual: planActualNombre,
        proximo_plan: nuevoPlanNombre,
        fecha_efectiva: '2026-11-01T23:59:59Z',
        recursos_conciliados: true,
        resumen_desactivacion_programada: {
          locales_a_inactivar: 1,
          pisos_a_inactivar: 2,
          mesas_a_inactivar: 16,
          usuarios_a_inactivar: 3,
        },
        aviso: `Tu plan actual ${planActualNombre} seguirá funcionando sin limitaciones hasta el 01/Nov/2026. A partir de esa fecha se aplicará la tarifa ${nuevoPlanNombre} (S/ 99.00/mes).`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 10. Cancelar Downgrade Programado
  async cancelarDowngrade(): Promise<CancelarDowngradeApiResponse> {
    await new Promise((r) => setTimeout(r, 250));
    const store = this.loadData();

    store.proximo_plan_id = null;
    store.config_downgrade = null;
    store.recursos_conciliados = false;
    store.stripe_schedule_id = null;

    this.saveData(store);

    const planActualNombre = store.plan_id === 3 ? 'Enterprise' : 'Pro';
    const tarifa = store.plan_id === 3 ? 499.00 : 249.00;

    return {
      exito: true,
      datos: {
        cancelado: true,
        plan_activo: planActualNombre,
        tarifa_mensual: tarifa,
        proximo_cobro: '2026-11-01T23:59:59Z',
        mensaje: `Se canceló la programación de downgrade. Tu Plan ${planActualNombre} continúa activo indefinidamente.`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Métodos Sandbox QA para CU-PROP-03
  simularDowngradeProgramado(): void {
    const store = this.loadData();
    store.proximo_plan_id = 1;
    store.recursos_conciliados = true;
    store.config_downgrade = {
      local_id_activo: '00000000-0000-4000-8000-000000000010',
      piso_id_activo: '00000000-0000-4000-8000-000000000301',
      mesas_ids_activas: ['mes-0001', 'mes-0002', 'mes-0003', 'mes-0004', 'mes-0005', 'mes-0006', 'mes-0007', 'mes-0008', 'mes-0009', 'mes-0010'],
      usuarios_ids_activos: ['usr-prop-01', 'usr-adm-01', 'usr-moz-01'],
    };
    store.stripe_schedule_id = 'sub_sched_demo_qa';
    this.saveData(store);
  }

  simularUpgradeEnterprise(): void {
    const store = this.loadData();
    store.plan_id = 3;
    store.proximo_plan_id = null;
    store.config_downgrade = null;
    store.recursos_conciliados = false;
    this.saveData(store);
  }

  resetDatabase(): void {
    this.saveData(DEFAULT_STORE_DATA);
  }
}

export const propietarioSuscripcionService = new PropietarioSuscripcionService();
