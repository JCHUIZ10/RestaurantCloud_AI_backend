import React, { useState } from 'react';
import { LockKeyhole, RefreshCw, Store, ArrowRight, ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCerrarSesion } from '@/shared/hooks/useCerrarSesion';
import { ROUTES } from '@/router/routes.constants';

interface CajaCerradaBloqueoViewProps {
  rol?: 'mozo' | 'cocina' | 'general';
  onReintentar: () => void | Promise<void>;
  reintentando?: boolean;
  mensajePersonalizado?: string;
}

export const CajaCerradaBloqueoView: React.FC<CajaCerradaBloqueoViewProps> = ({
  rol = 'general',
  onReintentar,
  reintentando = false,
  mensajePersonalizado,
}) => {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useCerrarSesion();
  const [ejecutandoReintento, setEjecutandoReintento] = useState(false);

  const esAdmin = usuario?.rol === 'admin_local' || (usuario?.rol as string) === 'administrador';

  const handleReintentar = async () => {
    if (ejecutandoReintento || reintentando) return;
    setEjecutandoReintento(true);
    try {
      // Garantizar un tiempo mínimo de feedback de 400ms para evitar parpadeos bruscos
      await Promise.all([
        Promise.resolve(onReintentar()),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    } finally {
      setEjecutandoReintento(false);
    }
  };

  const rolTitulo =
    rol === 'mozo'
      ? 'Terminal de Salón (Mozos)'
      : rol === 'cocina'
      ? 'Terminal KDS (Cocina)'
      : 'Terminal Operativa';

  const estaConsultando = reintentando || ejecutandoReintento;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto">
      {/* 1. Barra Superior Completa */}
      <header className="w-full flex items-center justify-between pb-4 border-b border-slate-800/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-serif font-black text-base shadow-inner">
            Á
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white font-semibold text-sm tracking-wide">
              {usuario?.empresa?.nombre || (usuario as any)?.empresa_id ? 'Áurea Restaurante' : 'RestaurantCloud'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Store className="w-3 h-3 text-amber-400" />
              {rolTitulo}
            </span>
          </div>
        </div>

        {/* Botón Salir / Cerrar Sesión */}
        <button
          type="button"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión y salir"
          className="py-2 px-3.5 rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:text-rose-200 hover:bg-rose-950/30 hover:border-rose-600/50 text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300" />
          <span>Salir</span>
        </button>
      </header>

      {/* 2. Cuerpo Central: Tarjeta de Bloqueo Inmersiva */}
      <main className="flex-1 flex flex-col items-center justify-center my-6">
        <div className="max-w-md w-full bg-slate-900/95 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Luces difusas decorativas */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icono de Candado / Caja Inactiva */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-inner">
              <LockKeyhole className="w-10 h-10 text-amber-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 shadow" />
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight mb-3">
            Actualmente no hay caja abierta
          </h1>

          {/* Mensaje Descriptivo */}
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            {mensajePersonalizado ||
              'Vuelve a intentarlo más tarde o solicita la apertura de caja al cajero o administrador para iniciar la atención del turno.'}
          </p>

          {/* Botones de Acción */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleReintentar}
              disabled={estaConsultando}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-wait cursor-pointer"
            >
              {estaConsultando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-950" />
                  <span>Comprobar estado de caja</span>
                </>
              )}
            </button>

            {esAdmin && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.CAJERO_POS)}
                className="w-full py-3 px-5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs tracking-wide border border-slate-700/70 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Ir a Apertura de Turno (Caja)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 3. Pie Inferior: Sincronización Automática */}
      <footer className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 font-mono pt-4 border-t border-slate-800/50 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Sincronización en tiempo real activa (se desbloqueará automáticamente al aperturar caja)</span>
      </footer>
    </div>
  );
};
