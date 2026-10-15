/**
 * Constantes centralizadas de rutas del Frontend de RestaurantCloud AI.
 * Permite tipado estricto y evita rutas 'quemadas' (hardcoded) en los componentes.
 */
export const ROUTES = {
  // Dominio Público SaaS
  HOME: '/',
  LOGIN: '/login',
  REGISTRO: '/registro',
  RECUPERAR_PASSWORD: '/recuperar-password',

  // Experiencia Cliente QR por Slug y Comprobantes
  SEDE_CARTA: (slug: string = ':slug') => `/sede/${slug}/carta`,
  SEDE_ALIAS: (slug: string = ':slug') => `/m/${slug}`,
  SEDE_COMPROBANTE: (slug: string = ':slug', id: string = ':numero') => `/sede/${slug}/comprobante/${id}`,
  COMPROBANTE_DIRECTO: (token: string = ':token') => `/c/${token}`,
  COMPROBANTE_BUSQUEDA: '/comprobante',

  // Portal Propietario (Multi-Local & Corporativo)
  PROPIETARIO_DASHBOARD: '/propietario/dashboard',
  PROPIETARIO_SEDES: '/propietario/sedes',
  PROPIETARIO_ADMINISTRADORES: '/propietario/administradores',
  PROPIETARIO_SUSCRIPCION: '/propietario/suscripcion',
  PROPIETARIO_INCIDENTES: '/propietario/incidentes',

  // Portal Administrador de Local
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PLANO_MESAS: '/admin/plano-mesas',
  ADMIN_CARTA: '/admin/carta',
  ADMIN_CATEGORIAS: '/admin/categorias',
  ADMIN_INVENTARIO: '/admin/inventario',
  ADMIN_PROVEEDORES: '/admin/proveedores',
  ADMIN_COMPRAS: '/admin/compras',
  ADMIN_PERSONAL: '/admin/personal',
  ADMIN_HORARIO: '/admin/horario',
  ADMIN_POLITICAS_RESERVA: '/admin/politicas-reserva',
  ADMIN_INCIDENTES: '/admin/incidentes',
  ADMIN_ANULACIONES: '/admin/anulaciones',
  ADMIN_PROMOCIONES: '/admin/promociones',
  ADMIN_CONFIGURACION_KDS: '/admin/configuracion-kds',
  ADMIN_METODOS_PAGO: '/admin/metodos-pago',
  ADMIN_REPORTES_VENTAS: '/admin/reportes/ventas',
  ADMIN_REPORTES_CIERRES_Z: '/admin/reportes/cierres-z',

  // Terminales Operativas Salón, Cocina y Caja
  MOZO_MESAS: '/mozo/mesas',
  MOZO_COMANDA: (mesaId: string = ':mesaId') => `/mozo/mesas/${mesaId}/comanda`,
  MOZO_PRECUENTA: (mesaId: string = ':mesaId') => `/mozo/mesas/${mesaId}/precuenta`,
  MOZO_RESERVAS: '/mozo/reservas',

  COCINA_KDS: '/cocina/kds',
  COCINA_STOCK_RAPIDO: '/cocina/stock-rapido',

  CAJERO_POS: '/cajero/pos',
  CAJERO_TURNO: '/cajero/turno',

  // Consola Global Admin SaaS
  SAAS_TENANTS: '/saas/tenants',
  SAAS_PLANES: '/saas/planes',
} as const;
