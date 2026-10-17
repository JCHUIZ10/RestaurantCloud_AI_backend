import type { ApiResponse } from '@/types/api';
import type {
  LoginRequestDTO,
  LoginResponseDTO,
  SeleccionarCuentaRequestDTO,
  BetaCredentialPreset,
} from '@/types/auth';

/**
 * Catálogo canónico de credenciales preconfiguradas para pruebas Beta.
 * Permite explorar todos los roles y paneles del sistema sin memorizar contraseñas.
 */
export const BETA_CREDENTIALS: BetaCredentialPreset[] = [
  {
    rol: 'propietario',
    rolLabel: 'Propietario (Owner)',
    nombrePersona: 'Rodrigo De Las Casas',
    correo: 'propietario@aurea.local',
    password: 'propietario2026',
    descripcion: 'Control corporativo multi-sede, suscripción Stripe y facturación consolidada.',
    destinoDashboard: '/propietario/dashboard',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    rol: 'admin_local',
    rolLabel: 'Administrador de Sede',
    nombrePersona: 'Valeria Mendoza',
    correo: 'admin@aurea.local',
    password: 'admin-local2026',
    descripcion: 'Gestión de inventario de bodega, plano de mesas, carta y personal de Miraflores.',
    destinoDashboard: '/admin/dashboard',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    rol: 'mozo',
    rolLabel: 'Mozo de Salón',
    nombrePersona: 'Carlos Huamán',
    correo: 'mozo@aurea.local',
    password: 'mozo2026',
    descripcion: 'Terminal móvil de salón: estado de mesas, toma de comandas y bebidas directas.',
    destinoDashboard: '/mozo/mesas',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    rol: 'cocina',
    rolLabel: 'Jefe de Cocina / KDS',
    nombrePersona: 'Roberto Vargas',
    correo: 'cocina@aurea.local',
    password: 'cocina2026',
    descripcion: 'Kitchen Display System en tiempo real: semáforo de fogones y despacho al pase.',
    destinoDashboard: '/cocina/kds',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    rol: 'cajero',
    rolLabel: 'Cajero Principal',
    nombrePersona: 'Lucía Quispe',
    correo: 'cajero@aurea.local',
    password: 'cajero2026',
    descripcion: 'Terminal POS de cobro, división de cuentas, boletas/facturas y arqueo de turnos.',
    destinoDashboard: '/cajero/pos',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    rol: 'admin_saas',
    rolLabel: 'SuperAdmin SaaS',
    nombrePersona: 'Operaciones RestaurantCloud',
    correo: 'admin@restaurantcloud.pe',
    password: 'admin-saas2026',
    descripcion: 'Consola global de plataforma: auditoría de restaurantes tenants y planes Stripe.',
    destinoDashboard: '/saas/tenants',
    badgeColor: 'bg-slate-800 text-white border-slate-900',
  }
];


// Cuentas simuladas para el caso multi-cuenta
const CUENTAS_MULTI_TENANT = [
  {
    usuario_id: 'usr-001-casona-mozo',
    empresa_id: 'emp-001-casona',
    empresa_nombre: 'La Casona Criolla S.A.C.',
    local_id: 'loc-001-casona-miraflores',
    local_nombre: 'Sede Miraflores (Salón)',
    rol: 'mozo' as const,
    estado_empresa: 'activa' as const,
    acceso_habilitado: true,
  },
  {
    usuario_id: 'usr-002-burger-owner',
    empresa_id: 'emp-002-burger',
    empresa_nombre: 'Burger & Beer Co. EIRL',
    local_id: null,
    local_nombre: 'Acceso Corporativo',
    rol: 'propietario' as const,
    estado_empresa: 'activa' as const,
    acceso_habilitado: true,
  },
  {
    usuario_id: 'usr-003-pizzeria-caja',
    empresa_id: 'emp-003-pizzeria',
    empresa_nombre: 'Pizzería Napolitana Gourmet',
    local_id: 'loc-003-pizzeria-centro',
    local_nombre: 'Sede Centro Histórico',
    rol: 'cajero' as const,
    estado_empresa: 'suspendida' as const,
    acceso_habilitado: false,
    motivo_bloqueo: 'Suscripción temporalmente suspendida por falta de pago.',
  },
];

/**
 * Simulación del endpoint POST /api/v1/auth/login
 */
export async function loginWithCredentials(
  req: LoginRequestDTO
): Promise<ApiResponse<LoginResponseDTO>> {
  // Latencia de red simulada (300ms)
  await new Promise((r) => setTimeout(r, 300));

  const correoTrim = req.correo.trim().toLowerCase();
  const passwordTrim = req.password.trim();

  // Caso 1: Usuario Multi-Cuenta (Demostración de bifurcación de tenant)
  if (correoTrim === 'multicuenta@restaurantcloud.pe') {
    if (passwordTrim !== 'PasswordMultiTenant2026!') {
      return {
        exito: false,
        datos: { requiere_seleccion: false },
        errores: [
          {
            codigo: 'CREDENCIALES_INVALIDAS',
            mensaje: 'Correo o contraseña incorrectos.',
          },
        ],
      };
    }

    return {
      exito: true,
      datos: {
        requiere_seleccion: true,
        temp_token: 'temp_token_stateless_jwt_987654321',
        expira_en_segundos: 300, // 5 minutos de countdown
        cuentas: CUENTAS_MULTI_TENANT,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Caso 2: Cuentas individuales según catálogo beta
  const preset = BETA_CREDENTIALS.find(
    (b) => b.correo.toLowerCase() === correoTrim
  );

  if (!preset || preset.password !== passwordTrim) {
    return {
      exito: false,
      datos: { requiere_seleccion: false },
      errores: [
        {
          codigo: 'CREDENCIALES_INVALIDAS',
          mensaje: 'Correo o contraseña incorrectos. Verifica tus credenciales.',
        },
      ],
    };
  }

  // Generar sesión según el rol
  const rol = preset.rol as
    | 'admin_saas'
    | 'propietario'
    | 'admin_local'
    | 'mozo'
    | 'cocina'
    | 'cajero';

  return {
    exito: true,
    datos: {
      requiere_seleccion: false,
      token: `jwt_session_token_${rol}_${Date.now()}`,
      refresh_token: `refresh_token_${Date.now()}`,
      usuario: {
        id: `usr-${rol}-001`,
        nombre: preset.nombrePersona,
        correo: preset.correo,
        rol: rol,
        empresa: {
          id: 'emp-aurea-01',
          nombre: 'Restaurante ÁUREA S.A.C.',
        },
        local:
          rol !== 'admin_saas' && rol !== 'propietario'
            ? {
                id: 'loc-miraflores-01',
                nombre: 'Sede Miraflores - Malecón',
              }
            : undefined,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Simulación del endpoint POST /api/v1/auth/seleccionar-cuenta
 */
export async function seleccionarCuenta(
  req: SeleccionarCuentaRequestDTO,
  tempToken: string
): Promise<ApiResponse<LoginResponseDTO>> {
  await new Promise((r) => setTimeout(r, 250));

  if (!tempToken) {
    return {
      exito: false,
      datos: { requiere_seleccion: false },
      errores: [
        {
          codigo: 'TEMP_TOKEN_EXPIRADO',
          mensaje: 'La sesión temporal ha expirado. Por favor inicia sesión nuevamente.',
        },
      ],
    };
  }

  const cuentaSeleccionada = CUENTAS_MULTI_TENANT.find(
    (c) => c.usuario_id === req.usuario_id
  );

  if (!cuentaSeleccionada) {
    return {
      exito: false,
      datos: { requiere_seleccion: false },
      errores: [
        {
          codigo: 'CUENTA_NO_ENCONTRADA',
          mensaje: 'La cuenta seleccionada no existe.',
        },
      ],
    };
  }

  if (!cuentaSeleccionada.acceso_habilitado) {
    return {
      exito: false,
      datos: { requiere_seleccion: false },
      errores: [
        {
          codigo: 'EMPRESA_SUSPENDIDA',
          mensaje: cuentaSeleccionada.motivo_bloqueo || 'El acceso a esta empresa se encuentra bloqueado.',
        },
      ],
    };
  }

  return {
    exito: true,
    datos: {
      requiere_seleccion: false,
      token: `jwt_session_token_${cuentaSeleccionada.rol}_${Date.now()}`,
      refresh_token: `refresh_token_${Date.now()}`,
      usuario: {
        id: cuentaSeleccionada.usuario_id,
        nombre: 'Fernando Tapia',
        correo: 'multicuenta@restaurantcloud.pe',
        rol: cuentaSeleccionada.rol,
        empresa: {
          id: cuentaSeleccionada.empresa_id,
          nombre: cuentaSeleccionada.empresa_nombre,
        },
        local: cuentaSeleccionada.local_id
          ? {
              id: cuentaSeleccionada.local_id,
              nombre: cuentaSeleccionada.local_nombre,
            }
          : undefined,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}
