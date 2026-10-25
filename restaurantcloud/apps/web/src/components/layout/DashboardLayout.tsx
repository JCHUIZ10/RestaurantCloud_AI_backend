import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  Menu,
  X,
  LogOut,
  UtensilsCrossed,
  Package,
  LayoutGrid,
  FolderTree,
  Truck,
  Receipt,
  Clock,
  FileX2,
  Tag,
  Flame,
  Wallet,
  ArrowLeft,
} from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { ETIQUETA_ROL, homeDeRol, iniciales } from '@/router/accesoPorRol';
import { useAuthStore } from '@/stores/authStore';
import { useCerrarSesion } from '@/shared/hooks/useCerrarSesion';
import { cn } from '@/shared/utils';
import { DropdownCampanaNotificaciones } from '@/modules/admin/components/anulaciones/DropdownCampanaNotificaciones';

interface EnlaceMenu {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Consola Global SaaS (Catálogo de Planes diferido para próximo entregable)
const LINKS_SAAS: EnlaceMenu[] = [
  { label: 'Supervisión de tenants', href: ROUTES.SAAS_TENANTS, icon: Building2 },
];

// Consola Propietario (Resumen General e Incidentes Empresa diferidos para próximo entregable)
const LINKS_PROPIETARIO: EnlaceMenu[] = [
  { label: 'Mis sedes', href: ROUTES.PROPIETARIO_SEDES, icon: Building2 },
  { label: 'Administradores', href: ROUTES.PROPIETARIO_ADMINISTRADORES, icon: Users },
  { label: 'Suscripción', href: ROUTES.PROPIETARIO_SUSCRIPCION, icon: CreditCard },
];

// Consola Admin de Local. El Panel del Local, Políticas de Reserva, Incidentes y Reportes
// de Venta son placeholders del próximo entregable y no se listan (regla NV10).
const LINKS_ADMIN: EnlaceMenu[] = [
  { label: 'Plano de mesas', href: ROUTES.ADMIN_PLANO_MESAS, icon: LayoutGrid },
  { label: 'Categorías del menú', href: ROUTES.ADMIN_CATEGORIAS, icon: FolderTree },
  { label: 'Productos y recetas', href: ROUTES.ADMIN_CARTA, icon: UtensilsCrossed },
  { label: 'Insumos e inventario', href: ROUTES.ADMIN_INVENTARIO, icon: Package },
  { label: 'Proveedores', href: ROUTES.ADMIN_PROVEEDORES, icon: Truck },
  { label: 'Compras', href: ROUTES.ADMIN_COMPRAS, icon: Receipt },
  { label: 'Personal de sede', href: ROUTES.ADMIN_PERSONAL, icon: Users },
  { label: 'Horario y feriados', href: ROUTES.ADMIN_HORARIO, icon: Clock },
  { label: 'Promociones', href: ROUTES.ADMIN_PROMOCIONES, icon: Tag },
  { label: 'Tiempos de cocina', href: ROUTES.ADMIN_CONFIGURACION_KDS, icon: Flame },
  { label: 'Métodos de pago', href: ROUTES.ADMIN_METODOS_PAGO, icon: Wallet },
  { label: 'Auditoría de anulaciones', href: ROUTES.ADMIN_ANULACIONES, icon: FileX2 },
  { label: 'Flujo de caja y cierres Z', href: ROUTES.ADMIN_FLUJO_CAJA, icon: CreditCard },
];

// Breakpoint lg de Tailwind: decide dónde se monta la campana para no duplicar su sondeo
const CONSULTA_ESCRITORIO = '(min-width: 1024px)';

function useEsEscritorio() {
  const [esEscritorio, setEsEscritorio] = useState(() => window.matchMedia(CONSULTA_ESCRITORIO).matches);
  useEffect(() => {
    const mq = window.matchMedia(CONSULTA_ESCRITORIO);
    const alCambiar = (e: MediaQueryListEvent) => setEsEscritorio(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);
  return esEscritorio;
}

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useCerrarSesion();

  const enAdminLocal = location.pathname.startsWith('/admin');
  const esEscritorio = useEsEscritorio();
  const rol = usuario?.rol;

  // Menú según rol (regla NV5); el propietario que entra a una sede ve el menú de administración
  const enlaces =
    rol === 'admin_saas'
      ? LINKS_SAAS
      : rol === 'propietario' && !enAdminLocal
        ? LINKS_PROPIETARIO
        : LINKS_ADMIN;

  const tituloConsola =
    rol === 'admin_saas'
      ? 'Consola SaaS'
      : rol === 'propietario' && !enAdminLocal
        ? 'Consola de propietario'
        : 'Administración de sede';

  const mostrarVolverASedes = rol === 'propietario' && enAdminLocal;
  const home = homeDeRol(rol);

  // Cierra el menú móvil con la tecla Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [sidebarOpen]);

  const esActivo = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const navegacion = (
    <nav
      aria-label="Navegación principal"
      onClick={() => setSidebarOpen(false)}
      className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
    >
      {enlaces.map((item) => {
        const Icon = item.icon;
        const activo = esActivo(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            aria-current={activo ? 'page' : undefined}
            className={cn(
              'min-h-tactil flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-colors',
              activo
                ? 'bg-aurea-copper text-aurea-navy font-semibold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className={cn('w-4 h-4 shrink-0', activo ? 'text-aurea-navy' : 'text-aurea-copper')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      {mostrarVolverASedes && (
        <Link
          to={ROUTES.PROPIETARIO_SEDES}
          className="mb-3 min-h-tactil flex items-center gap-3 px-3 rounded-xl text-sm font-semibold bg-white/5 text-aurea-champagne border border-aurea-copper/30 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Volver a mis sedes</span>
        </Link>
      )}
    </nav>
  );

  // Pie de la sidebar: identidad del usuario y salida, sustituye a la antigua cabecera
  const pieSesion = (
    <div className="p-3 border-t border-white/10 space-y-1">
      {usuario && (
        <div className="flex items-center gap-2.5 px-2 py-2 min-w-0">
          <span
            className="w-9 h-9 rounded-full bg-aurea-champagne flex items-center justify-center font-bold text-sm text-aurea-navy border border-aurea-copper/50 shrink-0"
            aria-hidden="true"
          >
            {iniciales(usuario.nombre)}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold text-white truncate">{usuario.nombre}</span>
            <span className="block text-xs text-aurea-champagne/80 truncate">
              {ETIQUETA_ROL[usuario.rol]}
            </span>
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={cerrarSesion}
        className="min-h-tactil w-full flex items-center gap-3 px-3 rounded-xl text-sm font-medium text-estado-error-200 hover:bg-estado-error-500/10 hover:text-estado-error-100 transition-colors"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );

  const marca = (
    <Link to={home} className="flex items-center gap-2.5 min-w-0">
      <span className="w-9 h-9 rounded-lg bg-aurea-copper/20 flex items-center justify-center border border-aurea-copper/40 shrink-0">
        <span className="font-serif text-lg text-aurea-champagne">R</span>
      </span>
      <span className="font-serif text-lg tracking-wide text-white truncate">RestaurantCloud</span>
    </Link>
  );

  // Contexto de la consola: rótulo discreto y, en administración de sede, el nombre de la sede
  const contexto = (
    <div className="px-6 pt-5 pb-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">{tituloConsola}</p>
      {enAdminLocal && usuario?.local?.nombre && (
        <p className="mt-1 font-serif text-xl leading-tight text-aurea-champagne truncate">
          {usuario.local.nombre}
        </p>
      )}
    </div>
  );

  const seccionActual = enlaces.find((e) => esActivo(e.href))?.label ?? tituloConsola;

  return (
    <div className="min-h-dvh flex bg-aurea-ivory text-aurea-navy">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-aurea-navy text-aurea-ivory border-r border-aurea-copper/30 shrink-0 sticky top-0 h-dvh">
        <div className="h-16 flex items-center justify-between gap-2 px-5 border-b border-white/10">
          {marca}
          {/* Notificaciones de anulaciones: solo tienen sentido en la administración de sede */}
          {enAdminLocal && esEscritorio && <DropdownCampanaNotificaciones enFondoOscuro />}
        </div>
        {contexto}
        {navegacion}
        {pieSesion}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra mínima solo en móvil/tablet: en escritorio la sidebar ya cumple esta función */}
        <header className="lg:hidden h-14 bg-white/90 backdrop-blur-md border-b border-aurea-copper/20 px-2 sm:px-4 flex items-center justify-between gap-2 sticky top-0 z-30">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
              className="min-h-tactil min-w-tactil flex items-center justify-center rounded-lg text-aurea-navy hover:bg-aurea-champagne/40"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <span className="font-semibold text-sm sm:text-base truncate">{seccionActual}</span>
          </div>
          {enAdminLocal && !esEscritorio && <DropdownCampanaNotificaciones />}
        </header>

        {/* Drawer móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Menú">
            <div
              className="fixed inset-0 bg-aurea-navy/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[85%] h-dvh bg-aurea-navy text-white flex flex-col shadow-2xl">
              <div className="h-16 flex items-center justify-between gap-2 px-4 border-b border-white/10">
                {marca}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar menú"
                  className="min-h-tactil min-w-tactil flex items-center justify-center rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-aurea-copper" aria-hidden="true" />
                </button>
              </div>
              {contexto}
              {navegacion}
              {pieSesion}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
