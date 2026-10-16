import type {
  LocalItemDTO,
  DirectorioLocalesApiResponse,
  VerificarDisponibilidadApiResponse,
  VerificarSlugApiResponse,
  CrearLocalRequestDTO,
  CrearLocalApiResponse,
  ActualizarLocalRequestDTO,
  ActualizarLocalApiResponse,
  ValidarBajaApiResponse,
  CambiarEstadoLocalRequestDTO,
  CambiarEstadoApiResponse,
  AdministradorResumenDTO,
} from '@/types/propietarioLocales';

const LOCAL_STORAGE_KEY = 'restaurantcloud_locales_propietario_db';

const ADMINISTRADORES_DISPONIBLES_SEED: AdministradorResumenDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000102',
    nombre: 'Valeria Mendoza',
    correo: 'admin@aurea.local',
    telefono: '+51 900 000 102',
  },
  {
    id: 'usr-adm-02-carlos',
    nombre: 'Carlos Rojas Pardo',
    correo: 'carlos.rojas@aurea.local',
    telefono: '+51 987 654 321',
  },
  {
    id: 'usr-adm-03-pedro',
    nombre: 'Pedro Castillo Morales',
    correo: 'pedro.castillo@aurea.local',
    telefono: '+51 912 345 678',
  },
];

const LOCALES_SEED: LocalItemDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    empresa_id: '00000000-0000-4000-8000-000000000001',
    nombre: 'ÁUREA Miraflores (Principal)',
    slug: 'aurea-miraflores',
    url_carta_digital: '/sede/aurea-miraflores/carta',
    direccion: 'Av. Larco 450',
    distrito: 'Miraflores',
    ciudad: 'Lima',
    telefono: '+51 987 654 321',
    zona_horaria: 'America/Lima',
    moneda: 'PEN',
    giro_negocio: 'cevicheria',
    estado: 'activo',
    es_autogestionado: false,
    administrador: {
      id: '00000000-0000-4000-8000-000000000102',
      nombre: 'Valeria Mendoza',
      correo: 'admin@aurea.local',
      telefono: '+51 900 000 102',
    },
    metricas: {
      total_pisos: 2,
      total_mesas: 18,
    },
    puede_desactivar: true,
    created_at: '2026-09-15T12:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000020',
    empresa_id: '00000000-0000-4000-8000-000000000001',
    nombre: 'ÁUREA San Isidro (Financiero)',
    slug: 'aurea-san-isidro',
    url_carta_digital: '/sede/aurea-san-isidro/carta',
    direccion: 'Av. Conquistadores 450',
    distrito: 'San Isidro',
    ciudad: 'Lima',
    telefono: '+51 1 221-3410',
    zona_horaria: 'America/Lima',
    moneda: 'PEN',
    giro_negocio: 'polleria',
    estado: 'activo',
    es_autogestionado: true, // ¡Autogestionado por el Propietario con botón directo!
    administrador: null,
    metricas: {
      total_pisos: 1,
      total_mesas: 8,
    },
    puede_desactivar: true,
    created_at: '2026-10-01T15:30:00Z',
  },
];

class PropietarioLocalesService {
  private simularBloqueoDuro = true;
  private forzarCupoLleno = false;

  private loadLocales(): LocalItemDTO[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    this.saveLocales(LOCALES_SEED);
    return LOCALES_SEED;
  }

  private saveLocales(locales: LocalItemDTO[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(locales));
    } catch {
      // ignore
    }
  }

  /**
   * Endpoint 1: Listar Directorio de Locales del Tenant
   * GET /api/v1/propietario/locales
   */
  async getDirectorioLocales(): Promise<DirectorioLocalesApiResponse> {
    await new Promise((res) => setTimeout(res, 350));
    const locales = this.loadLocales();
    const localesActivos = locales.filter((l) => l.estado === 'activo').length;
    const maxPermitido = this.forzarCupoLleno ? localesActivos : 3;
    const cuposDisponibles = Math.max(0, maxPermitido - localesActivos);

    return {
      exito: true,
      datos: {
        cuota_plan: {
          plan_id: 2,
          plan_nombre: 'Pro',
          locales_permitidos: maxPermitido,
          locales_activos: localesActivos,
          cupos_disponibles: cuposDisponibles,
          limite_alcanzado: cuposDisponibles === 0,
          downgrade_programado: false,
        },
        locales,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 2: Verificar Disponibilidad y Datos Previos para Alta
   * GET /api/v1/propietario/locales/verificar-disponibilidad
   */
  async verificarDisponibilidad(): Promise<VerificarDisponibilidadApiResponse> {
    await new Promise((res) => setTimeout(res, 200));
    const locales = this.loadLocales();
    const localesActivos = locales.filter((l) => l.estado === 'activo').length;
    const maxPermitido = this.forzarCupoLleno ? localesActivos : 3;
    const cupos = Math.max(0, maxPermitido - localesActivos);

    return {
      exito: true,
      datos: {
        puede_crear: cupos > 0,
        cupos_disponibles: cupos,
        max_permitido: maxPermitido,
        administradores_disponibles: ADMINISTRADORES_DISPONIBLES_SEED,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 3: Comprobar Disponibilidad de Slug de Carta Digital
   * GET /api/v1/propietario/locales/verificar-slug?slug={slug}
   */
  async verificarSlug(
    slugPropuesto: string,
    excluirLocalId?: string
  ): Promise<VerificarSlugApiResponse> {
    await new Promise((res) => setTimeout(res, 250));
    const cleanSlug = slugPropuesto.trim().toLowerCase();
    const locales = this.loadLocales();

    // Comprobar colisión contra otros locales
    const existe = locales.some(
      (l) => l.slug.toLowerCase() === cleanSlug && l.id !== excluirLocalId
    );

    if (existe) {
      return {
        exito: true,
        datos: {
          slug: cleanSlug,
          disponible: false,
          sugerencia: `${cleanSlug}-2`,
          mensaje: 'Esta dirección web ya está en uso. Puedes adoptar la sugerencia generada.',
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return {
      exito: true,
      datos: {
        slug: cleanSlug,
        disponible: true,
        sugerencia: null,
        mensaje: 'Enlace web disponible para la carta digital de tu restaurante.',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 4: Registrar Nueva Sede / Local
   * POST /api/v1/propietario/locales
   */
  async crearLocal(req: CrearLocalRequestDTO): Promise<CrearLocalApiResponse> {
    await new Promise((res) => setTimeout(res, 600));
    const locales = this.loadLocales();
    const localesActivos = locales.filter((l) => l.estado === 'activo').length;
    const maxPermitido = this.forzarCupoLleno ? localesActivos : 3;

    if (localesActivos >= maxPermitido) {
      return {
        exito: false,
        datos: null as unknown as CrearLocalApiResponse['datos'],
        errores: [
          {
            codigo: 'LOCAL_LIMITE_PLAN_ALCANZADO',
            mensaje:
              'Has alcanzado el límite máximo de locales de tu Plan Pro (3 locales). Por favor actualiza a Enterprise.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Verificar slug único
    const existeSlug = locales.some(
      (l) => l.slug.toLowerCase() === req.slug.trim().toLowerCase()
    );
    if (existeSlug) {
      return {
        exito: false,
        datos: null as unknown as CrearLocalApiResponse['datos'],
        errores: [
          {
            codigo: 'LOCAL_SLUG_DUPLICADO',
            mensaje: `La dirección web "${req.slug}" ya está ocupada.`,
            campo: 'slug',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const nuevoId = crypto.randomUUID();
    const esAutogestionado = req.modo_administracion === 'propietario';

    let adminAsignado: AdministradorResumenDTO | null = null;
    if (!esAutogestionado && req.administrador_usuario_id) {
      adminAsignado =
        ADMINISTRADORES_DISPONIBLES_SEED.find(
          (a) => a.id === req.administrador_usuario_id
        ) ?? null;
    }

    const nuevoLocal: LocalItemDTO = {
      id: nuevoId,
      empresa_id: '00000000-0000-4000-8000-000000000001',
      nombre: req.nombre,
      slug: req.slug,
      url_carta_digital: `/sede/${req.slug}/carta`,
      direccion: req.direccion,
      distrito: req.distrito,
      ciudad: req.ciudad,
      telefono: req.telefono,
      zona_horaria: 'America/Lima',
      moneda: 'PEN',
      giro_negocio: req.giro_negocio,
      estado: 'activo',
      es_autogestionado: esAutogestionado,
      administrador: adminAsignado,
      metricas: {
        total_pisos: 1,
        total_mesas: req.giro_negocio === 'en_blanco' ? 0 : 15,
      },
      puede_desactivar: true,
      created_at: new Date().toISOString(),
    };

    locales.push(nuevoLocal);
    this.saveLocales(locales);

    return {
      exito: true,
      datos: {
        id: nuevoId,
        nombre: nuevoLocal.nombre,
        slug: nuevoLocal.slug,
        url_carta_digital: nuevoLocal.url_carta_digital,
        giro_negocio: nuevoLocal.giro_negocio,
        estado: 'activo',
        zona_horaria: 'America/Lima',
        moneda: 'PEN',
        es_autogestionado: esAutogestionado,
        resumen_inicializacion: {
          pisos_creados: 1,
          piso_nombre: 'Salón Principal',
          categorias_creadas: req.giro_negocio === 'en_blanco' ? 0 : 5,
          insumos_creados: req.giro_negocio === 'en_blanco' ? 0 : 15,
        },
        mensaje: `Sede "${nuevoLocal.nombre}" registrada exitosamente. Salón Principal y carta inicial aprovisionados.`,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 5: Actualizar Datos de una Sede Existente
   * PUT /api/v1/propietario/locales/{id}
   */
  async actualizarLocal(
    id: string,
    req: ActualizarLocalRequestDTO
  ): Promise<ActualizarLocalApiResponse> {
    await new Promise((res) => setTimeout(res, 400));
    const locales = this.loadLocales();
    const index = locales.findIndex((l) => l.id === id);

    if (index === -1) {
      return {
        exito: false,
        datos: null as unknown as LocalItemDTO,
        errores: [
          {
            codigo: 'LOCAL_NO_ENCONTRADO',
            mensaje: 'El local solicitado no existe en el sistema.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const esAutogestionado = req.modo_administracion === 'propietario';
    let adminAsignado: AdministradorResumenDTO | null = null;
    if (!esAutogestionado && req.administrador_usuario_id) {
      adminAsignado =
        ADMINISTRADORES_DISPONIBLES_SEED.find(
          (a) => a.id === req.administrador_usuario_id
        ) ?? null;
    }

    const localActualizado: LocalItemDTO = {
      ...locales[index],
      nombre: req.nombre,
      slug: req.slug,
      url_carta_digital: `/sede/${req.slug}/carta`,
      direccion: req.direccion,
      distrito: req.distrito,
      ciudad: req.ciudad,
      telefono: req.telefono,
      es_autogestionado: esAutogestionado,
      administrador: adminAsignado,
    };

    locales[index] = localActualizado;
    this.saveLocales(locales);

    return {
      exito: true,
      datos: localActualizado,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 6: Validar Viabilidad Operativa de Baja (Auditoría de Bloqueo Duro)
   * GET /api/v1/propietario/locales/{id}/validar-baja
   */
  async validarBajaLocal(id: string): Promise<ValidarBajaApiResponse> {
    await new Promise((res) => setTimeout(res, 350));
    const locales = this.loadLocales();
    const local = locales.find((l) => l.id === id);

    if (!local) {
      return {
        exito: false,
        datos: null as unknown as ValidarBajaApiResponse['datos'],
        errores: [{ codigo: 'LOCAL_NO_ENCONTRADO', mensaje: 'Sede no encontrada' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const localesActivos = locales.filter((l) => l.estado === 'activo');
    const esUltimoActivo = localesActivos.length <= 1 && local.estado === 'activo';

    if (esUltimoActivo) {
      return {
        exito: true,
        datos: {
          local_id: local.id,
          nombre: local.nombre,
          puede_desactivar: false,
          es_ultimo_local_activo: true,
          bloqueos_operativos: [],
          aviso: 'No puedes desactivar la única sede activa de tu restaurante. Tu empresa requiere al menos una sede operativa.',
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Si está activada la simulación de bloqueo duro
    if (this.simularBloqueoDuro) {
      return {
        exito: true,
        datos: {
          local_id: local.id,
          nombre: local.nombre,
          puede_desactivar: false,
          es_ultimo_local_activo: false,
          bloqueos_operativos: [
            {
              tipo: 'CAJA_ABIERTA',
              descripcion: 'Caja Turno Tarde se encuentra ABIERTA',
              responsable: 'Lucía Flores (Cajero)',
              monto_acumulado: 1420.5,
              sesion_id: 'caj-ses-9988',
            },
            {
              tipo: 'PEDIDOS_ACTIVOS',
              descripcion: 'Existen 2 pedidos pendientes de atención o cobro en el salón',
              mesas_afectadas: ['Mesa 04', 'Mesa 07'],
            },
          ],
          aviso: 'Debes cerrar todas las sesiones de caja y liquidar los pedidos en comanda antes de desactivar la sede.',
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Caso limpio (desactivable)
    return {
      exito: true,
      datos: {
        local_id: local.id,
        nombre: local.nombre,
        puede_desactivar: true,
        es_ultimo_local_activo: false,
        bloqueos_operativos: [],
        aviso: 'La sede no tiene actividad operativa en curso. Puedes desactivarla de forma segura sin perder datos históricos ni reportes.',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 7: Cambiar Estado de un Local (Desactivar / Reactivar)
   * PATCH /api/v1/propietario/locales/{id}/cambiar-estado
   */
  async cambiarEstadoLocal(
    id: string,
    req: CambiarEstadoLocalRequestDTO
  ): Promise<CambiarEstadoApiResponse> {
    await new Promise((res) => setTimeout(res, 450));
    const locales = this.loadLocales();
    const index = locales.findIndex((l) => l.id === id);

    if (index === -1) {
      return {
        exito: false,
        datos: null as unknown as CambiarEstadoApiResponse['datos'],
        errores: [{ codigo: 'LOCAL_NO_ENCONTRADO', mensaje: 'Sede no encontrada' }],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    locales[index].estado = req.nuevo_estado;
    this.saveLocales(locales);

    return {
      exito: true,
      datos: {
        id: locales[index].id,
        nombre: locales[index].nombre,
        estado: locales[index].estado,
        mensaje:
          req.nuevo_estado === 'activo'
            ? `Sede "${locales[index].nombre}" reactivada con éxito.`
            : `Sede "${locales[index].nombre}" desactivada correctamente. Cupo del plan liberado.`,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // =========================================================================
  // MÉTODOS QA / DEMO PLAYGROUND
  // =========================================================================
  setSimularBloqueoDuro(val: boolean): void {
    this.simularBloqueoDuro = val;
  }

  getSimularBloqueoDuro(): boolean {
    return this.simularBloqueoDuro;
  }

  setForzarCupoLleno(val: boolean): void {
    this.forzarCupoLleno = val;
  }

  getForzarCupoLleno(): boolean {
    return this.forzarCupoLleno;
  }

  toggleAutogestion(localId: string): void {
    const locales = this.loadLocales();
    const index = locales.findIndex((l) => l.id === localId);
    if (index !== -1) {
      locales[index].es_autogestionado = !locales[index].es_autogestionado;
      if (locales[index].es_autogestionado) {
        locales[index].administrador = null;
      } else {
        locales[index].administrador = ADMINISTRADORES_DISPONIBLES_SEED[0];
      }
      this.saveLocales(locales);
    }
  }

  restablecerSemillas(): void {
    this.simularBloqueoDuro = true;
    this.forzarCupoLleno = false;
    this.saveLocales(LOCALES_SEED);
  }
}

export const propietarioLocalesService = new PropietarioLocalesService();
