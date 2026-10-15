import React from 'react';
import {
  X,
  Receipt,
  Edit2,
  PauseCircle,
  PlayCircle,
  Lock,
} from 'lucide-react';
import { PromocionRendimientoDTO } from '@/types/admin';

interface ModalRendimientoPromocionProps {
  isOpen: boolean;
  onClose: () => void;
  rendimiento: PromocionRendimientoDTO | null;
  onEditar: () => void;
  onToggleEstado: (id: string, nuevoEstado: boolean) => void;
}

export const ModalRendimientoPromocion: React.FC<ModalRendimientoPromocionProps> = ({
  isOpen,
  onClose,
  rendimiento,
  onEditar,
  onToggleEstado,
}) => {
  const [paginaComprobantes, setPaginaComprobantes] = React.useState(1);
  const itemsPorPaginaComprobantes = 5;

  React.useEffect(() => {
    setPaginaComprobantes(1);
  }, [rendimiento?.promocion.id]);

  if (!isOpen || !rendimiento) return null;

  const { promocion: promo, ventas_totales, descuentos_totales, ticket_promedio, usos_totales, comprobantes } = rendimiento;

  const totalPaginasComprobantes = Math.ceil(comprobantes.length / itemsPorPaginaComprobantes);
  const indiceInicioComprobantes = (paginaComprobantes - 1) * itemsPorPaginaComprobantes;
  const comprobantesPaginados = comprobantes.slice(
    indiceInicioComprobantes,
    indiceInicioComprobantes + itemsPorPaginaComprobantes
  );

  const formatearFecha = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatearHora = (iso: string) => {
    return new Date(iso).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto transition-all transform max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-500/20 text-amber-400 font-mono text-xs px-2 py-0.5 rounded-md font-bold tracking-wider border border-amber-500/30">
                {promo.codigo}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {promo.nombre}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
              Rendimiento comercial y auditoría de comprobantes emitidos en caja (<code className="text-slate-300">CU-CAJA-03</code>)
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Reglas de la Campana */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700 block">
                Reglas Activas de la Campaña:
              </span>
              <p className="text-slate-500 text-[11px]">
                {promo.tipo_descuento === 'porcentaje' ? `${promo.valor}% sobre subtotal` : `- S/ ${promo.valor.toFixed(2)} monto fijo`}
                {promo.tope_maximo_descuento ? ` • Tope por mesa: S/ ${promo.tope_maximo_descuento.toFixed(2)}` : ' • Sin tope por mesa'}
                {promo.monto_minimo_consumo > 0 ? ` • Mínimo: S/ ${promo.monto_minimo_consumo.toFixed(2)}` : ' • Sin mínimo'}
                {promo.limite_usos ? (
                  promo.tipo_limite_usos === 'diario'
                    ? ` • Cupo diario: ${promo.usos_hoy || 0}/${promo.limite_usos} hoy`
                    : ` • Cupo global: ${promo.usos_actuales}/${promo.limite_usos} total`
                ) : ' • Cupo ilimitado'}
                {` • Vigencia: ${promo.fecha_inicio} al ${promo.fecha_fin}`}
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  promo.estado_visual === 'agotada_hoy'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : promo.estado_visual === 'agotada'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : promo.activa
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    promo.estado_visual === 'agotada_hoy'
                      ? 'bg-amber-600'
                      : promo.estado_visual === 'agotada'
                      ? 'bg-purple-600'
                      : promo.activa
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
                {promo.estado_visual === 'agotada_hoy'
                  ? 'AGOTADA HOY (Renueva mañana)'
                  : promo.estado_visual === 'agotada'
                  ? 'AGOTADA DEFINITIVAMENTE'
                  : promo.activa
                  ? 'DISPONIBLE EN CAJA'
                  : 'PAUSADA EN CAJA'}
              </span>
            </div>
          </div>

          {/* 4 Métricas de Retorno Financiero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Ventas con Promo
              </span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">
                S/ {ventas_totales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">Consumo bruto impulsado</span>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Descuentos Dados
              </span>
              <span className="text-lg font-extrabold text-amber-800 block mt-1">
                - S/ {descuentos_totales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Impacto comercial asumido</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Ticket Promedio
              </span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">
                S/ {ticket_promedio.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Por mesa beneficiada</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {promo.tipo_limite_usos === 'diario' ? 'Usos Hoy / Total' : 'Usos Totales'}
              </span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">
                {promo.tipo_limite_usos === 'diario' ? `${promo.usos_hoy || 0} / ${usos_totales}` : usos_totales}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {promo.tipo_limite_usos === 'diario' ? 'Canjes jornada / histórico' : 'Comandas liquidadas'}
              </span>
            </div>
          </div>

          {/* Tabla de Últimos Comprobantes Cobrados en Caja */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-400" />
              Últimos Comprobantes Fiscales Emitidos con esta Promoción (Caja)
            </h4>

            {comprobantes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                Aún no se registran comprobantes cobrados con esta campaña en caja.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">Comprobante</th>
                      <th className="py-2.5 px-3">Fecha / Hora</th>
                      <th className="py-2.5 px-3">Mesa</th>
                      <th className="py-2.5 px-3">Cajero</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-right">Descuento</th>
                      <th className="py-2.5 px-3 text-right">Total Cobrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comprobantesPaginados.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {c.numero_comprobante}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {formatearFecha(c.fecha_hora)} {formatearHora(c.fecha_hora)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {c.mesa_numero}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {c.cajero_nombre}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                          S/ {c.subtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700 font-bold font-mono">
                          - S/ {c.descuento.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 font-extrabold font-mono">
                          S/ {c.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación condicional: Solo si hay >= 2 páginas */}
                {totalPaginasComprobantes >= 2 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                    <span>
                      Mostrando <strong>{indiceInicioComprobantes + 1}</strong> -{' '}
                      <strong>{Math.min(indiceInicioComprobantes + itemsPorPaginaComprobantes, comprobantes.length)}</strong> de{' '}
                      <strong>{comprobantes.length}</strong> comprobantes
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaginaComprobantes((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaComprobantes === 1}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        &lt; Anterior
                      </button>
                      <span className="text-xs font-semibold text-slate-700 px-1.5">
                        Página {paginaComprobantes} de {totalPaginasComprobantes}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaginaComprobantes((prev) => Math.min(prev + 1, totalPaginasComprobantes))}
                        disabled={paginaComprobantes === totalPaginasComprobantes}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente &gt;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Banner de Salvaguarda Contable Legal */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-start gap-3 border border-slate-800">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-amber-400 block text-xs">
                Salvaguarda Contable: Restricción de Borrado Físico (ON DELETE RESTRICT)
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Esta campaña cuenta con <strong>{usos_totales} comprobantes emitidos</strong> ante la SUNAT. Por normativa de integridad fiscal y arqueo de caja (CU-CAJA-05), no puede ser eliminada físicamente de la base de datos. Utiliza la opción <strong>Pausar</strong> para retirar su disponibilidad en el salón y la caja.
              </p>
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {(() => {
              const today = '2026-10-09';
              const estaVencida = today > promo.fecha_fin;
              const estaAgotadaGlobal =
                promo.tipo_limite_usos === 'global' &&
                promo.limite_usos != null &&
                promo.usos_actuales >= promo.limite_usos;
              const noPuedeReactivar = !promo.activa && (estaVencida || estaAgotadaGlobal);

              const btnTitle = promo.activa
                ? 'Pausar disponibilidad en caja'
                : estaVencida
                ? `No es posible reactivar: la vigencia culminó el ${promo.fecha_fin}. Modifica la fecha de fin para reactivar.`
                : estaAgotadaGlobal
                ? `No es posible reactivar: cupo global agotado (${promo.limite_usos}/${promo.limite_usos}). Amplía el cupo para reactivar.`
                : 'Reactivar disponibilidad en caja';

              return (
                <button
                  type="button"
                  disabled={noPuedeReactivar}
                  onClick={() => {
                    if (!noPuedeReactivar) {
                      onToggleEstado(promo.id, !promo.activa);
                    }
                  }}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    noPuedeReactivar
                      ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                      : promo.activa
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={btnTitle}
                >
                  {promo.activa ? (
                    <>
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                      Pausar en Caja
                    </>
                  ) : (
                    <>
                      {noPuedeReactivar ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                      ) : (
                        <PlayCircle className="w-4 h-4 text-emerald-600" />
                      )}
                      {estaVencida ? 'Vigencia Expirada' : estaAgotadaGlobal ? 'Cupo Agotado' : 'Reactivar en Caja'}
                    </>
                  )}
                </button>
              );
            })()}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditar();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Parámetros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
