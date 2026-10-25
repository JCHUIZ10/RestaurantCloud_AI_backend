import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Wifi, User, Clock } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';

export const TerminalLayout: React.FC = () => {
  const location = useLocation();

  const isMozo = location.pathname.startsWith('/mozo');
  const isCocina = location.pathname.startsWith('/cocina');
  const isCajero = location.pathname.startsWith('/cajero');

  const tituloTerminal = isMozo
    ? 'Terminal POS Mozo'
    : isCocina
    ? 'Monitor KDS Cocina'
    : isCajero
    ? 'Terminal de Caja'
    : 'Terminal Operativa';

  return (
    <div className={`min-h-screen flex flex-col select-none ${
      isCocina ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Barra de Estado Operativa Superior */}
      <header className={`h-14 px-4 flex items-center justify-between border-b shrink-0 ${
        isCocina ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ADMIN_DASHBOARD}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              isCocina
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-aurea-copper" />
            <span className="hidden sm:inline">Panel Admin</span>
          </Link>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />

          <h2 className="font-semibold text-sm sm:text-base tracking-tight">
            {tituloTerminal}
          </h2>

          <span className="hidden md:inline px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
            Sede: Miraflores
          </span>
        </div>

        {/* Indicadores en Vivo (Conectado / Polling, Hora y Usuario de Turno) */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">En Línea</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">19:45</span>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-aurea-copper/20 flex items-center justify-center text-aurea-copper">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium hidden sm:inline text-xs">Carlos M. (Turno Tarde)</span>
          </div>
        </div>
      </header>

      {/* Navegación Rápida entre Terminales Operativas */}
      <div className={`px-4 py-1.5 flex items-center justify-between text-xs border-b ${
        isCocina ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Link
            to={ROUTES.MOZO_MESAS}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
              isMozo ? 'bg-aurea-navy text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Mesas Mozo
          </Link>
          <Link
            to={ROUTES.COCINA_KDS}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
              isCocina ? 'bg-aurea-copper text-aurea-navy font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            KDS Cocina
          </Link>
          <Link
            to={ROUTES.CAJERO_POS}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
              isCajero ? 'bg-aurea-navy text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Caja & Cobros
          </Link>
        </div>

        <span className="text-[10px] font-mono opacity-60">Layout: Terminal Fullscreen</span>
      </div>

      {/* Contenedor Táctil */}
      <main className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
