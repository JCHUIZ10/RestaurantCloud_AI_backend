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

import type{
DepartamentoPeru,
ProvinciaPeru,
DistritoPeru
} from '@/types/geografia'

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
    ubigeo_cod: '150122',
    departamento: 'Lima',
    provincia: 'Lima',
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
    ubigeo_cod: '150131',
    departamento: 'Lima',
    provincia: 'Lima',
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

export const DEPARTAMENTOS_PERU: DepartamentoPeru[] = [
  { codigo: '02', nombre: 'Áncash' },
  { codigo: '15', nombre: 'Lima' },
  { codigo: '07', nombre: 'Callao' },
  { codigo: '13', nombre: 'La Libertad' },
  { codigo: '04', nombre: 'Arequipa' },
  { codigo: '14', nombre: 'Lambayeque' },
  { codigo: '20', nombre: 'Piura' },
  { codigo: '06', nombre: 'Cajamarca' },
  { codigo: '08', nombre: 'Cusco' },
  { codigo: '11', nombre: 'Ica' },
  { codigo: '12', nombre: 'Junín' },
  { codigo: '22', nombre: 'San Martín' },
  { codigo: '01', nombre: 'Amazonas' },
  { codigo: '03', nombre: 'Apurímac' },
  { codigo: '05', nombre: 'Ayacucho' },
  { codigo: '09', nombre: 'Huancavelica' },
  { codigo: '10', nombre: 'Huánuco' },
  { codigo: '16', nombre: 'Loreto' },
  { codigo: '17', nombre: 'Madre de Dios' },
  { codigo: '18', nombre: 'Moquegua' },
  { codigo: '19', nombre: 'Pasco' },
  { codigo: '21', nombre: 'Puno' },
  { codigo: '23', nombre: 'Tacna' },
  { codigo: '24', nombre: 'Tumbes' },
  { codigo: '25', nombre: 'Ucayali' },
];

export const PROVINCIAS_PERU: ProvinciaPeru[] = [
  // Áncash (02)
  { codigo: '0218', departamento_codigo: '02', nombre: 'Santa' },
  { codigo: '0201', departamento_codigo: '02', nombre: 'Huaraz' },
  { codigo: '0207', departamento_codigo: '02', nombre: 'Casma' },
  { codigo: '0211', departamento_codigo: '02', nombre: 'Huarmey' },
  { codigo: '0212', departamento_codigo: '02', nombre: 'Huaylas' },

  // Lima (15) y Callao (07)
  { codigo: '1501', departamento_codigo: '15', nombre: 'Lima' },
  { codigo: '1505', departamento_codigo: '15', nombre: 'Cañete' },
  { codigo: '1506', departamento_codigo: '15', nombre: 'Huaral' },
  { codigo: '1507', departamento_codigo: '15', nombre: 'Huarochirí' },
  { codigo: '1508', departamento_codigo: '15', nombre: 'Huaura' },
  { codigo: '0701', departamento_codigo: '07', nombre: 'Callao' },

  // La Libertad (13)
  { codigo: '1301', departamento_codigo: '13', nombre: 'Trujillo' },
  { codigo: '1302', departamento_codigo: '13', nombre: 'Ascope' },
  { codigo: '1307', departamento_codigo: '13', nombre: 'Pacasmayo' },
  { codigo: '1312', departamento_codigo: '13', nombre: 'Virú' },

  // Arequipa (04)
  { codigo: '0401', departamento_codigo: '04', nombre: 'Arequipa' },
  { codigo: '0402', departamento_codigo: '04', nombre: 'Camaná' },
  { codigo: '0403', departamento_codigo: '04', nombre: 'Caravelí' },
  { codigo: '0404', departamento_codigo: '04', nombre: 'Castilla' },
  { codigo: '0405', departamento_codigo: '04', nombre: 'Caylloma' },
  { codigo: '0408', departamento_codigo: '04', nombre: 'Islay' },

  // Lambayeque (14)
  { codigo: '1401', departamento_codigo: '14', nombre: 'Chiclayo' },
  { codigo: '1402', departamento_codigo: '14', nombre: 'Ferreñafe' },
  { codigo: '1403', departamento_codigo: '14', nombre: 'Lambayeque' },

  // Piura (20)
  { codigo: '2001', departamento_codigo: '20', nombre: 'Piura' },
  { codigo: '2004', departamento_codigo: '20', nombre: 'Morropón' },
  { codigo: '2005', departamento_codigo: '20', nombre: 'Paita' },
  { codigo: '2006', departamento_codigo: '20', nombre: 'Sullana' },
  { codigo: '2007', departamento_codigo: '20', nombre: 'Talara' },

  // Cusco (08)
  { codigo: '0801', departamento_codigo: '08', nombre: 'Cusco' },
  { codigo: '0808', departamento_codigo: '08', nombre: 'La Convención' },
  { codigo: '0813', departamento_codigo: '08', nombre: 'Urubamba' },

  // Ica (11)
  { codigo: '1101', departamento_codigo: '11', nombre: 'Ica' },
  { codigo: '1102', departamento_codigo: '11', nombre: 'Chincha' },
  { codigo: '1103', departamento_codigo: '11', nombre: 'Nasca' },
  { codigo: '1105', departamento_codigo: '11', nombre: 'Pisco' },

  // Junín (12)
  { codigo: '1201', departamento_codigo: '12', nombre: 'Huancayo' },
  { codigo: '1203', departamento_codigo: '12', nombre: 'Chanchamayo' },
  { codigo: '1206', departamento_codigo: '12', nombre: 'Satipo' },
  { codigo: '1208', departamento_codigo: '12', nombre: 'Tarma' },

  // San Martín (22)
  { codigo: '2209', departamento_codigo: '22', nombre: 'San Martín (Tarapoto)' },
  { codigo: '2201', departamento_codigo: '22', nombre: 'Moyobamba' },
];

export const DISTRITOS_PERU: DistritoPeru[] = [
  // =========================================================================
  // ÁNCASH - PROVINCIA DEL SANTA (0218) [PREDETERMINADO NACIONAL]
  // =========================================================================
  { codigo: '021801', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Chimbote' },
  { codigo: '021808', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Nuevo Chimbote' },
  { codigo: '021803', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Coishco' },
  { codigo: '021809', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Santa' },
  { codigo: '021807', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Samanco' },
  { codigo: '021806', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Nepeña' },
  { codigo: '021805', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Moro' },
  { codigo: '021804', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Macate' },
  { codigo: '021802', provincia_codigo: '0218', departamento_codigo: '02', nombre: 'Cáceres del Perú (Jimbe)' },

  // Áncash - Huaraz (0201)
  { codigo: '020101', provincia_codigo: '0201', departamento_codigo: '02', nombre: 'Huaraz' },
  { codigo: '020102', provincia_codigo: '0201', departamento_codigo: '02', nombre: 'Independencia' },

  // Áncash - Casma (0207)
  { codigo: '020701', provincia_codigo: '0207', departamento_codigo: '02', nombre: 'Casma' },
  { codigo: '020702', provincia_codigo: '0207', departamento_codigo: '02', nombre: 'Buena Vista Alta' },
  { codigo: '020703', provincia_codigo: '0207', departamento_codigo: '02', nombre: 'Comandante Noel' },
  { codigo: '020704', provincia_codigo: '0207', departamento_codigo: '02', nombre: 'Yaután' },

  // Áncash - Huarmey (0211)
  { codigo: '021101', provincia_codigo: '0211', departamento_codigo: '02', nombre: 'Huarmey' },
  { codigo: '021102', provincia_codigo: '0211', departamento_codigo: '02', nombre: 'Culebras' },

  // =========================================================================
  // LIMA - PROVINCIA DE LIMA (1501)
  // =========================================================================
  { codigo: '150122', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Miraflores' },
  { codigo: '150131', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'San Isidro' },
  { codigo: '150140', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Santiago de Surco' },
  { codigo: '150130', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'San Borja' },
  { codigo: '150104', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Barranco' },
  { codigo: '150116', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Magdalena del Mar' },
  { codigo: '150120', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Pueblo Libre' },
  { codigo: '150113', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Jesús María' },
  { codigo: '150114', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'La Molina' },
  { codigo: '150115', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'La Victoria' },
  { codigo: '150117', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Lince' },
  { codigo: '150141', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Surquillo' },
  { codigo: '150132', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'San Miguel' },
  { codigo: '150101', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Cercado de Lima' },
  { codigo: '150103', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Ate' },
  { codigo: '150112', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Independencia' },
  { codigo: '150119', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'Los Olivos' },
  { codigo: '150133', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'San Martín de Porres' },
  { codigo: '150134', provincia_codigo: '1501', departamento_codigo: '15', nombre: 'San Juan de Lurigancho' },

  // Callao (0701)
  { codigo: '070101', provincia_codigo: '0701', departamento_codigo: '07', nombre: 'Callao' },
  { codigo: '070102', provincia_codigo: '0701', departamento_codigo: '07', nombre: 'Bellavista' },
  { codigo: '070104', provincia_codigo: '0701', departamento_codigo: '07', nombre: 'La Perla' },
  { codigo: '070105', provincia_codigo: '0701', departamento_codigo: '07', nombre: 'La Punta' },
  { codigo: '070106', provincia_codigo: '0701', departamento_codigo: '07', nombre: 'Ventanilla' },

  // =========================================================================
  // LA LIBERTAD - PROVINCIA DE TRUJILLO (1301)
  // =========================================================================
  { codigo: '130101', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'Trujillo' },
  { codigo: '130102', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'Huanchaco' },
  { codigo: '130107', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'Víctor Larco Herrera' },
  { codigo: '130106', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'Moche' },
  { codigo: '130104', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'El Porvenir' },
  { codigo: '130105', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'Florencia de Mora' },
  { codigo: '130109', provincia_codigo: '1301', departamento_codigo: '13', nombre: 'Salaverry' },

  // =========================================================================
  // AREQUIPA - PROVINCIA DE AREQUIPA (0401)
  // =========================================================================
  { codigo: '040101', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Arequipa' },
  { codigo: '040129', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Yanahuara' },
  { codigo: '040103', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Cayma' },
  { codigo: '040104', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Cerro Colorado' },
  { codigo: '040102', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Alto Selva Alegre' },
  { codigo: '040112', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Paucarpata' },
  { codigo: '040119', provincia_codigo: '0401', departamento_codigo: '04', nombre: 'Socabaya' },

  // =========================================================================
  // PIURA - PROVINCIA DE PIURA (2001)
  // =========================================================================
  { codigo: '200101', provincia_codigo: '2001', departamento_codigo: '20', nombre: 'Piura' },
  { codigo: '200104', provincia_codigo: '2001', departamento_codigo: '20', nombre: 'Castilla' },
  { codigo: '200105', provincia_codigo: '2001', departamento_codigo: '20', nombre: 'Catacaos' },
  { codigo: '200115', provincia_codigo: '2001', departamento_codigo: '20', nombre: 'Veintiséis de Octubre' },

  // =========================================================================
  // LAMBAYEQUE - PROVINCIA DE CHICLAYO (1401)
  // =========================================================================
  { codigo: '140101', provincia_codigo: '1401', departamento_codigo: '14', nombre: 'Chiclayo' },
  { codigo: '140108', provincia_codigo: '1401', departamento_codigo: '14', nombre: 'La Victoria' },
  { codigo: '140106', provincia_codigo: '1401', departamento_codigo: '14', nombre: 'José Leonardo Ortiz' },
  { codigo: '140112', provincia_codigo: '1401', departamento_codigo: '14', nombre: 'Pimentel' },

  // =========================================================================
  // CUSCO - PROVINCIA DE CUSCO (0801)
  // =========================================================================
  { codigo: '080101', provincia_codigo: '0801', departamento_codigo: '08', nombre: 'Cusco' },
  { codigo: '080106', provincia_codigo: '0801', departamento_codigo: '08', nombre: 'Santiago' },
  { codigo: '080108', provincia_codigo: '0801', departamento_codigo: '08', nombre: 'Wanchaq' },
  { codigo: '080105', provincia_codigo: '0801', departamento_codigo: '08', nombre: 'San Sebastián' },
  { codigo: '080104', provincia_codigo: '0801', departamento_codigo: '08', nombre: 'San Jerónimo' },
];

// Valores por defecto solicitados por la arquitectura: Áncash > Santa > Chimbote
export const DEFAULT_DEPARTAMENTO_COD = '02'; // Áncash
export const DEFAULT_PROVINCIA_COD = '0218'; // Santa
export const DEFAULT_DISTRITO_COD = '021801'; // Chimbote

/**
 * Obtener provincias filtradas por código de departamento
 */
export function getProvinciasByDepartamento(departamentoCodigo: string): ProvinciaPeru[] {
  const provs = PROVINCIAS_PERU.filter((p) => p.departamento_codigo === departamentoCodigo);
  if (provs.length === 0) {
    // Fallback genérico para departamentos sin provincias exhaustivas
    const dep = DEPARTAMENTOS_PERU.find((d) => d.codigo === departamentoCodigo);
    return [
      {
        codigo: `${departamentoCodigo}01`,
        departamento_codigo: departamentoCodigo,
        nombre: dep ? dep.nombre : 'Capital',
      },
    ];
  }
  return provs;
}

/**
 * Obtener distritos filtrados por código de provincia
 */
export function getDistritosByProvincia(provinciaCodigo: string): DistritoPeru[] {
  const dists = DISTRITOS_PERU.filter((d) => d.provincia_codigo === provinciaCodigo);
  if (dists.length === 0) {
    // Fallback genérico
    const prov = PROVINCIAS_PERU.find((p) => p.codigo === provinciaCodigo);
    return [
      {
        codigo: `${provinciaCodigo}01`,
        provincia_codigo: provinciaCodigo,
        departamento_codigo: provinciaCodigo.substring(0, 2),
        nombre: prov ? prov.nombre : 'Cercado',
      },
    ];
  }
  return dists;
}

/**
 * Buscar la información completa de UBIGEO a partir de un código de distrito
 */
export function getUbigeoCompleto(distritoCodigo: string): {
  departamento: DepartamentoPeru;
  provincia: ProvinciaPeru;
  distrito: DistritoPeru;
} | null {
  const dist = DISTRITOS_PERU.find((d) => d.codigo === distritoCodigo);
  if (!dist) return null;

  const prov = PROVINCIAS_PERU.find((p) => p.codigo === dist.provincia_codigo);
  const dep = DEPARTAMENTOS_PERU.find((d) => d.codigo === dist.departamento_codigo);

  if (!prov || !dep) return null;

  return { departamento: dep, provincia: prov, distrito: dist };
}


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
      ubigeo_cod: req.ubigeo_cod || '021801',
      departamento: req.departamento || 'Áncash',
      provincia: req.provincia || 'Santa',
      distrito: req.distrito || 'Chimbote',
      ciudad: req.ciudad || 'Chimbote',
      referencia: req.referencia,
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
      ubigeo_cod: req.ubigeo_cod || locales[index].ubigeo_cod || '021801',
      departamento: req.departamento || locales[index].departamento || 'Áncash',
      provincia: req.provincia || locales[index].provincia || 'Santa',
      distrito: req.distrito || locales[index].distrito || 'Chimbote',
      ciudad: req.ciudad || locales[index].ciudad || 'Chimbote',
      referencia: req.referencia ?? locales[index].referencia,
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
