import type { ApiResponse } from '@/types/api';
import type { ComprobantePublicoDTO, DemoComprobantePreset } from '@/types/comprobante';

/**
 * Catálogo de comprobantes demo para pruebas interactivas en vivo.
 */
export const DEMO_COMPROBANTES: DemoComprobantePreset[] = [
  {
    key: 'boleta',
    label: 'Boleta Emitida (Móvil)',
    token: 'token-boleta-demo',
    descripcion: 'Boleta de Venta electrónica B001-0012894 emitida a comensal en salón.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    key: 'factura',
    label: 'Factura Fiscal (Desktop A4)',
    token: 'token-factura-demo',
    descripcion: 'Factura Electrónica F001-0004521 emitida a empresa con RUC y XML listo.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    key: 'anulado',
    label: 'Comprobante Anulado (NC)',
    token: 'token-anulado-demo',
    descripcion: 'Boleta original B001-0012894 anulada formalmente con Nota de Crédito.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    key: 'invalido',
    label: 'Enlace Inválido (Zero Dead-End)',
    token: 'token-no-existe-404',
    descripcion: 'Simula un token inexistente con pantalla orientadora de búsqueda manual.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
];

// Mock 1: Boleta Emitida Estándar
const MOCK_BOLETA: ComprobantePublicoDTO = {
  token: 'token-boleta-demo',
  tipo: 'boleta',
  tipo_label: 'Boleta de Venta Electrónica',
  serie: 'B001',
  correlativo: 12894,
  serie_numero: 'B001-0012894',
  fecha_emision: '2026-10-10T18:35:12Z',
  estado: 'emitido',
  hash_seguridad: '7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
  emisor: {
    razon_social: 'EL CARBÓN & LEÑA S.A.C.',
    ruc: '20601234567',
    local_nombre: 'Sede Miraflores - Malecón',
    direccion: 'Av. Conquistadores 450',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    telefono: '987654321',
    slug_sede: 'aurea-miraflores',
    horario: 'Lun - Dom: 12:00 PM - 11:00 PM',
  },
  cliente: {
    nombre: 'CARLOS MENDOZA QUISPE',
    tipo_documento: 'DNI',
    numero_documento: '72819201',
    mesa_codigo: 'Mesa 04 (Salón)',
  },
  items: [
    {
      codigo: 'PLT-001',
      cantidad: 1,
      descripcion: '1/4 Pollo a la Brasa c/ Papas Nativas y Ensalada Clásica',
      precio_unitario: 24.5,
      importe_total: 24.5,
    },
    {
      codigo: 'PLT-002',
      cantidad: 1,
      descripcion: 'Lomo Saltado Criollo de Lomo Fino al Wok',
      precio_unitario: 42.0,
      importe_total: 42.0,
    },
    {
      codigo: 'BEB-003',
      cantidad: 2,
      descripcion: 'Chicha Morada Especial 1L (Maíz Morado de Valle)',
      precio_unitario: 9.25,
      importe_total: 18.5,
    },
  ],
  totales: {
    subtotal_consumo: 85.0,
    descuento: 12.75,
    descuento_motivo: 'Almuerzo Ejecutivo (15%)',
    base_imponible: 61.23,
    igv: 11.02,
    monto_recargo: 0.0,
    total: 72.25,
  },
  pago: {
    medio_pago: 'tarjeta',
    metodo_nombre: 'Tarjeta POS Visa',
    numero_operacion: '8941',
  },
  url_carta_digital: '/sede/aurea-miraflores/carta',
};

// Mock 2: Factura Corporativa Emitida
const MOCK_FACTURA: ComprobantePublicoDTO = {
  token: 'token-factura-demo',
  tipo: 'factura',
  tipo_label: 'Factura Electrónica',
  serie: 'F001',
  correlativo: 4521,
  serie_numero: 'F001-0004521',
  fecha_emision: '2026-10-10T20:15:40Z',
  estado: 'emitido',
  hash_seguridad: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
  emisor: {
    razon_social: 'EL CARBÓN & LEÑA S.A.C.',
    ruc: '20601234567',
    local_nombre: 'Sede Miraflores - Malecón',
    direccion: 'Av. Conquistadores 450',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    telefono: '987654321',
    slug_sede: 'aurea-miraflores',
    horario: 'Lun - Dom: 12:00 PM - 11:00 PM',
  },
  cliente: {
    nombre: 'INVERSIONES TECNOLÓGICAS DEL PERÚ S.A.C.',
    tipo_documento: 'RUC',
    numero_documento: '20549876321',
    direccion: 'Av. Rivera Navarrete 501, Piso 8, San Isidro, Lima',
  },
  items: [
    {
      codigo: 'PLT-004',
      cantidad: 4,
      descripcion: '1/2 Pollo a la Brasa c/ Papas Nativas',
      precio_unitario: 38.0,
      importe_total: 152.0,
    },
    {
      codigo: 'PLT-014',
      cantidad: 2,
      descripcion: 'Parrilla Familiar Mixta Especial (4 Personas)',
      precio_unitario: 115.0,
      importe_total: 230.0,
    },
    {
      codigo: 'BEB-008',
      cantidad: 4,
      descripcion: 'Jarra de Chicha Morada Artesanal 1.5L',
      precio_unitario: 16.0,
      importe_total: 64.0,
    },
  ],
  totales: {
    subtotal_consumo: 446.0,
    descuento: 0.0,
    descuento_motivo: null,
    base_imponible: 377.97,
    igv: 68.03,
    monto_recargo: 0.0,
    total: 446.0,
  },
  pago: {
    medio_pago: 'tarjeta',
    metodo_nombre: 'Tarjeta de Crédito Corporativa',
    numero_operacion: '4512',
  },
  url_carta_digital: '/sede/aurea-miraflores/carta',
};

// Mock 3: Boleta Anulada con Nota de Crédito
const MOCK_BOLETA_ANULADA: ComprobantePublicoDTO = {
  ...MOCK_BOLETA,
  token: 'token-anulado-demo',
  estado: 'anulado',
  nota_credito: {
    serie_numero: 'BC01-0000042',
    fecha: '2026-10-10T18:42:15Z',
    motivo_codigo: '01',
    motivo_texto: 'Anulación de la operación (Cambio a Factura con RUC)',
    sustento: 'Comensal solicitó cambio de Boleta a Factura corporativa con RUC.',
    url_publica: '#',
  },
};

/**
 * Consulta del comprobante por token único de QR
 */
export async function getComprobantePorToken(
  token: string
): Promise<ApiResponse<ComprobantePublicoDTO | null>> {
  await new Promise((r) => setTimeout(r, 250));

  const cleanToken = token.trim().toLowerCase();

  if (cleanToken === 'token-boleta-demo' || cleanToken === 'b001-0012894' || cleanToken === 'b001-12894') {
    return {
      exito: true,
      datos: MOCK_BOLETA,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  if (cleanToken === 'token-factura-demo' || cleanToken === 'f001-0004521' || cleanToken === 'f001-4521') {
    return {
      exito: true,
      datos: MOCK_FACTURA,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  if (cleanToken === 'token-anulado-demo') {
    return {
      exito: true,
      datos: MOCK_BOLETA_ANULADA,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // Token inválido / No encontrado
  return {
    exito: false,
    datos: null,
    errores: [
      {
        codigo: 'COMPROBANTE_NO_ENCONTRADO',
        mensaje: 'No pudimos encontrar ningún comprobante con el código o enlace suministrado.',
      },
    ],
    meta: { timestamp: new Date().toISOString() },
  };
}
