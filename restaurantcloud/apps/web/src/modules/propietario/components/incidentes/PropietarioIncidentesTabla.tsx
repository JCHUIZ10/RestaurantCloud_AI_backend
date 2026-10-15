import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';
import {
  IncidenteBandejaItemDTO,
  CategoriaIncidente,
  GravedadIncidente,
  EstadoIncidente,
} from '@/types/propietario';

interface PropietarioIncidentesTablaProps {
  incidentes: IncidenteBandejaItemDTO[];
  cargando: boolean;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
  onCambiarPagina: (pagina: number) => void;
  onInspeccionar: (id: string) => void;
}

const CATEGORIA_LABELS: Record<CategoriaIncidente, string> = {
  servicio_cliente: 'Servicio al Cliente',
  disciplinario: 'Disciplinario',
  rotura_merma: 'Rotura o Merma',
  seguridad_higiene: 'Seguridad / Higiene',
  caja_dinero: 'Caja o Dinero',
  otro: 'Otro',
};

const GRAVEDAD_CONFIG: Record<
  GravedadIncidente,
  { label: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  alta: {
    label: 'ALTA',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    icon: AlertTriangle,
  },
  media: {
    label: 'MEDIA',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    icon: AlertTriangle,
  },
  baja: {
    label: 'BAJA',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
    icon: ShieldAlert,
  },
};

const ESTADO_CONFIG: Record<
  EstadoIncidente,
  { label: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  abierto: {
    label: 'Abierto',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ShieldAlert,
  },
  en_revision: {
    label: 'En Revisión',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    icon: Clock,
  },
  resuelto: {
    label: 'Resuelto',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    icon: CheckCircle2,
  },
};

export const PropietarioIncidentesTabla: React.FC<PropietarioIncidentesTablaProps> = ({
  incidentes,
  cargando,
  paginaActual,
  totalPaginas,
  totalRegistros,
  limite,
  onCambiarPagina,
  onInspeccionar,
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

  const inicio = (paginaActual - 1) * limite + 1;
  const fin = Math.min(paginaActual * limite, totalRegistros);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Tabla Responsive */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Fecha / Hora</th>
              <th className="py-3.5 px-4">Sede</th>
              <th className="py-3.5 px-4">Gravedad</th>
              <th className="py-3.5 px-4">Categoría</th>
              <th className="py-3.5 px-4">Asunto / Título</th>
              <th className="py-3.5 px-4">Involucrado</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {incidentes.map((inc) => {
              const gravedad = GRAVEDAD_CONFIG[inc.gravedad];
              const estado = ESTADO_CONFIG[inc.estado];
              const GravedadIcon = gravedad.icon;
              const EstadoIcon = estado.icon;
              const esNoVisto = !inc.visto_por_propietario;

              const fecha = new Date(inc.created_at);
              const fechaCorta = fecha.toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
              });
              const horaCorta = fecha.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr
                  key={inc.id}
                  onClick={() => onInspeccionar(inc.id)}
                  className={`group cursor-pointer transition-colors ${
                    esNoVisto ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Fecha y Hora */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fechaCorta}</span>
                      <span className="text-slate-400 font-mono text-xs">{horaCorta}</span>
                    </div>
                  </td>

                  {/* Sede */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
                      {inc.local_nombre}
                    </span>
                  </td>

                  {/* Gravedad */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${gravedad.badgeClass}`}>
                      <GravedadIcon className="w-3 h-3" />
                      {gravedad.label}
                    </span>
                  </td>

                  {/* Categoría */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                    {CATEGORIA_LABELS[inc.categoria]}
                  </td>

                  {/* Asunto / Título con Indicador de No Revisado */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      {esNoVisto && (
                        <span
                          title="No revisado por ti"
                          className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider"
                        >
                          <EyeOff className="w-3 h-3" />
                          Nuevo
                        </span>
                      )}
                      <span
                        className={`truncate ${
                          esNoVisto
                            ? 'font-bold text-aurea-navy'
                            : 'font-medium text-slate-700 group-hover:text-aurea-navy'
                        }`}
                      >
                        {inc.titulo}
                      </span>
                      {inc.tiene_evidencia && (
                        <span title="Contiene evidencia fotográfica" className="inline-flex">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                      {inc.codigo}
                    </span>
                  </td>

                  {/* Involucrado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {inc.involucrado_nombre ? (
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">
                          {inc.involucrado_nombre}
                        </span>
                        {inc.involucrado_cargo && (
                          <span className="text-[11px] text-slate-400 block">
                            {inc.involucrado_cargo}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">N/A</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${estado.badgeClass}`}>
                      <EstadoIcon className="w-3.5 h-3.5" />
                      {estado.label}
                    </span>
                  </td>

                  {/* Acción */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspeccionar(inc.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-aurea-copper hover:text-aurea-navy hover:border-aurea-copper text-xs font-semibold text-slate-700 transition-all shadow-sm active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspeccionar</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Mostrando <strong className="text-slate-700">{inicio}</strong> a{' '}
          <strong className="text-slate-700">{fin}</strong> de{' '}
          <strong className="text-slate-700">{totalRegistros}</strong> incidentes
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pag) => (
            <button
              key={pag}
              onClick={() => onCambiarPagina(pag)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                pag === paginaActual
                  ? 'bg-aurea-copper text-aurea-navy shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pag}
            </button>
          ))}

          <button
            onClick={() => onCambiarPagina(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
