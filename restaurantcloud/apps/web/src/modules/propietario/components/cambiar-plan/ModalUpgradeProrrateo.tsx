import React, { useState, useEffect } from 'react';
import {
  SimularUpgradeResponseDTO,
  EjecutarUpgradeResponseDTO,
  PeriodicidadFacturacion,
} from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';
import { Button } from '@/components/ui/Button';
import {
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ModalUpgradeProrrateoProps {
  abierto: boolean;
  nuevoPlanId: number;
  periodicidad: PeriodicidadFacturacion;
  onCerrar: () => void;
  onUpgradeExitoso: (res: EjecutarUpgradeResponseDTO) => void;
}

export const ModalUpgradeProrrateo: React.FC<ModalUpgradeProrrateoProps> = ({
  abierto,
  nuevoPlanId,
  periodicidad,
  onCerrar,
  onUpgradeExitoso,
}) => {
  const [simulacion, setSimulacion] = useState<SimularUpgradeResponseDTO | null>(null);
  const [cargandoSimulacion, setCargandoSimulacion] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorCobro, setErrorCobro] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;

    let cancelado = false;
    setCargandoSimulacion(true);
    setErrorCobro(null);

    propietarioSuscripcionService
      .simularUpgrade({ nuevo_plan_id: nuevoPlanId, periodicidad })
      .then((res) => {
        if (!cancelado && res.exito && res.datos) {
          setSimulacion(res.datos);
        }
      })
      .catch(() => {
        if (!cancelado) setErrorCobro('Error al calcular el prorrateo con Stripe.');
      })
      .finally(() => {
        if (!cancelado) setCargandoSimulacion(false);
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, nuevoPlanId, periodicidad]);

  if (!abierto) return null;

  const handleConfirmarPago = async () => {
    setProcesandoPago(true);
    setErrorCobro(null);
    try {
      const res = await propietarioSuscripcionService.ejecutarUpgrade({
        nuevo_plan_id: nuevoPlanId,
        periodicidad,
      });

      if (res.exito && res.datos) {
        onUpgradeExitoso(res.datos);
      } else {
        setErrorCobro(res.errores?.[0]?.mensaje || 'No se pudo procesar el cargo de prorrateo.');
      }
    } catch {
      setErrorCobro('Error de comunicación con Stripe Billing. Verifica tu método de pago.');
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-upgrade-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-aurea-navy/15 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-aurea-navy p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-aurea-copper/20 text-aurea-champagne border border-aurea-copper/30">
              <Zap className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <h2
                id="modal-upgrade-titulo"
                className="font-serif text-lg font-bold tracking-tight text-white"
              >
                Confirmar Upgrade a Plan {simulacion?.plan_destino || 'Enterprise'}
              </h2>
              <p className="text-xs text-slate-300">
                Prorrateo transparente calculado en tiempo real con Stripe
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={procesandoPago}
            aria-label="Cerrar modal"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {cargandoSimulacion ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-aurea-navy" />
              <p className="text-xs font-semibold text-slate-600">
                Calculando saldo proporcional y crédito a favor con Stripe...
              </p>
            </div>
          ) : simulacion ? (
            <>
              {/* Banner de Activación Inmediata */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold block">Activación Inmediata:</strong>
                  Tus nuevas funciones de IA predictiva y cuotas multi-sede se habilitarán en el acto tras confirmar este cobro proporcional.
                </div>
              </div>

              {/* Transición Visual de Planes */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Plan Origen
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {simulacion.plan_origen}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    S/ {simulacion.plan_origen === 'Starter' ? '40.00' : '80.00'}/mes
                  </span>
                </div>

                <div className="flex flex-col items-center px-3">
                  <div className="w-8 h-8 rounded-full bg-aurea-copper/20 flex items-center justify-center text-aurea-navy">
                    <ArrowRight className="w-4 h-4 text-aurea-navy" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1">
                    {simulacion.dias_restantes_ciclo} días rest.
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-aurea-copper block tracking-wider">
                    Plan Destino
                  </span>
                  <span className="text-sm font-bold text-aurea-navy">
                    {simulacion.plan_destino}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    S/ {simulacion.nuevo_monto_recurrente.toFixed(2)}/mes
                  </span>
                </div>
              </div>

              {/* Desglose Financiero de Prorrateo */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Desglose Financiero de Facturación Inmediata
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600">
                      1. Crédito a favor ({simulacion.dias_restantes_ciclo} días no usados de {simulacion.plan_origen}):
                    </span>
                    <span className="font-mono font-semibold text-emerald-600">
                      -S/ {simulacion.credito_plan_actual.toFixed(2)} PEN
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-600">
                      2. Costo proporcional ({simulacion.dias_restantes_ciclo} días restantes de {simulacion.plan_destino}):
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      +S/ {simulacion.costo_nuevo_plan_proporcional.toFixed(2)} PEN
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 font-bold">
                    <span className="text-sm text-aurea-navy">
                      3. Monto total neto a pagar hoy:
                    </span>
                    <span className="text-base font-sans font-extrabold text-aurea-navy">
                      S/ {simulacion.monto_neto_a_pagar_hoy.toFixed(2)} PEN
                    </span>
                  </div>
                </div>
              </div>

              {/* Método de Pago Seleccionado */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-aurea-navy font-bold text-xs uppercase shadow-xs">
                    {simulacion.metodo_pago_defecto.marca}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {simulacion.metodo_pago_defecto.marca.toUpperCase()} terminada en •••• {simulacion.metodo_pago_defecto.ultimos_4}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Método predeterminado registrado en Stripe
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Seguro</span>
                </div>
              </div>

              {/* Mensaje de Recurrencia Futura */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  A partir del <strong>01/Nov/2026</strong> tu tarifa recurrente regular será de <strong>S/ {simulacion.nuevo_monto_recurrente.toFixed(2)} PEN/mes</strong>.
                </span>
              </div>

              {/* Error si ocurre */}
              {errorCobro && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorCobro}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-xs text-red-500">
              No se pudo cargar la información de prorrateo.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={procesandoPago}
            onClick={onCerrar}
            className="text-xs font-semibold text-slate-600"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={cargandoSimulacion || procesandoPago || !simulacion}
            onClick={handleConfirmarPago}
            className="bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs shadow-md flex items-center gap-2 px-5"
          >
            {procesandoPago ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-aurea-navy" />
                <span>Procesando con Stripe...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-aurea-navy" />
                <span>
                  Confirmar y Pagar S/ {simulacion?.monto_neto_a_pagar_hoy.toFixed(2) || '125.00'}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
