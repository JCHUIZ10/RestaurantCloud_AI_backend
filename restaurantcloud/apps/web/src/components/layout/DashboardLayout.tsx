import React, { useState } from 'react';
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
  TrendingUp,
  LayoutGrid,
  FolderTree,
  Truck,
  Receipt,
  Clock,
  FileX2,
  Tag,
  Flame,
  Wallet,
} from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { DropdownCampanaNotificaciones } from '@/modules/admin/components/anulaciones/DropdownCampanaNotificaciones';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isSaas = location.pathname.startsWith('/saas');
  const isPropietario = location.pathname.startsWith('/propietario');

  // Consola Global SaaS (Catálogo de Planes diferido para próximo entregable)
  const linksSaas = [
    { label: 'Supervisión Tenants', href: ROUTES.SAAS_TENANTS, icon: Building2 },
  ];

  // Consola Propietario (Resumen General e Incidentes Empresa diferidos para próximo entregable)
  const linksPropietario = [
    { label: 'Gestión de Sedes', href: ROUTES.PROPIETARIO_SEDES, icon: Building2 },
    { label: 'Administradores', href: ROUTES.PROPIETARIO_ADMINISTRADORES, icon: Users },
    { label: 'Suscripción & Stripe', href: ROUTES.PROPIETARIO_SUSCRIPCION, icon: CreditCard },
  ];

  // Consola Admin de Local (Políticas de Reserva, Incidentes Internos y Reportes de Venta diferidos para próximo entregable)
  const linksAdmin = [
    { label: 'Panel del Local', href: ROUTES.ADMIN_DASHBOARD, icon: TrendingUp },
    { label: 'Plano de Mesas', href: ROUTES.ADMIN_PLANO_MESAS, icon: LayoutGrid },
    { label: 'Categorías del Menú', href: ROUTES.ADMIN_CATEGORIAS, icon: FolderTree },
    { label: 'Productos y Recetas', href: ROUTES.ADMIN_CARTA, icon: UtensilsCrossed },
    { label: 'Insumos & Inventario', href: ROUTES.ADMIN_INVENTARIO, icon: Package },
    { label: 'Proveedores', href: ROUTES.ADMIN_PROVEEDORES, icon: Truck },
    { label: 'Compras', href: ROUTES.ADMIN_COMPRAS, icon: Receipt },
    { label: 'Personal de Sede', href: ROUTES.ADMIN_PERSONAL, icon: Users },
    { label: 'Horario & Feriados', href: ROUTES.ADMIN_HORARIO, icon: Clock },
    { label: 'Promociones de Sede', href: ROUTES.ADMIN_PROMOCIONES, icon: Tag },
    { label: 'Tiempos KDS & Cocina', href: ROUTES.ADMIN_CONFIGURACION_KDS, icon: Flame },
    { label: 'Métodos de Pago & POS', href: ROUTES.ADMIN_METODOS_PAGO, icon: Wallet },
    { label: 'Auditoría Anulaciones', href: ROUTES.ADMIN_ANULACIONES, icon: FileX2 },
    { label: 'Flujo de Caja & Cierres Z', href: ROUTES.ADMIN_FLUJO_CAJA, icon: CreditCard },
  ];

  const currentLinks = isSaas ? linksSaas : isPropietario ? linksPropietario : linksAdmin;

  return (
    <div className="min-h-screen flex bg-aurea-ivory text-aurea-navy">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-aurea-navy text-aurea-ivory border-r border-aurea-copper/30 shrink-0">
        {/* Cabecera del Sidebar */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aurea-copper/20 flex items-center justify-center border border-aurea-copper/40">
              <span className="font-serif text-lg text-aurea-champagne font-bold">R</span>
            </div>
            <div>
              <span className="font-serif text-lg tracking-wide text-white block leading-none">
                RestaurantCloud
              </span>
              <span className="text-[10px] text-aurea-copper font-mono uppercase tracking-wider">
                {isSaas ? 'Consola Admin SaaS' : isPropietario ? 'Consola Propietario' : 'Admin de Local'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navegación del Sidebar */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {currentLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-aurea-copper text-aurea-navy font-semibold shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-aurea-navy' : 'text-aurea-copper'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pie del Sidebar: Cerrar sesión */}
        <div className="p-4 border-t border-white/10">
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>

      {/* Contenedor Principal (Topbar + Contenido) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Administrativa */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-aurea-copper/20 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              className="lg:hidden p-2 rounded-lg text-aurea-navy hover:bg-aurea-champagne/40"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Consola Global SaaS */}
            {isSaas && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-aurea-navy text-white text-xs sm:text-sm font-semibold border border-aurea-copper/40 shadow-sm">
                <Building2 className="w-4 h-4 text-aurea-copper shrink-0" />
                <span>Supervisión Global SaaS (Bypass RLS)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones Reactiva SSE */}
            <DropdownCampanaNotificaciones />

            {/* Avatar del usuario */}
            <div className="w-9 h-9 rounded-full bg-aurea-champagne flex items-center justify-center font-bold text-sm text-aurea-navy border border-aurea-copper/50">
              {isSaas ? 'SA' : isPropietario ? 'PR' : 'AD'}
            </div>
          </div>
        </header>

        {/* Drawer Móvil del Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-64 max-w-[80%] bg-aurea-navy text-white flex flex-col p-4 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="font-serif text-lg text-aurea-champagne">RestaurantCloud AI</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-aurea-copper" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {currentLinks.map((item) => {
                  const active = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-aurea-copper text-aurea-navy font-semibold'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${
                          active ? 'text-aurea-navy' : 'text-aurea-copper'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-white/10">
                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 text-xs text-rose-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Dinámico de la Ruta */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
