import React, { useEffect } from 'react';
import { AlertTriangle, X, Phone, Users, Calendar, ShieldAlert } from 'lucide-react';
import { ReservaResumenDTO } from '@/types/admin';

interface ModalBloqueoDesactivacionProps {
  isOpen: boolean;
  onClose: () => void;
  /** Confirma suspender la recepción de nuevas reservas; las pendientes siguen vigentes. */
  onApagarIgualmente: () => void;
  reservas: ReservaResumenDTO[];
}

export const ModalBloqueoDesactivacion: React.FC<ModalBloqueoDesactivacionProps> = ({
  isOpen,
  onClose,
  onApagarIgualmente,
  reservas,
}) => {
  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-bloqueo-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 w-full max-w-[620px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="p-5 pb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3
                id="modal-bloqueo-title"
                className="text-base sm:text-lg font-bold text-aurea-navy leading-tight"
              >
                Hay reservas pendientes
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Suspender la recepción de reservas no las cancela.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              Hay <strong>{reservas.length} {reservas.length === 1 ? 'reserva pendiente' : 'reservas pendientes'}</strong>.
              Si suspendes el canal, <strong>seguirán vigentes</strong> y el mozo las atenderá con normalidad; solo se
              impedirá registrar nuevas.
            </div>
          </div>

          <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-stone-50 px-3.5 py-2.5 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Reservas que siguen vigentes</span>
              <span>{reservas.length}</span>
            </div>

            <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
              {reservas.map((res) => {
                const fechaObj = new Date(res.fecha_hora);
                const fechaLegible = !isNaN(fechaObj.getTime())
                  ? fechaObj.toLocaleString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : res.fecha_hora;

                return (
                  <div
                    key={res.id}
                    className="p-3 hover:bg-stone-50/70 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 flex items-center gap-2">
                        <span>{res.cliente}</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-medium">
                          <Users className="w-3 h-3 text-stone-500" />
                          {res.pax} PAX
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {fechaLegible}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-stone-700">{res.mesas.join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <a
                        href={`tel:${res.telefono.replace(/\s/g, '')}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-mono font-medium transition-colors"
                        title="Llamar al cliente"
                      >
                        <Phone className="w-3 h-3 text-stone-500" />
                        <span>{res.telefono}</span>
                      </a>
                      {res.link_whatsapp && (
                        <a
                          href={res.link_whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Escribir por WhatsApp"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Si el local <strong>no podrá atender</strong> alguna de esas fechas, no basta con suspender el canal: registra
            el cierre en <strong>Horario y feriados</strong> para cancelar las reservas y avisar a los clientes.
          </p>
        </div>

        {/* Pie */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors text-center"
          >
            Mantener reservas habilitadas
          </button>

          <button
            type="button"
            onClick={onApagarIgualmente}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md text-center"
          >
            Suspender igualmente
          </button>
        </div>
      </div>
    </div>
  );
};
