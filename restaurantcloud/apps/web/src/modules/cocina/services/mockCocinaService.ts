import { ApiResponse } from '@/types/api';
import {
  KDSComandaDTO,
  ConfiguracionKDSDTO,
  ConsolidadoAllDayDTO,
  EstadoItemCocina,
  ItemAnuladoSSEEvent,
  KDSPedidoDespachadoDTO,
  MetricasDespachoDTO,
  AlertaStockInsuficienteSSE,
  PlatoDisponibilidadDTO,
  ItemEnFuegoResolucionDTO,
} from '@/types/cocina';

// Configuración de sede predeterminada (tabla configuracion_kds)
export const MOCK_CONFIGURACION_KDS: ConfiguracionKDSDTO = {
  local_id: 'local-miraflores-01',
  tiempo_optimo_verde_min: 15,
  tiempo_alerta_ambar_min: 25,
  tiempo_maximo_pase_min: 3,
  alerta_sonora_nueva_comanda: true,
  alerta_sonora_comanda_roja: true,
  intervalo_sonido_rojo_seg: 60,
  vista_predeterminada: 'fifo',
};

// Almacén físico de insumos e ingredientes (tabla insumo de 02_schema_ddl.sql - CU-COCINA-03)
export interface InsumoAlmacenMock {
  id: string;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  estado: 'activo' | 'agotado' | 'inactivo';
}

let mockInsumosAlmacen: InsumoAlmacenMock[] = [
  { id: 'ins-lomo-fino', nombre: 'Carne Lomo Fino', unidad_medida: 'kg', stock_actual: 13.700, stock_minimo: 5.000, estado: 'activo' },
  { id: 'ins-papa-yungay', nombre: 'Papa Yungay', unidad_medida: 'saco', stock_actual: 1.172, stock_minimo: 0.500, estado: 'activo' },
  { id: 'ins-aceite-vegetal', nombre: 'Aceite Vegetal (Bidón 20L)', unidad_medida: 'bidon', stock_actual: 0.005, stock_minimo: 1.000, estado: 'activo' },
  { id: 'ins-pollo-entero', nombre: 'Pollo Entero Marinado', unidad_medida: 'und', stock_actual: 14.000, stock_minimo: 6.000, estado: 'activo' },
  { id: 'ins-pescado-corvina', nombre: 'Pescado Corvina Fresca', unidad_medida: 'kg', stock_actual: 8.500, stock_minimo: 3.000, estado: 'activo' },
  { id: 'ins-limon-sutil', nombre: 'Limón Sutil Fresco', unidad_medida: 'kg', stock_actual: 0.000, stock_minimo: 2.000, estado: 'agotado' },
  { id: 'ins-queso-paria', nombre: 'Queso Paria', unidad_medida: 'kg', stock_actual: 4.200, stock_minimo: 1.500, estado: 'activo' },
  { id: 'ins-arroz-extra', nombre: 'Arroz Extra', unidad_medida: 'saco', stock_actual: 2.500, stock_minimo: 1.000, estado: 'activo' },
];

// Catálogo maestro de productos y su disponibilidad en carta (tabla producto + categoria_producto - CU-COCINA-04)
export interface ProductoCartaMock {
  id: string;
  nombre: string;
  categoria_id: string;
  categoria_nombre: string;
  precio: number;
  foto_url?: string;
  disponibilidad: 'disponible' | 'agotado';
  motivo_agotado?: 'quiebre_stock_receta' | 'apagado_manual_cocina' | 'decision_admin' | null;
  usuario_modifico_nombre?: string | null;
  fecha_modificacion_disp?: string | null;
  receta_resumen: string;
  insumo_requerido_id?: string;
  cantidad_descuenta?: number;
}

let mockProductosCarta: ProductoCartaMock[] = [
  {
    id: 'prod-lomo-saltado',
    nombre: 'Lomo Saltado Criollo',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Platos Criollos',
    precio: 48.00,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    receta_resumen: '0.200 kg Carne Lomo Fino • 0.007 sacos Papa Yungay • 0.004 bidones Aceite Vegetal',
    insumo_requerido_id: 'ins-aceite-vegetal',
    cantidad_descuenta: 0.004,
  },
  {
    id: 'prod-causa-limena',
    nombre: 'Causa Limeña de Pollo',
    categoria_id: 'cat-frios',
    categoria_nombre: 'Entradas y Fríos',
    precio: 28.00,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    receta_resumen: '0.250 kg Papa Amarilla • 0.150 kg Pechuga Pollo',
    insumo_requerido_id: 'ins-pollo-entero',
    cantidad_descuenta: 0.150,
  },
  {
    id: 'prod-ceviche-mixto',
    nombre: 'Ceviche Mixto Tradicional',
    categoria_id: 'cat-ceviches',
    categoria_nombre: 'Ceviches y Fríos',
    precio: 52.00,
    disponibilidad: 'agotado',
    motivo_agotado: 'quiebre_stock_receta',
    usuario_modifico_nombre: 'Sistema (Kardex Automático)',
    fecha_modificacion_disp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    receta_resumen: '0.200 kg Pescado Corvina • 0.100 kg Mixtura Mariscos • 0.050 kg Limón Sutil',
    insumo_requerido_id: 'ins-limon-sutil',
    cantidad_descuenta: 0.050,
  },
  {
    id: 'prod-arroz-mariscos',
    nombre: 'Arroz con Mariscos',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Platos Criollos',
    precio: 49.00,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    receta_resumen: '0.300 kg Arroz Extra • 0.150 kg Mixtura Mariscos • 0.020 kg Pasta Ají Amarillo',
    insumo_requerido_id: 'ins-arroz-extra',
    cantidad_descuenta: 0.005,
  },
  {
    id: 'prod-pollo-brasa',
    nombre: '1/2 Pollo a la Brasa',
    categoria_id: 'cat-brasas',
    categoria_nombre: 'Brasas y Horno',
    precio: 38.00,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    receta_resumen: '0.500 und Pollo Entero Marinado • 0.020 sacos Papa Yungay',
    insumo_requerido_id: 'ins-pollo-entero',
    cantidad_descuenta: 0.500,
  },
  {
    id: 'prod-tequenos',
    nombre: 'Porción Tequeños Criollos',
    categoria_id: 'cat-frios',
    categoria_nombre: 'Entradas y Fríos',
    precio: 24.00,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    receta_resumen: '0.120 kg Queso Paria • 12 und Masa Wantán • 0.060 kg Palta Fuerte',
    insumo_requerido_id: 'ins-queso-paria',
    cantidad_descuenta: 0.120,
  },
  {
    id: 'prod-bife-angosto',
    nombre: 'Bife Angosto Criollo',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Platos Criollos',
    precio: 56.00,
    disponibilidad: 'agotado',
    motivo_agotado: 'apagado_manual_cocina',
    usuario_modifico_nombre: 'Marco V. (Chef)',
    fecha_modificacion_disp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    receta_resumen: '0.300 kg Carne Bife Angosto • 0.100 kg Papas Nativas • 0.050 kg Mantequilla',
    insumo_requerido_id: 'ins-lomo-fino',
    cantidad_descuenta: 0.300,
  },
  {
    id: 'prod-pastel-choclo',
    nombre: 'Pastel de Choclo Criollo',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Platos Criollos',
    precio: 32.00,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    receta_resumen: '0.300 kg Choclo Desgranado • 0.100 kg Carne Molida • 0.050 kg Pasas Morenas',
  },
];

// Semilla de comandas activas iniciales reflejando fielmente el wireframe canónico
let mockComandasMemoria: KDSComandaDTO[] = [
  // 1. MESA 04 - ÓPTIMO (Verde <= 15m)
  {
    pedido_id: 'ped-kds-001',
    numero_comanda: 149,
    mesa_codigo: '04',
    es_mesa_agrupada: false,
    mozo_nombre: 'Carlos Mendoza',
    piso_nombre: 'Salón Principal',
    ronda_numero: 1,
    ronda_tipo: 'inicial',
    comensales: 4,
    fecha_envio: new Date(Date.now() - 8 * 60 * 1000 - 30 * 1000).toISOString(),
    minutos_espera: 8,
    segundos_transcurridos: 8 * 60 + 30,
    semaforo_color: 'verde',
    bebidas_salon_count: 2,
    items: [
      {
        item_id: 'item-kds-101',
        producto_id: 'prod-lomo-saltado',
        nombre_producto: 'Lomo Saltado Criollo',
        cantidad: 2,
        estado: 'en_preparacion',
        categoria_id: 'cat-criollos',
        categoria_nombre: 'Platos Criollos',
        nota_cocina: 'Término 3/4 • Una porción sin cebolla (alergia)',
        fecha_inicio_coccion: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        receta_resumen: '0.400 kg Carne Lomo Fino • 0.014 sacos Papa Yungay • 0.004 bidones Aceite Vegetal',
      },
      {
        item_id: 'item-kds-102',
        producto_id: 'prod-causa-limena',
        nombre_producto: 'Causa Limeña de Pollo',
        cantidad: 1,
        estado: 'listo',
        categoria_id: 'cat-frios',
        categoria_nombre: 'Entradas y Fríos',
        nota_cocina: null,
        fecha_inicio_coccion: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        fecha_listo_cocina: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        receta_resumen: '0.250 kg Papa Amarilla prensada • 0.150 kg Pechuga Pollo • 0.050 kg Palta Fuerte',
      },
    ],
  },

  // 2. MESA 01 - ALERTA (Ámbar 16-25m)
  {
    pedido_id: 'ped-kds-002',
    numero_comanda: 147,
    mesa_codigo: '01',
    es_mesa_agrupada: false,
    mozo_nombre: 'Ana Paredes',
    piso_nombre: 'Salón Principal',
    ronda_numero: 1,
    ronda_tipo: 'inicial',
    comensales: 2,
    fecha_envio: new Date(Date.now() - 18 * 60 * 1000 - 45 * 1000).toISOString(),
    minutos_espera: 18,
    segundos_transcurridos: 18 * 60 + 45,
    semaforo_color: 'ambar',
    bebidas_salon_count: 1,
    items: [
      {
        item_id: 'item-kds-201',
        producto_id: 'prod-ceviche-mixto',
        nombre_producto: 'Ceviche Mixto Tradicional',
        cantidad: 1,
        estado: 'en_cola',
        categoria_id: 'cat-ceviches',
        categoria_nombre: 'Ceviches y Fríos',
        nota_cocina: '⚠️ Sin ají • Hielo aparte para la leche de tigre',
        fecha_inicio_coccion: null,
        receta_resumen: '0.200 kg Pescado Corvina • 0.100 kg Mixtura Mariscos • 0.050 kg Limón Sutil',
      },
      {
        item_id: 'item-kds-202',
        producto_id: 'prod-arroz-mariscos',
        nombre_producto: 'Arroz con Mariscos',
        cantidad: 1,
        estado: 'en_preparacion',
        categoria_id: 'cat-criollos',
        categoria_nombre: 'Platos Criollos',
        nota_cocina: 'Conchas negras cocidas al dente',
        fecha_inicio_coccion: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        receta_resumen: '0.300 kg Arroz Extra • 0.150 kg Mixtura Mariscos • 0.020 kg Pasta Ají Amarillo',
      },
    ],
  },

  // 3. MESA [ 02 ; 03 ] - GRUPO UNIDO (Ámbar 16-25m, Ronda 2 Adicional)
  {
    pedido_id: 'ped-kds-003',
    numero_comanda: 148,
    mesa_codigo: '[ 02 ; 03 ]',
    es_mesa_agrupada: true,
    mozo_nombre: 'Carlos Mendoza',
    piso_nombre: 'Salón Principal',
    ronda_numero: 2,
    ronda_tipo: 'adicional',
    comensales: 8,
    fecha_envio: new Date(Date.now() - 21 * 60 * 1000 - 10 * 1000).toISOString(),
    minutos_espera: 21,
    segundos_transcurridos: 21 * 60 + 10,
    semaforo_color: 'ambar',
    bebidas_salon_count: 4,
    items: [
      {
        item_id: 'item-kds-301',
        producto_id: 'prod-pollo-brasa',
        nombre_producto: '1/2 Pollo a la Brasa',
        cantidad: 3,
        estado: 'en_preparacion',
        categoria_id: 'cat-brasas',
        categoria_nombre: 'Brasas y Horno',
        nota_cocina: 'Papas crocantes • Servicio familiar conjunto',
        fecha_inicio_coccion: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        receta_resumen: '1.500 und Pollo Entero Marinado • 0.040 sacos Papa Yungay',
      },
      {
        item_id: 'item-kds-302',
        producto_id: 'prod-tequenos',
        nombre_producto: 'Porción Tequeños Criollos',
        cantidad: 1,
        estado: 'en_cola',
        categoria_id: 'cat-frios',
        categoria_nombre: 'Entradas y Fríos',
        nota_cocina: 'Con salsa guacamole casera',
        fecha_inicio_coccion: null,
        receta_resumen: '0.120 kg Queso Paria • 12 und Masa Wantán • 0.060 kg Palta Fuerte',
      },
    ],
  },

  // 4. MESA 07 - CRÍTICO DEMORADO (Rojo > 25m)
  {
    pedido_id: 'ped-kds-004',
    numero_comanda: 145,
    mesa_codigo: '07',
    es_mesa_agrupada: false,
    mozo_nombre: 'Carlos Mendoza',
    piso_nombre: 'Terraza Jardín',
    ronda_numero: 1,
    ronda_tipo: 'inicial',
    comensales: 3,
    fecha_envio: new Date(Date.now() - 28 * 60 * 1000 - 50 * 1000).toISOString(),
    minutos_espera: 28,
    segundos_transcurridos: 28 * 60 + 50,
    semaforo_color: 'rojo',
    bebidas_salon_count: 2,
    items: [
      {
        item_id: 'item-kds-401',
        producto_id: 'prod-bife-angosto',
        nombre_producto: 'Bife Angosto Criollo',
        cantidad: 2,
        estado: 'en_cola',
        categoria_id: 'cat-criollos',
        categoria_nombre: 'Platos Criollos',
        nota_cocina: 'Término 3/4 • Comensal consulta demora con mozo',
        fecha_inicio_coccion: null,
        receta_resumen: '0.600 kg Carne Bife Angosto • 0.200 kg Papas Nativas • 0.050 kg Mantequilla',
      },
      {
        item_id: 'item-kds-402',
        producto_id: 'prod-pastel-choclo',
        nombre_producto: 'Pastel de Choclo Criollo',
        cantidad: 1,
        estado: 'listo',
        categoria_id: 'cat-criollos',
        categoria_nombre: 'Platos Criollos',
        nota_cocina: null,
        fecha_inicio_coccion: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        fecha_listo_cocina: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        receta_resumen: '0.300 kg Choclo Desgranado • 0.100 kg Carne Molida • 0.050 kg Pasas Morenas',
      },
    ],
  },
];

// Semilla de comandas despachadas en los últimos 30 minutos (CU-COCINA-02)
let mockDespachadosMemoria: KDSPedidoDespachadoDTO[] = [
  {
    pedido_id: 'ped-kds-desp-01',
    numero_comanda: 145,
    mesa_codigo: '03',
    mozo_nombre: 'Carlos Mendoza',
    piso_nombre: 'Salón Principal',
    total_items: 3,
    fecha_despacho: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    minutos_desde_despacho: 3,
    puede_recuperar: true,
    items_resumen: [
      { producto_nombre: 'Seco de Res Norteña', cantidad: 2, nota_cocina: 'Con frijoles bien calientes' },
      { producto_nombre: 'Papa Rellena Criolla', cantidad: 1, nota_cocina: null },
    ],
  },
  {
    pedido_id: 'ped-kds-desp-02',
    numero_comanda: 144,
    mesa_codigo: '08',
    mozo_nombre: 'Ana Paredes',
    piso_nombre: 'Terraza Jardín',
    total_items: 4,
    fecha_despacho: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    minutos_desde_despacho: 11,
    puede_recuperar: true,
    items_resumen: [
      { producto_nombre: 'Arroz Chaufa Especial', cantidad: 3, nota_cocina: null },
      { producto_nombre: 'Porción Wantán Frito', cantidad: 1, nota_cocina: 'Salsa tamarindo extra' },
    ],
  },
  {
    pedido_id: 'ped-kds-desp-03',
    numero_comanda: 142,
    mesa_codigo: '05',
    mozo_nombre: 'Carlos Mendoza',
    piso_nombre: 'Salón Principal',
    total_items: 3,
    fecha_despacho: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    minutos_desde_despacho: 22,
    puede_recuperar: true,
    items_resumen: [
      { producto_nombre: 'Pollo Saltado Criollo', cantidad: 2, nota_cocina: 'Término bien cocido' },
      { producto_nombre: 'Ensalada Mixta Fresca', cantidad: 1, nota_cocina: 'Aliño aparte' },
    ],
  },
];

export const mockCocinaService = {
  /**
   * Obtiene la configuración de sede para el KDS
   */
  async obtenerConfiguracion(): Promise<ApiResponse<ConfiguracionKDSDTO>> {
    return {
      exito: true,
      datos: { ...MOCK_CONFIGURACION_KDS },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Obtiene la cola FIFO de comandas activas
   */
  async obtenerComandas(): Promise<ApiResponse<KDSComandaDTO[]>> {
    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(mockComandasMemoria)),
      meta: {
        timestamp: new Date().toISOString(),
        total: mockComandasMemoria.length,
      },
    };
  },

  /**
   * Cambia el estado de un plato (PATCH /api/v1/cocina/items/:id/estado)
   * Integra deducción atómica de recetas y política de servicio continuo (CU-COCINA-03)
   */
  async cambiarEstadoItem(
    itemId: string,
    nuevoEstado: 'en_preparacion' | 'listo'
  ): Promise<ApiResponse<{
    item_id: string;
    estado: EstadoItemCocina;
    alerta_stock?: AlertaStockInsuficienteSSE | null;
  }>> {
    let targetItem: any = null;
    let targetComanda: any = null;

    for (const comanda of mockComandasMemoria) {
      const it = comanda.items.find((i) => i.item_id === itemId);
      if (it) {
        targetItem = it;
        targetComanda = comanda;
        break;
      }
    }

    if (!targetItem || !targetComanda) {
      return {
        exito: false,
        datos: { item_id: itemId, estado: 'en_cola' },
        errores: [{ codigo: 'ITEM_NO_ENCONTRADO', mensaje: 'El ítem culinario no existe.' }],
      };
    }

    let alertaStock: AlertaStockInsuficienteSSE | null = null;

    // Deducción automática de insumos al marcar Listo (CU-COCINA-03)
    if (nuevoEstado === 'listo') {
      const prod = mockProductosCarta.find((p) => p.id === targetItem.producto_id);
      if (prod && prod.insumo_requerido_id) {
        const insumo = mockInsumosAlmacen.find((ins) => ins.id === prod.insumo_requerido_id);
        if (insumo) {
          const cantidadDescuenta = prod.cantidad_descuenta || 0.004;
          const consumoRequerido = targetItem.cantidad * cantidadDescuenta;
          const stockAnterior = insumo.stock_actual;

          if (insumo.stock_actual < consumoRequerido) {
            // Inconsistencia de bodega: no bloquea cocina, fija stock 0 y alerta
            const faltante = consumoRequerido - insumo.stock_actual;
            insumo.stock_actual = 0;
            insumo.estado = 'agotado';
            prod.disponibilidad = 'agotado';
            prod.motivo_agotado = 'quiebre_stock_receta';
            prod.fecha_modificacion_disp = new Date().toISOString();

            alertaStock = {
              insumo_id: insumo.id,
              insumo_nombre: insumo.nombre,
              unidad_medida: insumo.unidad_medida,
              pedido_id: targetComanda.pedido_id,
              numero_comanda: targetComanda.numero_comanda,
              mesa_codigo: targetComanda.mesa_codigo,
              plato_nombre: targetItem.nombre_producto,
              consumo_requerido: Number(consumoRequerido.toFixed(4)),
              stock_disponible: Number(stockAnterior.toFixed(4)),
              faltante_teorico: Number(faltante.toFixed(4)),
              timestamp: new Date().toISOString(),
            };
          } else {
            insumo.stock_actual = Number((insumo.stock_actual - consumoRequerido).toFixed(4));
            if (insumo.stock_actual <= 0) {
              insumo.stock_actual = 0;
              insumo.estado = 'agotado';
              prod.disponibilidad = 'agotado';
              prod.motivo_agotado = 'quiebre_stock_receta';
              prod.fecha_modificacion_disp = new Date().toISOString();

              alertaStock = {
                insumo_id: insumo.id,
                insumo_nombre: insumo.nombre,
                unidad_medida: insumo.unidad_medida,
                pedido_id: targetComanda.pedido_id,
                numero_comanda: targetComanda.numero_comanda,
                mesa_codigo: targetComanda.mesa_codigo,
                plato_nombre: targetItem.nombre_producto,
                consumo_requerido: Number(consumoRequerido.toFixed(4)),
                stock_disponible: Number(stockAnterior.toFixed(4)),
                faltante_teorico: 0,
                timestamp: new Date().toISOString(),
              };
            }
          }
        }
      }
    }

    mockComandasMemoria = mockComandasMemoria.map((comanda) => {
      const itemsActualizados = comanda.items.map((item) => {
        if (item.item_id === itemId) {
          return {
            ...item,
            estado: nuevoEstado,
            fecha_inicio_coccion:
              nuevoEstado === 'en_preparacion'
                ? new Date().toISOString()
                : item.fecha_inicio_coccion,
            fecha_listo_cocina:
              nuevoEstado === 'listo' ? new Date().toISOString() : item.fecha_listo_cocina,
            deshacer_hasta:
              nuevoEstado === 'listo' ? Date.now() + 30 * 1000 : null,
          };
        }
        return item;
      });
      return { ...comanda, items: itemsActualizados };
    });

    return {
      exito: true,
      datos: { item_id: itemId, estado: nuevoEstado, alerta_stock: alertaStock },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Deshace el cambio a 'listo' regresando el plato a 'en_preparacion' dentro de los 30s
   * Ejecuta rollback de stock y reactivación condicional de carta (CU-COCINA-03 Transacción 7.2)
   */
  async deshacerListoItem(
    itemId: string
  ): Promise<ApiResponse<{ item_id: string; estado: EstadoItemCocina }>> {
    let itemDeshacer: any = null;
    for (const comanda of mockComandasMemoria) {
      const it = comanda.items.find((i) => i.item_id === itemId);
      if (it) {
        itemDeshacer = it;
        break;
      }
    }

    if (itemDeshacer) {
      const prod = mockProductosCarta.find((p) => p.id === itemDeshacer.producto_id);
      if (prod && prod.insumo_requerido_id) {
        const insumo = mockInsumosAlmacen.find((ins) => ins.id === prod.insumo_requerido_id);
        if (insumo) {
          const cantidadDescuenta = prod.cantidad_descuenta || 0.004;
          const reposicion = itemDeshacer.cantidad * cantidadDescuenta;
          insumo.stock_actual = Number((insumo.stock_actual + reposicion).toFixed(4));
          if (insumo.stock_actual > 0) {
            insumo.estado = 'activo';
            // Reactivar en carta SOLO si fue apagado por receta (no altera apagados manuales del chef)
            if (prod.motivo_agotado === 'quiebre_stock_receta') {
              prod.disponibilidad = 'disponible';
              prod.motivo_agotado = null;
              prod.fecha_modificacion_disp = new Date().toISOString();
            }
          }
        }
      }
    }

    mockComandasMemoria = mockComandasMemoria.map((comanda) => ({
      ...comanda,
      items: comanda.items.map((item) => {
        if (item.item_id === itemId) {
          return {
            ...item,
            estado: 'en_preparacion',
            fecha_listo_cocina: null,
            deshacer_hasta: null,
          };
        }
        return item;
      }),
    }));

    return {
      exito: true,
      datos: { item_id: itemId, estado: 'en_preparacion' },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Despacha todos los platos culinarios de una comanda al pase de salón (CU-COCINA-02)
   */
  async despacharComandaCompleta(
    pedidoId: string
  ): Promise<ApiResponse<{ pedido_id: string; despachado: boolean }>> {
    const idx = mockComandasMemoria.findIndex((c) => c.pedido_id === pedidoId);
    if (idx !== -1) {
      const comanda = mockComandasMemoria[idx];
      mockComandasMemoria.splice(idx, 1);

      // Registrar en la bandeja de pedidos despachados recientes (CU-COCINA-02)
      const despachado: KDSPedidoDespachadoDTO = {
        pedido_id: comanda.pedido_id,
        numero_comanda: comanda.numero_comanda,
        mesa_codigo: comanda.mesa_codigo,
        mozo_nombre: comanda.mozo_nombre,
        piso_nombre: comanda.piso_nombre,
        total_items: comanda.items.length,
        fecha_despacho: new Date().toISOString(),
        minutos_desde_despacho: 0,
        puede_recuperar: true,
        items_resumen: comanda.items.map((i) => ({
          producto_nombre: i.nombre_producto,
          cantidad: i.cantidad,
          nota_cocina: i.nota_cocina,
        })),
      };
      mockDespachadosMemoria = [despachado, ...mockDespachadosMemoria];
    }

    return {
      exito: true,
      datos: { pedido_id: pedidoId, despachado: true },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Consulta las órdenes terminadas en los últimos 30 minutos (CU-COCINA-02)
   */
  async obtenerPedidosDespachados(): Promise<ApiResponse<KDSPedidoDespachadoDTO[]>> {
    const ahora = Date.now();
    const actualizados = mockDespachadosMemoria.map((d) => {
      const minutos = Math.max(0, Math.floor((ahora - new Date(d.fecha_despacho).getTime()) / 60000));
      return {
        ...d,
        minutos_desde_despacho: minutos,
        puede_recuperar: minutos <= 30,
      };
    });

    return {
      exito: true,
      datos: actualizados,
      meta: { timestamp: new Date().toISOString(), total: actualizados.length },
    };
  },

  /**
   * Métricas operativas de despacho para la cabecera del modal de histórico
   */
  async obtenerMetricasDespacho(): Promise<ApiResponse<MetricasDespachoDTO>> {
    const ahora = Date.now();
    const recientes30m = mockDespachadosMemoria.filter((d) => {
      const minutos = (ahora - new Date(d.fecha_despacho).getTime()) / 60000;
      return minutos <= 30;
    }).length;

    return {
      exito: true,
      datos: {
        despachadosUltimos30m: recientes30m,
        tiempoPromedioCoccionMin: 11.6,
        tiempoPromedioPaseMin: 2.2,
        totalTurnoHoy: 42 + mockDespachadosMemoria.length,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Recupera una comanda despachada devolviéndola al tablero activo del KDS (Recall 30m - CU-COCINA-02)
   */
  async recuperarPedidoDespachado(
    pedidoId: string
  ): Promise<ApiResponse<{ pedido_id: string; recuperado: boolean }>> {
    const idx = mockDespachadosMemoria.findIndex((d) => d.pedido_id === pedidoId);
    if (idx === -1) {
      return {
        exito: false,
        datos: { pedido_id: pedidoId, recuperado: false },
        errores: [{ codigo: 'PEDIDO_NO_ENCONTRADO', mensaje: 'El pedido no se encuentra en el historial.' }],
      };
    }

    const itemDespachado = mockDespachadosMemoria[idx];
    const minutos = (Date.now() - new Date(itemDespachado.fecha_despacho).getTime()) / 60000;
    if (minutos > 30) {
      return {
        exito: false,
        datos: { pedido_id: pedidoId, recuperado: false },
        errores: [{ codigo: 'TIEMPO_EXCEDIDO', mensaje: 'No es posible recuperar pedidos despachados hace más de 30 minutos.' }],
      };
    }

    mockDespachadosMemoria.splice(idx, 1);

    // Reinsertar en el tablero activo con sus platos en fuego
    const comandaRecuperada: KDSComandaDTO = {
      pedido_id: itemDespachado.pedido_id,
      numero_comanda: itemDespachado.numero_comanda,
      mesa_codigo: itemDespachado.mesa_codigo,
      es_mesa_agrupada: false,
      mozo_nombre: itemDespachado.mozo_nombre,
      piso_nombre: itemDespachado.piso_nombre,
      ronda_numero: 1,
      ronda_tipo: 'inicial',
      comensales: 4,
      fecha_envio: itemDespachado.fecha_despacho,
      minutos_espera: Math.floor(minutos),
      segundos_transcurridos: Math.floor(minutos * 60),
      semaforo_color: minutos > 25 ? 'rojo' : minutos > 15 ? 'ambar' : 'verde',
      bebidas_salon_count: 0,
      items: itemDespachado.items_resumen.map((it, i) => ({
        item_id: `recup-${Date.now()}-${i}`,
        producto_id: `prod-recup-${i}`,
        nombre_producto: it.producto_nombre,
        cantidad: it.cantidad,
        estado: 'en_preparacion',
        categoria_id: 'cat-recuperados',
        categoria_nombre: 'Platos Criollos',
        nota_cocina: it.nota_cocina,
        fecha_inicio_coccion: new Date().toISOString(),
        receta_resumen: 'Insumos reingresados a inventario (Rollback de bodega)',
      })),
    };

    mockComandasMemoria = [comandaRecuperada, ...mockComandasMemoria];

    return {
      exito: true,
      datos: { pedido_id: pedidoId, recuperado: true },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Acción masiva por tanda: Poner en fuego todas las raciones en cola de un plato (CU-COCINA-02 Vista 3)
   */
  async ponerEnFuegoPorTanda(
    productoId: string
  ): Promise<ApiResponse<{ producto_id: string; actualizados: number }>> {
    let actualizados = 0;
    mockComandasMemoria = mockComandasMemoria.map((c) => ({
      ...c,
      items: c.items.map((it) => {
        if (it.producto_id === productoId && it.estado === 'en_cola') {
          actualizados += it.cantidad;
          return {
            ...it,
            estado: 'en_preparacion',
            fecha_inicio_coccion: new Date().toISOString(),
          };
        }
        return it;
      }),
    }));

    return {
      exito: true,
      datos: { producto_id: productoId, actualizados },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Acción masiva por tanda: Marcar listos los platos en fuego de un producto (FIFO) (CU-COCINA-02 Vista 3)
   */
  async marcarListoPorTanda(
    productoId: string,
    cantidadRaciones: number
  ): Promise<ApiResponse<{ producto_id: string; listos: number }>> {
    let restantes = cantidadRaciones;
    let listos = 0;

    mockComandasMemoria = mockComandasMemoria.map((c) => ({
      ...c,
      items: c.items.map((it) => {
        if (it.producto_id === productoId && it.estado === 'en_preparacion' && restantes > 0) {
          const porciones = Math.min(it.cantidad, restantes);
          restantes -= porciones;
          listos += porciones;
          return {
            ...it,
            estado: 'listo',
            fecha_listo_cocina: new Date().toISOString(),
            deshacer_hasta: Date.now() + 30 * 1000,
          };
        }
        return it;
      }),
    }));

    return {
      exito: true,
      datos: { producto_id: productoId, listos },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Genera el consolidado All-Day agrupado por categorías de la carta
   */
  async obtenerConsolidadoAllDay(): Promise<ApiResponse<ConsolidadoAllDayDTO[]>> {
    // Mapa: categoria_nombre -> ConsolidadoAllDayDTO
    const mapaCategorias: Record<string, ConsolidadoAllDayDTO> = {};

    mockComandasMemoria.forEach((comanda) => {
      comanda.items.forEach((item) => {
        if (item.estado === 'listo' || item.estado === 'anulado') return;

        const cat = item.categoria_nombre;
        if (!mapaCategorias[cat]) {
          mapaCategorias[cat] = {
            categoria_nombre: cat,
            total_raciones: 0,
            platos: [],
          };
        }

        mapaCategorias[cat].total_raciones += item.cantidad;

        let platoCons = mapaCategorias[cat].platos.find(
          (p) => p.producto_id === item.producto_id
        );

        if (!platoCons) {
          platoCons = {
            producto_id: item.producto_id,
            nombre_producto: item.nombre_producto,
            categoria_nombre: cat,
            cantidad_total: 0,
            cantidad_en_fuego: 0,
            cantidad_critica: 0,
            detalle_mesas: [],
          };
          mapaCategorias[cat].platos.push(platoCons);
        }

        platoCons.cantidad_total += item.cantidad;
        if (item.estado === 'en_preparacion') {
          platoCons.cantidad_en_fuego += item.cantidad;
        }
        if (comanda.semaforo_color === 'rojo') {
          platoCons.cantidad_critica += item.cantidad;
        }

        platoCons.detalle_mesas.push({
          mesa_codigo: comanda.mesa_codigo,
          cantidad: item.cantidad,
          nota_cocina: item.nota_cocina,
          minutos_espera: comanda.minutos_espera,
          estado: item.estado as 'en_cola' | 'en_preparacion',
        });
      });
    });

    const resultado = Object.values(mapaCategorias);
    return {
      exito: true,
      datos: resultado,
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Simula la inyección de una nueva comanda desde la Tablet de Mozo (CU-MOZO-02)
   */
  simularNuevaComandaMozo(): KDSComandaDTO {
    const nuevaComanda: KDSComandaDTO = {
      pedido_id: `ped-kds-demo-${Date.now()}`,
      numero_comanda: Math.floor(150 + Math.random() * 20),
      mesa_codigo: '05',
      es_mesa_agrupada: false,
      mozo_nombre: 'Carlos Mendoza',
      piso_nombre: 'Salón Principal',
      ronda_numero: 1,
      ronda_tipo: 'inicial',
      comensales: 3,
      fecha_envio: new Date().toISOString(),
      minutos_espera: 0,
      segundos_transcurridos: 0,
      semaforo_color: 'verde',
      bebidas_salon_count: 3,
      items: [
        {
          item_id: `item-demo-${Date.now()}-1`,
          producto_id: 'prod-lomo-saltado',
          nombre_producto: 'Lomo Saltado Criollo',
          cantidad: 1,
          estado: 'en_cola',
          categoria_id: 'cat-criollos',
          categoria_nombre: 'Platos Criollos',
          nota_cocina: 'Término medio • Papas bien doradas',
          receta_resumen: '0.200 kg Carne Lomo Fino • 0.007 sacos Papa Yungay',
        },
        {
          item_id: `item-demo-${Date.now()}-2`,
          producto_id: 'prod-ceviche-mixto',
          nombre_producto: 'Ceviche Mixto Tradicional',
          cantidad: 1,
          estado: 'en_cola',
          categoria_id: 'cat-ceviches',
          categoria_nombre: 'Ceviches y Fríos',
          nota_cocina: 'Picante medio',
          receta_resumen: '0.200 kg Pescado Corvina • 0.100 kg Mixtura Mariscos',
        },
      ],
    };

    mockComandasMemoria.unshift(nuevaComanda);
    return nuevaComanda;
  },

  /**
   * Simula el evento reactivo SSE de Parada de Fogones (item_pedido_anulado desde CU-MOZO-06)
   */
  simularAnulacionSSE(): ItemAnuladoSSEEvent {
    // Tomar un plato de Mesa 04 para anularlo
    const comanda04 = mockComandasMemoria.find((c) => c.mesa_codigo === '04');
    let itemId = 'item-kds-101';
    let prodNombre = 'Lomo Saltado Criollo';

    if (comanda04 && comanda04.items.length > 0) {
      itemId = comanda04.items[0].item_id;
      prodNombre = comanda04.items[0].nombre_producto;
      comanda04.items[0].estado = 'anulado';
    }

    return {
      item_id: itemId,
      pedido_id: 'ped-kds-001',
      nombre_producto: prodNombre,
      mesa_codigo: '04',
      mozo_nombre: 'Carlos Mendoza',
      motivo_anulacion: 'Demora excesiva en entrega. Comensal desistió del plato.',
      es_merma: false,
      minutos_transcurridos: 25,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Obtiene el catálogo completo de platos con disponibilidad y conteo de órdenes activas (CU-COCINA-04)
   */
  async obtenerCatalogoDisponibilidad(): Promise<ApiResponse<PlatoDisponibilidadDTO[]>> {
    const catalogo: PlatoDisponibilidadDTO[] = mockProductosCarta.map((prod) => {
      let enCola = 0;
      let enFuego = 0;

      mockComandasMemoria.forEach((c) => {
        c.items.forEach((it) => {
          if (it.producto_id === prod.id) {
            if (it.estado === 'en_cola') enCola += it.cantidad;
            if (it.estado === 'en_preparacion') enFuego += it.cantidad;
          }
        });
      });

      let insumoBloqueante: string | null = null;
      if (prod.insumo_requerido_id) {
        const ins = mockInsumosAlmacen.find((i) => i.id === prod.insumo_requerido_id);
        if (ins && ins.stock_actual <= 0) {
          insumoBloqueante = `${ins.nombre} (Stock: 0 ${ins.unidad_medida})`;
        }
      }

      return {
        producto_id: prod.id,
        nombre: prod.nombre,
        categoria_id: prod.categoria_id,
        categoria_nombre: prod.categoria_nombre,
        precio: prod.precio,
        foto_url: prod.foto_url,
        disponibilidad: prod.disponibilidad,
        motivo_agotado: prod.motivo_agotado,
        fecha_modificacion_disp: prod.fecha_modificacion_disp,
        usuario_modifico_nombre: prod.usuario_modifico_nombre,
        receta_resumen: prod.receta_resumen,
        insumo_bloqueante: insumoBloqueante,
        ordenes_en_cola: enCola,
        ordenes_en_fuego: enFuego,
      };
    });

    return {
      exito: true,
      datos: catalogo,
      meta: { timestamp: new Date().toISOString(), total: catalogo.length },
    };
  },

  /**
   * Obtiene la lista de órdenes activas en fuego para un plato (CU-COCINA-04 Vista 2)
   */
  async obtenerItemsEnFuegoDeProducto(
    productoId: string
  ): Promise<ApiResponse<ItemEnFuegoResolucionDTO[]>> {
    const itemsEnFuego: ItemEnFuegoResolucionDTO[] = [];

    mockComandasMemoria.forEach((comanda) => {
      comanda.items.forEach((it) => {
        if (it.producto_id === productoId && it.estado === 'en_preparacion') {
          itemsEnFuego.push({
            item_id: it.item_id,
            pedido_id: comanda.pedido_id,
            numero_comanda: comanda.numero_comanda,
            mesa_codigo: comanda.mesa_codigo,
            mozo_nombre: comanda.mozo_nombre,
            cantidad: it.cantidad,
            minutos_espera: comanda.minutos_espera,
            cubierto: true,
          });
        }
      });
    });

    itemsEnFuego.sort((a, b) => b.minutos_espera - a.minutos_espera);

    return {
      exito: true,
      datos: itemsEnFuego,
      meta: { timestamp: new Date().toISOString(), total: itemsEnFuego.length },
    };
  },

  /**
   * Conmuta disponibilidad directa de un plato (cuando no hay raciones en fuego)
   */
  async conmutarDisponibilidadPlatoDirecto(
    productoId: string,
    nuevoEstado: 'disponible' | 'agotado'
  ): Promise<ApiResponse<{ producto_id: string; disponibilidad: 'disponible' | 'agotado'; requiere_resolucion?: boolean }>> {
    const prod = mockProductosCarta.find((p) => p.id === productoId);
    if (!prod) {
      return {
        exito: false,
        datos: { producto_id: productoId, disponibilidad: 'disponible' },
        errores: [{ codigo: 'PRODUCTO_NO_ENCONTRADO', mensaje: 'El producto no existe en la carta.' }],
      };
    }

    if (nuevoEstado === 'disponible') {
      if (prod.insumo_requerido_id) {
        const ins = mockInsumosAlmacen.find((i) => i.id === prod.insumo_requerido_id);
        if (ins && ins.stock_actual <= 0) {
          return {
            exito: false,
            datos: { producto_id: productoId, disponibilidad: 'agotado' },
            errores: [
              {
                codigo: 'BLOQUEO_STOCK_TEORICO',
                mensaje: `No es posible reactivar manualmente "${prod.nombre}". El insumo "${ins.nombre}" tiene 0 existencias en almacén. Requiere recepción de compras (CU-ADMIN-06/07).`,
              },
            ],
          };
        }
      }

      prod.disponibilidad = 'disponible';
      prod.motivo_agotado = null;
      prod.usuario_modifico_nombre = 'Marco V. (Chef)';
      prod.fecha_modificacion_disp = new Date().toISOString();

      return {
        exito: true,
        datos: { producto_id: productoId, disponibilidad: 'disponible' },
        meta: { timestamp: new Date().toISOString() },
      };
    } else {
      let racionesEnFuego = 0;
      mockComandasMemoria.forEach((c) => {
        c.items.forEach((it) => {
          if (it.producto_id === productoId && it.estado === 'en_preparacion') {
            racionesEnFuego += it.cantidad;
          }
        });
      });

      if (racionesEnFuego > 0) {
        return {
          exito: true,
          datos: { producto_id: productoId, disponibilidad: 'disponible', requiere_resolucion: true },
          meta: { timestamp: new Date().toISOString() },
        };
      }

      // Si no hay órdenes en fuego, conmutar las órdenes en cola a anulado (no_disponible)
      mockComandasMemoria = mockComandasMemoria.map((c) => ({
        ...c,
        items: c.items.map((it) => {
          if (it.producto_id === productoId && it.estado === 'en_cola') {
            return {
              ...it,
              estado: 'anulado',
              nota_cocina: '🚫 No disponible: plato apagado en cocina',
            };
          }
          return it;
        }),
      }));

      prod.disponibilidad = 'agotado';
      prod.motivo_agotado = 'apagado_manual_cocina';
      prod.usuario_modifico_nombre = 'Marco V. (Chef)';
      prod.fecha_modificacion_disp = new Date().toISOString();

      return {
        exito: true,
        datos: { producto_id: productoId, disponibilidad: 'agotado' },
        meta: { timestamp: new Date().toISOString() },
      };
    }
  },

  /**
   * Confirma la resolución granular de fuego activo ante quiebre de plato (CU-COCINA-04 Vista 2)
   */
  async confirmarResolucionFuego(
    productoId: string,
    itemsEnFuegoNoAlcanzadosIds: string[],
    motivoAnulacion: string
  ): Promise<ApiResponse<{ producto_id: string; totalAnulados: number }>> {
    const prod = mockProductosCarta.find((p) => p.id === productoId);
    if (prod) {
      prod.disponibilidad = 'agotado';
      prod.motivo_agotado = 'apagado_manual_cocina';
      prod.usuario_modifico_nombre = 'Marco V. (Chef)';
      prod.fecha_modificacion_disp = new Date().toISOString();
    }

    let anulados = 0;

    mockComandasMemoria = mockComandasMemoria.map((c) => ({
      ...c,
      items: c.items.map((it) => {
        if (it.producto_id === productoId) {
          if (it.estado === 'en_cola') {
            anulados += it.cantidad;
            return {
              ...it,
              estado: 'anulado',
              nota_cocina: `🚫 No disponible: ${motivoAnulacion}`,
            };
          }
          if (it.estado === 'en_preparacion' && itemsEnFuegoNoAlcanzadosIds.includes(it.item_id)) {
            anulados += it.cantidad;
            return {
              ...it,
              estado: 'anulado',
              nota_cocina: `🚫 No disponible en fuego: ${motivoAnulacion}`,
            };
          }
        }
        return it;
      }),
    }));

    return {
      exito: true,
      datos: { producto_id: productoId, totalAnulados: anulados },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Simula un consumo que agota el Aceite Vegetal y dispara la alerta reactiva (Demo CU-03)
   */
  simularConsumoStockCritico(): AlertaStockInsuficienteSSE {
    const insumo = mockInsumosAlmacen.find((i) => i.id === 'ins-aceite-vegetal')!;
    const stockPrevio = insumo.stock_actual;
    insumo.stock_actual = 0;
    insumo.estado = 'agotado';

    const prod = mockProductosCarta.find((p) => p.id === 'prod-lomo-saltado')!;
    prod.disponibilidad = 'agotado';
    prod.motivo_agotado = 'quiebre_stock_receta';
    prod.usuario_modifico_nombre = 'Sistema (Kardex Automático)';
    prod.fecha_modificacion_disp = new Date().toISOString();

    return {
      insumo_id: insumo.id,
      insumo_nombre: insumo.nombre,
      unidad_medida: insumo.unidad_medida,
      pedido_id: 'ped-kds-001',
      numero_comanda: 149,
      mesa_codigo: '04',
      plato_nombre: prod.nombre,
      consumo_requerido: 0.008,
      stock_disponible: stockPrevio,
      faltante_teorico: 0.003,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Restablece las comandas de demostración iniciales
   */
  restablecerComandasIniciales() {
    mockComandasMemoria = [
      {
        pedido_id: 'ped-kds-001',
        numero_comanda: 149,
        mesa_codigo: '04',
        es_mesa_agrupada: false,
        mozo_nombre: 'Carlos Mendoza',
        piso_nombre: 'Salón Principal',
        ronda_numero: 1,
        ronda_tipo: 'inicial',
        comensales: 4,
        fecha_envio: new Date(Date.now() - 8 * 60 * 1000 - 30 * 1000).toISOString(),
        minutos_espera: 8,
        segundos_transcurridos: 8 * 60 + 30,
        semaforo_color: 'verde',
        bebidas_salon_count: 2,
        items: [
          {
            item_id: 'item-kds-101',
            producto_id: 'prod-lomo-saltado',
            nombre_producto: 'Lomo Saltado Criollo',
            cantidad: 2,
            estado: 'en_preparacion',
            categoria_id: 'cat-criollos',
            categoria_nombre: 'Platos Criollos',
            nota_cocina: 'Término 3/4 • Una porción sin cebolla (alergia)',
            fecha_inicio_coccion: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
            receta_resumen: '0.400 kg Carne Lomo Fino • 0.014 sacos Papa Yungay • 0.004 bidones Aceite Vegetal',
          },
          {
            item_id: 'item-kds-102',
            producto_id: 'prod-causa-limena',
            nombre_producto: 'Causa Limeña de Pollo',
            cantidad: 1,
            estado: 'listo',
            categoria_id: 'cat-frios',
            categoria_nombre: 'Entradas y Fríos',
            nota_cocina: null,
            fecha_inicio_coccion: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
            fecha_listo_cocina: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            receta_resumen: '0.250 kg Papa Amarilla prensada • 0.150 kg Pechuga Pollo • 0.050 kg Palta Fuerte',
          },
        ],
      },
      {
        pedido_id: 'ped-kds-002',
        numero_comanda: 147,
        mesa_codigo: '01',
        es_mesa_agrupada: false,
        mozo_nombre: 'Ana Paredes',
        piso_nombre: 'Salón Principal',
        ronda_numero: 1,
        ronda_tipo: 'inicial',
        comensales: 2,
        fecha_envio: new Date(Date.now() - 18 * 60 * 1000 - 45 * 1000).toISOString(),
        minutos_espera: 18,
        segundos_transcurridos: 18 * 60 + 45,
        semaforo_color: 'ambar',
        bebidas_salon_count: 1,
        items: [
          {
            item_id: 'item-kds-201',
            producto_id: 'prod-ceviche-mixto',
            nombre_producto: 'Ceviche Mixto Tradicional',
            cantidad: 1,
            estado: 'en_cola',
            categoria_id: 'cat-ceviches',
            categoria_nombre: 'Ceviches y Fríos',
            nota_cocina: '⚠️ Sin ají • Hielo aparte para la leche de tigre',
            fecha_inicio_coccion: null,
            receta_resumen: '0.200 kg Pescado Corvina • 0.100 kg Mixtura Mariscos • 0.050 kg Limón Sutil',
          },
          {
            item_id: 'item-kds-202',
            producto_id: 'prod-arroz-mariscos',
            nombre_producto: 'Arroz con Mariscos',
            cantidad: 1,
            estado: 'en_preparacion',
            categoria_id: 'cat-criollos',
            categoria_nombre: 'Platos Criollos',
            nota_cocina: 'Conchas negras cocidas al dente',
            fecha_inicio_coccion: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            receta_resumen: '0.300 kg Arroz Extra • 0.150 kg Mixtura Mariscos • 0.020 kg Pasta Ají Amarillo',
          },
        ],
      },
      {
        pedido_id: 'ped-kds-003',
        numero_comanda: 148,
        mesa_codigo: '[ 02 ; 03 ]',
        es_mesa_agrupada: true,
        mozo_nombre: 'Carlos Mendoza',
        piso_nombre: 'Salón Principal',
        ronda_numero: 2,
        ronda_tipo: 'adicional',
        comensales: 8,
        fecha_envio: new Date(Date.now() - 21 * 60 * 1000 - 10 * 1000).toISOString(),
        minutos_espera: 21,
        segundos_transcurridos: 21 * 60 + 10,
        semaforo_color: 'ambar',
        bebidas_salon_count: 4,
        items: [
          {
            item_id: 'item-kds-301',
            producto_id: 'prod-pollo-brasa',
            nombre_producto: '1/2 Pollo a la Brasa',
            cantidad: 3,
            estado: 'en_preparacion',
            categoria_id: 'cat-brasas',
            categoria_nombre: 'Brasas y Horno',
            nota_cocina: 'Papas crocantes • Servicio familiar conjunto',
            fecha_inicio_coccion: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            receta_resumen: '1.500 und Pollo Entero Marinado • 0.040 sacos Papa Yungay',
          },
          {
            item_id: 'item-kds-302',
            producto_id: 'prod-tequenos',
            nombre_producto: 'Porción Tequeños Criollos',
            cantidad: 1,
            estado: 'en_cola',
            categoria_id: 'cat-frios',
            categoria_nombre: 'Entradas y Fríos',
            nota_cocina: 'Con salsa guacamole casera',
            fecha_inicio_coccion: null,
            receta_resumen: '0.120 kg Queso Paria • 12 und Masa Wantán • 0.060 kg Palta Fuerte',
          },
        ],
      },
      {
        pedido_id: 'ped-kds-004',
        numero_comanda: 145,
        mesa_codigo: '07',
        es_mesa_agrupada: false,
        mozo_nombre: 'Carlos Mendoza',
        piso_nombre: 'Terraza Jardín',
        ronda_numero: 1,
        ronda_tipo: 'inicial',
        comensales: 3,
        fecha_envio: new Date(Date.now() - 28 * 60 * 1000 - 50 * 1000).toISOString(),
        minutos_espera: 28,
        segundos_transcurridos: 28 * 60 + 50,
        semaforo_color: 'rojo',
        bebidas_salon_count: 2,
        items: [
          {
            item_id: 'item-kds-401',
            producto_id: 'prod-bife-angosto',
            nombre_producto: 'Bife Angosto Criollo',
            cantidad: 2,
            estado: 'en_cola',
            categoria_id: 'cat-criollos',
            categoria_nombre: 'Platos Criollos',
            nota_cocina: 'Término 3/4 • Comensal consulta demora con mozo',
            fecha_inicio_coccion: null,
            receta_resumen: '0.600 kg Carne Bife Angosto • 0.200 kg Papas Nativas • 0.050 kg Mantequilla',
          },
          {
            item_id: 'item-kds-402',
            producto_id: 'prod-pastel-choclo',
            nombre_producto: 'Pastel de Choclo Criollo',
            cantidad: 1,
            estado: 'listo',
            categoria_id: 'cat-criollos',
            categoria_nombre: 'Platos Criollos',
            nota_cocina: null,
            fecha_inicio_coccion: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            fecha_listo_cocina: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
            receta_resumen: '0.300 kg Choclo Desgranado • 0.100 kg Carne Molida • 0.050 kg Pasas Morenas',
          },
        ],
      },
    ];
  },
};
