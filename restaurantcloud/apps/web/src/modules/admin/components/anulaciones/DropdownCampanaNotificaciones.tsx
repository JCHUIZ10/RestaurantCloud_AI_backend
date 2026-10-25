import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  AlertTriangle,
  AlertOctagon,
  Package,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificacionCampanaDTO } from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { ROUTES } from '@/router/routes.constants';

interface DropdownCampanaNotificacionesProps {
  onVerAnulacion?: (anulacionId: string) => void;
  /** En la sidebar navy: campana clara y panel abierto hacia la derecha */
  enFondoOscuro?: boolean;
}

export const DropdownCampanaNotificaciones: React.FC<DropdownCampanaNotificacionesProps> = ({
  onVerAnulacion,
  enFondoOscuro = false,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionCampanaDTO[]>([]);
  const [cargando, setCargando] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const cargarNotificaciones = async () => {
    try {
      const resp = await adminService.getNotificacionesCampana();
      if (resp.exito) {
        setNotificaciones(resp.datos);
      }
    } catch (e) {
      console.error('Error al cargar notificaciones de campana', e);
    }
  };

  useEffect(() => {
    cargarNotificaciones();

    // Polling periódico para refrescar campana de notificaciones (cada 10s)
    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
    }
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, [abierto]);

  const noLeidas = notificaciones.filter((n) => !n.leido);
  const countNoLeidas = noLeidas.length;

  const handleMarcarTodasLeidas = async () => {
    setCargando(true);
    try {
      await adminService.marcarTodasNotificacionesLeidas();
      await cargarNotificaciones();
    } finally {
      setCargando(false);
    }
  };

  const handleClickItem = async (item: NotificacionCampanaDTO) => {
    if (!item.leido) {
      await adminService.marcarNotificacionLeida(item.id);
      await cargarNotificaciones();
    }

    setAbierto(false);

    if (item.anulacion_id && onVerAnulacion) {
      onVerAnulacion(item.anulacion_id);
    } else if (item.anulacion_id) {
      navigate(ROUTES.ADMIN_ANULACIONES);
    }
  };

  const getIconoNotificacion = (tipo: string) => {
    switch (tipo) {
      case 'anulacion_item':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'anulacion_comanda':
        return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      case 'stock_minimo':
        return <Package className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Botón Campana Interactivo */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-label="Notificaciones"
        className={`relative min-h-tactil min-w-tactil flex items-center justify-center rounded-xl transition-colors ${
          enFondoOscuro
            ? 'text-aurea-champagne hover:text-white hover:bg-white/10'
            : 'text-tinta-600 hover:text-tinta-900 hover:bg-tinta-100'
        }`}
      >
        <Bell className="w-5 h-5" />
        {countNoLeidas > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white animate-pulse">
            {countNoLeidas > 9 ? '9+' : countNoLeidas}
          </span>
        )}
      </button>

      {/* Popover Dropdown de 390px */}
      {abierto && (
        <div className={`absolute ${enFondoOscuro ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150`}>
          {/* Cabecera */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold tracking-tight">
                Notificaciones del Local
              </span>
              {countNoLeidas > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                  {countNoLeidas} nuevas
                </span>
              )}
            </div>

            {countNoLeidas > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodasLeidas}
                disabled={cargando}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Marcar todo leído
              </button>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No hay notificaciones recientes en el local.
              </div>
            ) : (
              notificaciones.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !item.leido
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIconoNotificacion(item.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {item.titulo}
                      </span>
                      {!item.leido && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-slate-600 text-[11px] leading-snug mt-1">
                      {item.mensaje}
                    </p>

                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(item.created_at).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pie del Dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                navigate(ROUTES.ADMIN_ANULACIONES);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ir a Bandeja Central de Auditoría
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
