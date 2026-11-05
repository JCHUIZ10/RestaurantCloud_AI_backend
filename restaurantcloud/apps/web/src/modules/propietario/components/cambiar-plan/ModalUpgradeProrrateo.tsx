import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Info, Loader2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import type { EjecutarUpgradeResponseDTO, SimularUpgradeResponseDTO } from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';

interface ModalUpgradeProrrateoProps {
  abierto: boolean;
  nuevoPlanId: number | null;
  onCerrar: () => void;
  onUpgradeExitoso: (res: EjecutarUpgradeResponseDTO) => void;
}

const MENSAJE_CONEXION = 'No pudimos conectar con el servidor. Intenta nuevamente.';

const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

/** Confirmación del upgrade con el desglose del prorrateo calculado por el servidor. */
export const ModalUpgradeProrrateo: React.FC<ModalUpgradeProrrateoProps> = ({
  abierto,
  nuevoPlanId,
  onCerrar,
  onUpgradeExitoso,
}) => {
  const [simulacion, setSimulacion] = useState<SimularUpgradeResponseDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto || nuevoPlanId === null) return;

    let cancelado = false;
    setSimulacion(null);
    setCargando(true);
    setError(null);

    propietarioSuscripcionService
      .simularUpgrade(nuevoPlanId)
      .then((res) => {
        if (cancelado) return;
        if (res.exito && res.datos) setSimulacion(res.datos);
        else setError(res.errores?.[0]?.mensaje ?? 'No se pudo calcular el prorrateo.');
      })
      .catch(() => {
        if (!cancelado) setError(MENSAJE_CONEXION);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, nuevoPlanId]);

  const sinTarjeta = simulacion !== null && simulacion.requiere_cobro && simulacion.metodo_pago_defecto === null;

  const confirmar = async () => {
    if (nuevoPlanId === null || procesando) return;
    setProcesando(true);
    setError(null);

    try {
      const res = await propietarioSuscripcionService.ejecutarUpgrade(nuevoPlanId);
      if (res.exito && res.datos) {
        onUpgradeExitoso(res.datos);
        return;
      }
      setError(res.errores?.[0]?.mensaje ?? 'No se pudo procesar el cambio de plan.');
    } catch {
      setError(MENSAJE_CONEXION);
    } finally {
      setProcesando(false);
    }
  };

  const unidad = simulacion?.periodicidad === 'anual' ? 'año' : 'mes';

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!procesando}
      icono={Zap}
      etiqueta="Mejora de plan"
      titulo={`Mejorar a Plan ${simulacion?.plan_destino ?? ''}`.trim()}
      descripcion="El nuevo plan se activa de inmediato; solo pagas la diferencia por lo que resta de tu periodo."
      tamano="md"
      pie={
        <>
          <Button variant="ghost" disabled={procesando} onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            disabled={cargando || procesando || !simulacion || sinTarjeta}
            loading={procesando}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={confirmar}
          >
            {procesando
              ? 'Procesando con Stripe...'
              : simulacion?.requiere_cobro
                ? `Confirmar y pagar S/ ${simulacion.monto_neto_a_pagar_hoy.toFixed(2)}`
                : 'Activar plan (sin cobro hoy)'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {cargando && (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-aurea-navy" />
            <p className="text-xs font-semibold text-slate-600">Calculando el prorrateo de tu periodo...</p>
          </div>
        )}

        {simulacion && (
          <>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Plan actual</span>
                <span className="text-sm font-bold text-slate-800">{simulacion.plan_origen}</span>
                <span className="text-xs text-slate-500 block">
                  S/ {simulacion.precio_actual.toFixed(2)}/{unidad}
                </span>
              </div>

              <div className="flex flex-col items-center px-3">
                <span className="w-8 h-8 rounded-full bg-aurea-copper/20 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-aurea-navy" />
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-1">
                  {simulacion.dias_restantes_ciclo} {simulacion.dias_restantes_ciclo === 1 ? 'día' : 'días'} rest.
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-aurea-copper block tracking-wider">Nuevo plan</span>
                <span className="text-sm font-bold text-aurea-navy">{simulacion.plan_destino}</span>
                <span className="text-xs text-slate-500 block">
                  S/ {simulacion.nuevo_monto_recurrente.toFixed(2)}/{unidad}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Desglose del cobro de hoy</div>
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-slate-600">Crédito por lo no usado de {simulacion.plan_origen}</span>
                  <span className="font-mono font-semibold text-emerald-600 whitespace-nowrap">
                    -S/ {simulacion.credito_plan_actual.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-slate-600">Costo proporcional de {simulacion.plan_destino}</span>
                  <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">
                    +S/ {simulacion.costo_nuevo_plan_proporcional.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2.5 font-bold">
                  <span className="text-sm text-aurea-navy">Total a pagar hoy</span>
                  <span className="text-base font-extrabold text-aurea-navy whitespace-nowrap">
                    S/ {simulacion.monto_neto_a_pagar_hoy.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {!simulacion.requiere_cobro && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Queda muy poco de tu periodo actual, así que no se cobra nada hoy. Tu próximo cobro ya será del nuevo plan.
                </span>
              </div>
            )}

            {simulacion.metodo_pago_defecto && simulacion.requiere_cobro && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-bold text-slate-800">
                    {simulacion.metodo_pago_defecto.marca.toUpperCase()} terminada en •••• {simulacion.metodo_pago_defecto.ultimos_4}
                  </div>
                  <div className="text-[11px] text-slate-500">Tarjeta predeterminada de tu suscripción</div>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Seguro
                </span>
              </div>
            )}

            {sinTarjeta && (
              <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Necesitas una tarjeta registrada para pagar la diferencia. Agrégala desde "Mi suscripción" y vuelve a intentarlo.
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex items-start gap-1.5 px-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Desde el <strong>{formatearFecha(simulacion.fecha_proximo_ciclo)}</strong> tu tarifa regular será de{' '}
                <strong>S/ {simulacion.nuevo_monto_recurrente.toFixed(2)}/{unidad}</strong>.
              </span>
            </div>
          </>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};
