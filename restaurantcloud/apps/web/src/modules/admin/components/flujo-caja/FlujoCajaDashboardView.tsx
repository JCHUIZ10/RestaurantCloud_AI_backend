import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Download,
  Plus,
  Receipt,
  Sparkles,
  CalendarOff,
} from "lucide-react";
import { FlujoCajaResumenDTO, PeriodoFlujoCaja } from "@/types/admin";

interface FlujoCajaDashboardViewProps {
  resumen: FlujoCajaResumenDTO;
  periodoSeleccionado: PeriodoFlujoCaja;
  onCambiarPeriodo: (periodo: PeriodoFlujoCaja) => void;
  onAbrirModalGasto: () => void;
}

export const FlujoCajaDashboardView: React.FC<FlujoCajaDashboardViewProps> = ({
  resumen,
  periodoSeleccionado,
  onCambiarPeriodo,
  onAbrirModalGasto,
}) => {
  const [descargando, setDescargando] = useState<boolean>(false);
  const [descargaExitosa, setDescargaExitosa] = useState<boolean>(false);

  const formatFechaCorta = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleExportar = () => {
    setDescargando(true);
    setTimeout(() => {
      setDescargando(false);
      setDescargaExitosa(true);
      setTimeout(() => setDescargaExitosa(false), 3000);
    }, 900);
  };

  const isSuperavit = resumen.balance_neto >= 0;
  const esPeriodoCompletamenteVacio =
    resumen.ingresos_totales === 0 &&
    resumen.egresos_totales === 0 &&
    resumen.curva_diaria.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Período y Acciones Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
        {/* Selector de Período */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto relative">
            <button
              type="button"
              onClick={() => onCambiarPeriodo("hoy")}
              className={`px-4 py-2 rounded-xl transition-all ${
                periodoSeleccionado === "hoy"
                  ? "bg-aurea-navy text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => onCambiarPeriodo("semana")}
              className={`px-4 py-2 rounded-xl transition-all ${
                periodoSeleccionado === "semana"
                  ? "bg-aurea-navy text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => onCambiarPeriodo("este_mes")}
              className={`px-4 py-2 rounded-xl transition-all ${
                periodoSeleccionado === "este_mes"
                  ? "bg-aurea-navy text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Este Mes (Octubre)
            </button>
          </div>

        {/* Acciones de Flujo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportar}
            disabled={descargando}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            {descargando ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{descargaExitosa ? "✓ Exportado" : "Exportar Flujo"}</span>
          </button>

          <button
            type="button"
            onClick={onAbrirModalGasto}
            className="px-4 py-2 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs transition-all shadow-md shadow-aurea-copper/20 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto de Sede</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Estratégicos Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Salón */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              INGRESOS SALÓN (COBRADOS)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-3 h-3" />
              <span>+{resumen.delta_ingresos_pct}%</span>
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              S/{" "}
              {resumen.ingresos_totales.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[11px] font-bold text-aurea-copper bg-aurea-copper/10 px-1.5 py-0.5 rounded">
              100% Salón
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            POS:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.ingresos_desglose.tarjeta_pos_monto.toFixed(0)} (
              {resumen.ingresos_desglose.tarjeta_pos_porcentaje}%)
            </strong>{" "}
            • Eft:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.ingresos_desglose.efectivo_monto.toFixed(0)} (
              {resumen.ingresos_desglose.efectivo_porcentaje}%)
            </strong>{" "}
            • Yape:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.ingresos_desglose.billeteras_monto.toFixed(0)} (
              {resumen.ingresos_desglose.billeteras_porcentaje}%)
            </strong>
          </p>
        </div>

        {/* KPI 2: Egresos Totales Operativos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              EGRESOS TOTALES OPERAT.
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              <TrendingDown className="w-3 h-3" />
              <span>{resumen.delta_egresos_pct}%</span>
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              S/{" "}
              {resumen.egresos_totales.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Insumos cocina:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.compras_insumos_total.toFixed(0)} (67%)
            </strong>{" "}
            • Gastos sede:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.gastos_manuales_total.toFixed(0)} (33%)
            </strong>
          </p>
        </div>

        {/* KPI 3: Balance Neto Operativo */}
        <div
          className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden group ${
            isSuperavit
              ? "bg-emerald-950/10 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80"
              : "bg-rose-950/10 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
              BALANCE NETO OPERATIVO
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                isSuperavit
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200"
              }`}
            >
              {isSuperavit ? "▲ Rentable" : "⚠️ Déficit"}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span
              className={`text-2xl font-bold font-mono ${
                isSuperavit
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {isSuperavit
                ? `+ S/ ${resumen.balance_neto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
                : `- S/ ${Math.abs(resumen.balance_neto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Margen de liquidez libre:{" "}
            <strong
              className={
                isSuperavit
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              }
            >
              {resumen.margen_neto_porcentaje}%
            </strong>{" "}
            • Ratio cobertura:{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              S/ {resumen.ratio_cobertura}
            </strong>{" "}
            x S/ 1
          </p>
        </div>

        {/* KPI 4: Conciliación de Liquidez */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              CONCILIACIÓN LIQUIDEZ
            </span>
            <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              S/{" "}
              {resumen.conciliacion_liquidez.total_disponible.toLocaleString(
                "es-PE",
                { minimumFractionDigits: 2 },
              )}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            En Bancos/Pasarelas:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.conciliacion_liquidez.en_bancos_monto.toFixed(0)} (
              {resumen.conciliacion_liquidez.en_bancos_porcentaje}%)
            </strong>{" "}
            • Gavetas:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              S/ {resumen.conciliacion_liquidez.en_gavetas_monto.toFixed(0)} (
              {resumen.conciliacion_liquidez.en_gavetas_porcentaje}%)
            </strong>
          </p>
        </div>
      </div>

      {/* Grid Principal: Gráfica de Evolución Diaria vs Composición Fáctica de Egresos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Evolución Diaria de Entradas vs Salidas (7 Columnas) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
                {periodoSeleccionado === "hoy"
                  ? "Movimientos Operativos de Hoy (15 Octubre 2026)"
                  : periodoSeleccionado === "personalizado"
                    ? `Evolución de Entradas vs Salidas (${formatFechaCorta(resumen.fecha_inicio)} — ${formatFechaCorta(resumen.fecha_fin)})`
                    : "Evolución Diaria de Entradas vs Salidas (Octubre 2026)"}
              </h2>
              <p className="text-xs text-slate-500">
                Flujo monetario periódico con barras pareadas de solvencia
                operacional.
              </p>
            </div>

            {!esPeriodoCompletamenteVacio && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-aurea-navy dark:bg-slate-700 inline-block" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Entradas
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-aurea-copper inline-block" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Salidas
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de Barras o Empty State para Días Vacíos */}
          {esPeriodoCompletamenteVacio ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <CalendarOff className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Sin movimientos de caja en este período
              </h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                No se registraron ventas de salón ni egresos operativos para el
                rango seleccionado ({formatFechaCorta(resumen.fecha_inicio)} al{" "}
                {formatFechaCorta(resumen.fecha_fin)}). La sede no tuvo turnos
                de caja ni compras en estas fechas.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onCambiarPeriodo("este_mes")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  Ver Este Mes (Octubre)
                </button>
                <button
                  type="button"
                  onClick={onAbrirModalGasto}
                  className="px-3.5 py-1.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Gasto de Sede</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {resumen.curva_diaria.map((punto, idx) => {
                  const maxVal = Math.max(
                    1,
                    ...resumen.curva_diaria.map((p) =>
                      Math.max(p.ingresos_dia, p.egresos_dia),
                    ),
                  );
                  const esDiaVacio =
                    punto.ingresos_dia === 0 && punto.egresos_dia === 0;
                  const alturaIng = Math.min(
                    100,
                    Math.round((punto.ingresos_dia / maxVal) * 100),
                  );
                  const alturaEgr = Math.min(
                    100,
                    Math.round((punto.egresos_dia / maxVal) * 100),
                  );

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all ${
                        esDiaVacio
                          ? "bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-500 truncate w-full text-center">
                        {punto.etiqueta_dia.split(" ")[0]}
                      </span>

                      {/* Contenedor de Barras */}
                      <div className="h-32 w-full flex items-end justify-center gap-1.5 pt-2">
                        {esDiaVacio ? (
                          <div
                            className="h-full w-full flex flex-col items-center justify-center text-[10px] text-slate-400 font-mono text-center px-1"
                            title="Día sin operaciones (S/ 0.00)"
                          >
                            <span className="w-6 border-b border-dashed border-slate-300 dark:border-slate-700 block mb-1" />
                            <span>Sin mov.</span>
                          </div>
                        ) : (
                          <>
                            {/* Barra Entrada */}
                            <div
                              style={{ height: `${alturaIng}%` }}
                              className="w-3.5 bg-aurea-navy dark:bg-slate-300 rounded-t-md transition-all group relative"
                              title={`Ingresos: S/ ${punto.ingresos_dia.toFixed(2)}`}
                            />
                            {/* Barra Salida */}
                            <div
                              style={{ height: `${alturaEgr}%` }}
                              className="w-3.5 bg-aurea-copper rounded-t-md transition-all group relative"
                              title={`Egresos: S/ ${punto.egresos_dia.toFixed(2)}`}
                            />
                          </>
                        )}
                      </div>

                      <div className="text-center w-full">
                        {esDiaVacio ? (
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            S/ 0.00
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-emerald-600 block">
                            +S/ {punto.saldo_neto_dia.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Callout de Ratio de Cobertura */}
              {resumen.ratio_cobertura > 0 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="font-semibold">
                      Ratio de Cobertura Financiera:
                    </strong>{" "}
                    Por cada S/ 1.00 de egreso operativo, la sede generó{" "}
                    <strong className="font-bold">
                      S/ {resumen.ratio_cobertura}
                    </strong>{" "}
                    en ventas de salón. Cero déficit diario en el ciclo actual.
                    {resumen.curva_diaria.length > 0 && (
                      <span className="block mt-0.5 text-slate-500 dark:text-slate-400">
                        Promedio estimado de ingresos: S/{" "}
                        {(
                          resumen.ingresos_totales / resumen.curva_diaria.length
                        ).toFixed(2)}
                        /tramo • Egresos: S/{" "}
                        {(
                          resumen.egresos_totales / resumen.curva_diaria.length
                        ).toFixed(2)}
                        /tramo.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Sin índice de cobertura aplicable (cero egresos registrados
                    en el período).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Composición Fáctica de Egresos (5 Columnas) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
              Composición Fáctica de Egresos (S/{" "}
              {resumen.egresos_totales.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
              })}
              )
            </h2>
            <p className="text-xs text-slate-500">
              Insumos culinarios directos vs Gastos manuales de sede.
            </p>
          </div>

          {/* Bloque 1: Insumos Culinarios Comprados (ficha_compra) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
                  <Receipt className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Insumos Culinarios (ficha_compra)
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                S/{" "}
                {resumen.compras_insumos_total.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="space-y-1.5 pl-6">
              {resumen.top_insumos_comprados.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  Sin compras de insumos culinarios en este período.
                </p>
              ) : (
                resumen.top_insumos_comprados.map((item) => (
                  <div
                    key={item.insumo_id}
                    className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
                  >
                    <span className="truncate pr-2">
                      • {item.nombre_insumo}
                    </span>
                    <span className="font-mono shrink-0">
                      S/ {item.monto_total.toFixed(2)} (
                      {item.porcentaje_de_compras}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Bloque 2: Gastos Operativos de Sede (gasto_manual) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Gastos Operativos de Sede (gasto_manual)
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                S/{" "}
                {resumen.gastos_manuales_total.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="space-y-1.5 pl-6">
              {resumen.gastos_por_categoria.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  Sin gastos operativos manuales en este período.
                </p>
              ) : (
                resumen.gastos_por_categoria.map((gasto, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
                  >
                    <span className="truncate pr-2">
                      • {gasto.nombre_categoria}
                    </span>
                    <span className="font-mono shrink-0">
                      S/ {gasto.monto_total.toFixed(2)} (
                      {gasto.porcentaje_de_gastos}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
