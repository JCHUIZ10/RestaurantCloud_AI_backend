import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  Send,
  CheckCircle2,
  CalendarCheck,
  ShieldAlert,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

interface PaywallStarterReservasProps {
  onVerPlanes?: () => void;
}

export const PaywallStarterReservas: React.FC<PaywallStarterReservasProps> = ({
  onVerPlanes,
}) => {
  const [notificacionEnviada, setNotificacionEnviada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleEnviarNotificacion = () => {
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      setNotificacionEnviada(true);
    }, 700);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto my-6 text-center space-y-8">
      {/* Icono de Candado con Gradiente */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-aurea-navy via-slate-800 to-aurea-copper flex items-center justify-center text-aurea-champagne shadow-xl shadow-aurea-navy/20">
          <Lock className="w-10 h-10 text-aurea-copper" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Títulos y Explicación */}
      <div className="space-y-2 max-w-xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
          Función de Plan Pro / Enterprise
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-aurea-navy tracking-tight">
          El módulo de reservas requiere Plan Pro o Enterprise
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Tu empresa cuenta actualmente con el <strong>Plan Starter</strong>, el cual está orientado a comandas básicas y facturación, excluyendo la gestión automatizada de reservas de mesas de salón.
        </p>
      </div>

      {/* 3 Beneficios Bloqueados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 relative overflow-hidden group hover:border-aurea-copper/40 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-stone-600" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Recepción en Tiempo Real
          </h4>
          <p className="text-xs text-stone-600 leading-snug">
            Portal digital público para que los comensales reserven mesas según aforo y horarios reales.
          </p>
          <div className="absolute top-3 right-3 text-stone-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 relative overflow-hidden group hover:border-aurea-copper/40 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-stone-600" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Bloqueo Preventivo en Salón
          </h4>
          <p className="text-xs text-stone-600 leading-snug">
            Protección de mesas en el terminal táctil del mozo (CU-MOZO-01) para prohibir walk-ins antes de citas.
          </p>
          <div className="absolute top-3 right-3 text-stone-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 relative overflow-hidden group hover:border-aurea-copper/40 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center">
            <Flame className="w-4 h-4 text-stone-600" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Control de Rotación y No-Show
          </h4>
          <p className="text-xs text-stone-600 leading-snug">
            Configuración de tolerancias, buffers de sanitización y alertas automáticas de no-show para maximizar ventas.
          </p>
          <div className="absolute top-3 right-3 text-stone-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Llamado a la Acción para Administrador de Sede */}
      <div className="bg-aurea-ivory/80 rounded-2xl border border-aurea-copper/30 p-5 max-w-2xl mx-auto space-y-3">
        <p className="text-xs text-stone-700 leading-relaxed">
          Comunícate con el <strong>Propietario de la empresa</strong> para solicitar una ampliación de plan desde su portal corporativo (CU-PROP-02) y habilitar esta sede inmediatamente.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleEnviarNotificacion}
            disabled={enviando || notificacionEnviada}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              notificacionEnviada
                ? 'bg-emerald-600 text-white'
                : 'bg-aurea-navy text-white hover:bg-aurea-navy/90'
            }`}
          >
            {notificacionEnviada ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Notificación Enviada al Propietario</span>
              </>
            ) : enviando ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enviando aviso...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-aurea-champagne" />
                <span>Enviar Notificación al Propietario</span>
              </>
            )}
          </button>

          {onVerPlanes && (
            <button
              type="button"
              onClick={onVerPlanes}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ver Comparativa de Planes</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
