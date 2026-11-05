import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import type { PeriodicidadFacturacion, PlanComparativoDTO, ProgramarCambioResponseDTO } from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';

interface ModalProgramarCambioProps {
  abierto: boolean;
  /** Plan al que se quiere bajar (puede ser el mismo plan actual al pasar de anual a mensual) */
  plan: PlanComparativoDTO | null;
  cicloActual: PeriodicidadFacturacion;
  fechaRenovacion: string | null;
  onCerrar: () => void;
  onProgramado: (datos: ProgramarCambioResponseDTO) => void;
}

const ETIQUETA_RECURSO = { locales: 'locales', pisos: 'pisos', mesas: 'mesas', usuarios: 'cuentas de personal' } as const;

const formatearFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

/** Confirma el ciclo y deja claro que el cambio entra recién cuando termina el periodo ya pagado. */
export const ModalProgramarCambio: React.FC<ModalProgramarCambioProps> = ({
  abierto,
  plan,
  cicloActual,
  fechaRenovacion,
  onCerrar,
  onProgramado,
}) => {
  const [ciclo, setCiclo] = useState<PeriodicidadFacturacion>('mensual');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setCiclo(cicloActual === 'anual' && plan?.es_plan_actual ? 'mensual' : cicloActual);
      setError(null);
    }
  }, [abierto, cicloActual, plan]);

  if (!plan) return null;

  // Con el mismo plan el único cambio posible es anual -> mensual
  const soloMensual = plan.es_plan_actual;
  const precio = ciclo === 'anual' ? plan.precio_anual : plan.precio_mensual;

  const confirmar = async () => {
    setProcesando(true);
    setError(null);

    try {
      const res = await propietarioSuscripcionService.programarCambio(plan.id, ciclo);
      if (res.exito && res.datos) {
        onProgramado(res.datos);
        return;
      }
      setError(res.errores?.[0]?.mensaje ?? 'No se pudo programar el cambio.');
    } catch {
      setError('No pudimos conectar con el servidor. Intenta nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!procesando}
      icono={CalendarClock}
      etiqueta="Cambio programado"
      titulo={soloMensual ? `Pasar a facturación mensual (Plan ${plan.nombre})` : `Bajar a Plan ${plan.nombre}`}
      descripcion="Pagaste este periodo completo: el cambio entra recién cuando termina."
      tamano="md"
      pie={
        <>
          <Button variant="ghost" disabled={procesando} onClick={onCerrar}>
            Cancelar
          </Button>
          <Button loading={procesando} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={confirmar}>
            Programar cambio
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {!soloMensual && (
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Facturación del nuevo plan</legend>
            {(['mensual', 'anual'] as const).map((opcion) => (
              <label
                key={opcion}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer ${
                  ciclo === opcion ? 'border-aurea-navy bg-aurea-ivory/60' : 'border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <input type="radio" name="ciclo" checked={ciclo === opcion} onChange={() => setCiclo(opcion)} />
                  <span className="font-medium capitalize">{opcion}</span>
                </span>
                <strong>
                  S/ {(opcion === 'anual' ? plan.precio_anual : plan.precio_mensual).toFixed(2)}/{opcion === 'anual' ? 'año' : 'mes'}
                </strong>
              </label>
            ))}
          </fieldset>
        )}

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700">
          Seguirás con tu plan actual y <strong>todos tus recursos</strong> hasta el{' '}
          <strong>{formatearFecha(fechaRenovacion)}</strong>. Ese día se cobrará{' '}
          <strong>
            S/ {precio.toFixed(2)}/{ciclo === 'anual' ? 'año' : 'mes'}
          </strong>{' '}
          por el Plan {plan.nombre}. Puedes cancelar el cambio cuando quieras antes de esa fecha.
        </div>

        {plan.recursos_excedidos.length > 0 && !soloMensual && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Hoy superas este plan en {plan.recursos_excedidos.map((r) => ETIQUETA_RECURSO[r]).join(', ')} (pisos, mesas y personal se miden en cada local). Ese día lo que
              exceda quedará inactivo (sin borrar datos). Al programar podrás elegir qué conservar; si no, se aplicará por antigüedad.
            </span>
          </div>
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
