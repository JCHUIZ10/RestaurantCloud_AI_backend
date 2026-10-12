import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface ModalPaywallReservasProps {
  abierto: boolean;
  onCerrar: () => void;
}

export const ModalPaywallReservas: React.FC<ModalPaywallReservasProps> = ({
  abierto,
  onCerrar,
}) => {
  const navigate = useNavigate();

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-h-[90vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '520px' }}
      >
        {/* Cabecera Distintiva */}
        <div className="px-5 py-5 bg-gradient-to-r from-aurea-navy via-slate-800 to-aurea-navy text-white text-center relative border-b border-aurea-copper/40">
          <div className="w-12 h-12 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center text-aurea-champagne mx-auto mb-2.5 shadow-sm">
            <Lock className="w-6 h-6 text-aurea-copper" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne">
            Funcionalidad SaaS Avanzada
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
            Módulo Exclusivo Pro & Enterprise
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-sm mx-auto">
            Gestión de Reservas de Salón, Mini-Mapa Espacial y Prevención de Solapamientos.
          </p>
        </div>

        {/* Contenido Didáctico */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
            Tu local actualmente opera bajo el <strong>Plan Starter</strong>. La gestión avanzada de reservas con asignación espacial y bloqueo reactivo de mesas está disponible al ascender a los planes <strong>Pro o Enterprise</strong>.
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Beneficios incluidos en Planes Pro / Enterprise:
            </span>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span>
                  <strong>Mini-Mapa interactivo de salón:</strong> Asignación física visual de mesas individuales o agrupadas.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span>
                  <strong>Bloqueo preventivo automático a 30m:</strong> Protege la mesa en salón antes de la cita.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span>
                  <strong>Avisos directos a WhatsApp:</strong> Recordatorios con 1 toque al comensal para reducir inasistencias.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span>
                  <strong>Control de tolerancia y cortesía:</strong> Liberación inmediata de mesa ante inasistencias en tiempo real.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => {
              onCerrar();
              navigate(ROUTES.MOZO_MESAS);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-center"
          >
            Volver al Salón Principal
          </button>

          <button
            type="button"
            onClick={() => {
              alert('Solicitud enviada al Administrador del Local para actualizar suscripción a Plan Pro.');
              onCerrar();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-aurea-navy hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-aurea-copper" />
            <span>Contactar al Propietario / Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
