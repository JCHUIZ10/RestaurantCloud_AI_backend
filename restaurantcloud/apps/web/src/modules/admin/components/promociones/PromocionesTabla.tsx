import React from 'react';
import {
  Tag,
  Clock,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PromocionAdminDTO } from '@/types/admin';

interface PromocionesTablaProps {
  promociones: PromocionAdminDTO[];
  cargando: boolean;
  onVerRendimiento: (id: string) => void;
  onEditar: (promo: PromocionAdminDTO) => void;
  onEliminar: (id: string) => void;
  onToggleEstado: (id: string, nuevoEstado: boolean) => void;
  paginaActual?: number;
  totalPaginas?: number;
  totalRegistros?: number;
  limitePorPagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  onCambiarLimite?: (limite: number) => void;
}

export const PromocionesTabla: React.FC<PromocionesTablaProps> = ({
  promociones,
  cargando,
  onVerRendimiento,
  onEditar,
  onEliminar,
  onToggleEstado,
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
  const totalRegistros = totalRegistrosProp ?? promociones.length;
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
  }, [promociones.length, paginaProp]);

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'vigente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            VIGENTE
          </span>
        );
      case 'programada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="w-3 h-3 text-blue-500" />
            PROGRAMADA
          </span>
        );
      case 'pausada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            PAUSADA
          </span>
        );
      case 'agotada_hoy':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300"
            title="Cupo diario completado para la jornada de hoy. Se renovará automáticamente en la siguiente jornada a 0 canjes."
          >
            <Clock className="w-3 h-3 text-amber-600" />
            AGOTADA HOY
          </span>
        );
      case 'agotada':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200"
            title="Cupo total de campaña completado."
          >
            AGOTADA
          </span>
        );
      case 'vencida':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            VENCIDA
          </span>
        );
    }
  };

  const nombresDias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const inicioRango = totalRegistros > 0 ? (paginaActual - 1) * limitePorPagina + 1 : 0;
  const finRango = Math.min(paginaActual * limitePorPagina, totalRegistros);
  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const promocionesPaginadas =
    paginaProp !== undefined && promociones.length <= limitePorPagina
      ? promociones
      : promociones.slice(indiceInicio, indiceInicio + limitePorPagina);

    return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Promoción & Código</th>
              <th className="py-3.5 px-4">Tipo / Valor</th>
              <th className="py-3.5 px-4">Vigencia & Días</th>
              <th className="py-3.5 px-4">Condiciones / Topes</th>
              <th className="py-3.5 px-4">Usos & Descuento</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 text-center">En Caja</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {promociones.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No se encontraron promociones registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              promocionesPaginadas.map((promo) => {
                const tieneHistorico = promo.usos_actuales > 0;

                return (
                  <tr
                    key={promo.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Columna 1: Promoción & Código */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm" title={promo.nombre}>
                            {promo.nombre}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                              {promo.codigo}
                            </span>
                            {promo.descripcion && (
                              <span className="text-[11px] text-slate-500 truncate block max-w-xs" title={promo.descripcion}>
                                {promo.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columna 2: Tipo / Valor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {promo.tipo_descuento === 'porcentaje' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                            {promo.valor}% OFF
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Porcentual</span>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                            - S/ {promo.valor.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Monto Fijo</span>
                        </div>
                      )}
                    </td>

                    {/* Columna 3: Vigencia & Días */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-700 font-mono">
                        {promo.fecha_inicio.slice(5).replace('-', '/')} - {promo.fecha_fin.slice(5).replace('-', '/')}
                      </div>
                      {/* Chips de días de la semana */}
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((d, idx) => {
                          const activo = promo.dias_semana.includes(d);
                          return (
                            <span
                              key={d}
                              className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                                activo
                                  ? 'bg-amber-600 text-white font-extrabold'
                                  : 'bg-slate-100 text-slate-300'
                              }`}
                              title={`Día ${d}`}
                            >
                              {nombresDias[idx]}
                            </span>
                          );
                        })}
                      </div>
                      {promo.hora_inicio && promo.hora_fin && (
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {promo.hora_inicio} - {promo.hora_fin}
                        </span>
                      )}
                    </td>

                    {/* Columna 4: Condiciones & Topes */}
                    <td className="py-3.5 px-4 text-xs space-y-1">
                      {promo.monto_minimo_consumo > 0 ? (
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px] block w-fit">
                          Mínimo: <strong>S/ {promo.monto_minimo_consumo.toFixed(2)}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] block">Sin consumo mínimo</span>
                      )}

                      {promo.tope_maximo_descuento ? (
                        <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px] block w-fit border border-amber-200/60">
                          Tope Máx: S/ {promo.tope_maximo_descuento.toFixed(2)}
                        </span>
                      ) : null}

                      {promo.limite_usos ? (
                        promo.tipo_limite_usos === 'diario' ? (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200/70 font-semibold px-2 py-0.5 rounded text-[11px] block w-fit">
                            🔄 Diario: <strong>{promo.usos_hoy || 0} / {promo.limite_usos}</strong> hoy
                          </span>
                        ) : (
                          <span className="bg-purple-50 text-purple-900 border border-purple-200/70 font-semibold px-2 py-0.5 rounded text-[11px] block w-fit">
                            🌐 Global: <strong>{promo.usos_actuales} / {promo.limite_usos}</strong> total
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[10px] block">Cuponera ilimitada</span>
                      )}
                    </td>

                    {/* Columna 5: Usos & Descuento */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                        {promo.usos_actuales} {promo.usos_actuales === 1 ? 'cuenta' : 'cuentas'}
                      </span>
                      <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                        - S/ {promo.total_descontado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Ventas: S/ {promo.total_ventas_asociadas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Columna 6: Estado Visual */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getBadgeEstado(promo.estado_visual)}
                    </td>

                    {/* Columna 7: Switch En Caja (Pausar / Reactivar en caliente con salvaguarda de vigencia y cupo) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {(() => {
                        const today = new Date().toISOString().slice(0, 10);
                        const estaVencida = today > promo.fecha_fin;
                        const estaAgotadaGlobal =
                          promo.tipo_limite_usos === 'global' &&
                          promo.limite_usos != null &&
                          promo.usos_actuales >= promo.limite_usos;
                        const noPuedeReactivar = !promo.activa && (estaVencida || estaAgotadaGlobal);

                        const switchTitle = promo.activa
                          ? 'Pausar disponibilidad en caja'
                          : estaVencida
                          ? `No se puede reactivar: La vigencia expiró el ${promo.fecha_fin}. Modifica la fecha de fin primero.`
                          : estaAgotadaGlobal
                          ? `No se puede reactivar: Cupo global agotado (${promo.limite_usos}/${promo.limite_usos}). Amplía el cupo primero.`
                          : 'Reactivar disponibilidad en caja';

                        return (
                          <div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={promo.activa}
                              disabled={noPuedeReactivar}
                              onClick={() => {
                                if (!noPuedeReactivar) {
                                  onToggleEstado(promo.id, !promo.activa);
                                }
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                                noPuedeReactivar
                                  ? 'opacity-40 cursor-not-allowed bg-slate-300'
                                  : promo.activa
                                  ? 'cursor-pointer bg-emerald-600'
                                  : 'cursor-pointer bg-slate-300'
                              }`}
                              title={switchTitle}
                            >
                              <span className="sr-only">Habilitar en caja</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  promo.activa ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            {promo.activa ? (
                              <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
                                Disponible
                              </span>
                            ) : estaVencida ? (
                              <span
                                className="text-[10px] text-rose-600 block mt-0.5 font-semibold flex items-center justify-center gap-0.5"
                                title={`Vigencia vencida el ${promo.fecha_fin}`}
                              >
                                <Lock className="w-2.5 h-2.5" /> Expirada
                              </span>
                            ) : estaAgotadaGlobal ? (
                              <span
                                className="text-[10px] text-purple-600 block mt-0.5 font-semibold flex items-center justify-center gap-0.5"
                                title="Cupo global completado"
                              >
                                <Lock className="w-2.5 h-2.5" /> Agotada
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                                Pausada
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Columna 8: Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón Ver Rendimiento */}
                        <button
                          type="button"
                          onClick={() => onVerRendimiento(promo.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Ver Rendimiento Comercial y Auditoría de Caja"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={() => onEditar(promo)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Editar parámetros de la promoción"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Botón Eliminar con Salvaguarda Contable */}
                        {tieneHistorico ? (
                          <span
                            className="p-1.5 text-slate-300 cursor-not-allowed inline-flex items-center"
                            title="Protegido por historial contable SUNAT (ON DELETE RESTRICT). Usa la opción Pausar."
                          >
                            <Lock className="w-4 h-4 text-slate-300" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEliminar(promo.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar campaña sin historial"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Banner de Auditoría y Protección Contable */}
      <div className="px-4 py-2.5 bg-aurea-champagne/15 border-t border-aurea-champagne/40 flex items-center gap-2 text-xs text-aurea-navy/70">
        <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0" />
        <span>
          <strong>Protección activa:</strong> Las promociones con histórico de canje en comprobantes electrónicos SUNAT quedan bloqueadas contra borrado físico para salvaguardar la auditoría contable.
        </span>
      </div>

      {/* Controles de Paginación Interactiva */}
      <div className="p-4 border-t border-aurea-champagne/30 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-aurea-navy/70">
        {/* Contador de rango y selector de tamaño */}
        <div className="flex items-center gap-3">
          <span>
            Mostrando <strong>{inicioRango}</strong> - <strong>{finRango}</strong> de <strong>{totalRegistros}</strong> promociones
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

        {/* Botones de navegación de página */}
        <div className="flex items-center gap-1">
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
export default PromocionesTabla;
