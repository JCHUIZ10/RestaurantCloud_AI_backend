import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { GastoOperativoDTO, CategoriaGastoManual } from '@/types/admin';

interface GastosOperativosTableViewProps {
  gastos: GastoOperativoDTO[];
  onAbrirModalGasto: () => void;
}

const CATEGORIA_LABELS: Record<CategoriaGastoManual, { label: string; color: string }> = {
  servicios_basicos: { label: 'Servicios Básicos (Luz/Gas/Agua)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-800' },
  alquiler: { label: 'Alquiler de Local', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800' },
  limpieza_aseo: { label: 'Limpieza, Aseo y Menaje', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 border-teal-300 dark:border-teal-800' },
  mantenimiento: { label: 'Mantenimiento & Equipamiento', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200 border-sky-300 dark:border-sky-800' },
  caja_chica: { label: 'Caja Chica / Emergencias', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 dark:border-rose-800' },
  otros: { label: 'Otros Egresos Operativos', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
};

export const GastosOperativosTableView: React.FC<GastosOperativosTableViewProps> = ({
  gastos,
  onAbrirModalGasto,
}) => {
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const itemsPorPagina = 5;

  useEffect(() => {
    setPaginaActual(1);
  }, [gastos.length]);

  const totalPaginas = Math.ceil(gastos.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const gastosPaginados = gastos.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const totalMonto = gastos.reduce((acc, g) => acc + g.monto, 0);
  const totalBancos = gastos
    .filter((g) => g.origen_fondos === 'transferencia_bancaria')
    .reduce((acc, g) => acc + g.monto, 0);
  const totalCajaChica = gastos
    .filter((g) => g.origen_fondos === 'efectivo_caja')
    .reduce((acc, g) => acc + g.monto, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 3 Métricas Rápidas de Gastos Manuales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">TOTAL GASTOS DE SEDE</span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            S/ {totalMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block">{gastos.length} comprobantes registrados</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">VÍA TRANSFERENCIA / BANCO</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
            S/ {totalBancos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block">Alquiler y suministros mayores</span>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
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
                const catCfg = CATEGORIA_LABELS[gasto.categoria] || CATEGORIA_LABELS.otros;

                return (
                  <tr key={gasto.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Fecha */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {gasto.fecha}
                    </td>

                    {/* Categoría */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catCfg.color}`}>
                        {catCfg.label}
                      </span>
                    </td>

                    {/* Proveedor */}
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {gasto.proveedor_nombre}
                    </td>

                    {/* Comprobante */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div>{gasto.tipo_comprobante}</div>
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
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={gasto.descripcion}>
                      {gasto.descripcion}
                    </td>

                    {/* Monto */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      S/ {gasto.monto.toFixed(2)}
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
    </div>
  );
};
