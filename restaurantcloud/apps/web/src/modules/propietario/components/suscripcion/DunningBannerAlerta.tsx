import React from 'react';
import { EstadoSuscripcion, EstadoCobroDunningDTO } from '@/types/propietarioSuscripcion';
import { AlertTriangle, ShieldAlert, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DunningBannerAlertaProps {
  estadoSuscripcion: EstadoSuscripcion;
  estadoCobro: EstadoCobroDunningDTO | null;
  onActualizarTarjeta: () => void;
}

export const DunningBannerAlerta: React.FC<DunningBannerAlertaProps> = ({
  estadoSuscripcion,
  estadoCobro,
  onActualizarTarjeta,
}) => {
  const esSuspendida = estadoSuscripcion === 'suspendida';
  const esEnGracia =
    estadoSuscripcion === 'en_gracia' || (estadoCobro?.en_periodo_gracia ?? false);

  if (!esSuspendida && !esEnGracia) {
    return null;
  }

  if (esSuspendida) {
    return (
      <section
        role="alert"
        aria-live="assertive"
        className="rounded-xl bg-red-50 border-2 border-red-300 p-4 sm:p-5 shadow-sm transition-all"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-red-100 text-red-700 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-base sm:text-lg text-red-900">
                  Acceso Suspendido: Se requiere regularización de pago
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-red-200 text-red-900 rounded">
                  Inactivo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-800 mt-1 max-w-2xl leading-relaxed">
                El periodo de gracia de 5 días ha finalizado sin recibir el pago de la suscripción (S/ {estadoCobro?.monto_pendiente ? estadoCobro.monto_pendiente.toFixed(2) : '80.00'}). Las funciones de comanda, KDS y carta QR se encuentran temporalmente pausadas.
              </p>
              {estadoCobro?.ultimo_error_cobro && (
                <p className="text-xs font-mono text-red-700 bg-red-100/70 rounded px-2.5 py-1 mt-2 inline-block border border-red-200">
                  Motivo bancario: {estadoCobro.ultimo_error_cobro}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 shrink-0">
            <Button
              type="button"
              onClick={onActualizarTarjeta}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 shadow-md flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Reactivar con Nueva Tarjeta</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Caso: Periodo de Gracia (Dunning)
  const diasRestantes = estadoCobro?.dias_gracia_restantes ?? 5;
  const montoPendiente = estadoCobro?.monto_pendiente ?? 80.0;

  return (
    <section
      role="alert"
      aria-live="polite"
      className="rounded-xl bg-amber-50/90 border border-amber-300 p-4 sm:p-5 shadow-sm transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-sans font-bold text-base sm:text-lg text-amber-950">
                Atención: No pudimos procesar tu último cobro mensual de S/{' '}
                {montoPendiente.toFixed(2)}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                <Clock className="w-3 h-3" />
                {diasRestantes} {diasRestantes === 1 ? 'día restante' : 'días restantes'} de gracia
              </span>
            </div>

            <p className="text-xs sm:text-sm text-amber-900/90 mt-1 max-w-2xl leading-relaxed">
              Tu banco declinó el cargo automático en tu tarjeta registrada. Actualiza tu método de pago para evitar la interrupción de tus servicios.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2 border-t border-amber-200/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Operaciones en cocina, salón y delivery 100% activas</span>
              </div>
              {estadoCobro?.ultimo_error_cobro && (
                <div className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200/80">
                  Respuesta del banco: {estadoCobro.ultimo_error_cobro}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 shrink-0">
          <Button
            type="button"
            onClick={onActualizarTarjeta}
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm py-2.5 px-4 shadow-md flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4 text-amber-200" />
            <span>Actualizar Tarjeta Ahora</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
