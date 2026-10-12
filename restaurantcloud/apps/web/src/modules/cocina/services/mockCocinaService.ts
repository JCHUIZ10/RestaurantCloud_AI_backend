import { ApiResponse } from '@/types/api';
import {
  KDSComandaDTO,
  ConfiguracionKDSDTO,
  ConsolidadoAllDayDTO,
  EstadoItemCocina,
  ItemAnuladoSSEEvent,
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
   */
  async cambiarEstadoItem(
    itemId: string,
    nuevoEstado: 'en_preparacion' | 'listo'
  ): Promise<ApiResponse<{ item_id: string; estado: EstadoItemCocina }>> {
    let encontrado = false;

    mockComandasMemoria = mockComandasMemoria.map((comanda) => {
      const itemsActualizados = comanda.items.map((item) => {
        if (item.item_id === itemId) {
          encontrado = true;
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

    if (!encontrado) {
      return {
        exito: false,
        datos: { item_id: itemId, estado: 'en_cola' },
        errores: [{ codigo: 'ITEM_NO_ENCONTRADO', mensaje: 'El ítem culinario no existe.' }],
      };
    }

    return {
      exito: true,
      datos: { item_id: itemId, estado: nuevoEstado },
      meta: { timestamp: new Date().toISOString() },
    };
  },

  /**
   * Deshace el cambio a 'listo' regresando el plato a 'en_preparacion' dentro de los 30s
   */
  async deshacerListoItem(
    itemId: string
  ): Promise<ApiResponse<{ item_id: string; estado: EstadoItemCocina }>> {
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
   * Despacha todos los platos culinarios de una comanda al pase de salón
   */
  async despacharComandaCompleta(
    pedidoId: string
  ): Promise<ApiResponse<{ pedido_id: string; despachado: boolean }>> {
    const idx = mockComandasMemoria.findIndex((c) => c.pedido_id === pedidoId);
    if (idx !== -1) {
      mockComandasMemoria.splice(idx, 1);
    }

    return {
      exito: true,
      datos: { pedido_id: pedidoId, despachado: true },
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
