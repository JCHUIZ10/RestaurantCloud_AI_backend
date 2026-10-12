import { ApiResponse } from '@/types/api';
import {
  PlanoCompletoMozoDTO,
  MesaDetalleMozoDTO,
  ItemDespachoListoDTO,
  MesaCardDTO,
  PisoAmbienteDTO,
  AlertaCocinaModalDTO,
  CatalogoProductosMozoDTO,
  ProductoCatalogoMozoDTO,
  CrearPedidoRequest,
  PedidoConfirmadoDTO,
  HistorialMesaComandaDTO,
  PrecuentaMozoResponseDTO,
  PromocionSedeDTO,
  SolicitarCuentaRequest,
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

  /**
   * =========================================================================
   * MÉTODOS PARA CU-MOZO-02: TOMA DE PEDIDO Y COMANDA MÓVIL
   * =========================================================================
   */

  /**
   * Obtiene el catálogo completo de la carta con categorías y disponibilidad en vivo
   */
  async obtenerCatalogoCarta(_mesaId: string): Promise<ApiResponse<CatalogoProductosMozoDTO>> {
    await new Promise((res) => setTimeout(res, 150));

    const categoriasMap = new Map<string, { id: string; nombre: string; total: number }>();
    PRODUCTOS_CARTA_MOCK.forEach((p) => {
      if (!categoriasMap.has(p.categoria_id)) {
        categoriasMap.set(p.categoria_id, {
          id: p.categoria_id,
          nombre: p.categoria_nombre,
          total: 0,
        });
      }
      categoriasMap.get(p.categoria_id)!.total++;
    });

    return {
      exito: true,
      datos: {
        categorias: Array.from(categoriasMap.values()),
        productos: [...PRODUCTOS_CARTA_MOCK],
      },
    };
  },

  /**
   * Obtiene el historial de consumos y comanda activa de la mesa (soporta Ronda #02 adicional)
   */
  async obtenerHistorialMesa(mesaId: string): Promise<ApiResponse<HistorialMesaComandaDTO>> {
    await new Promise((res) => setTimeout(res, 120));

    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    const mesaNumero = mesa?.numero || '04';
    const esOcupada = mesa?.estado === 'ocupada' || mesa?.estado === 'cuenta_pedida';

    // Si la mesa ya está ocupada, simula que tiene la Ronda #01 enviada
    const itemsRondaPrevia = esOcupada
      ? [
          {
            id: 'item-previo-01',
            producto_id: 'prod-criollo-01',
            producto_nombre: 'Lomo Saltado Criollo',
            cantidad: 2,
            precio_unitario: 38.0,
            subtotal: 76.0,
            nota_cocina: 'Término 3/4, sin cebolla',
            requiere_preparacion: true,
            tipo_despacho: 'cocina' as const,
            estado: 'entregado' as const,
            minutos_en_estado: 15,
            numero_ronda: 1,
          },
          {
            id: 'item-previo-02',
            producto_id: 'prod-ent-01',
            producto_nombre: 'Causa Limeña de Pollo',
            cantidad: 1,
            precio_unitario: 24.0,
            subtotal: 24.0,
            nota_cocina: null,
            requiere_preparacion: true,
            tipo_despacho: 'cocina' as const,
            estado: 'entregado' as const,
            minutos_en_estado: 15,
            numero_ronda: 1,
          },
          {
            id: 'item-previo-03',
            producto_id: 'prod-beb-03',
            producto_nombre: 'Jarra de Chicha Morada Casera 1L',
            cantidad: 1,
            precio_unitario: 18.0,
            subtotal: 18.0,
            nota_cocina: 'Helada',
            requiere_preparacion: false,
            tipo_despacho: 'directo_salon' as const,
            estado: 'entregado' as const,
            minutos_en_estado: 20,
            numero_ronda: 1,
          },
        ]
      : [];

    const totalPrevio = itemsRondaPrevia.reduce((acc, it) => acc + it.subtotal, 0);

    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        mesa_numero: mesaNumero,
        ambiente: 'Salón Principal',
        comensales: mesa?.comensales_sentados || 4,
        minutos_en_mesa: mesa?.minutos_ocupada || 35,
        mozo_nombre: mesa?.mozo_nombre || MOZO_ACTUAL.nombre,
        ronda_actual: esOcupada ? 2 : 1,
        ronda_previa_items: itemsRondaPrevia,
        total_previo: totalPrevio,
      },
    };
  },

  /**
   * Despacha la comanda a cocina y salón con split atómico
   */
  async enviarPedidoCocina(
    request: CrearPedidoRequest,
    forzarConflictoStock = false
  ): Promise<ApiResponse<PedidoConfirmadoDTO>> {
    await new Promise((res) => setTimeout(res, 350));

    // Si se activa simulación de conflicto de stock (Vista 4: 409 Conflict)
    if (forzarConflictoStock) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_AGOTADO',
            mensaje:
              "El insumo crítico 'Pescado Blanco (Corvina)' se agotó en cocina hace 30 segundos. La preparación de Ceviche Clásico no es posible.",
            campo: 'items[0].producto_id',
          },
        ],
      };
    }

    // Calcular montos y enriquecer ítems
    let totalComanda = 0;
    const itemsEnviados = request.items.map((it, idx) => {
      const prod = PRODUCTOS_CARTA_MOCK.find((p) => p.id === it.producto_id);
      const precio = prod?.precio || 20.0;
      const subtotal = precio * it.cantidad;
      totalComanda += subtotal;

      return {
        id: `item-env-${Date.now()}-${idx}`,
        producto_id: it.producto_id,
        producto_nombre: prod?.nombre || 'Producto Gastronómico',
        cantidad: it.cantidad,
        precio_unitario: precio,
        subtotal: subtotal,
        nota_cocina: it.nota_cocina || null,
        estado: prod?.requiere_preparacion ? 'en_cola' : 'listo',
        numero_ronda: request.numero_ronda,
        created_at: new Date().toISOString(),
      };
    });

    // Actualizar estado de la mesa en el mock
    const mesaIndex = MESAS_SALON_MOCK.findIndex((m) => m.id === request.mesa_id);
    if (mesaIndex >= 0) {
      const mesaAnt = MESAS_SALON_MOCK[mesaIndex];
      MESAS_SALON_MOCK[mesaIndex] = {
        ...mesaAnt,
        estado: 'ocupada',
        comensales_sentados: request.comensales,
        total_consumo: (mesaAnt.total_consumo || 0) + totalComanda,
        es_mi_mesa: true,
        mozo_nombre: MOZO_ACTUAL.nombre,
      };
    }

    return {
      exito: true,
      datos: {
        pedido_id: `ped-${Date.now()}`,
        mesa_id: request.mesa_id,
        mesa_numero: '04',
        numero_ronda: request.numero_ronda,
        estado: 'enviado',
        total_comanda: totalComanda,
        items_enviados: itemsEnviados,
        mensaje: 'Comanda despachada a cocina y salón con éxito',
      },
    };
  },

  /**
   * Conmuta la disponibilidad de un producto en la carta para probar reactividad
   */
  alternarDisponibilidadProducto(productoId: string): boolean {
    const prod = PRODUCTOS_CARTA_MOCK.find((p) => p.id === productoId);
    if (prod) {
      prod.disponibilidad = prod.disponibilidad === 'disponible' ? 'agotado' : 'disponible';
      return prod.disponibilidad === 'disponible';
    }
    return false;
  },

  /**
   * =========================================================================
   * MÉTODOS PARA CU-MOZO-08: PRECUENTA DIGITAL EN MESA
   * =========================================================================
   */

  /**
   * Consulta on-demand de la precuenta digital de la mesa sin esperar a caja
   */
  async obtenerPrecuentaMesa(mesaId: string): Promise<ApiResponse<PrecuentaMozoResponseDTO>> {
    await new Promise((res) => setTimeout(res, 180));

    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    const mesaNumero = mesa?.numero || '04';

    // Consolidado de consumos (4 ítems de prueba para un total bruto de S/ 100.00)
    const itemsPrecuenta = [
      {
        producto_id: 'prod-criollo-01',
        nombre: 'Lomo Saltado Criollo',
        nota_cocina: 'Término 3/4, con papas amarillas',
        cantidad: 1,
        precio_unitario: 38.0,
        subtotal: 38.0,
        estado_cocina: 'en_preparacion' as const, // Simula advertencia de cocina
      },
      {
        producto_id: 'prod-mar-03',
        nombre: 'Arroz con Mariscos Especial',
        nota_cocina: null,
        cantidad: 1,
        precio_unitario: 34.0,
        subtotal: 34.0,
        estado_cocina: 'listo' as const,
      },
      {
        producto_id: 'prod-beb-03',
        nombre: 'Jarra de Chicha Morada Casera 1L',
        nota_cocina: 'Helada con vaso',
        cantidad: 1,
        precio_unitario: 16.0,
        subtotal: 16.0,
        estado_cocina: 'entregado' as const,
      },
      {
        producto_id: 'prod-ent-01',
        nombre: 'Causa Limeña Clásica de Pollo',
        nota_cocina: null,
        cantidad: 1,
        precio_unitario: 12.0,
        subtotal: 12.0,
        estado_cocina: 'entregado' as const,
      },
    ];

    const consumoBruto = itemsPrecuenta.reduce((acc, it) => acc + it.subtotal, 0); // 100.00
    const promocionActiva = PROMOCIONES_SEDE_MOCK[0]; // 15% Almuerzo Ejecutivo
    const descuentoComercial =
      Math.round(consumoBruto * (promocionActiva.porcentaje_descuento / 100) * 100) / 100; // 15.00
    const totalNeto = consumoBruto - descuentoComercial; // 85.00
    const baseImponible = Math.round((totalNeto / 1.18) * 100) / 100; // 72.03
    const igv = Math.round((totalNeto - baseImponible) * 100) / 100; // 12.97

    // Opciones de pago proyectadas
    const comisionTarjeta = Math.round(totalNeto * 0.035 * 100) / 100; // 3.5% = 2.98
    const totalTarjeta = Math.round((totalNeto + comisionTarjeta) * 100) / 100; // 87.98

    const opcionesPago = [
      {
        codigo: 'efectivo' as const,
        nombre: 'Efectivo',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
      },
      {
        codigo: 'billetera_digital' as const,
        nombre: 'Billetera Digital (Yape / Plin)',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
        detalle_billetera: {
          telefono: '987 654 321',
          titular: 'Restaurant S.A.C.',
          ruc: '20601234567',
          qr_imagen_url: '',
          monto_exacto: totalNeto,
        },
      },
      {
        codigo: 'tarjeta' as const,
        nombre: 'Tarjeta Débito / Crédito',
        comision_porcentaje: 3.5,
        monto_comision: comisionTarjeta,
        total_estimado: totalTarjeta,
      },
    ];

    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        mesa_numero: mesaNumero,
        es_mesa_unida: mesa?.permite_union || false,
        mozo_nombre: mesa?.mozo_nombre || MOZO_ACTUAL.nombre,
        comensales: mesa?.comensales_sentados || 4,
        minutos_en_mesa: mesa?.minutos_ocupada || 32,
        items: itemsPrecuenta,
        tiene_cocina_pendiente: true,
        alerta_cocina: "1 plato 'Lomo Saltado' en 'preparación'",
        promociones_disponibles: PROMOCIONES_SEDE_MOCK,
        promocion_activa: promocionActiva,
        tributacion_sunat: {
          consumo_bruto: consumoBruto,
          descuento_comercial: descuentoComercial,
          total_neto: totalNeto,
          base_imponible: baseImponible,
          igv: igv,
          tasa_igv: 0.18,
        },
        opciones_pago: opcionesPago,
        calculada_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Conmuta a cuenta_pedida, guarda el método acordado y notifica a Caja vía SSE
   */
  async solicitarCuentaMesaConDetalle(
    request: SolicitarCuentaRequest
  ): Promise<ApiResponse<{ success: boolean; mesa_id: string; mensaje: string }>> {
    await new Promise((res) => setTimeout(res, 200));

    const mesaIndex = MESAS_SALON_MOCK.findIndex((m) => m.id === request.mesa_id);
    if (mesaIndex >= 0) {
      MESAS_SALON_MOCK[mesaIndex] = {
        ...MESAS_SALON_MOCK[mesaIndex],
        estado: 'cuenta_pedida',
        total_consumo: request.monto_declarado,
      };
    }

    return {
      exito: true,
      datos: {
        success: true,
        mesa_id: request.mesa_id,
        mensaje: `Precuenta de Mesa ${request.mesa_id} enviada a Caja vía SSE exitosamente.`,
      },
    };
  },
};

const PROMOCIONES_SEDE_MOCK: PromocionSedeDTO[] = [
  {
    id: 'promo-almuerzo-15',
    nombre: 'Descuento Almuerzo Ejecutivo (15%)',
    porcentaje_descuento: 15,
    descripcion: 'Válido de 12:00 a 16:00 en platos a la carta seleccionados.',
  },
  {
    id: 'promo-happy-hour-10',
    nombre: 'Promoción Familiar (10%)',
    porcentaje_descuento: 10,
    descripcion: '10% de descuento en mesas de 4 a más comensales.',
  },
];

/**
 * Catálogo Gastronómico Mock para CU-MOZO-02
 */
let PRODUCTOS_CARTA_MOCK: ProductoCatalogoMozoDTO[] = [
  {
    id: 'prod-criollo-01',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: 'Lomo Saltado Criollo',
    descripcion: 'Trozos finos de lomo salteados al wok con cebolla, tomate, ají amarillo, servido con papas fritas y arroz.',
    precio: 38.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-criollo-02',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: '1/4 Pollo a la Brasa Tradicional',
    descripcion: 'Marinado con hierbas andinas, papas crujientes y ensalada fresca de la casa.',
    precio: 26.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-criollo-03',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: 'Ají de Gallina Cremoso',
    descripcion: 'Pechuga deshilachada en crema de ají amarillo, nueces, huevo de corral y arroz con choclo.',
    precio: 32.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-criollo-04',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: 'Anticuchos de Corazón al Carbón',
    descripcion: 'Dos palos de corazón de res tierno marinados en ají panca, acompañados de papas doradas y choclo.',
    precio: 28.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-01',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Ceviche Clásico de Corvina',
    descripcion: 'Cubos de pesca fresca del día en leche de tigre al momento, canchita chulpi, camote glaseado y choclo.',
    precio: 36.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-02',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Tiradito en Crema de Ají Amarillo',
    descripcion: 'Finas láminas de pescado blanco bañadas en salsa tibia de ají amarillo, choclo desgranado y camote.',
    precio: 38.0,
    disponibilidad: 'agotado',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-03',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Arroz con Mariscos al Wok',
    descripcion: 'Arroz a la criolla flambeado al pisco con mixtura de calamares, langostinos, conchas y salsa madre.',
    precio: 42.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-ent-01',
    categoria_id: 'cat-entradas',
    categoria_nombre: 'Entradas Criollas',
    nombre: 'Causa Limeña de Pollo',
    descripcion: 'Masa de papa amarilla prensada con pasta de ají y limón, relleno cremoso de pollo, palta fuerte y mayonesa.',
    precio: 24.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-ent-02',
    categoria_id: 'cat-entradas',
    categoria_nombre: 'Entradas Criollas',
    nombre: 'Papa a la Huancaína Tradicional',
    descripcion: 'Rodajas de papa huayro bañadas en cremosa salsa huancaína con queso fresco, huevo duro y aceituna.',
    precio: 20.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-ent-03',
    categoria_id: 'cat-entradas',
    categoria_nombre: 'Entradas Criollas',
    nombre: 'Tequeños Criollos con Queso Andino',
    descripcion: 'Seis unidades crocantes rellenas de queso andino fundido, acompañadas de guacamole casero.',
    precio: 22.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-beb-01',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Inca Kola 500ml Helada en Botella',
    descripcion: 'Gaseosa nacional clásica servida con o sin hielo y rodaja de limón opcional.',
    precio: 7.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-beb-02',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Coca Cola 500ml Helada en Botella',
    descripcion: 'Gaseosa servida inmediatamente desde la vitrina refrigerada.',
    precio: 7.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-beb-03',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Jarra de Chicha Morada Casera 1L',
    descripcion: 'Elaborada artesanalmente con maíz morado, piña golden, manzana, canela y clavo de olor.',
    precio: 18.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-beb-04',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Cusqueña Dorada 330ml Botella Helada',
    descripcion: 'Cerveza premium lager helada servida con copa fría.',
    precio: 11.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-pos-01',
    categoria_id: 'cat-postres',
    categoria_nombre: 'Postres de Vitrina',
    nombre: 'Gelatina de Fresa de Vitrina',
    descripcion: 'Postre frío clásico de exhibición inmediata, servido en copa con toque de leche condensada.',
    precio: 6.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-pos-02',
    categoria_id: 'cat-postres',
    categoria_nombre: 'Postres de Vitrina',
    nombre: 'Porción Crema Volteada de Vitrina',
    descripcion: 'Flan tradicional acaramelado con textura sedosa, listo en vitrina refrigerada.',
    precio: 12.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-pos-03',
    categoria_id: 'cat-postres',
    categoria_nombre: 'Postres de Vitrina',
    nombre: 'Suspiro a la Limeña Clásico',
    descripcion: 'Manjar blanco de yemas perfumado al oporto con merengue italiano espolvoreado con canela.',
    precio: 14.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
];

