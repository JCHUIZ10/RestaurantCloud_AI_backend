import React, { useState } from 'react';
import {
  AlertTriangle,
  UserX,
  Bell,
  LogOut,
  Clock,
  Coins,
  Receipt,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CajaTurnoDTO } from '@/types/caja';

interface ModalBloqueoTurnoPrevioProps {
  isOpen: boolean;
  turnoActivo: CajaTurnoDTO | null;
  onNotificarAdmin: () => Promise<void>;
  onCerrarSesion: () => void;
  onSimularCierreAdmin14: () => void;
}

export const ModalBloqueoTurnoPrevio: React.FC<ModalBloqueoTurnoPrevioProps> = ({
  isOpen,
  turnoActivo,
  onNotificarAdmin,
  onCerrarSesion,
  onSimularCierreAdmin14,
}) => {
  const [notificado, setNotificado] = useState<boolean>(false);
  const [isNotificando, setIsNotificando] = useState<boolean>(false);

  if (!isOpen || !turnoActivo) return null;

  const handleNotificar = async () => {
    setIsNotificando(true);
    await onNotificarAdmin();
    setIsNotificando(false);
    setNotificado(true);
  };

  const whatsappUrl = `https://wa.me/51987654321?text=${encodeURIComponent(
    `Hola Mariana Ramos, en la terminal de caja el Turno #${String(
      turnoActivo.correlativo
    ).padStart(3, '0')} de ${
      turnoActivo.cajero_nombre
    } quedó pendiente de cierre. Por favor resolver en CU-ADMIN-14 para habilitar la apertura de turno.`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="modal-bloqueo-title"
    >
      <div className="w-full max-w-[580px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden flex flex-col">
        {/* Cabecera de Alerta de Bloqueo 409 */}
        <div className="px-6 py-5 border-b border-rose-100 dark:border-rose-900/40 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/40">
                  409 Conflict • ERR_TURNO_PREVIO_NO_CERRADO
                </span>
              </div>
              <h1 id="modal-bloqueo-title" className="text-lg font-bold tracking-tight text-white font-serif mt-0.5">
                Turno Previo Pendiente de Cierre
              </h1>
              <p className="text-xs text-slate-300">
                Regla Poka-Yoke: Terminal Única de Caja Activa
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-rose-900/50 text-rose-200 border border-rose-700/50 text-xs font-mono font-bold">
            Turno #{String(turnoActivo.correlativo).padStart(3, '0')}
          </span>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 space-y-4">
          {/* Mensaje de Seguridad RBAC */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block">Restricción de Seguridad Contable:</span>
              <span className="text-[11px] opacity-90">
                Usted ha iniciado sesión como cajero entrante. Por control de auditoría, usted no puede manipular ni arquear la gaveta de otro colaborador. El cierre formal o forzado de este turno corresponde a la administración en <strong>CU-ADMIN-14 (Flujo de Caja & Cierres Z)</strong>.
              </span>
            </div>
          </div>

          {/* Ficha Detallada del Turno Previo No Cerrado */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-rose-200/60 dark:border-rose-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-xs flex items-center justify-center">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {turnoActivo.cajero_nombre}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {turnoActivo.cajero_rol || 'Cajero Saliente'}
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Abierta hace ~5 horas</span>
                </div>
              </div>
            </div>

            {/* Métricas del turno no cerrado */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30">
                <span className="text-[10px] uppercase text-slate-400 block flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-aurea-copper" /> Fondo Inicial
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  S/ {turnoActivo.monto_apertura.toFixed(2)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30">
                <span className="text-[10px] uppercase text-slate-400 block flex items-center justify-center gap-1">
                  <Receipt className="w-3 h-3 text-emerald-500" /> Ventas
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {turnoActivo.total_ventas || 24} ops (S/ {(turnoActivo.monto_ventas || 2480.0).toFixed(2)})
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30">
                <span className="text-[10px] uppercase text-slate-400 block flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-amber-500" /> Saldo Esperado
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  S/ {(turnoActivo.efectivo_actual || turnoActivo.monto_esperado || 2730.0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Estado de Notificación / Acuse de Envío */}
          {notificado ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2.5 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notificación enviada a Administración</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                <strong>Mariana Ramos (Administradora de Sede)</strong> ha recibido la solicitud. Ella resolverá el cierre y arqueo en <strong>CU-ADMIN-14 (Flujo de Caja & Supervisar Cierres Z)</strong>.
              </p>

              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Avisar por WhatsApp</span>
                </a>

                {/* Acción QA para simular la resolución que el admin ejecuta en CU-ADMIN-14 */}
                <button
                  type="button"
                  onClick={onSimularCierreAdmin14}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-aurea-champagne font-mono font-bold text-[11px] border border-aurea-copper/40 flex items-center gap-1 transition-colors shadow-sm ml-auto"
                  title="Simula la acción del Administrador en CU-ADMIN-14"
                >
                  <Sparkles className="w-3 h-3 text-aurea-copper" />
                  <span>Simular Cierre en CU-ADMIN-14</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Botones de Acción Canónicos: Notificar y Cerrar Sesión */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCerrarSesion}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>

            <button
              type="button"
              onClick={handleNotificar}
              disabled={isNotificando || notificado}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                notificado
                  ? 'bg-emerald-600 hover:bg-emerald-700 opacity-90'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/25'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>
                {isNotificando
                  ? 'Enviando aviso...'
                  : notificado
                  ? 'Administración Notificada'
                  : 'Notificar al Administrador'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
