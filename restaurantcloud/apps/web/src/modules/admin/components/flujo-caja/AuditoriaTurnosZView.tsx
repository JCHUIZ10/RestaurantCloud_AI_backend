import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AuditoriaTurnosKPIsDTO, TurnoCajaResumenDTO } from '@/types/admin';

interface AuditoriaTurnosZViewProps {
  kpis: AuditoriaTurnosKPIsDTO;
  turnos: TurnoCajaResumenDTO[];
  onAuditarTurnoZ: (turno: TurnoCajaResumenDTO) => void;
  onAbrirCierreForzado: (turno: TurnoCajaResumenDTO) => void;
}

export const AuditoriaTurnosZView: React.FC<AuditoriaTurnosZViewProps> = ({
  kpis,
  turnos,
  onAuditarTurnoZ,
  onAbrirCierreForzado,
}) => {
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const itemsPorPagina = 5;

  useEffect(() => {
    setPaginaActual(1);
  }, [turnos.length]);

  const totalPaginas = Math.ceil(turnos.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const turnosPaginados = turnos.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const turnoActivo = kpis.turno_activo || turnos.find((t) => t.estado === 'abierta');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Indicadores de Control Interno */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">TURNOS DEL MES</span>
          <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
            {kpis.total_turnos}
          </span>
          <span className="text-[10px] text-slate-500 block">Historial consolidado</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/60 text-center">
          <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
            CONFORMES / CUADRADOS
          </span>
          <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {kpis.turnos_cuadrados} ({kpis.porcentaje_cuadratura}%)
          </span>
          <span className="text-[10px] text-emerald-600/80 block">Cero diferencias</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/60 text-center">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 block">
            CON DISCREPANCIA
          </span>
          <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
            {kpis.turnos_con_discrepancia} ({kpis.monto_total_discrepancias < 0 ? `-S/ ${Math.abs(kpis.monto_total_discrepancias).toFixed(2)}` : `+S/ ${kpis.monto_total_discrepancias.toFixed(2)}`})
          </span>
          <span className="text-[10px] text-amber-600/80 block">Menores subsanadas</span>
        </div>

        <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/60 text-center">
          <span className="text-[10px] font-mono uppercase font-bold text-sky-600 dark:text-sky-400 block">
            AUDITADOS POR GERENCIA
          </span>
          <span className="text-xl font-bold font-mono text-sky-700 dark:text-sky-300">
            {kpis.turnos_auditados} de {kpis.total_turnos}
          </span>
          <span className="text-[10px] text-sky-600/80 block">
            {kpis.turnos_pendientes_auditoria > 0
              ? `${kpis.turnos_pendientes_auditoria} por visar`
              : '100% al día'}
          </span>
        </div>
      </div>

      {/* Banner de Monitoreo de Terminal y Rescate Administrativo */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-aurea-navy to-slate-900 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-bold border border-emerald-500/40">
                Terminal Única POS-01
              </span>
              <span className="text-xs text-slate-400">Restricción uq_caja_abierta_local</span>
            </div>
            <h3 className="text-sm font-bold font-serif text-white mt-1">
              {turnoActivo ? (
                <>Actualmente la sede opera con <strong className="text-aurea-champagne font-mono">Turno #{String(turnoActivo.correlativo).padStart(3, '0')} ABIERTO</strong> ({turnoActivo.cajero_nombre}).</>
              ) : (
                'Terminal libre: No hay turno activo en este momento.'
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Si un cajero se retira o se enferma sin cerrar turno formal, la administración puede realizar un cierre de rescate liberando la terminal.
            </p>
          </div>
        </div>

        {turnoActivo && (
          <button
            type="button"
            onClick={() => onAbrirCierreForzado(turnoActivo)}
            className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 shrink-0 border border-rose-500/40"
          >
            <AlertTriangle className="w-4 h-4 text-rose-200" />
            <span>Cierre Administrativo Forzado (Turno #{String(turnoActivo.correlativo).padStart(3, '0')})</span>
          </button>
        )}
      </div>

      {/* Directorio Histórico de Turnos y Supervisión de Arqueos Z */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
              Directorio Histórico de Turnos y Supervisión de Arqueos Z
            </h2>
            <p className="text-xs text-slate-500">
              Auditoría fiscal de cuadratura física de gaveta, conciliación de lotes POS y visado gerencial.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-500">
            Mostrando {turnos.length} turnos registrados
          </span>
        </div>

        {/* Tabla Responsive de Turnos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3 px-3"># Turno</th>
                <th className="py-3 px-3">Fecha & Horario</th>
                <th className="py-3 px-3">Cajero Responsable</th>
                <th className="py-3 px-3 text-right">Apertura</th>
                <th className="py-3 px-3 text-right">Esperado</th>
                <th className="py-3 px-3 text-right">Real Físico</th>
                <th className="py-3 px-3 text-right">Diferencia</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center">Visado Gerencial</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {turnos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        No se encontraron turnos de caja en este período
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No existen aperturas o cierres de caja registrados en el rango de fechas seleccionado.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                turnosPaginados.map((turno) => {
                const isActivo = turno.estado === 'abierta';

                return (
                  <tr
                    key={turno.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isActivo
                        ? 'bg-amber-50/40 dark:bg-amber-950/10'
                        : !turno.revisado
                        ? 'bg-amber-50/20 dark:bg-amber-950/5'
                        : ''
                    }`}
                  >
                    {/* # Turno */}
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        Turno #{String(turno.correlativo).padStart(3, '0')}
                      </span>
                    </td>

                    {/* Fecha & Horario */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(turno.fecha_apertura).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(turno.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        {turno.fecha_cierre ? ` - ${new Date(turno.fecha_cierre).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : ' (Abierto)'}
                      </div>
                    </td>

                    {/* Cajero Responsable */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {turno.cajero_nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {turno.cajero_rol || 'Cajero de Sede'}
                      </span>
                    </td>

                    {/* Apertura */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      S/ {turno.monto_apertura.toFixed(2)}
                    </td>

                    {/* Esperado */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      S/ {turno.monto_esperado.toFixed(2)}
                    </td>

                    {/* Real Físico */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {turno.monto_real !== null && turno.monto_real !== undefined
                        ? `S/ ${turno.monto_real.toFixed(2)}`
                        : <span className="text-slate-400 italic">Pendiente</span>}
                    </td>

                    {/* Diferencia */}
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {turno.discrepancia === null || turno.discrepancia === undefined ? (
                        <span className="text-slate-400">--</span>
                      ) : Math.abs(turno.discrepancia) < 0.001 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">S/ 0.00</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          {turno.discrepancia < 0 ? `- S/ ${Math.abs(turno.discrepancia).toFixed(2)}` : `+ S/ ${turno.discrepancia.toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-3 text-center">
                      {isActivo ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold font-mono inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Abierto</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                          Cerrado
                        </span>
                      )}
                    </td>

                    {/* Visado Gerencial */}
                    <td className="py-3 px-3 text-center">
                      {isActivo ? (
                        <span className="text-[10px] text-slate-400 italic">En operación</span>
                      ) : turno.revisado ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Auditado</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-right">
                      {isActivo ? (
                        <button
                          type="button"
                          onClick={() => onAbrirCierreForzado(turno)}
                          className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold border border-rose-200 dark:border-rose-800 transition-colors"
                        >
                          Forzar Cierre
                        </button>
                      ) : !turno.revisado ? (
                        <button
                          type="button"
                          onClick={() => onAuditarTurnoZ(turno)}
                          className="px-3 py-1.5 rounded-xl bg-aurea-navy hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto border border-aurea-copper/30"
                        >
                          <Eye className="w-3.5 h-3.5 text-aurea-champagne" />
                          <span>Auditar Reporte Z</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAuditarTurnoZ(turno)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Ver Z</span>
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
              <strong className="text-slate-800 dark:text-slate-200">{Math.min(indiceInicio + itemsPorPagina, turnos.length)}</strong> de{' '}
              <strong className="text-slate-800 dark:text-slate-200">{turnos.length}</strong> turnos registrados
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

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0" />
          <span>
            <strong>Criterio de Visado:</strong> El administrador revisa el Reporte Z oficial SUNAT y confirma la conciliación contra lotes de POS. Ante faltantes, asienta nota aclaratoria vinculante.
          </span>
        </div>
      </div>
    </div>
  );
};
