import React, { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TerminalLayout } from '@/components/layout/TerminalLayout';
import { SedeCustomerLayout } from '@/components/layout/SedeCustomerLayout';
import { PlaceholderView } from '@/components/ui/PlaceholderView';
import { ROUTES } from './routes.constants';
import { RequireRole } from './RequireRole';
import { ROLES_AREA } from './accesoPorRol';

const CargandoVista: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div
      role="status"
      aria-label="Cargando vista"
      className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-700 animate-spin"
    />
  </div>
);

function lazyPage<K extends string>(
  loader: () => Promise<Record<K, ComponentType>>,
  name: K,
): React.ReactElement {
  const Component = lazy<ComponentType>(async () => {
    const mod = await loader();
    return { default: mod[name] };
  });
  return (
    <Suspense fallback={<CargandoVista />}>
      <Component />
    </Suspense>
  );
}

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
        element: lazyPage(() => import('@/modules/cliente/pages/HomePage'), 'HomePage'),
      },
      {
        path: 'login',
        element: lazyPage(() => import('@/modules/auth/pages/LoginPage'), 'LoginPage'),
      },
      {
        path: 'registro',
        element: lazyPage(
          () => import('@/modules/propietario/pages/RegistroEmpresaPage'),
          'RegistroEmpresaPage',
        ),
      },
      {
        path: 'activar-cuenta',
        element: lazyPage(
          () => import('@/modules/auth/pages/ActivarCuentaPage'),
          'ActivarCuentaPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/cliente/pages/ComprobanteDigitalPage'),
          'ComprobanteDigitalPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/cliente/pages/CartaDigitalPage'),
          'CartaDigitalPage',
        ),
      },
      {
        path: 'comprobante/:numero',
        element: lazyPage(
          () => import('@/modules/cliente/pages/ComprobanteDigitalPage'),
          'ComprobanteDigitalPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/cliente/pages/ComprobanteDigitalPage'),
          'ComprobanteDigitalPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/propietario/pages/PropietarioLocalesPage'),
          'PropietarioLocalesPage',
        ),
      },
      {
        path: 'prediccion',
        element: lazyPage(
          () => import('@/modules/propietario/pages/PropietarioPrediccionPage'),
          'PropietarioPrediccionPage',
        ),
      },
      {
        path: 'administradores',
        element: lazyPage(
          () => import('@/modules/propietario/pages/PropietarioAdministradoresPage'),
          'PropietarioAdministradoresPage',
        ),
      },
      {
        path: 'suscripcion',
        element: lazyPage(
          () => import('@/modules/propietario/pages/PropietarioSuscripcionPage'),
          'PropietarioSuscripcionPage',
        ),
      },
      {
        path: 'cambiar-plan',
        element: lazyPage(
          () => import('@/modules/propietario/pages/PropietarioCambiarPlanPage'),
          'PropietarioCambiarPlanPage',
        ),
      },
      {
        path: 'suscripcion/conservar',
        element: lazyPage(
          () => import('@/modules/propietario/pages/PropietarioConservarRecursosPage'),
          'PropietarioConservarRecursosPage',
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
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPlanoMesasPage'),
          'AdminPlanoMesasPage',
        ),
      },
      {
        path: 'carta',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminProductosPage'),
          'AdminProductosPage',
        ),
      },
      {
        path: 'categorias',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminCategoriasPage'),
          'AdminCategoriasPage',
        ),
      },
      {
        path: 'inventario',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminInsumosPage'),
          'AdminInsumosPage',
        ),
      },
      {
        path: 'proveedores',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminProveedoresPage'),
          'AdminProveedoresPage',
        ),
      },
      {
        path: 'compras',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminComprasPage'),
          'AdminComprasPage',
        ),
      },
      {
        path: 'personal',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPersonalPage'),
          'AdminPersonalPage',
        ),
      },
      {
        path: 'horario',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminHorarioPage'),
          'AdminHorarioPage',
        ),
      },
      {
        path: 'politicas-reserva',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPoliticasReservaPage'),
          'AdminPoliticasReservaPage',
        ),
      },
      {
        path: 'anulaciones',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminAnulacionesPage'),
          'AdminAnulacionesPage',
        ),
      },
      {
        path: 'planificar-semana',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPlanificarSemanaPage'),
          'AdminPlanificarSemanaPage',
        ),
      },
      {
        path: 'planificar-semana/platos',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPlatosSemanaPage'),
          'AdminPlatosSemanaPage',
        ),
      },
      {
        path: 'planificar-semana/compra',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPrepararCompraPage'),
          'AdminPrepararCompraPage',
        ),
      },
      {
        path: 'promociones',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminPromocionesPage'),
          'AdminPromocionesPage',
        ),
      },
      {
        path: 'configuracion-kds',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminConfiguracionKdsPage'),
          'AdminConfiguracionKdsPage',
        ),
      },
      {
        path: 'metodos-pago',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminMetodosPagoPage'),
          'AdminMetodosPagoPage',
        ),
      },
      // Reportes de ventas y desempeño (CU-ADMIN-13): ms-analítica por Kong
      {
        path: 'reportes/ventas',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminReportesPage'),
          'AdminReportesPage',
        ),
      },
      {
        path: 'finanzas/flujo-caja',
        element: lazyPage(
          () => import('@/modules/admin/pages/AdminFlujoCajaPage'),
          'AdminFlujoCajaPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/mozo/pages/MozoMesasPage'),
          'MozoMesasPage',
        ),
      },
      {
        path: 'mesas/:mesaId/comanda',
        element: lazyPage(
          () => import('@/modules/mozo/pages/MozoComandaPage'),
          'MozoComandaPage',
        ),
      },
      {
        path: 'mesas/:mesaId/precuenta',
        element: lazyPage(
          () => import('@/modules/mozo/pages/MozoPrecuentaPage'),
          'MozoPrecuentaPage',
        ),
      },
      {
        path: 'reservas',
        element: lazyPage(
          () => import('@/modules/mozo/pages/MozoReservasPage'),
          'MozoReservasPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/cocina/pages/CocinaKdsPage'),
          'CocinaKdsPage',
        ),
      },
      {
        path: 'stock-rapido',
        element: lazyPage(
          () => import('@/modules/cocina/pages/CocinaStockRapidoPage'),
          'CocinaStockRapidoPage',
        ),
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
        element: lazyPage(
          () => import('@/modules/caja/pages/CajeroPosPage'),
          'CajeroPosPage',
        ),
      },
      {
        path: 'apertura',
        element: <Navigate to={ROUTES.CAJERO_POS} replace />,
      },
      {
        path: 'comprobantes',
        element: lazyPage(
          () => import('@/modules/caja/pages/CajeroComprobantesPage'),
          'CajeroComprobantesPage',
        ),
      },
      {
        path: 'turno',
        element: lazyPage(
          () => import('@/modules/caja/pages/CajeroTurnoCierrePage'),
          'CajeroTurnoCierrePage',
        ),
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
        element: lazyPage(
          () => import('@/modules/saas/pages/SaasTenantsPage'),
          'SaasTenantsPage',
        ),
      },
      {
        path: 'tenants/nuevo',
        element: lazyPage(
          () => import('@/modules/saas/pages/SaasTenantOnboardingPage'),
          'SaasTenantOnboardingPage',
        ),
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
