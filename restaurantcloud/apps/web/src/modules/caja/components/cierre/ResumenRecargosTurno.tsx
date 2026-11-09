import React from 'react';

interface ResumenRecargosTurnoProps {
  totalNeto: number;
  recargoTarjetas: number;
  recargoBilleteras: number;
  totalRecargos: number;
  ingresoConsumo: number;
}

/**
 * Del total cobrado, cuánto corresponde al consumo y cuánto es recargo por usar tarjeta o billetera
 * (el recargo cubre la comisión de la pasarela). Solo se dibuja cuando el turno tuvo recargos.
 */
export const ResumenRecargosTurno: React.FC<ResumenRecargosTurnoProps> = ({
  totalNeto,
  recargoTarjetas,
  recargoBilleteras,
  totalRecargos,
  ingresoConsumo,
}) => (
  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
      Del total cobrado, qué es consumo y qué es recargo
    </span>
    <dl className="font-mono text-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <dt className="text-slate-600 dark:text-slate-300">Cobrado neto (todos los medios)</dt>
        <dd className="font-bold text-slate-900 dark:text-white">S/ {totalNeto.toFixed(2)}</dd>
      </div>
      {recargoTarjetas > 0 && (
        <div className="flex items-center justify-between text-slate-500">
          <dt>− Recargo por uso de tarjeta</dt>
          <dd>S/ {recargoTarjetas.toFixed(2)}</dd>
        </div>
      )}
      {recargoBilleteras > 0 && (
        <div className="flex items-center justify-between text-slate-500">
          <dt>− Recargo por uso de Yape / Plin</dt>
          <dd>S/ {recargoBilleteras.toFixed(2)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700">
        <dt className="font-bold text-slate-900 dark:text-white">= Ingreso por consumo</dt>
        <dd className="font-bold text-emerald-600 dark:text-emerald-400">S/ {ingresoConsumo.toFixed(2)}</dd>
      </div>
    </dl>
    <p className="text-[10px] text-slate-400 font-sans leading-snug">
      Los recargos ({`S/ ${totalRecargos.toFixed(2)}`}) son lo que se cobró de más al cliente según el porcentaje
      configurado. La liquidación real del banco o la pasarela puede variar.
    </p>
  </div>
);
