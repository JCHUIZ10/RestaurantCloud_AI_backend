import React from 'react';
import {
  Flame,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  User,
  Shield,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { IncidenteItemDTO } from '@/types/admin';

interface IncidentesTablaProps {
  incidentes: IncidenteItemDTO[];
  total: number;
  pagina: number;
  limite: number;
  onCambiarPagina: (nuevaPagina: number) => void;
  onVerDetalle: (id: string) => void;
}

export const IncidentesTabla: React.FC<IncidentesTablaProps> = ({
  incidentes,
  total,
  pagina,
  limite,
  onCambiarPagina,
  onVerDetalle,
}) => {
  const totalPaginas = Math.ceil(total / limite) || 1;
  const inicio = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const fin = Math.min(pagina * limite, total);

  const getCategoriaLabel = (cat: string) => {
    switch (cat) {
      case 'caja_dinero':
        return 'Caja / Dinero';
      case 'rotura_merma':
        return 'Rotura / Merma';
      case 'servicio_cliente':
        return 'Serv. Cliente';
      case 'disciplinario':
        return 'Disciplinario';
      case 'seguridad_higiene':
        return 'Seg. Higiene';
      default:
        return 'Otro';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-3">Fecha / Hora</th>
              <th className="py-3 px-4">Título del Incidente</th>
              <th className="py-3 px-3">Categoría</th>
              <th className="py-3 px-3">Gravedad</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {incidentes.map((inc) => {
              const fechaObj = new Date(inc.fecha_hora);
              const fechaLegible = !isNaN(fechaObj.getTime())
                ? fechaObj.toLocaleString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : inc.fecha_hora;

              return (
                <tr
                  key={inc.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* Código */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-aurea-navy bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {inc.codigo}
                    </span>
                  </td>

                  {/* Fecha / Hora */}
                  <td className="py-3 px-3 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                    {fechaLegible}
                  </td>

                  {/* Título y Colaborador */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900 group-hover:text-aurea-navy transition-colors line-clamp-1">
                      {inc.titulo}
                    </div>
                    {inc.empleado_nombre ? (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-stone-400" />
                        <span>{inc.empleado_nombre}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-stone-400 italic mt-0.5">
                        Sin colaborador específico
                      </div>
                    )}
                  </td>

                  {/* Categoría */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                      {getCategoriaLabel(inc.categoria)}
                    </span>
                  </td>

                  {/* Gravedad */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {inc.gravedad === 'alta' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                        <Flame className="w-3 h-3 text-red-600 shrink-0" />
                        <span>ALTA ●</span>
                      </span>
                    ) : inc.gravedad === 'media' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span>MEDIA</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <span>BAJA</span>
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="space-y-1">
                      {inc.estado === 'abierto' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Abierto</span>
                        </span>
                      ) : inc.estado === 'en_revision' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <Hourglass className="w-3 h-3 text-blue-600" />
                          <span>En Rev ({inc.dias_en_curso}d)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Resuelto</span>
                        </span>
                      )}

                      {/* Indicador de visualización de Gerencia y Directiva */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {inc.visto_por_propietario ? (
                          <span
                            title={
                              inc.fecha_visto
                                ? `Visto por Propietario: ${new Date(inc.fecha_visto).toLocaleString('es-PE')}`
                                : 'Visto por el Propietario'
                            }
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200"
                          >
                            <Eye className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Visto por Dueño</span>
                          </span>
                        ) : (
                          <span
                            title="Pendiente de visualización por el Propietario en el portal corporativo"
                            className="inline-flex items-center gap-1 text-[10px] font-normal text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200"
                          >
                            <EyeOff className="w-2.5 h-2.5 text-stone-400" />
                            <span>No visto aún</span>
                          </span>
                        )}

                        {inc.tiene_nota_propietario && inc.estado !== 'resuelto' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-300">
                            <Shield className="w-2.5 h-2.5 text-purple-700" />
                            <span>Directiva Dueño</span>
                          </span>
                        )}

                        {inc.total_avances > 0 && inc.estado === 'en_revision' && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-medium">
                            {inc.total_avances} {inc.total_avances === 1 ? 'avance' : 'avances'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Acción */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onVerDetalle(inc.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 hover:text-aurea-navy text-xs font-semibold shadow-sm transition-all"
                    >
                      <span>{inc.estado === 'resuelto' ? 'Ver' : 'Ver / Resolver'}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-aurea-navy transition-colors" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          Mostrando <strong>{inicio}</strong> - <strong>{fin}</strong> de <strong>{total}</strong> incidentes en Sede Miraflores
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onCambiarPagina(num)}
              className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${
                pagina === num
                  ? 'bg-aurea-navy text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
