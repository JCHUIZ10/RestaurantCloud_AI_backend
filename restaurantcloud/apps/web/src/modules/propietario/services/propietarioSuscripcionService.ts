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

const SUSCRIPCION_STORAGE_KEY = 'restaurantcloud_propietario_suscripcion_db';
const LOCALES_STORAGE_KEY = 'restaurantcloud_locales_propietario_db';
const ADMINS_STORAGE_KEY = 'restaurantcloud_propietario_admins_db';

interface SuscripcionStoreData {
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
  private getUsoRecursosReal(): UsoRecursosDTO {
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

    // Plan Pro canónico (06_seed_initial_data.sql): max_locales = 3, max_mesas = 30, max_usuarios = 15
    const maxLocales = 3;
    const maxMesas = 30;
    const maxPersonal = 15;

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
      incluye_reservas: true,
      incluye_reportes_avanzados: true,
      incluye_asistente_ia: true,
      incluye_prediccion_ia: true,
    };
  }

  // 1. Consultar Dashboard General de Suscripción
  async getDashboardSuscripcion(): Promise<SuscripcionDashboardApiResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const store = this.loadData();
    const recursos = this.getUsoRecursosReal();

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
        id: 2,
        nombre: 'Pro',
        slug: 'plan-pro',
        precio_mensual: 249.00,
        precio_anual: 2490.00,
        periodicidad: 'mensual',
        proximo_cobro: '2026-11-01T23:59:59Z',
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

  resetDatabase(): void {
    this.saveData(DEFAULT_STORE_DATA);
  }
}

export const propietarioSuscripcionService = new PropietarioSuscripcionService();
