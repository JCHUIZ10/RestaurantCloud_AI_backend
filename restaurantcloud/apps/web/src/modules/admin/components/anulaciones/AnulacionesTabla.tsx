import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Building2,
  CookingPot,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PedidoAnulacionItemDTO } from '@/types/admin';

interface AnulacionesTablaProps {
  anulaciones: PedidoAnulacionItemDTO[];
  cargando: boolean;
  onVerFicha: (id: string) => void;
  onMarcarRevisado: (id: string) => void;
  paginaActual?: number;
  totalPaginas?: number;
  totalRegistros?: number;
  limitePorPagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  onCambiarLimite?: (limite: number) => void;
}

export const AnulacionesTabla: React.FC<AnulacionesTablaProps> = ({
  anulaciones,
  cargando,
  onVerFicha,
  onMarcarRevisado,
  paginaActual: paginaProp,
  totalPaginas: totalPaginasProp,
  totalRegistros: totalRegistrosProp,
  limitePorPagina: limiteProp,
  onCambiarPagina,
  onCambiarLimite,
}) => {
  const [paginaInterna, setPaginaInterna] = React.useState(1);
  const [limiteInterno, setLimiteInterno] = React.useState(10);

  const paginaActual = paginaProp ?? paginaInterna;
  const limitePorPagina = limiteProp ?? limiteInterno;
  const totalRegistros = totalRegistrosProp ?? anulaciones.length;
  const totalPaginas = totalPaginasProp ?? Math.max(1, Math.ceil(totalRegistros / limitePorPagina));

  const handleCambiarPagina = (pag: number) => {
    const paginaValida = Math.max(1, Math.min(pag, totalPaginas));
    if (onCambiarPagina) {
      onCambiarPagina(paginaValida);
    } else {
      setPaginaInterna(paginaValida);
    }
  };

  const handleCambiarLimite = (lim: number) => {
    if (onCambiarLimite) {
      onCambiarLimite(lim);
    } else {
      setLimiteInterno(lim);
      setPaginaInterna(1);
    }
  };

  React.useEffect(() => {
    if (paginaProp === undefined) {
      setPaginaInterna(1);
    }
  }, [anulaciones.length, paginaProp]);

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const inicioRango = totalRegistros > 0 ? (paginaActual - 1) * limitePorPagina + 1 : 0;
  const finRango = Math.min(paginaActual * limitePorPagina, totalRegistros);
  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const anulacionesPaginadas =
    paginaProp !== undefined && anulaciones.length <= limitePorPagina
      ? anulaciones
      : anulaciones.slice(indiceInicio, indiceInicio + limitePorPagina);

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
            {anulaciones.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No se encontraron registros de anulación en esta fecha.
                </td>
              </tr>
            ) : (
              anulacionesPaginadas.map((anul) => {
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Banner de Auditoría y Protección */}
      <div className="px-4 py-2.5 bg-aurea-champagne/15 border-t border-aurea-champagne/40 flex items-center justify-between text-xs text-aurea-navy/70 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0" />
          <span>
            <strong>Auditoría inmutable:</strong> Registros sincronizados con trazabilidad de mozo, tiempos de espera y control contable de mermas culinarias.
          </span>
        </div>
        <span className="font-semibold text-aurea-navy ml-auto">
          Monto auditado en fecha: S/{' '}
          {anulaciones.reduce((acc, a) => acc + a.monto_total, 0).toFixed(2)}
        </span>
      </div>

      {/* Controles de Paginación Compacta */}
      <div className="p-4 border-t border-aurea-champagne/30 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-aurea-navy/70">
        {/* Contador de rango y selector de tamaño */}
        <div className="flex items-center gap-3">
          <span>
            Mostrando <strong>{inicioRango}</strong> - <strong>{finRango}</strong> de <strong>{totalRegistros}</strong> anulaciones
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-aurea-navy/50">|</span>
            <span>Mostrar</span>
            <select
              value={limitePorPagina}
              onChange={(e) => handleCambiarLimite(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-aurea-champagne/60 text-xs text-aurea-navy bg-white focus:border-aurea-copper outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>por pág.</span>
          </div>
        </div>

        {/* Botones de navegación de página compacta */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCambiarPagina(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="p-1.5 rounded-lg border border-aurea-champagne/60 text-aurea-navy hover:bg-aurea-champagne/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-aurea-champagne/20 border border-aurea-champagne/40 text-xs font-medium text-aurea-navy whitespace-nowrap">
            <span>Página</span>
            {totalPaginas > 1 ? (
              <select
                value={paginaActual}
                onChange={(e) => handleCambiarPagina(Number(e.target.value))}
                className="bg-transparent font-bold text-aurea-navy border-b border-aurea-copper/60 focus:outline-none cursor-pointer px-0.5"
                title="Seleccionar página"
              >
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            ) : (
              <strong className="font-bold">{paginaActual}</strong>
            )}
            <span>de</span>
            <strong className="font-bold">{totalPaginas}</strong>
          </div>

          <button
            type="button"
            onClick={() => handleCambiarPagina(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className="p-1.5 rounded-lg border border-aurea-champagne/60 text-aurea-navy hover:bg-aurea-champagne/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnulacionesTabla;
