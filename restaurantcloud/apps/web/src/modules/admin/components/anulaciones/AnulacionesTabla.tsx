import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Building2,
  CookingPot,
} from 'lucide-react';
import { PedidoAnulacionItemDTO } from '@/types/admin';

interface AnulacionesTablaProps {
  anulaciones: PedidoAnulacionItemDTO[];
  cargando: boolean;
  onVerFicha: (id: string) => void;
  onMarcarRevisado: (id: string) => void;
}

export const AnulacionesTabla: React.FC<AnulacionesTablaProps> = ({
  anulaciones,
  cargando,
  onVerFicha,
  onMarcarRevisado,
}) => {
  if (cargando) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Hora</th>
              <th className="py-3.5 px-4">Mesa</th>
              <th className="py-3.5 px-4">Mozo</th>
              <th className="py-3.5 px-4">Plato / Comanda</th>
              <th className="py-3.5 px-4">Monto</th>
              <th className="py-3.5 px-4">Espera</th>
              <th className="py-3.5 px-4">Merma</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {anulaciones.map((anul) => {
              const hora = new Date(anul.anulado_at).toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const esCombinada = anul.mesa_numero.includes('[');
              const esComandaCompleta = anul.tipo_anulacion === 'comanda_completa';

              return (
                <tr
                  key={anul.id}
                  onClick={() => onVerFicha(anul.id)}
                  className={`group cursor-pointer transition-colors ${
                    !anul.revisado ? 'bg-amber-50/30 hover:bg-amber-100/40' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Hora */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {hora}
                    </span>
                  </td>

                  {/* Mesa (con soporte para combinadas) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        esCombinada
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
                      {anul.mesa_numero}
                    </span>
                  </td>

                  {/* Mozo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-700">
                      {anul.mozo_nombre}
                    </span>
                  </td>

                  {/* Plato / Comanda */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-aurea-navy">
                        {anul.producto_nombre}
                      </span>
                      {esComandaCompleta && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                          Comanda Total
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                      {anul.codigo}
                    </span>
                  </td>

                  {/* Monto */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold font-serif text-slate-900">
                      S/ {anul.monto_total.toFixed(2)}
                    </span>
                  </td>

                  {/* Tiempo de Espera Fáctico */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        anul.minutos_espera >= 20
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : anul.minutos_espera >= 12
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{anul.minutos_espera}m</span>
                    </span>
                  </td>

                  {/* Semáforo de Merma */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {anul.es_merma ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Con Merma (S/ {(anul.costo_merma || 0).toFixed(2)})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CookingPot className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sin Merma</span>
                      </span>
                    )}
                  </td>

                  {/* Estado de Supervisión */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {anul.revisado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>REVISADO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>PENDIENTE</span>
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerFicha(anul.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-aurea-navy hover:text-white text-xs font-semibold text-slate-700 transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ficha</span>
                      </button>

                      {!anul.revisado && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarcarRevisado(anul.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm"
                          title="Marcar como revisado / conforme"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Revisar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con total auditado */}
      <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Mostrando <strong>{anulaciones.length}</strong> registros de la fecha activa.
        </span>
        <span className="font-medium text-slate-700">
          Total auditado en vista: S/{' '}
          {anulaciones.reduce((acc, a) => acc + a.monto_total, 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
};
