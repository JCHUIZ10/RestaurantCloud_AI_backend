import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TerminalLayout } from '@/components/layout/TerminalLayout';
import { SedeCustomerLayout } from '@/components/layout/SedeCustomerLayout';
import { HomePage } from '@/modules/cliente/pages/HomePage';
import { PlaceholderView } from '@/components/ui/PlaceholderView';
import { ROUTES } from './routes.constants';

import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { CartaDigitalPage } from '@/modules/cliente/pages/CartaDigitalPage';
import { ComprobanteDigitalPage } from '@/modules/cliente/pages/ComprobanteDigitalPage';
import { MozoMesasPage } from '@/modules/mozo/pages/MozoMesasPage';
import { MozoComandaPage } from '@/modules/mozo/pages/MozoComandaPage';
import { MozoPrecuentaPage } from '@/modules/mozo/pages/MozoPrecuentaPage';
import { MozoReservasPage } from '@/modules/mozo/pages/MozoReservasPage';
import { CocinaKdsPage } from '@/modules/cocina/pages/CocinaKdsPage';
import { AdminPlanoMesasPage } from '@/modules/admin/pages/AdminPlanoMesasPage';
import { AdminCategoriasPage } from '@/modules/admin/pages/AdminCategoriasPage';
import { AdminInsumosPage } from '@/modules/admin/pages/AdminInsumosPage';
import { AdminProductosPage } from '@/modules/admin/pages/AdminProductosPage';
import { AdminProveedoresPage } from '@/modules/admin/pages/AdminProveedoresPage';
import { AdminComprasPage } from '@/modules/admin/pages/AdminComprasPage';
import { AdminPersonalPage } from '@/modules/admin/pages/AdminPersonalPage';
import { AdminHorarioPage } from '@/modules/admin/pages/AdminHorarioPage';

// Redirección para el alias corto /m/:slug -> /sede/:slug/carta
const ShortMenuRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/sede/${slug}/carta`} replace />;
};

export const router = createBrowserRouter([
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
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-01"
            nombrePantalla="Registro de Empresa & Onboarding RUC + OTP"
            rol="propietario"
            layoutNombre="PublicLayout"
            descripcion="Asistente de registro público en 3 pasos: Validación de RUC 10/20, Verificación obligatoria de correo con código OTP de 6 dígitos, y SetupIntent seguro de Stripe."
            viewportSugerido="desktop"
            enlacesRelacionados={[
              { label: 'Ir al Login', to: ROUTES.LOGIN },
              { label: 'Ver Planes en el Home', to: '/#planes' },
            ]}
          />
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
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-01/04"
            nombrePantalla="Dashboard Consolidado del Propietario"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Resumen ejecutivo multi-sede: ventas consolidadas en Soles, uso de recursos respecto al plan contratado y estado de suscripción Stripe."
            enlacesRelacionados={[
              { label: 'Gestión de Sedes', to: ROUTES.PROPIETARIO_SEDES },
              { label: 'Suscripción & Stripe', to: ROUTES.PROPIETARIO_SUSCRIPCION },
            ]}
          />
        ),
      },
      {
        path: 'sedes',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-04"
            nombrePantalla="Administración de Sedes & Slugs Web"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Alta y mantenimiento de locales físicos. Configuración del slug de la carta digital con comprobación reactiva de disponibilidad en tiempo real."
            enlacesRelacionados={[
              { label: 'Probar Carta de una Sede', to: '/sede/mi-restaurante/carta' },
            ]}
          />
        ),
      },
      {
        path: 'administradores',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-05"
            nombrePantalla="Asignación de Administradores de Local"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Gestión de accesos y asignación de encargados de administración por local operativo."
          />
        ),
      },
      {
        path: 'suscripcion',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-02/03"
            nombrePantalla="Gestión de Suscripción & Cambio de Plan"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Integración con Stripe Billing: actualización de tarjetas de crédito/débito, historial de facturas, simulación de upgrades inmediatos y downgrades programados con asistente de conciliación de recursos."
          />
        ),
      },
      {
        path: 'incidentes',
        element: (
          <PlaceholderView
            codigoCu="CU-PROP-06"
            nombrePantalla="Bitácora Corporativa de Incidentes"
            rol="propietario"
            layoutNombre="DashboardLayout"
            descripcion="Registro y auditoría de incidencias operativas ocurridas en los distintos locales de la empresa."
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
    element: <DashboardLayout />,
    children: [
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
      {
        path: 'reportes/ventas',
        element: (
          <PlaceholderView
            codigoCu="CU-ADMIN-13"
            nombrePantalla="Reportes de Ventas & Productos Más Vendidos"
            rol="administrador"
            layoutNombre="DashboardLayout"
            descripcion="Análisis analítico de ventas por rango de fechas, platos de mayor rotación y ticket promedio."
          />
        ),
      },
      {
        path: 'reportes/cierres-z',
        element: (
          <PlaceholderView
            codigoCu="CU-ADMIN-14"
            nombrePantalla="Flujo de Caja & Cierres Z"
            rol="administrador"
            layoutNombre="DashboardLayout"
            descripcion="Auditoría de arqueos y cierres de turno Z de cada caja del local."
          />
        ),
      },
    ],
  },

  // =========================================================================
  // 5. TERMINALES OPERATIVAS TÁCTILES (Mozo, Cocina KDS y Caja)
  // =========================================================================
  {
    path: '/mozo',
    element: <TerminalLayout />,
    children: [
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
    element: <TerminalLayout />,
    children: [
      {
        path: 'kds',
        element: <CocinaKdsPage />,
      },
      {
        path: 'stock-rapido',
        element: (
          <PlaceholderView
            codigoCu="CU-COCINA-04"
            nombrePantalla="Marcar Producto Agotado en Cocina"
            rol="cocina"
            layoutNombre="TerminalLayout"
            descripcion="Control de quiebre de stock en 1 toque. Al marcar un plato como 'Agotado por hoy', se atenúa inmediatamente en la carta digital QR y en el POS de los mozos."
            viewportSugerido="fullscreen"
          />
        ),
      },
    ],
  },

  {
    path: '/cajero',
    element: <TerminalLayout />,
    children: [
      {
        path: 'pos',
        element: (
          <PlaceholderView
            codigoCu="CU-CAJA-03"
            nombrePantalla="Cobro de Comandas & Facturación"
            rol="cajero"
            layoutNombre="TerminalLayout"
            descripcion="Módulo de cobro rápido de comandas por mesa: división de cuenta, pagos mixtos (efectivo, tarjeta, Yape/Plin) y emisión de boleta o factura electrónica."
            viewportSugerido="desktop"
            enlacesRelacionados={[
              { label: 'Turno & Arqueo Z', to: ROUTES.CAJERO_TURNO },
            ]}
          />
        ),
      },
      {
        path: 'turno',
        element: (
          <PlaceholderView
            codigoCu="CU-CAJA-01/05"
            nombrePantalla="Apertura y Cierre de Caja Z"
            rol="cajero"
            layoutNombre="TerminalLayout"
            descripcion="Control del turno de caja: monto de apertura en efectivo, registro de entradas/salidas de efectivo, arqueo ciego y generación del comprobante de Cierre Z."
            viewportSugerido="desktop"
          />
        ),
      },
    ],
  },

  // =========================================================================
  // 6. CONSOLA ADMINISTRADOR GLOBAL SAAS
  // =========================================================================
  {
    path: '/saas',
    element: <DashboardLayout />,
    children: [
      {
        path: 'tenants',
        element: (
          <PlaceholderView
            codigoCu="CU-SAAS-01"
            nombrePantalla="Supervisión Global de Tenants & Empresas"
            rol="saas_admin"
            layoutNombre="DashboardLayout"
            descripcion="Consola central de supervisión: base instalada de restaurantes, estado de períodos de gracia (dunning) de Stripe y alta manual corporativa B2B."
            enlacesRelacionados={[
              { label: 'Catálogo de Planes Globales', to: ROUTES.SAAS_PLANES },
            ]}
          />
        ),
      },
      {
        path: 'planes',
        element: (
          <PlaceholderView
            codigoCu="CU-SAAS-03"
            nombrePantalla="Catálogo de Planes SaaS"
            rol="saas_admin"
            layoutNombre="DashboardLayout"
            descripcion="Mantenimiento de planes comerciales (Starter, Pro, Enterprise), precios en PEN/USD y límites de recursos de plataforma."
          />
        ),
      },
    ],
  },

  // Redirección por defecto ante rutas desconocidas
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
