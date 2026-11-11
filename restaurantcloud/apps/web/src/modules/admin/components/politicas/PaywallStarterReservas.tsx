import React from 'react';
import { Lock, Sparkles, CalendarCheck, ShieldAlert, Flame } from 'lucide-react';

interface PaywallStarterReservasProps {
  /** Mensaje del API: indica qué planes incluyen el módulo de reservas. */
  mensaje?: string;
}

export const PaywallStarterReservas: React.FC<PaywallStarterReservasProps> = ({ mensaje }) => {
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
          Módulo no incluido en tu plan
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-aurea-navy tracking-tight">
          El módulo de reservas no está habilitado
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          {mensaje ?? 'El plan de tu empresa no incluye el módulo de reservas.'}
        </p>
      </div>

      {/* 3 Beneficios Bloqueados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 relative overflow-hidden group hover:border-aurea-copper/40 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-stone-600" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Registro de Reservas
          </h4>
          <p className="text-xs text-stone-600 leading-snug">
            Registro de reservas en el salón con mesas asignadas según aforo y horarios reales de la sede.
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
            Rotación e Inasistencias
          </h4>
          <p className="text-xs text-stone-600 leading-snug">
            Tolerancia de espera, tiempo de limpieza entre reservas y registro de inasistencias para optimizar la rotación.
          </p>
          <div className="absolute top-3 right-3 text-stone-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Cómo habilitarlo */}
      <div className="bg-aurea-ivory/80 rounded-2xl border border-aurea-copper/30 p-5 max-w-2xl mx-auto">
        <p className="text-xs text-stone-700 leading-relaxed">
          El <strong>propietario de la empresa</strong> puede cambiar de plan desde su portal, en la sección{' '}
          <strong>Suscripción</strong>. Una vez habilitado, esta pantalla se activa sin más pasos.
        </p>
      </div>
    </div>
  );
};
