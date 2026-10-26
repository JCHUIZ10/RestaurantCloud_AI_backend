import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TerminalLayout } from '@/components/layout/TerminalLayout';
import { SedeCustomerLayout } from '@/components/layout/SedeCustomerLayout';
import { HomePage } from '@/modules/cliente/pages/HomePage';
import { PlaceholderView } from '@/components/ui/PlaceholderView';
import { ROUTES } from './routes.constants';
import { RequireRole } from './RequireRole';
import { ROLES_AREA } from './accesoPorRol';

import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { ActivarCuentaPage } from '@/modules/auth/pages/ActivarCuentaPage';
import { CartaDigitalPage } from '@/modules/cliente/pages/CartaDigitalPage';
import { ComprobanteDigitalPage } from '@/modules/cliente/pages/ComprobanteDigitalPage';
import { MozoMesasPage } from '@/modules/mozo/pages/MozoMesasPage';
import { MozoComandaPage } from '@/modules/mozo/pages/MozoComandaPage';
import { MozoPrecuentaPage } from '@/modules/mozo/pages/MozoPrecuentaPage';
import { MozoReservasPage } from '@/modules/mozo/pages/MozoReservasPage';
import { CocinaKdsPage } from '@/modules/cocina/pages/CocinaKdsPage';
import { CocinaStockRapidoPage } from '@/modules/cocina/pages/CocinaStockRapidoPage';
import { AdminPlanoMesasPage } from '@/modules/admin/pages/AdminPlanoMesasPage';
import { AdminCategoriasPage } from '@/modules/admin/pages/AdminCategoriasPage';
import { AdminInsumosPage } from '@/modules/admin/pages/AdminInsumosPage';
import { AdminProductosPage } from '@/modules/admin/pages/AdminProductosPage';
import { AdminProveedoresPage } from '@/modules/admin/pages/AdminProveedoresPage';
import { AdminComprasPage } from '@/modules/admin/pages/AdminComprasPage';
import { AdminPersonalPage } from '@/modules/admin/pages/AdminPersonalPage';
import { AdminHorarioPage } from '@/modules/admin/pages/AdminHorarioPage';
// Vistas preservadas en repositorio para Fase 2 (Próximo Entregable):
// import { AdminPoliticasReservaPage } from '@/modules/admin/pages/AdminPoliticasReservaPage';
// import { AdminIncidentesPage } from '@/modules/admin/pages/AdminIncidentesPage';
import { AdminAnulacionesPage } from '@/modules/admin/pages/AdminAnulacionesPage';
import { AdminPromocionesPage } from '@/modules/admin/pages/AdminPromocionesPage';
import { AdminConfiguracionKdsPage } from '@/modules/admin/pages/AdminConfiguracionKdsPage';
import { AdminMetodosPagoPage } from '@/modules/admin/pages/AdminMetodosPagoPage';
import { AdminFlujoCajaPage } from '@/modules/admin/pages/AdminFlujoCajaPage';
// import { PropietarioIncidentesPage } from '@/modules/propietario/pages/PropietarioIncidentesPage';
import { RegistroEmpresaPage } from '@/modules/propietario/pages/RegistroEmpresaPage';
import { PropietarioLocalesPage } from '@/modules/propietario/pages/PropietarioLocalesPage';
import { PropietarioAdministradoresPage } from '@/modules/propietario/pages/PropietarioAdministradoresPage';
import { PropietarioSuscripcionPage } from '@/modules/propietario/pages/PropietarioSuscripcionPage';
import { PropietarioCambiarPlanPage } from '@/modules/propietario/pages/PropietarioCambiarPlanPage';
import { CajeroPosPage } from '@/modules/caja/pages/CajeroPosPage';
import { CajeroTurnoCierrePage } from '@/modules/caja/pages/CajeroTurnoCierrePage';
import { SaasTenantsPage } from '@/modules/saas/pages/SaasTenantsPage';
import { SaasTenantOnboardingPage } from '@/modules/saas/pages/SaasTenantOnboardingPage';

// Redirección para el alias corto /m/:slug -> /sede/:slug/carta
const ShortMenuRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={ROUTES.SEDE_CARTA(slug)} replace />;
};

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  // =========================================================================
  // 1. DOMINIO PÚBLICO SAAS (Landing, Login, Registro Onboarding)
  // =========================================================================
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'registro',
        element: <RegistroEmpresaPage />,
      },
      {
        path: 'activar-cuenta',
        element: <ActivarCuentaPage />,
      },
      {
        path: 'recuperar-password',
        element: (
          <PlaceholderView
            codigoCu="CU-AUTH-02"
            nombrePantalla="Recuperación de Contraseña con OTP"
            rol="usuario"
            layoutNombre="PublicLayout"
            descripcion="Flujo seguro de restablecimiento de contraseña mediante envío de código OTP temporal a la casilla de correo del colaborador."
            viewportSugerido="desktop"
          />
        ),
      },
      {
        path: 'carta',
        element: <Navigate to="/sede/aurea-miraflores/carta" replace />,
      },
      // Búsqueda manual de comprobante Zero Dead-Ends
      {
        path: 'comprobante',
        element: <ComprobanteDigitalPage />,
      },
    ],
  },

  // =========================================================================
  // 2. EXPERIENCIA CLIENTE QR POR SLUG (Carta Digital & Comprobantes)
  // =========================================================================
  {
    path: '/sede/:slug',
    element: <SedeCustomerLayout />,
    children: [
      {
        path: 'carta',
        element: <CartaDigitalPage />,
      },
      {
        path: 'comprobante/:numero',
        element: <ComprobanteDigitalPage />,
      },
    ],
  },

  // Acceso directo a comprobante electrónico por token único QR (/c/:token)
  {
    path: '/c/:token',
    element: <SedeCustomerLayout />,
    children: [
      {
        index: true,
        element: <ComprobanteDigitalPage />,
      },
    ],
  },

  // Alias corto para QRs impresos (/m/:slug -> /sede/:slug/carta)
  {
    path: '/m/:slug',
    element: <ShortMenuRedirect />,
  },

  // =========================================================================
  // 3. CONSOLA PROPIETARIO CORPORATIVO (Multi-Local & Facturación Stripe)
  // =========================================================================
  {
    path: '/propietario',
    element: (
      <RequireRole roles={ROLES_AREA.PROPIETARIO}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.PROPIETARIO_SEDES} replace />,
      },
      // [PRÓXIMO ENTREGABLE - FASE 2]: Resumen general consolidado multi-sede (CU-PROP-01/04)
      {
        path: 'dashboard',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-01/04"
            nombrePantalla="Dashboard Consolidado del Propietario"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Resumen ejecutivo multi-sede: ventas consolidadas en Soles, uso de recursos respecto al plan contratado y estado de suscripción Stripe."
            proximoEntregable={true}
            enlacesRelacionados={[
              { label: 'Gestión de Sedes', to: ROUTES.PROPIETARIO_SEDES },
              { label: 'Suscripción & Stripe', to: ROUTES.PROPIETARIO_SUSCRIPCION },
            ]}
          />
        ),
      },
      {
        path: 'sedes',
        element: <PropietarioLocalesPage />,
      },
      {
        path: 'administradores',
        element: <PropietarioAdministradoresPage />,
      },
      {
        path: 'suscripcion',
        element: <PropietarioSuscripcionPage />,
      },
      {
        path: 'cambiar-plan',
        element: <PropietarioCambiarPlanPage />,
      },
      // [PRÓXIMO ENTREGABLE - FASE 2]: Incidentes de la Empresa (CU-PROP-06)
      {
        path: 'incidentes',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-06"
            nombrePantalla="Incidentes de la Empresa (Supervisión Corporativa Multi-Sede)"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Consola ejecutiva de supervisión de incidentes y anomalías de sedes con trazabilidad de bitácora y emisión de directivas corporativas."
            proximoEntregable={true}
            enlacesRelacionados={[
              { label: 'Gestión de Sedes', to: ROUTES.PROPIETARIO_SEDES },
              { label: 'Administradores', to: ROUTES.PROPIETARIO_ADMINISTRADORES },
            ]}
          />
        ),
      },
    ],
  },

  // =========================================================================
  // 4. PORTAL ADMINISTRADOR DE LOCAL
  // =========================================================================
  {
    path: '/admin',
    element: (
      <RequireRole roles={ROLES_AREA.ADMIN}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.ADMIN_PLANO_MESAS} replace />,
      },
      {
        path: 'dashboard',
        element: (
          <PlaceholderView
            codigoCu="CU-ADMIN-*"
            nombrePantalla="Panel de Control del Local"
            rol="administrador"
            layoutNombre="DashboardLayout"
            descripcion="Métricas operativas del día en la sede activa: mesas ocupadas, tiempo promedio de preparación en KDS, ventas del turno y estado del inventario."
            enlacesRelacionados={[
              { label: 'Plano de Mesas', to: ROUTES.ADMIN_PLANO_MESAS },
              { label: 'Gestión de Carta', to: ROUTES.ADMIN_CARTA },
            ]}
          />
        ),
      },
      {
        path: 'plano-mesas',
        element: <AdminPlanoMesasPage />,
      },
      {
        path: 'carta',
        element: <AdminProductosPage />,
      },
      {
        path: 'categorias',
        element: <AdminCategoriasPage />,
      },
      {
        path: 'inventario',
        element: <AdminInsumosPage />,
      },
      {
        path: 'proveedores',
        element: <AdminProveedoresPage />,
      },
      {
        path: 'compras',
        element: <AdminComprasPage />,
      },
      {
        path: 'personal',
        element: <AdminPersonalPage />,
      },
      {
        path: 'horario',
        element: <AdminHorarioPage />,
      },
      // [PRÓXIMO ENTREGABLE - FASE 2]: Políticas y Parámetros de Reservas (CU-ADMIN-10)
      {
        path: 'politicas-reserva',
        element: (
          <PlaceholderView
            codigoCu="CU-ADMIN-10"
            nombrePantalla="Configuración de Políticas y Parámetros de Reservas"
            rol="administrador"
            layoutNombre="DashboardLayout"
            descripcion="Parametrización operativa y gobernanza de reservas de salón: switch maestro, buffer de limpieza, tolerancia no-show y simulador de rotación."
            proximoEntregable={true}
            enlacesRelacionados={[
              { label: 'Plano de Mesas', to: ROUTES.ADMIN_PLANO_MESAS },
              { label: 'Horario & Feriados', to: ROUTES.ADMIN_HORARIO },
            ]}
          />
        ),
      },
      // [PRÓXIMO ENTREGABLE - FASE 2]: Incidentes Internos de Sede (CU-ADMIN-11)
      {
        path: 'incidentes',
        element: (
          <PlaceholderView
            codigoCu="CU-ADMIN-11"
            nombrePantalla="Historial y Registro de Incidentes Internos"
            rol="administrador"
            layoutNombre="DashboardLayout"
            descripcion="Registro, control operativo y resolución inmutable de anomalías de salón, cocina y caja con bitácora cronológica y escalamiento."
            proximoEntregable={true}
            enlacesRelacionados={[
              { label: 'Auditoría Anulaciones', to: ROUTES.ADMIN_ANULACIONES },
              { label: 'Panel del Local', to: ROUTES.ADMIN_DASHBOARD },
            ]}
          />
        ),
      },
      {
        path: 'anulaciones',
        element: <AdminAnulacionesPage />,
      },
      {
        path: 'promociones',
        element: <AdminPromocionesPage />,
      },
      {
        path: 'configuracion-kds',
        element: <AdminConfiguracionKdsPage />,
      },
      {
        path: 'metodos-pago',
        element: <AdminMetodosPagoPage />,
      },
      // [PRÓXIMO ENTREGABLE - FASE 2]: Reportes de Ventas (CU-ADMIN-13)
      {
        path: 'reportes/ventas',
        element: (
          <PlaceholderView
            codigoCu="CU-ADMIN-13"
            nombrePantalla="Reportes de Ventas & Productos Más Vendidos"
            rol="administrador"
            layoutNombre="DashboardLayout"
            descripcion="Análisis analítico de ventas por rango de fechas, platos de mayor rotación y ticket promedio."
            proximoEntregable={true}
            enlacesRelacionados={[
              { label: 'Flujo de Caja & Cierres Z', to: ROUTES.ADMIN_FLUJO_CAJA },
              { label: 'Panel del Local', to: ROUTES.ADMIN_DASHBOARD },
            ]}
          />
        ),
      },
      {
        path: 'finanzas/flujo-caja',
        element: <AdminFlujoCajaPage />,
      },
      {
        path: 'reportes/cierres-z',
        element: <Navigate to={ROUTES.ADMIN_FLUJO_CAJA} replace />,
      },
    ],
  },

  // =========================================================================
  // 5. TERMINALES OPERATIVAS TÁCTILES (Mozo, Cocina KDS y Caja)
  // =========================================================================
  {
    path: '/mozo',
    element: (
      <RequireRole roles={ROLES_AREA.MOZO}>
        <TerminalLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.MOZO_MESAS} replace />,
      },
      {
        path: 'mesas',
        element: <MozoMesasPage />,
      },
      {
        path: 'mesas/:mesaId/comanda',
        element: <MozoComandaPage />,
      },
      {
        path: 'mesas/:mesaId/precuenta',
        element: <MozoPrecuentaPage />,
      },
      {
        path: 'reservas',
        element: <MozoReservasPage />,
      },
    ],
  },

  {
    path: '/cocina',
    element: (
      <RequireRole roles={ROLES_AREA.COCINA}>
        <TerminalLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.COCINA_KDS} replace />,
      },
      {
        path: 'kds',
        element: <CocinaKdsPage />,
      },
      {
        path: 'stock-rapido',
        element: <CocinaStockRapidoPage />,
      },
    ],
  },

  {
    path: '/cajero',
    element: (
      <RequireRole roles={ROLES_AREA.CAJERO}>
        <TerminalLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.CAJERO_POS} replace />,
      },
      {
        path: 'pos',
        element: <CajeroPosPage />,
      },
      {
        path: 'apertura',
        element: <Navigate to={ROUTES.CAJERO_POS} replace />,
      },
      {
        path: 'turno',
        element: <CajeroTurnoCierrePage />,
      },
    ],
  },

  // =========================================================================
  // 6. CONSOLA ADMINISTRADOR GLOBAL SAAS
  // =========================================================================
  {
    path: '/saas',
    element: (
      <RequireRole roles={ROLES_AREA.SAAS}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.SAAS_TENANTS} replace />,
      },
      {
        path: 'tenants',
        element: <SaasTenantsPage />,
      },
      {
        path: 'tenants/nuevo',
        element: <SaasTenantOnboardingPage />,
      },
      // [PRÓXIMO ENTREGABLE - FASE 2]: Catálogo de Planes SaaS (CU-SAAS-03)
      {
        path: 'planes',
        element: (
          <PlaceholderView
            codigoCu="CU-SAAS-03"
            nombrePantalla="Catálogo de Planes SaaS"
            rol="saas_admin"
            layoutNombre="DashboardLayout"
            descripcion="Mantenimiento de planes comerciales (Starter, Pro, Enterprise), precios en PEN/USD y límites de recursos de plataforma."
            proximoEntregable={true}
            enlacesRelacionados={[
              { label: 'Supervisión Tenants', to: ROUTES.SAAS_TENANTS },
            ]}
          />
        ),
      },
    ],
  },

  // Redirección por defecto ante rutas desconocidas
  {
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);
