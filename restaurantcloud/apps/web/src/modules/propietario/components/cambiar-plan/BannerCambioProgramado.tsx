import React from 'react';
import { Calendar, ListChecks, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface BannerCambioProgramadoProps {
  nombrePlan: string;
  ciclo: 'mensual' | 'anual';
  fechaEfectiva: string | null;
  diasRestantes: number;
  /** Cuando la empresa excede el plan futuro: cuántos recursos pasarían a inactivos ese día */
  hayExcedentes: boolean;
  /** El propietario ya eligió qué conservar; si no, se aplica por antigüedad */
  seleccionGuardada: boolean;
  cancelando: boolean;
  onCancelar: () => void;
  onElegirConservar: () => void;
}

const formatearFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

/** Aviso permanente del cambio de plan o ciclo programado para el fin del periodo ya pagado. */
export const BannerCambioProgramado: React.FC<BannerCambioProgramadoProps> = ({
  nombrePlan,
  ciclo,
  fechaEfectiva,
  diasRestantes,
  hayExcedentes,
  seleccionGuardada,
  cancelando,
  onCancelar,
  onElegirConservar,
}) => (
  <div
    role="status"
    className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col gap-4 shadow-sm"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-amber-100/80 border border-amber-300/80 text-amber-900 shrink-0 mt-0.5">
        <Calendar className="w-5 h-5" />
      </div>
      <div className="text-xs sm:text-sm leading-relaxed flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-amber-950 text-sm sm:text-base">
            Cambio programado a Plan {nombrePlan} ({ciclo})
          </p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-200/80 text-amber-900 border border-amber-300">
            {formatearFecha(fechaEfectiva)} · {diasRestantes} {diasRestantes === 1 ? 'día restante' : 'días restantes'}
          </span>
        </div>
        <p className="mt-1.5 text-amber-900/90 leading-relaxed">
          Hasta esa fecha sigues disfrutando tu plan actual completo.
          {hayExcedentes &&
            (seleccionGuardada
              ? ' Ese día, lo que supere los límites del nuevo plan quedará inactivo (sin borrar datos). Tu selección de qué conservar está guardada.'
              : ' Ese día, lo que supere los límites del nuevo plan quedará inactivo (sin borrar datos). Si no eliges qué conservar, se aplicará por antigüedad.')}
        </p>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-end sm:justify-start gap-2.5 pt-3 border-t border-amber-200/80">
      {hayExcedentes && (
        <Button
          type="button"
          variant="outline"
          leftIcon={<ListChecks className="w-4 h-4" />}
          onClick={onElegirConservar}
          className="border-amber-400 bg-white/80 text-amber-900 hover:bg-amber-100 shadow-xs"
        >
          {seleccionGuardada ? 'Revisar qué conservar' : 'Elegir qué conservar'}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        loading={cancelando}
        leftIcon={<XCircle className="w-4 h-4" />}
        onClick={onCancelar}
        className="border-amber-400 bg-white/80 text-amber-900 hover:bg-amber-100 shadow-xs"
      >
        Cancelar cambio
      </Button>
    </div>
  </div>
);
