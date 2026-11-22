/**
 * Sobre común y datos de los eventos que consume ms-notificaciones (doc-2u/servicios/eventos.md).
 *
 * Cada esquema exige solo lo que las reglas usan, con los nulos que el catálogo permite. Los tipos de
 * TypeScript describen lo mismo para que las reglas trabajen con datos ya validados.
 */

import type { Esquema } from './validacion.js';

export const VERSION_SOPORTADA = 1;

export interface Sobre {
  id: string;
  tipo: string;
  version: number;
  ocurrido_en: string;
  origen: string;
  empresa_id: string;
  local_id: string;
  datos: Record<string, unknown>;
}

export const ESQUEMA_SOBRE: Esquema = {
  id: { tipo: 'uuid' },
  tipo: { tipo: 'texto' },
  version: { tipo: 'entero' },
  ocurrido_en: { tipo: 'instante' },
  origen: { tipo: 'texto' },
  empresa_id: { tipo: 'uuid' },
  local_id: { tipo: 'uuid' },
};

// ---- comprobante.anulado ----

export interface ComprobanteAnulado {
  comprobante_id: string;
  nota_credito_id: string;
  fecha: string;
  motivo_codigo: string;
  anulado_por_id: string | null;
  anulado_por_nombre: string | null;
  total: number;
}

const COMPROBANTE_ANULADO: Esquema = {
  comprobante_id: { tipo: 'uuid' },
  nota_credito_id: { tipo: 'uuid' },
  fecha: { tipo: 'instante' },
  motivo_codigo: { tipo: 'texto' },
  anulado_por_id: { tipo: 'uuid', nulo: true },
  anulado_por_nombre: { tipo: 'texto', nulo: true },
  total: { tipo: 'numero' },
};

// ---- pedido.anulado ----

export interface PedidoAnulado {
  anulacion_id: string;
  pedido_id: string;
  pedido_item_id: string | null;
  producto_nombre: string | null;
  cantidad: number;
  monto_total: number;
  tipo_anulacion: 'item_individual' | 'comanda_completa';
  motivo_categoria: string | null;
  es_merma: boolean;
  mozo_nombre: string | null;
  anulado_por_nombre: string | null;
  anulado_en: string;
}

const PEDIDO_ANULADO: Esquema = {
  anulacion_id: { tipo: 'uuid' },
  pedido_id: { tipo: 'uuid' },
  pedido_item_id: { tipo: 'uuid', nulo: true },
  producto_nombre: { tipo: 'texto', nulo: true },
  cantidad: { tipo: 'entero' },
  monto_total: { tipo: 'numero' },
  tipo_anulacion: { tipo: { valores: ['item_individual', 'comanda_completa'] } },
  motivo_categoria: { tipo: 'texto', nulo: true },
  es_merma: { tipo: 'booleano' },
  mozo_nombre: { tipo: 'texto', nulo: true },
  anulado_por_nombre: { tipo: 'texto', nulo: true },
  anulado_en: { tipo: 'instante' },
};

// ---- pedido.item_sustituido ----

export interface PedidoItemSustituido {
  pedido_id: string;
  mesa_numero: string;
  pedido_item_original_id: string;
  pedido_item_nuevo_id: string;
  producto_original_nombre: string;
  producto_nuevo_nombre: string;
  cantidad: number;
  diferencia_monto: number;
  sustituido_por_id: string | null;
  sustituido_por_nombre: string | null;
  fecha: string;
}

const PEDIDO_ITEM_SUSTITUIDO: Esquema = {
  pedido_id: { tipo: 'uuid' },
  mesa_numero: { tipo: 'texto' },
  pedido_item_original_id: { tipo: 'uuid' },
  pedido_item_nuevo_id: { tipo: 'uuid' },
  producto_original_nombre: { tipo: 'texto' },
  producto_nuevo_nombre: { tipo: 'texto' },
  cantidad: { tipo: 'entero' },
  diferencia_monto: { tipo: 'numero' },
  sustituido_por_id: { tipo: 'uuid', nulo: true },
  sustituido_por_nombre: { tipo: 'texto', nulo: true },
  fecha: { tipo: 'instante' },
};

// ---- producto.agotado ----

export interface ProductoAgotado {
  producto_id: string;
  producto_nombre: string;
  causa: 'manual_cocina' | 'resolucion_fuego';
  motivo: string | null;
  marcado_por_id: string | null;
  marcado_por_nombre: string | null;
  fecha: string;
}

const PRODUCTO_AGOTADO: Esquema = {
  producto_id: { tipo: 'uuid' },
  producto_nombre: { tipo: 'texto' },
  causa: { tipo: { valores: ['manual_cocina', 'resolucion_fuego'] } },
  motivo: { tipo: 'texto', nulo: true },
  marcado_por_id: { tipo: 'uuid', nulo: true },
  marcado_por_nombre: { tipo: 'texto', nulo: true },
  fecha: { tipo: 'instante' },
};

// ---- plato.listo ----

export interface PlatoListo {
  pedido_id: string;
  mesa_numero: string;
  mozo_id: string;
  mozo_nombre: string | null;
  items: { pedido_item_id: string; producto_nombre: string; cantidad: number }[];
  fecha: string;
}

const PLATO_LISTO: Esquema = {
  pedido_id: { tipo: 'uuid' },
  mesa_numero: { tipo: 'texto' },
  // El destinatario: sin mozo no hay a quién avisar, así que es obligatorio.
  mozo_id: { tipo: 'uuid' },
  mozo_nombre: { tipo: 'texto', nulo: true },
  items: {
    tipo: {
      lista: {
        pedido_item_id: { tipo: 'uuid' },
        producto_nombre: { tipo: 'texto' },
        cantidad: { tipo: 'entero' },
      },
      minimo: 1,
    },
  },
  fecha: { tipo: 'instante' },
};

// ---- caja.turno_previo_pendiente ----

export interface CajaTurnoPrevioPendiente {
  caja_id: string;
  turno_correlativo: number;
  cajero_pendiente_nombre: string | null;
  solicitante_id: string;
  solicitante_nombre: string | null;
  hay_admin_local: boolean;
  fecha: string;
}

const CAJA_TURNO_PREVIO_PENDIENTE: Esquema = {
  caja_id: { tipo: 'uuid' },
  turno_correlativo: { tipo: 'entero' },
  cajero_pendiente_nombre: { tipo: 'texto', nulo: true },
  solicitante_id: { tipo: 'uuid' },
  solicitante_nombre: { tipo: 'texto', nulo: true },
  hay_admin_local: { tipo: 'booleano' },
  fecha: { tipo: 'instante' },
};

// ---- caja.cerrada ----

export interface CajaCerrada {
  caja_id: string;
  turno_correlativo: number;
  cajero_id: string | null;
  cajero_nombre: string | null;
  efectivo_esperado: number;
  efectivo_contado: number;
  discrepancia: number;
  cierre_forzado: boolean;
  cerrado_por_id: string | null;
  cerrado_por_nombre: string | null;
  fecha: string;
}

const CAJA_CERRADA: Esquema = {
  caja_id: { tipo: 'uuid' },
  turno_correlativo: { tipo: 'entero' },
  cajero_id: { tipo: 'uuid', nulo: true },
  cajero_nombre: { tipo: 'texto', nulo: true },
  efectivo_esperado: { tipo: 'numero' },
  efectivo_contado: { tipo: 'numero' },
  discrepancia: { tipo: 'numero' },
  cierre_forzado: { tipo: 'booleano' },
  cerrado_por_id: { tipo: 'uuid', nulo: true },
  cerrado_por_nombre: { tipo: 'texto', nulo: true },
  fecha: { tipo: 'instante' },
};

/** Esquema de `datos` de cada tipo que este servicio convierte en avisos (versión 1). */
export const ESQUEMAS_V1 = {
  'comprobante.anulado': COMPROBANTE_ANULADO,
  'pedido.anulado': PEDIDO_ANULADO,
  'pedido.item_sustituido': PEDIDO_ITEM_SUSTITUIDO,
  'producto.agotado': PRODUCTO_AGOTADO,
  'plato.listo': PLATO_LISTO,
  'caja.turno_previo_pendiente': CAJA_TURNO_PREVIO_PENDIENTE,
  'caja.cerrada': CAJA_CERRADA,
} as const satisfies Record<string, Esquema>;

export type TipoEvento = keyof typeof ESQUEMAS_V1;

export function esTipoConocido(tipo: string): tipo is TipoEvento {
  return Object.hasOwn(ESQUEMAS_V1, tipo);
}
