import React from 'react';
import type { GastoCajaTurnoDTO } from '@/types/caja';

import { etiquetaCortaCategoriaGasto } from '@/shared/constants/categoriasGasto';

interface DetalleEgresosCajaTurnoProps {
  egresos: GastoCajaTurnoDTO[];
}

/** Rótulo bajo el concepto: "Compra de insumos" o la categoría del gasto. Los Z antiguos no traen `tipo` (eran gastos). */
const rotulo = (egreso: GastoCajaTurnoDTO): string => {
  if (egreso.tipo === 'compra') return 'Compra de insumos';
  return egreso.categoria ? etiquetaCortaCategoriaGasto(egreso.categoria) : 'Gasto de caja';
};

/**
 * Gastos y compras de insumos pagados con efectivo de la gaveta durante el turno: quién los registró, a quién se
 * pagó y cuánto salió. Se descuentan del efectivo esperado, así que explican la diferencia con el fondo y las ventas.
 */
export const DetalleEgresosCajaTurno: React.FC<DetalleEgresosCajaTurnoProps> = ({ egresos }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
    <table className="w-full text-left text-[11px] font-mono">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wide">
          <th className="px-3 py-2 font-bold">Hora</th>
          <th className="px-3 py-2 font-bold">Concepto</th>
          <th className="px-3 py-2 font-bold">Registrado por</th>
          <th className="px-3 py-2 text-right font-bold">Monto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {egresos.map((egreso) => (
          <tr key={egreso.id}>
            <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {new Date(egreso.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </td>
            <td className="px-3 py-2 font-sans text-slate-700 dark:text-slate-300">
              <span className="font-semibold">{egreso.proveedor_nombre ?? 'Sin proveedor'}</span>
              <span className="block text-[10px] text-slate-400">
                {/* En una compra, la descripción ya dice "Compra de insumos · N° de comprobante" */}
                {egreso.tipo === 'compra'
                  ? (egreso.descripcion ?? rotulo(egreso))
                  : `${rotulo(egreso)}${egreso.descripcion ? ` · ${egreso.descripcion}` : ''}`}
              </span>
            </td>
            <td className="px-3 py-2 font-sans text-slate-600 dark:text-slate-400">{egreso.registrado_por_nombre ?? '—'}</td>
            <td className="px-3 py-2 text-right font-bold text-rose-500">- S/ {egreso.monto.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
