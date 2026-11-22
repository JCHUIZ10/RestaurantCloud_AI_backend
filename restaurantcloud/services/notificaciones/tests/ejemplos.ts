/**
 * `datos` de ejemplo de cada evento, con la forma del catálogo (doc-2u/servicios/eventos.md).
 * Valores ilustrativos; cada prueba cambia lo que necesita.
 */

import { MOZO } from './ayudas.js';

export const COMPROBANTE_ANULADO = {
  comprobante_id: '7c1d9e42-5b3a-4f7e-8a2c-1d4e5f6a7b8c',
  nota_credito_id: 'a91f0c3d-8e2b-4d6a-b7c5-2e3f4a5b6c7d',
  fecha: '2026-11-16T21:40:10-05:00',
  motivo_codigo: '01',
  anulado_por_id: '00000000-0000-4000-8000-000000000105',
  anulado_por_nombre: 'Carlos Ríos',
  total: 75,
};

export const PEDIDO_ANULADO = {
  anulacion_id: '9b1e2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d',
  pedido_id: '3d367634-70ce-45d3-96ec-c42c5597b7a5',
  pedido_item_id: '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d',
  producto_id: '00000000-0000-4000-8000-000000000431',
  producto_nombre: 'Lomo saltado',
  cantidad: 1,
  monto_total: 38,
  tipo_anulacion: 'item_individual',
  motivo_categoria: 'demora_cliente',
  es_merma: false,
  costo_merma: null,
  minutos_espera: 12,
  mozo_id: MOZO,
  mozo_nombre: 'Lucía Paredes',
  anulado_por_id: '00000000-0000-4000-8000-000000000105',
  anulado_por_nombre: 'Carlos Ríos',
  anulado_en: '2026-11-16T21:40:10-05:00',
  fecha_operativa: '2026-11-16',
};

export const PEDIDO_ITEM_SUSTITUIDO = {
  pedido_id: '3d367634-70ce-45d3-96ec-c42c5597b7a5',
  mesa_numero: '4',
  pedido_item_original_id: '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d',
  pedido_item_nuevo_id: '6b7c8d9e-0f1a-4b2c-8d3e-4f5a6b7c8d9e',
  producto_original_nombre: 'Ceviche clásico',
  producto_nuevo_nombre: 'Tiradito de pescado',
  cantidad: 2,
  diferencia_monto: -4,
  sustituido_por_id: MOZO,
  sustituido_por_nombre: 'Lucía Paredes',
  fecha: '2026-11-16T21:40:10-05:00',
};

export const PRODUCTO_AGOTADO = {
  producto_id: '00000000-0000-4000-8000-000000000432',
  producto_nombre: 'Ceviche clásico',
  causa: 'manual_cocina',
  motivo: null,
  marcado_por_id: '00000000-0000-4000-8000-000000000107',
  marcado_por_nombre: 'Rosa Quispe',
  fecha: '2026-11-16T21:40:10-05:00',
};

export const PLATO_LISTO = {
  pedido_id: '3d367634-70ce-45d3-96ec-c42c5597b7a5',
  mesa_numero: '4',
  mozo_id: MOZO,
  mozo_nombre: 'Lucía Paredes',
  items: [
    { pedido_item_id: '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d', producto_nombre: 'Lomo saltado', cantidad: 2 },
  ],
  fecha: '2026-11-16T21:40:10-05:00',
};

export const CAJA_TURNO_PREVIO_PENDIENTE = {
  caja_id: '8c9d0e1f-2a3b-4c4d-8e5f-6a7b8c9d0e1f',
  turno_correlativo: 7,
  cajero_pendiente_nombre: 'Ana Torres',
  solicitante_id: '00000000-0000-4000-8000-000000000106',
  solicitante_nombre: 'Jorge Salas',
  hay_admin_local: true,
  fecha: '2026-11-16T21:40:10-05:00',
};

export const CAJA_CERRADA = {
  caja_id: '8c9d0e1f-2a3b-4c4d-8e5f-6a7b8c9d0e1f',
  turno_correlativo: 7,
  cajero_id: '00000000-0000-4000-8000-000000000108',
  cajero_nombre: 'Ana Torres',
  efectivo_esperado: 500,
  efectivo_contado: 450,
  discrepancia: -50,
  cierre_forzado: false,
  cerrado_por_id: '00000000-0000-4000-8000-000000000108',
  cerrado_por_nombre: 'Ana Torres',
  fecha: '2026-11-16T21:40:10-05:00',
};

export const EJEMPLOS: Record<string, Record<string, unknown>> = {
  'comprobante.anulado': COMPROBANTE_ANULADO,
  'pedido.anulado': PEDIDO_ANULADO,
  'pedido.item_sustituido': PEDIDO_ITEM_SUSTITUIDO,
  'producto.agotado': PRODUCTO_AGOTADO,
  'plato.listo': PLATO_LISTO,
  'caja.turno_previo_pendiente': CAJA_TURNO_PREVIO_PENDIENTE,
  'caja.cerrada': CAJA_CERRADA,
};
