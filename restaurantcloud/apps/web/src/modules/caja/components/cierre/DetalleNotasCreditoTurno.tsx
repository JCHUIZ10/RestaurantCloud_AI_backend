import React, { useState } from 'react';
import type { NotaCreditoTurnoDTO } from '@/types/caja';

const ETIQUETA_MEDIO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  billetera_digital: 'Yape / Plin',
};

interface DetalleNotasCreditoTurnoProps {
  notas: NotaCreditoTurnoDTO[];
  /** Filas por página. Sin valor se muestran todas (Reporte Z y PDF son documentos completos). */
  porPagina?: number;
}

/**
 * Tabla de las notas de crédito emitidas en el turno: qué documento anula cada una,
 * por qué medio se devolvió y si el dinero salió de la gaveta.
 */
export const DetalleNotasCreditoTurno: React.FC<DetalleNotasCreditoTurnoProps> = ({ notas, porPagina }) => {
  const [paginaSolicitada, setPaginaSolicitada] = useState(1);

  const totalPaginas = porPagina ? Math.max(1, Math.ceil(notas.length / porPagina)) : 1;
  // Si la lista se acorta con un refresco, la página se ajusta a la última disponible
  const pagina = Math.min(paginaSolicitada, totalPaginas);
  const visibles = porPagina ? notas.slice((pagina - 1) * porPagina, pagina * porPagina) : notas;

  return (
  <div className="space-y-2">
  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
    <table className="w-full text-left text-[11px] font-mono">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wide">
          <th className="px-3 py-2 font-bold">Nota de crédito</th>
          <th className="px-3 py-2 font-bold">Anula a</th>
          <th className="px-3 py-2 font-bold">Medio</th>
          <th className="px-3 py-2 font-bold">Motivo</th>
          <th className="px-3 py-2 text-right font-bold">Monto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {visibles.map((nc) => (
          <tr key={nc.documento}>
            <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">{nc.documento}</td>
            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{nc.documento_modificado ?? '—'}</td>
            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
              {ETIQUETA_MEDIO[nc.medio_pago] ?? nc.medio_pago}
              <span className="block text-[10px] text-slate-400">
                {nc.afecta_gaveta ? 'Salió de la gaveta' : 'No afecta la gaveta'}
              </span>
            </td>
            <td className="px-3 py-2 font-sans text-slate-600 dark:text-slate-400">
              {nc.motivo_texto ?? nc.motivo_codigo_sunat ?? '—'}
              {nc.sustento_motivo && (
                <span className="block text-[10px] text-slate-400 italic line-clamp-2">{nc.sustento_motivo}</span>
              )}
            </td>
            <td className="px-3 py-2 text-right font-bold text-rose-500">- S/ {nc.monto.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  {totalPaginas > 1 && (
    <div className="flex items-center justify-between text-[11px] text-slate-500">
      <span>
        Página {pagina} de {totalPaginas} · {notas.length} notas
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPaginaSolicitada(pagina - 1)}
          disabled={pagina <= 1}
          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => setPaginaSolicitada(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
        >
          Siguiente
        </button>
      </div>
    </div>
  )}
  </div>
  );
};
