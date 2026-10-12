import { ApiResponse } from '@/types/api';
import {
  PlanoCompletoMozoDTO,
  MesaDetalleMozoDTO,
  ItemDespachoListoDTO,
  MesaCardDTO,
  PisoAmbienteDTO,
  AlertaCocinaModalDTO,
} from '@/types/mozo';

// ID canónico del mozo activo de prueba
const MOZO_ACTUAL = {
  id: 'usr-mozo-carlos-001',
  nombre: 'Carlos Mendoza',
  rol: 'mozo',
};

// Pisos configurados del local
const PISOS_MOCK: PisoAmbienteDTO[] = [
  {
    id: 'piso-01-salon',
    nombre: 'Salón Principal',
    total_mesas: 10,
    mesas_ocupadas: 6,
    mesas_libres: 4,
  },
  {
    id: 'piso-02-terraza',
    nombre: 'Terraza Al Aire Libre',
    total_mesas: 4,
    mesas_ocupadas: 2,
    mesas_libres: 2,
  },
  {
    id: 'piso-03-barra',
    nombre: 'Barra & Cócteles',
    total_mesas: 3,
    mesas_ocupadas: 1,
    mesas_libres: 2,
  },
];

// Mesas del Salón Principal
let MESAS_SALON_MOCK: MesaCardDTO[] = [
  {
    id: 'mesa-01',
    piso_id: 'piso-01-salon',
    numero: '01',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: true,
    estado: 'libre',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-02',
    piso_id: 'piso-01-salon',
    numero: '02',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: true,
    estado: 'ocupada',
    pedido_id: 'ped-148',
    comensales_sentados: 2,
    minutos_ocupada: 34,
    total_consumo: 145.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 0,
    platos_en_cocina: 3,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-03',
    piso_id: 'piso-01-salon',
    numero: '03',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: true,
    estado: 'libre',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-04',
    piso_id: 'piso-01-salon',
    numero: '04',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 0,
    permite_union: true,
    estado: 'ocupada',
    pedido_id: 'ped-149',
    comensales_sentados: 4,
    minutos_ocupada: 12,
    total_consumo: 94.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 2,
    platos_en_cocina: 1,
    despacho_directo_pendiente: 2,
  },
  {
    id: 'mesa-05',
    piso_id: 'piso-01-salon',
    numero: '05',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 0,
    posicion_y: 1,
    permite_union: false,
    estado: 'cuenta_pedida',
    pedido_id: 'ped-145',
    comensales_sentados: 5,
    minutos_ocupada: 52,
    total_consumo: 210.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-06',
    piso_id: 'piso-01-salon',
    numero: '06',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 1,
    permite_union: true,
    estado: 'ocupada',
    pedido_id: 'ped-150',
    comensales_sentados: 2,
    minutos_ocupada: 25,
    total_consumo: 168.0,
    mozo_id: 'usr-mozo-ana-002',
    mozo_nombre: 'Ana Paredes',
    es_mi_mesa: false,
    platos_listos: 1,
    platos_en_cocina: 2,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-07',
    piso_id: 'piso-01-salon',
    numero: '07',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 2,
    posicion_y: 1,
    permite_union: false,
    estado: 'ocupada',
    pedido_id: 'ped-151',
    comensales_sentados: 3,
    minutos_ocupada: 18,
    total_consumo: 92.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 0,
    platos_en_cocina: 2,
    despacho_directo_pendiente: 1,
  },
  {
    id: 'mesa-08',
    piso_id: 'piso-01-salon',
    numero: '08',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 1,
    permite_union: true,
    estado: 'bloqueada',
    reserva_cliente: 'Familia Gómez',
    reserva_hora: '14:00',
    minutos_para_reserva: 20,
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-09',
    piso_id: 'piso-01-salon',
    numero: '09',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 2,
    permite_union: true,
    estado: 'libre',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-10',
    piso_id: 'piso-01-salon',
    numero: '10',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 1,
    posicion_y: 2,
    permite_union: true,
    etiqueta_union: 'Mesa [ 10 ; 11 ]',
    estado: 'ocupada',
    pedido_id: 'ped-144',
    comensales_sentados: 6,
    minutos_ocupada: 45,
    total_consumo: 280.0,
    mozo_id: 'usr-mozo-ana-002',
    mozo_nombre: 'Ana Paredes',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 1,
    despacho_directo_pendiente: 0,
  },
];

// Ítems para la Barra Lateral de Despacho en Vivo
let ITEMS_DESPACHO_MOCK: ItemDespachoListoDTO[] = [
  // ⚡ Productos de despacho directo en salón (Entrega directa: bebidas, gelatinas, postres de vitrina)
  {
    item_id: 'item-despacho-01',
    pedido_id: 'ped-149',
    mesa_id: 'mesa-04',
    mesa_numero: '04',
    ambiente: 'Salón Principal',
    producto_nombre: 'Inca Kola 500ml',
    cantidad: 2,
    nota_especial: 'Heladas con vaso con hielo',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 30,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-02-gelatina',
    pedido_id: 'ped-149',
    mesa_id: 'mesa-04',
    mesa_numero: '04',
    ambiente: 'Salón Principal',
    producto_nombre: 'Gelatina de Fresa de Vitrina',
    cantidad: 2,
    nota_especial: 'Servir fría con leche condensada',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 45,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-02',
    pedido_id: 'ped-151',
    mesa_id: 'mesa-07',
    mesa_numero: '07',
    ambiente: 'Salón Principal',
    producto_nombre: 'Limonada Frozen 1L',
    cantidad: 1,
    nota_especial: 'Sin azúcar adicional',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 75,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-05-postre',
    pedido_id: 'ped-148',
    mesa_id: 'mesa-02',
    mesa_numero: '02',
    ambiente: 'Salón Principal',
    producto_nombre: 'Porción Crema Volteada de Vitrina',
    cantidad: 1,
    nota_especial: 'Porción individual de mostrador',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 90,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },

  // 🔔 Platos listos en pase de cocina KDS
  {
    item_id: 'item-despacho-03',
    pedido_id: 'ped-149',
    mesa_id: 'mesa-04',
    mesa_numero: '04',
    ambiente: 'Salón Principal',
    producto_nombre: 'Lomo Saltado Criollo',
    cantidad: 2,
    nota_especial: 'Término 3/4, papas crocantes',
    requiere_preparacion: true,
    tipo_despacho: 'cocina',
    pase_cocina: 'Pase Caliente #01',
    segundos_listo: 45,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-04',
    pedido_id: 'ped-150',
    mesa_id: 'mesa-06',
    mesa_numero: '06',
    ambiente: 'Salón Principal',
    producto_nombre: 'Ceviche Clásico del Día',
    cantidad: 1,
    nota_especial: 'Picante medio',
    requiere_preparacion: true,
    tipo_despacho: 'cocina',
    pase_cocina: 'Pase Frío #01',
    segundos_listo: 120,
    mozo_nombre: 'Ana Paredes',
    es_mi_mesa: false,
  },
];

// Detalle enriquecido para el Quick-Drawer al tocar Mesa 04
const DETALLE_MESA_04: MesaDetalleMozoDTO = {
  mesa_id: 'mesa-04',
  numero: '04',
  ambiente: 'Salón Principal',
  estado: 'ocupada',
  comanda_id: 'ped-149',
  numero_comanda: 149,
  mozo_nombre: MOZO_ACTUAL.nombre,
  es_mi_mesa: true,
  minutos_en_mesa: 12,
  comensales: 4,
  hora_apertura: '13:48',
  nota_general: 'Celebrando cumpleaños. Al final traer cortesía de postre con velita.',
  total_subtotal: 158.0,
  items: [
    // Platos de cocina KDS
    {
      id: 'it-01',
      producto_id: 'prod-lomo',
      producto_nombre: 'Lomo Saltado Criollo',
      cantidad: 2,
      precio_unitario: 38.0,
      subtotal: 76.0,
      nota_cocina: 'Término 3/4, papas bien crocantes',
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      estado: 'listo',
      minutos_en_estado: 1,
      numero_ronda: 1,
    },
    {
      id: 'it-02',
      producto_id: 'prod-suspiro',
      producto_nombre: 'Suspiro a la Limeña',
      cantidad: 1,
      precio_unitario: 18.0,
      subtotal: 18.0,
      nota_cocina: 'Poner velita de cumpleaños',
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      estado: 'en_preparacion',
      minutos_en_estado: 8,
      numero_ronda: 1,
    },
    {
      id: 'it-03',
      producto_id: 'prod-causa',
      producto_nombre: 'Causa Limeña de Pollo',
      cantidad: 1,
      precio_unitario: 24.0,
      subtotal: 24.0,
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      estado: 'entregado',
      minutos_en_estado: 10,
      numero_ronda: 1,
    },

    // Productos de despacho directo en salón (Entrega directa)
    {
      id: 'it-04',
      producto_id: 'prod-inca-500',
      producto_nombre: 'Inca Kola 500ml',
      cantidad: 2,
      precio_unitario: 9.0,
      subtotal: 18.0,
      nota_cocina: 'Helada con vaso con hielo',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      estado: 'listo',
      minutos_en_estado: 1,
      numero_ronda: 1,
    },
    {
      id: 'it-04-gelatina',
      producto_id: 'prod-gelatina',
      producto_nombre: 'Gelatina de Fresa de Vitrina',
      cantidad: 2,
      precio_unitario: 6.0,
      subtotal: 12.0,
      nota_cocina: 'Servir fría con leche condensada',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      estado: 'listo',
      minutos_en_estado: 1,
      numero_ronda: 1,
    },
    {
      id: 'it-05',
      producto_id: 'prod-chicha',
      producto_nombre: 'Jarra de Chicha Morada 1L',
      cantidad: 1,
      precio_unitario: 22.0,
      subtotal: 22.0,
      nota_cocina: 'Hielo aparte',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      estado: 'entregado',
      minutos_en_estado: 11,
      numero_ronda: 1,
    },
  ],
};

export const mockMozoService = {
  /**
   * Obtiene la carga completa del salón para el mozo
   */
  async obtenerPlanoCompleto(pisoId = 'piso-01-salon'): Promise<ApiResponse<PlanoCompletoMozoDTO>> {
    await new Promise((res) => setTimeout(res, 250));

    const pisoActivo = PISOS_MOCK.find((p) => p.id === pisoId) || PISOS_MOCK[0];
    const misMesas = MESAS_SALON_MOCK.filter((m) => m.es_mi_mesa && m.estado === 'ocupada').length;
    const totalVenta = MESAS_SALON_MOCK.filter((m) => m.es_mi_mesa).reduce(
      (sum, m) => sum + (m.total_consumo || 0),
      0
    );

    return {
      exito: true,
      datos: {
        piso_activo: pisoActivo,
        pisos_disponibles: PISOS_MOCK,
        mesas: MESAS_SALON_MOCK,
        items_despacho: ITEMS_DESPACHO_MOCK,
        comandas_preparacion: [
          {
            pedido_id: 'ped-148',
            mesa_numero: '02',
            numero_comanda: 148,
            minutos_transcurridos: 14,
            total_items: 3,
            items_en_fuego: 2,
          },
          {
            pedido_id: 'ped-151',
            mesa_numero: '07',
            numero_comanda: 151,
            minutos_transcurridos: 6,
            total_items: 2,
            items_en_fuego: 2,
          },
        ],
        alertas_operativas: [
          {
            id: 'alerta-01',
            tipo: 'quiebre_insumo',
            titulo: 'Quiebre de Insumo en Cocina',
            descripcion: 'Papa Amarilla agotada. Mesa 07 requiere sustitución de Causa Limeña.',
            mesa_numero: '07',
            hora: '13:52',
          },
        ],
        mesas_libres: 4,
        mesas_ocupadas: 6,
        total_mesas: 10,
        mis_mesas_activas: misMesas,
        total_venta_turno: totalVenta,
        mozo_actual: MOZO_ACTUAL,
      },
    };
  },

  /**
   * Obtiene el detalle de inspección de una mesa para el Quick-Drawer
   */
  async obtenerDetalleMesa(mesaId: string): Promise<ApiResponse<MesaDetalleMozoDTO>> {
    await new Promise((res) => setTimeout(res, 180));

    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);

    if (mesaId === 'mesa-04') {
      return { exito: true, datos: DETALLE_MESA_04 };
    }

    // Respuesta genérica para otras mesas ocupadas
    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        numero: mesa?.numero || '01',
        ambiente: 'Salón Principal',
        estado: mesa?.estado || 'ocupada',
        etiqueta_union: mesa?.etiqueta_union,
        comanda_id: mesa?.pedido_id || 'ped-demo',
        numero_comanda: 140 + Number(mesa?.numero || 1),
        mozo_nombre: mesa?.mozo_nombre || MOZO_ACTUAL.nombre,
        es_mi_mesa: mesa?.es_mi_mesa ?? true,
        minutos_en_mesa: mesa?.minutos_ocupada || 15,
        comensales: mesa?.comensales_sentados || 2,
        hora_apertura: '13:30',
        total_subtotal: mesa?.total_consumo || 85.0,
        items: [
          {
            id: `item-${mesaId}-1`,
            producto_id: 'p-01',
            producto_nombre: 'Arroz con Mariscos Especial',
            cantidad: 1,
            precio_unitario: 45.0,
            subtotal: 45.0,
            requiere_preparacion: true,
            tipo_despacho: 'cocina',
            estado: 'en_preparacion',
            minutos_en_estado: 10,
            numero_ronda: 1,
          },
          {
            id: `item-${mesaId}-2`,
            producto_id: 'p-02',
            producto_nombre: 'Cerveza Cusqueña Trigo 330ml',
            cantidad: 2,
            precio_unitario: 12.0,
            subtotal: 24.0,
            requiere_preparacion: false,
            tipo_despacho: 'directo_salon',
            estado: 'entregado',
            minutos_en_estado: 12,
            numero_ronda: 1,
          },
        ],
      },
    };
  },

  /**
   * Marca un ítem de la barra lateral o drawer como entregado / servido
   */
  async marcarItemServido(itemId: string): Promise<ApiResponse<{ success: boolean; itemId: string }>> {
    await new Promise((res) => setTimeout(res, 120));

    // Remueve el ítem de la lista de listos
    ITEMS_DESPACHO_MOCK = ITEMS_DESPACHO_MOCK.filter((i) => i.item_id !== itemId);

    return {
      exito: true,
      datos: { success: true, itemId },
    };
  },

  /**
   * Conmuta la mesa a 'cuenta_pedida' para que Caja emita precuenta o cobre
   */
  async solicitarCuentaMesa(mesaId: string): Promise<ApiResponse<{ success: boolean; mesaId: string }>> {
    await new Promise((res) => setTimeout(res, 150));

    MESAS_SALON_MOCK = MESAS_SALON_MOCK.map((m) =>
      m.id === mesaId ? { ...m, estado: 'cuenta_pedida' as const } : m
    );

    return {
      exito: true,
      datos: { success: true, mesaId },
    };
  },

  /**
   * Abre una mesa libre sentando comensales
   */
  async abrirMesa(
    mesaId: string,
    comensales = 2
  ): Promise<ApiResponse<{ success: boolean; pedidoId: string }>> {
    await new Promise((res) => setTimeout(res, 150));

    const nuevoPedidoId = `ped-${Date.now().toString().slice(-4)}`;

    MESAS_SALON_MOCK = MESAS_SALON_MOCK.map((m) =>
      m.id === mesaId
        ? {
            ...m,
            estado: 'ocupada' as const,
            pedido_id: nuevoPedidoId,
            comensales_sentados: comensales,
            minutos_ocupada: 1,
            total_consumo: 0,
            mozo_id: MOZO_ACTUAL.id,
            mozo_nombre: MOZO_ACTUAL.nombre,
            es_mi_mesa: true,
            platos_listos: 0,
            platos_en_cocina: 0,
            bebidas_pendientes: 0,
          }
        : m
    );

    return {
      exito: true,
      datos: { success: true, pedidoId: nuevoPedidoId },
    };
  },

  /**
   * Genera un evento simulado de plato listo en cocina
   */
  simularPlatoListoCocina(): ItemDespachoListoDTO {
    const nuevoItem: ItemDespachoListoDTO = {
      item_id: `item-live-${Date.now()}`,
      pedido_id: 'ped-149',
      mesa_id: 'mesa-04',
      mesa_numero: '04',
      ambiente: 'Salón Principal',
      producto_nombre: 'Arroz con Pato Criollo',
      cantidad: 1,
      nota_especial: 'Extra salsa criolla',
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      pase_cocina: 'Pase Caliente #01',
      segundos_listo: 5,
      mozo_nombre: MOZO_ACTUAL.nombre,
      es_mi_mesa: true,
    };

    ITEMS_DESPACHO_MOCK.unshift(nuevoItem);
    return nuevoItem;
  },

  /**
   * Genera un evento simulado de nuevo producto de despacho directo en salón (Entrega directa: gelatina o bebida)
   */
  simularProductoDespachoDirecto(): ItemDespachoListoDTO {
    const esGelatina = Math.random() > 0.5;
    const nuevoItem: ItemDespachoListoDTO = {
      item_id: `item-direct-${Date.now()}`,
      pedido_id: 'ped-148',
      mesa_id: 'mesa-02',
      mesa_numero: '02',
      ambiente: 'Salón Principal',
      producto_nombre: esGelatina
        ? 'Gelatina de Fresa de Vitrina'
        : 'Agua San Mateo sin gas 600ml',
      cantidad: esGelatina ? 2 : 1,
      nota_especial: esGelatina ? 'Servir bien fría de mostrador' : 'Al tiempo',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      segundos_listo: 2,
      mozo_nombre: MOZO_ACTUAL.nombre,
      es_mi_mesa: true,
    };

    ITEMS_DESPACHO_MOCK.unshift(nuevoItem);
    return nuevoItem;
  },

  // Alias retrocompatible
  simularNuevaBebidaSalon(): ItemDespachoListoDTO {
    return this.simularProductoDespachoDirecto();
  },

  /**
   * Datos de alerta emergente prioritaria
   */
  obtenerAlertaModalDemo(): AlertaCocinaModalDTO {
    return {
      id: 'alerta-pase-demo',
      tipo: 'plato_listo',
      mesa_numero: '04',
      ambiente: 'Salón Principal',
      comanda_numero: 149,
      plato_nombre: '2x Lomo Saltado Criollo (Término 3/4)',
      cantidad: 2,
      nota_especial: 'El comensal solicitó término 3/4 exacto. Retirar de inmediato.',
      cocinero_nombre: 'Roberto Vega',
      pase_nombre: 'Pase Caliente #01',
      segundos_transcurridos: 25,
      insumo_agotado: 'Papa Amarilla',
      platos_afectados: ['Causa Limeña', 'Papas Rellenas'],
    };
  },

  /**
   * Alterna a turno 100% libre / vacío para probar Vista 4
   */
  obtenerPlanoTurnoVacio(): PlanoCompletoMozoDTO {
    const mesasVacias = MESAS_SALON_MOCK.map((m) => ({
      ...m,
      estado: 'libre' as const,
      pedido_id: null,
      comensales_sentados: null,
      minutos_ocupada: null,
      total_consumo: null,
      mozo_id: null,
      mozo_nombre: null,
      es_mi_mesa: false,
      platos_listos: 0,
      platos_en_cocina: 0,
      despacho_directo_pendiente: 0,
      bebidas_pendientes: 0,
      reserva_cliente: null,
      reserva_hora: null,
    }));

    return {
      piso_activo: {
        id: 'piso-01-salon',
        nombre: 'Salón Principal',
        total_mesas: 10,
        mesas_ocupadas: 0,
        mesas_libres: 10,
      },
      pisos_disponibles: PISOS_MOCK.map((p) => ({ ...p, mesas_ocupadas: 0, mesas_libres: p.total_mesas })),
      mesas: mesasVacias,
      items_despacho: [],
      comandas_preparacion: [],
      alertas_operativas: [],
      mesas_libres: 10,
      mesas_ocupadas: 0,
      total_mesas: 10,
      mis_mesas_activas: 0,
      total_venta_turno: 0,
      mozo_actual: MOZO_ACTUAL,
    };
  },
};
