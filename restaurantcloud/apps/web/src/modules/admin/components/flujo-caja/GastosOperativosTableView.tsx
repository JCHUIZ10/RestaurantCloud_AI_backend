import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Ban,
} from 'lucide-react';
import { GastoOperativoDTO } from '@/types/admin';
import { configCategoriaGasto, etiquetaTipoComprobanteGasto } from '@/shared/constants/categoriasGasto';
import { Button, Modal } from '@/components/ui';

interface GastosOperativosTableViewProps {
  gastos: GastoOperativoDTO[];
  onAbrirModalGasto: () => void;
  /** Anula el gasto con su motivo; devuelve true si se anuló (el diálogo se cierra) */
  onAnularGasto: (gasto: GastoOperativoDTO, motivo: string) => Promise<boolean>;
}

const MIN_CARACTERES_MOTIVO = 10;

export const GastosOperativosTableView: React.FC<GastosOperativosTableViewProps> = ({
  gastos,
  onAbrirModalGasto,
  onAnularGasto,
}) => {
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const itemsPorPagina = 5;

  // Anulación: el gasto elegido y el motivo que se escribe
  const [gastoPorAnular, setGastoPorAnular] = useState<GastoOperativoDTO | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('');
  const [anulando, setAnulando] = useState<boolean>(false);

  useEffect(() => {
    setPaginaActual(1);
  }, [gastos.length]);

  const totalPaginas = Math.ceil(gastos.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const gastosPaginados = gastos.slice(indiceInicio, indiceInicio + itemsPorPagina);

  // Un gasto anulado se sigue viendo en la lista, pero ya no suma
  const gastosVigentes = gastos.filter((g) => g.estado !== 'anulado');
  const cantidadAnulados = gastos.length - gastosVigentes.length;
  const totalMonto = gastosVigentes.reduce((acc, g) => acc + g.monto, 0);
  const totalBancos = gastosVigentes
    .filter((g) => g.origen_fondos === 'transferencia_bancaria')
    .reduce((acc, g) => acc + g.monto, 0);
  const totalCajaChica = gastosVigentes
    .filter((g) => g.origen_fondos === 'efectivo_caja')
    .reduce((acc, g) => acc + g.monto, 0);

  const motivoTexto = motivoAnulacion.trim();
  const motivoValido = motivoTexto.length >= MIN_CARACTERES_MOTIVO;

  const abrirAnulacion = (gasto: GastoOperativoDTO) => {
    setMotivoAnulacion('');
    setGastoPorAnular(gasto);
  };

  const cerrarAnulacion = () => {
    if (!anulando) setGastoPorAnular(null);
  };

  const confirmarAnulacion = async () => {
    if (!gastoPorAnular || !motivoValido || anulando) return;
    setAnulando(true);
    try {
      const anulado = await onAnularGasto(gastoPorAnular, motivoTexto);
      if (anulado) setGastoPorAnular(null);
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 3 Métricas Rápidas de Gastos Manuales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">TOTAL GASTOS DE SEDE</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            S/ {totalMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {gastosVigentes.length} comprobantes registrados
            {cantidadAnulados > 0 ? ` · ${cantidadAnulados} anulado${cantidadAnulados === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">VÍA TRANSFERENCIA / BANCO</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
            S/ {totalBancos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block">Pagos desde la cuenta de la empresa</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/60">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-amber-400 block">
            VÍA CAJA CHICA / GAVETA ACTIVA
          </span>
          <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300">
            S/ {totalCajaChica.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-amber-600/80 block">Descontado del arqueo de turno</span>
        </div>
      </div>

      {/* Directorio de Gastos Operativos de Sede */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
              Historial de Gastos Operativos de Sede (gasto_manual)
            </h2>
            <p className="text-xs text-slate-500">
              Egresos corrientes de operación interna (excluye compras de insumos para cocina en ficha_compra).
            </p>
          </div>

          <button
            type="button"
            onClick={onAbrirModalGasto}
            className="px-4 py-2 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs transition-all shadow-md shadow-aurea-copper/20 flex items-center gap-2 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Gasto</span>
          </button>
        </div>

        {/* Tabla de Gastos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Categoría de Gasto</th>
                <th className="py-3 px-3">Proveedor / Beneficiario</th>
                <th className="py-3 px-3">Comprobante</th>
                <th className="py-3 px-3">Origen Fondos</th>
                <th className="py-3 px-3">Descripción / Justificación</th>
                <th className="py-3 px-3 text-right">Monto (PEN)</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        No se encontraron gastos operativos en este período
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mb-2">
                        No se han registrado salidas manuales de dinero o caja chica en las fechas seleccionadas.
                      </p>
                      <button
                        type="button"
                        onClick={onAbrirModalGasto}
                        className="px-4 py-2 rounded-xl bg-aurea-copper text-aurea-navy font-bold text-xs hover:bg-aurea-copper/90 transition-colors shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Registrar Nuevo Gasto</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                gastosPaginados.map((gasto) => {
                const catCfg = configCategoriaGasto(gasto.categoria);
                const anulado = gasto.estado === 'anulado';

                return (
                  <tr
                    key={gasto.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${anulado ? 'opacity-60' : ''}`}
                  >
                    {/* Fecha */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {gasto.fecha.split('-').reverse().join('/')}
                    </td>

                    {/* Categoría */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catCfg.clase}`}>
                        {catCfg.etiqueta}
                      </span>
                    </td>

                    {/* Proveedor */}
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {gasto.proveedor_nombre}
                    </td>

                    {/* Comprobante */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div>{etiquetaTipoComprobanteGasto(gasto.tipo_comprobante)}</div>
                      {gasto.numero_documento && (
                        <div className="text-[10px] text-slate-400">{gasto.numero_documento}</div>
                      )}
                    </td>

                    {/* Origen Fondos */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {gasto.origen_fondos === 'transferencia_bancaria' ? (
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>Banco / Transferencia</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-amber-500" />
                          <span>Caja Chica {gasto.caja_correlativo ? `(Turno #${String(gasto.caja_correlativo).padStart(3, '0')})` : ''}</span>
                        </span>
                      )}
                    </td>

                    {/* Descripción */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs" title={gasto.descripcion}>
                      <div className="truncate">{gasto.descripcion}</div>
                      {anulado && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 italic whitespace-normal">
                          Anulado{gasto.anulado_por_nombre ? ` por ${gasto.anulado_por_nombre}` : ''}
                          {gasto.motivo_anulacion ? `: ${gasto.motivo_anulacion}` : ''}
                        </div>
                      )}
                    </td>

                    {/* Monto */}
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${
                        anulado ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      S/ {gasto.monto.toFixed(2)}
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {anulado ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Anulado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => abrirAnulacion(gasto)}
                          disabled={gasto.puede_anularse === false}
                          title={
                            gasto.puede_anularse === false
                              ? 'Salió de la gaveta de un turno ya cerrado: su Reporte Z es inmutable y no se puede anular.'
                              : 'Anular este gasto'
                          }
                          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-50"
                        >
                          <Ban className="w-3 h-3" aria-hidden="true" />
                          <span>Anular</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Paginación Condicional: Solo se muestra si existen >= 2 páginas */}
        {totalPaginas >= 2 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{indiceInicio + 1}</strong> -{' '}
              <strong className="text-slate-800 dark:text-slate-200">{Math.min(indiceInicio + itemsPorPagina, gastos.length)}</strong> de{' '}
              <strong className="text-slate-800 dark:text-slate-200">{gastos.length}</strong> comprobantes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <span className="font-mono text-slate-700 dark:text-slate-300 px-2 font-bold">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Anulación de un gasto: siempre con motivo, que queda en la auditoría */}
      <Modal
        abierto={gastoPorAnular !== null}
        onCerrar={cerrarAnulacion}
        cerrable={!anulando}
        titulo="Anular gasto"
        icono={Ban}
        tono="error"
        tamano="md"
        descripcion={
          gastoPorAnular
            ? `${gastoPorAnular.proveedor_nombre} · S/ ${gastoPorAnular.monto.toFixed(2)}`
            : undefined
        }
        pie={
          <>
            <Button variant="outline" onClick={cerrarAnulacion} disabled={anulando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void confirmarAnulacion()} loading={anulando} disabled={!motivoValido}>
              Anular gasto
            </Button>
          </>
        }
      >
        {gastoPorAnular && (
          <div className="space-y-3 text-sm text-aurea-navy/80">
            <p>
              El gasto dejará de contar en el flujo de caja
              {gastoPorAnular.origen_fondos === 'efectivo_caja'
                ? ' y el efectivo se devolverá al esperado de la gaveta del turno abierto'
                : ''}
              . El registro se conserva para la auditoría.
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="motivo-anulacion-gasto" className="font-semibold text-aurea-navy">
                  Motivo de la anulación <span className="text-estado-error-600">*</span>
                </label>
                <span className={`text-xs ${motivoValido ? 'text-estado-ok-700 font-semibold' : 'text-estado-error-600'}`}>
                  {motivoValido
                    ? '✓ Válido'
                    : `Mínimo ${MIN_CARACTERES_MOTIVO} caracteres (faltan ${Math.max(0, MIN_CARACTERES_MOTIVO - motivoTexto.length)})`}
                </span>
              </div>
              <textarea
                id="motivo-anulacion-gasto"
                rows={3}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                maxLength={500}
                placeholder="Ej. El monto se digitó mal; el pago real fue de S/ 120."
                className="w-full px-3 py-2 rounded-xl border border-aurea-champagne bg-white text-aurea-navy focus:outline-none focus:border-aurea-copper resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
