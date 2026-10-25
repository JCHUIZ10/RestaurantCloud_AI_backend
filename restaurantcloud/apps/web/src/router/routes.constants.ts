/**
 * Constantes centralizadas de rutas del Frontend de RestaurantCloud AI.
 * Permite tipado estricto y evita rutas 'quemadas' (hardcoded) en los componentes.
 * 
 * NOTA DE ALCANCE:
 * - [ACTIVO PRIMER AVANCE]: Módulos operacionales activos y navegables en sidebars.
 * - [PRÓXIMO ENTREGABLE - FASE 2]: Módulos formalmente documentados con DDLs y contratos
 *   cuyo acceso visual directo despliega la vista informativa correspondiente.
 */
export const ROUTES = {
  // Dominio Público SaaS [ACTIVO PRIMER AVANCE]
  HOME: '/',
  LOGIN: '/login',
  REGISTRO: '/registro',
  ACTIVAR_CUENTA: '/activar-cuenta',
  RECUPERAR_PASSWORD: '/recuperar-password',

  // Experiencia Cliente QR por Slug y Comprobantes [ACTIVO PRIMER AVANCE]
  SEDE_CARTA: (slug: string = ':slug') => `/sede/${slug}/carta`,
  SEDE_ALIAS: (slug: string = ':slug') => `/m/${slug}`,
  SEDE_COMPROBANTE: (slug: string = ':slug', id: string = ':numero') => `/sede/${slug}/comprobante/${id}`,
  COMPROBANTE_DIRECTO: (token: string = ':token') => `/c/${token}`,
  COMPROBANTE_BUSQUEDA: '/comprobante',

  // Portal Propietario (Multi-Local & Corporativo)
  // [PRÓXIMO ENTREGABLE - FASE 2]: Resumen general corporativo multi-sede
  PROPIETARIO_DASHBOARD: '/propietario/dashboard',
  // [ACTIVO PRIMER AVANCE]:
  PROPIETARIO_SEDES: '/propietario/sedes',
  PROPIETARIO_ADMINISTRADORES: '/propietario/administradores',
  PROPIETARIO_SUSCRIPCION: '/propietario/suscripcion',
  PROPIETARIO_CAMBIAR_PLAN: '/propietario/cambiar-plan',
  // [PRÓXIMO ENTREGABLE - FASE 2]: Incidentes empresa (supervisión corporativa multi-sede)
  PROPIETARIO_INCIDENTES: '/propietario/incidentes',

  // Portal Administrador de Local
  // [ACTIVOS PRIMER AVANCE]:
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PLANO_MESAS: '/admin/plano-mesas',
  ADMIN_CARTA: '/admin/carta',
  ADMIN_CATEGORIAS: '/admin/categorias',
  ADMIN_INVENTARIO: '/admin/inventario',
  ADMIN_PROVEEDORES: '/admin/proveedores',
  ADMIN_COMPRAS: '/admin/compras',
  ADMIN_PERSONAL: '/admin/personal',
  ADMIN_HORARIO: '/admin/horario',
  ADMIN_PROMOCIONES: '/admin/promociones',
  ADMIN_CONFIGURACION_KDS: '/admin/configuracion-kds',
  ADMIN_METODOS_PAGO: '/admin/metodos-pago',
  ADMIN_ANULACIONES: '/admin/anulaciones',
  ADMIN_FLUJO_CAJA: '/admin/finanzas/flujo-caja',
  ADMIN_REPORTES_CIERRES_Z: '/admin/finanzas/flujo-caja',
  // [PRÓXIMO ENTREGABLE - FASE 2]: Módulos diferidos del Administrador
  ADMIN_POLITICAS_RESERVA: '/admin/politicas-reserva',
  ADMIN_INCIDENTES: '/admin/incidentes',
  ADMIN_REPORTES_VENTAS: '/admin/reportes/ventas',

  // Terminales Operativas Salón, Cocina y Caja [ACTIVOS PRIMER AVANCE]
  MOZO_MESAS: '/mozo/mesas',
  MOZO_COMANDA: (mesaId: string = ':mesaId') => `/mozo/mesas/${mesaId}/comanda`,
  MOZO_PRECUENTA: (mesaId: string = ':mesaId') => `/mozo/mesas/${mesaId}/precuenta`,
  MOZO_RESERVAS: '/mozo/reservas',

  COCINA_KDS: '/cocina/kds',
  COCINA_STOCK_RAPIDO: '/cocina/stock-rapido',

  CAJERO_POS: '/cajero/pos',
  CAJERO_APERTURA: '/cajero/apertura',
  CAJERO_TURNO: '/cajero/turno',

  // Consola Global Admin SaaS
  // [ACTIVO PRIMER AVANCE]:
  SAAS_TENANTS: '/saas/tenants',
  SAAS_TENANT_NUEVO: '/saas/tenants/nuevo',
  // [PRÓXIMO ENTREGABLE - FASE 2]: Catálogo y mantenimiento de planes SaaS
  SAAS_PLANES: '/saas/planes',
} as const;
