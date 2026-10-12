import { ApiResponse } from '@/types/api';
import {
  PlanoMesasResponseDTO,
  PisoAdminDTO,
  MesaAdminDTO,
  CrearMesaLoteRequest,
  CrearMesaIndividualRequest,
  ActualizarMesaRequest,
  CrearPisoRequest,
  ActualizarDimensionesPisoRequest,
} from '@/types/admin';

// Identificadores Canónicos del Seed de Desarrollo Local (07_seed_local_aurea_completo.sql)
export const CANONICAL_LOCAL_ID = '00000000-0000-4000-8000-000000000010';
export const CANONICAL_LOCAL_NOMBRE = 'Sede Miraflores (Principal)';

export const PISO_SALON_ID = '11111111-1111-4000-8000-000000000001';
export const PISO_TERRAZA_ID = '11111111-1111-4000-8000-000000000002';
export const PISO_BARRA_ID = '11111111-1111-4000-8000-000000000003';

// Semillas iniciales canónicas de mesas
const SEMILLA_MESAS_SALON: MesaAdminDTO[] = [
  {
    id: 'm1a2b3c4-0001-4000-8000-000000000001',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '01',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0002-4000-8000-000000000002',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '02',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0003-4000-8000-000000000003',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '03',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0004-4000-8000-000000000004',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '04',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    // Mesa con comanda activa para probar bloqueo de seguridad 409
    tiene_pedido_activo: true,
    comanda_activa_codigo: 'COM-0104',
    total_cuenta_activa: 142.5,
    mozo_a_cargo: 'Luis Mozo',
  },
  {
    id: 'm1a2b3c4-0005-4000-8000-000000000005',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '05',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 4,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0006-4000-8000-000000000006',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '06',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 0,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0007-4000-8000-000000000007',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '07',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 1,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0008-4000-8000-000000000008',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '08',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 2,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0009-4000-8000-000000000009',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '09',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 1,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0010-4000-8000-000000000010',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '10',
    capacidad: 8,
    forma: 'rectangular',
    posicion_x: 4,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
];

const SEMILLA_MESAS_TERRAZA: MesaAdminDTO[] = [
  {
    id: 'm1a2b3c4-0011-4000-8000-000000000011',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '11',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0012-4000-8000-000000000012',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '12',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0013-4000-8000-000000000013',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '13',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0014-4000-8000-000000000014',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '14',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 3,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
];

const SEMILLA_MESAS_BARRA: MesaAdminDTO[] = [
  {
    id: 'm1a2b3c4-0015-4000-8000-000000000015',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_BARRA_ID,
    numero: '15',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0016-4000-8000-000000000016',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_BARRA_ID,
    numero: '16',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0017-4000-8000-000000000017',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_BARRA_ID,
    numero: '17',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
];

const SEMILLAS_PISOS: PisoAdminDTO[] = [
  {
    id: PISO_SALON_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Salón Principal',
    columnas: 5,
    filas: 3,
    estado: 'activo',
    total_mesas: 10,
    capacidad_total_personas: 46,
    mesas: [...SEMILLA_MESAS_SALON],
  },
  {
    id: PISO_TERRAZA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Terraza Exterior',
    columnas: 4,
    filas: 2,
    estado: 'activo',
    total_mesas: 4,
    capacidad_total_personas: 16,
    mesas: [...SEMILLA_MESAS_TERRAZA],
  },
  {
    id: PISO_BARRA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Barra Bar',
    columnas: 3,
    filas: 2,
    estado: 'activo',
    total_mesas: 3,
    capacidad_total_personas: 6,
    mesas: [...SEMILLA_MESAS_BARRA],
  },
];

// Estado en memoria simulado
class MockAdminService {
  private pisos: PisoAdminDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PISOS));
  private maxMesasPlan = 30; // Plan Pro
  private maxPisosPlan = 5;

  private calcularMetricasPiso(piso: PisoAdminDTO) {
    const activas = piso.mesas.filter((m) => m.estado === 'activa');
    piso.total_mesas = activas.length;
    piso.capacidad_total_personas = activas.reduce((acc, m) => acc + m.capacidad, 0);
  }

  private obtenerTotalMesasActivas(): number {
    return this.pisos.reduce((acc, p) => {
      return acc + p.mesas.filter((m) => m.estado === 'activa').length;
    }, 0);
  }

  /**
   * GET /api/v1/admin/pisos
   */
  async obtenerPlanoMesas(localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<PlanoMesasResponseDTO>> {
    // Simular latencia de red realista
    await new Promise((r) => setTimeout(r, 120));

    this.pisos.forEach((p) => this.calcularMetricasPiso(p));
    const mesasActivas = this.obtenerTotalMesasActivas();

    const response: PlanoMesasResponseDTO = {
      local_id: localId,
      local_nombre: CANONICAL_LOCAL_NOMBRE,
      cuota_mesas: {
        mesas_activas_empresa: mesasActivas,
        max_mesas_plan: this.maxMesasPlan,
        mesas_disponibles: Math.max(0, this.maxMesasPlan - mesasActivas),
        pisos_activos_empresa: this.pisos.filter((p) => p.estado === 'activo').length,
        max_pisos_plan: this.maxPisosPlan,
      },
      pisos: JSON.parse(JSON.stringify(this.pisos.filter((p) => p.estado === 'activo'))),
    };

    return {
      exito: true,
      datos: response,
      meta: {
        timestamp: new Date().toISOString(),
        total: response.pisos.length,
      },
    };
  }

  /**
   * POST /api/v1/admin/pisos/{piso_id}/mesas/lote
   */
  async generarMesasEnLote(
    pisoId: string,
    req: CrearMesaLoteRequest
  ): Promise<ApiResponse<{ piso: PisoAdminDTO; mesas_creadas: number }>> {
    await new Promise((r) => setTimeout(r, 150));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Ambiente o piso no encontrado.');
    }

    const cantidadRequerida = req.columnas * req.filas;
    const mesasActivas = this.obtenerTotalMesasActivas();
    const disponibles = this.maxMesasPlan - mesasActivas;

    if (cantidadRequerida > disponibles) {
      return {
        exito: false,
        datos: null as unknown as { piso: PisoAdminDTO; mesas_creadas: number },
        errores: [
          {
            codigo: 'ERR_CUOTA_MESAS_EXCEDIDA',
            mensaje: `La cantidad solicitada (${cantidadRequerida}) excede el límite disponible (${disponibles}) de su Plan Pro.`,
            campo: 'cantidad',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Actualizar dimensiones del piso si son mayores
    piso.columnas = Math.max(piso.columnas, req.columnas);
    piso.filas = Math.max(piso.filas, req.filas);

    // Limpiar mesas activas anteriores si se regenera el layout
    piso.mesas = piso.mesas.filter((m) => m.estado !== 'activa');

    const nuevasMesas: MesaAdminDTO[] = [];
    let correlativo = req.numero_inicio;

    for (let f = 0; f < req.filas; f++) {
      for (let c = 0; c < req.columnas; c++) {
        const numStr = correlativo < 10 ? `0${correlativo}` : `${correlativo}`;
        nuevasMesas.push({
          id: `m-lote-${Date.now()}-${f}-${c}`,
          local_id: CANONICAL_LOCAL_ID,
          piso_id: pisoId,
          numero: `${req.prefijo}${numStr}`.trim(),
          capacidad: req.capacidad,
          forma: req.forma,
          posicion_x: c,
          posicion_y: f,
          permite_union: req.permite_union,
          mesa_principal_id: null,
          estado: 'activa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tiene_pedido_activo: false,
        });
        correlativo++;
      }
    }

    piso.mesas.push(...nuevasMesas);
    this.calcularMetricasPiso(piso);

    return {
      exito: true,
      datos: {
        piso: JSON.parse(JSON.stringify(piso)),
        mesas_creadas: nuevasMesas.length,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * POST /api/v1/admin/pisos/{piso_id}/mesas
   */
  async crearMesaIndividual(
    pisoId: string,
    req: CrearMesaIndividualRequest
  ): Promise<ApiResponse<MesaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Ambiente o piso no encontrado.');
    }

    // Validar cuota
    if (this.obtenerTotalMesasActivas() >= this.maxMesasPlan) {
      return {
        exito: false,
        datos: null as unknown as MesaAdminDTO,
        errores: [
          {
            codigo: 'ERR_CUOTA_MESAS_EXCEDIDA',
            mensaje: 'Ha alcanzado el límite máximo de mesas permitido por su suscripción.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validar unicidad de número en piso
    const duplicada = piso.mesas.find(
      (m) => m.numero.toLowerCase() === req.numero.trim().toLowerCase() && m.estado === 'activa'
    );
    if (duplicada) {
      return {
        exito: false,
        datos: null as unknown as MesaAdminDTO,
        errores: [
          {
            codigo: 'ERR_MESA_NUMERO_DUPLICADO',
            mensaje: `Ya existe una mesa con el número "${req.numero}" en este ambiente.`,
            campo: 'numero',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Ajustar dimensiones si la posición excede
    if (req.posicion_x >= piso.columnas) piso.columnas = req.posicion_x + 1;
    if (req.posicion_y >= piso.filas) piso.filas = req.posicion_y + 1;

    const nuevaMesa: MesaAdminDTO = {
      id: `m-indiv-${Date.now()}`,
      local_id: CANONICAL_LOCAL_ID,
      piso_id: pisoId,
      numero: req.numero.trim(),
      capacidad: req.capacidad,
      forma: req.forma,
      posicion_x: req.posicion_x,
      posicion_y: req.posicion_y,
      permite_union: req.permite_union,
      mesa_principal_id: null,
      estado: 'activa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tiene_pedido_activo: false,
    };

    piso.mesas.push(nuevaMesa);
    this.calcularMetricasPiso(piso);

    return {
      exito: true,
      datos: nuevaMesa,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PUT /api/v1/admin/mesas/{id}
   */
  async actualizarMesa(
    mesaId: string,
    req: ActualizarMesaRequest
  ): Promise<ApiResponse<MesaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    for (const piso of this.pisos) {
      const index = piso.mesas.findIndex((m) => m.id === mesaId);
      if (index !== -1) {
        // Validar unicidad de número
        const otraConMismoNumero = piso.mesas.find(
          (m) =>
            m.id !== mesaId &&
            m.numero.toLowerCase() === req.numero.trim().toLowerCase() &&
            m.estado === 'activa'
        );
        if (otraConMismoNumero) {
          return {
            exito: false,
            datos: null as unknown as MesaAdminDTO,
            errores: [
              {
                codigo: 'ERR_MESA_NUMERO_DUPLICADO',
                mensaje: `El número de mesa "${req.numero}" ya está en uso en este ambiente.`,
                campo: 'numero',
              },
            ],
            meta: { timestamp: new Date().toISOString() },
          };
        }

        const mesa = piso.mesas[index];
        mesa.numero = req.numero.trim();
        mesa.capacidad = req.capacidad;
        mesa.forma = req.forma;
        mesa.posicion_x = req.posicion_x;
        mesa.posicion_y = req.posicion_y;
        mesa.permite_union = req.permite_union;
        mesa.updated_at = new Date().toISOString();

        this.calcularMetricasPiso(piso);
        return {
          exito: true,
          datos: JSON.parse(JSON.stringify(mesa)),
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    throw new Error('Mesa no encontrada.');
  }

  /**
   * PATCH /api/v1/admin/mesas/{id}/desactivar
   * Simula el Bloqueo Duro ante comanda activa (409 Conflict)
   */
  async desactivarMesa(
    mesaId: string
  ): Promise<ApiResponse<{ mensaje: string; mesa_id: string }>> {
    await new Promise((r) => setTimeout(r, 120));

    for (const piso of this.pisos) {
      const mesa = piso.mesas.find((m) => m.id === mesaId);
      if (mesa) {
        if (mesa.tiene_pedido_activo) {
          // Bloqueo Duro 409
          return {
            exito: false,
            datos: null as unknown as { mensaje: string; mesa_id: string },
            errores: [
              {
                codigo: 'ERR_MESA_CON_PEDIDOS_ACTIVOS',
                mensaje: `No se puede desactivar la Mesa ${mesa.numero} porque tiene la comanda activa ${mesa.comanda_activa_codigo || '#104'} en salón.`,
                campo: 'mesa_id',
              },
            ],
            meta: {
              timestamp: new Date().toISOString(),
            },
          };
        }

        mesa.estado = 'inactiva';
        mesa.updated_at = new Date().toISOString();
        this.calcularMetricasPiso(piso);

        return {
          exito: true,
          datos: {
            mensaje: `Mesa ${mesa.numero} desactivada exitosamente del salón.`,
            mesa_id: mesaId,
          },
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    throw new Error('Mesa no encontrada.');
  }

  /**
   * POST /api/v1/admin/pisos
   */
  async crearPiso(localId: string, req: CrearPisoRequest): Promise<ApiResponse<PisoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    if (this.pisos.length >= this.maxPisosPlan) {
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_CUOTA_PISOS_EXCEDIDA',
            mensaje: `Su plan actual permite un máximo de ${this.maxPisosPlan} ambientes.`,
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const nuevoPiso: PisoAdminDTO = {
      id: `piso-${Date.now()}`,
      local_id: localId,
      nombre: req.nombre.trim(),
      columnas: req.columnas,
      filas: req.filas,
      estado: 'activo',
      total_mesas: 0,
      capacidad_total_personas: 0,
      mesas: [],
    };

    this.pisos.push(nuevoPiso);

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(nuevoPiso)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/pisos/{id}/dimensiones
   */
  async actualizarDimensionesPiso(
    pisoId: string,
    req: ActualizarDimensionesPisoRequest
  ): Promise<ApiResponse<PisoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado.');
    }

    // Validar si hay mesas activas fuera de los nuevos límites
    const mesasEnConflicto = piso.mesas.filter(
      (m) =>
        m.estado === 'activa' &&
        (m.posicion_x >= req.columnas || m.posicion_y >= req.filas)
    );

    if (mesasEnConflicto.length > 0) {
      const nombres = mesasEnConflicto.map((m) => `Mesa ${m.numero}`).join(', ');
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_COLUMNA_CON_MESAS',
            mensaje: `No se puede recortar la cuadrícula porque contiene mesas activas: ${nombres}. Reubícalas o desactívalas primero.`,
            campo: 'dimensiones',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    piso.columnas = req.columnas;
    piso.filas = req.filas;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(piso)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/pisos/{id}/nombre
   * Renombra un ambiente físico validando unicidad en la sede.
   */
  async actualizarNombrePiso(
    pisoId: string,
    nuevoNombre: string
  ): Promise<ApiResponse<PisoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado.');
    }

    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_NOMBRE_REQUERIDO',
            mensaje: 'El nombre del ambiente no puede estar vacío.',
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validar duplicidad
    const repetido = this.pisos.some(
      (p) =>
        p.id !== pisoId &&
        p.estado === 'activo' &&
        p.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (repetido) {
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_NOMBRE_PISO_DUPLICADO',
            mensaje: `Ya existe un ambiente activo con el nombre "${nombreLimpio}" en esta sede.`,
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    piso.nombre = nombreLimpio;
    piso.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(piso)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * DELETE / PATCH /api/v1/admin/pisos/{id}/desactivar
   * Da de baja segura un piso validando:
   * 1. Que no sea el único piso activo del local (mínimo 1 piso).
   * 2. Que no tenga mesas activas (Bloqueo Duro 409 ERR_PISO_CON_MESAS_ACTIVAS).
   */
  async desactivarPiso(
    pisoId: string
  ): Promise<ApiResponse<{ mensaje: string; piso_id: string }>> {
    await new Promise((r) => setTimeout(r, 120));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado.');
    }

    const pisosActivos = this.pisos.filter((p) => p.estado === 'activo');
    if (pisosActivos.length <= 1) {
      return {
        exito: false,
        datos: null as unknown as { mensaje: string; piso_id: string },
        errores: [
          {
            codigo: 'ERR_MINIMO_UN_PISO_ACTIVO',
            mensaje: 'No se puede eliminar el único ambiente de la sede. El restaurante debe contar con al menos un ambiente activo.',
            campo: 'piso_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const mesasActivas = piso.mesas.filter((m) => m.estado === 'activa');
    if (mesasActivas.length > 0) {
      const listaMesas = mesasActivas.map((m) => `Mesa ${m.numero}`).slice(0, 5).join(', ');
      const extra = mesasActivas.length > 5 ? ` y ${mesasActivas.length - 5} más` : '';
      return {
        exito: false,
        datos: null as unknown as { mensaje: string; piso_id: string },
        errores: [
          {
            codigo: 'ERR_PISO_CON_MESAS_ACTIVAS',
            mensaje: `No se puede eliminar el ambiente "${piso.nombre}" porque contiene ${mesasActivas.length} mesa(s) activa(s) (${listaMesas}${extra}). Reubica o desactiva las mesas antes de eliminar el ambiente.`,
            campo: 'piso_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    piso.estado = 'inactivo';
    piso.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: {
        mensaje: `Ambiente "${piso.nombre}" eliminado exitosamente.`,
        piso_id: pisoId,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // Métodos de simulación interactiva para DemoAdminPlanoWidget
  simularCuotaLlena() {
    this.maxMesasPlan = this.obtenerTotalMesasActivas();
  }

  restablecerCuotaOriginal() {
    this.maxMesasPlan = 30;
  }

  simularPisoVacio(pisoId: string) {
    const piso = this.pisos.find((p) => p.id === pisoId);
    if (piso) {
      piso.mesas = [];
      this.calcularMetricasPiso(piso);
    }
  }

  restablecerSemillasAurea() {
    this.pisos = JSON.parse(JSON.stringify(SEMILLAS_PISOS));
    this.maxMesasPlan = 30;
    this.maxPisosPlan = 5;
  }
}

export const mockAdminService = new MockAdminService();
