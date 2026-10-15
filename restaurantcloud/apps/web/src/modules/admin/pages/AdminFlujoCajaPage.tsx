import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Receipt,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  FlujoCajaResumenDTO,
  PeriodoFlujoCaja,
  TurnoCajaResumenDTO,
  AuditoriaTurnosKPIsDTO,
  GastoOperativoDTO,
  RegistrarGastoRequestDTO,
  VisarTurnoRequestDTO,
  CierreForzadoAdminRequestDTO,
} from '@/types/admin';
import { ReporteZDTO } from '@/types/caja';
import { mockAdminService } from '../services/mockAdminService';
import { FlujoCajaDashboardView } from '../components/flujo-caja/FlujoCajaDashboardView';
import { AuditoriaTurnosZView } from '../components/flujo-caja/AuditoriaTurnosZView';
import { GastosOperativosTableView } from '../components/flujo-caja/GastosOperativosTableView';
import { ModalVisorReporteZAdmin } from '../components/flujo-caja/ModalVisorReporteZAdmin';
import { ModalRegistroGastoManual } from '../components/flujo-caja/ModalRegistroGastoManual';
import { ModalCierreForzadoAdmin } from '../components/flujo-caja/ModalCierreForzadoAdmin';
import { DemoAdminFinanzasWidget } from '../components/flujo-caja/DemoAdminFinanzasWidget';

type TabFinanzas = 'flujo' | 'turnos_z' | 'gastos';

export const AdminFlujoCajaPage: React.FC = () => {
  // Pestaña Activa
  const [tabActiva, setTabActiva] = useState<TabFinanzas>('flujo');
  const [periodo, setPeriodo] = useState<PeriodoFlujoCaja>('este_mes');
  const [fechaDesde, setFechaDesde] = useState<string>('2026-10-01');
  const [fechaHasta, setFechaHasta] = useState<string>('2026-10-31');

  // Estados de datos
  const [resumenFlujo, setResumenFlujo] = useState<FlujoCajaResumenDTO | null>(null);
  const [turnosData, setTurnosData] = useState<{
    kpis: AuditoriaTurnosKPIsDTO;
    turnos: TurnoCajaResumenDTO[];
  } | null>(null);
  const [gastos, setGastos] = useState<GastoOperativoDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modales
  const [isModalGastoOpen, setIsModalGastoOpen] = useState<boolean>(false);
  const [isSubmittingGasto, setIsSubmittingGasto] = useState<boolean>(false);

  const [isModalReporteZOpen, setIsModalReporteZOpen] = useState<boolean>(false);
  const [turnoReporteZ, setTurnoReporteZ] = useState<TurnoCajaResumenDTO | null>(null);
  const [reporteZDetalle, setReporteZDetalle] = useState<ReporteZDTO | null>(null);
  const [isSubmittingVisado, setIsSubmittingVisado] = useState<boolean>(false);

  const [isModalCierreForzadoOpen, setIsModalCierreForzadoOpen] = useState<boolean>(false);
  const [turnoCierreForzado, setTurnoCierreForzado] = useState<TurnoCajaResumenDTO | null>(null);
  const [isSubmittingCierreForzado, setIsSubmittingCierreForzado] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<{ tipo: 'success' | 'error' | 'info'; mensaje: string } | null>(null);

  const showToast = (tipo: 'success' | 'error' | 'info', mensaje: string) => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Carga consolidada de datos financieros y de turnos
  const cargarDatos = useCallback(async (p: PeriodoFlujoCaja = periodo, d: string = fechaDesde, h: string = fechaHasta) => {
    try {
      const [resFlujo, resTurnos, resGastos] = await Promise.all([
        mockAdminService.getFlujoCajaResumen(p, d, h),
        mockAdminService.getTurnosCajaHistorial(p, d, h),
        mockAdminService.getGastosOperativos(p, d, h),
      ]);

      if (resFlujo.exito && resFlujo.datos) {
        setResumenFlujo(resFlujo.datos);
      }
      if (resTurnos.exito && resTurnos.datos) {
        setTurnosData(resTurnos.datos);
      }
      if (resGastos.exito && resGastos.datos) {
        setGastos(resGastos.datos);
      }
    } catch (err) {
      console.error('Error al cargar datos financieros:', err);
      showToast('error', 'Error al sincronizar datos financieros de la sede.');
    } finally {
      setLoading(false);
    }
  }, [periodo, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleCambiarPeriodo = async (nuevoPeriodo: PeriodoFlujoCaja, desde?: string, hasta?: string) => {
    setPeriodo(nuevoPeriodo);
    const d = desde || (nuevoPeriodo === 'hoy' ? '2026-10-15' : '2026-10-01');
    const h = hasta || (nuevoPeriodo === 'hoy' ? '2026-10-15' : '2026-10-31');
    setFechaDesde(d);
    setFechaHasta(h);
    await cargarDatos(nuevoPeriodo, d, h);
  };

  // Manejador: Registrar Gasto
  const handleGuardarGasto = async (req: RegistrarGastoRequestDTO) => {
    setIsSubmittingGasto(true);
    try {
      const resp = await mockAdminService.registrarGastoOperativo(req);
      if (resp.exito && resp.datos) {
        showToast(
          'success',
          `✓ Gasto de S/ ${resp.datos.monto.toFixed(2)} registrado con éxito (${resp.datos.origen_fondos === 'efectivo_caja' ? 'Descontado de gaveta activa' : 'Vía banco'}).`
        );
        setIsModalGastoOpen(false);
        await cargarDatos();
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo registrar el gasto.';
        showToast('error', errorMsg);
      }
    } catch {
      showToast('error', 'Fallo de red al registrar el gasto de sede.');
    } finally {
      setIsSubmittingGasto(false);
    }
  };

  // Manejador: Auditar Reporte Z
  const handleAuditarTurnoZ = async (turno: TurnoCajaResumenDTO) => {
    setTurnoReporteZ(turno);
    try {
      const respZ = await mockAdminService.getReporteZTurno(turno.id);
      if (respZ.exito && respZ.datos) {
        setReporteZDetalle(respZ.datos);
      }
      setIsModalReporteZOpen(true);
    } catch {
      showToast('error', 'Error al obtener el Reporte Z oficial del turno.');
    }
  };

  // Manejador: Visar Turno Z
  const handleVisarTurno = async (turnoId: string, req: VisarTurnoRequestDTO) => {
    setIsSubmittingVisado(true);
    try {
      const resp = await mockAdminService.visarTurnoZ(turnoId, req);
      if (resp.exito && resp.datos) {
        showToast(
          'success',
          `✓ Turno #${String(resp.datos.correlativo).padStart(3, '0')} auditado y visado conforme por gerencia.`
        );
        setIsModalReporteZOpen(false);
        await cargarDatos();
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo visar el turno.';
        showToast('error', errorMsg);
      }
    } catch {
      showToast('error', 'Error al registrar el visado gerencial.');
    } finally {
      setIsSubmittingVisado(false);
    }
  };

  // Manejador: Cierre Forzado Administrativo (Rescate)
  const handleAbrirCierreForzado = (turno: TurnoCajaResumenDTO) => {
    setTurnoCierreForzado(turno);
    setIsModalCierreForzadoOpen(true);
  };

  const handleConfirmarCierreForzado = async (turnoId: string, req: CierreForzadoAdminRequestDTO) => {
    setIsSubmittingCierreForzado(true);
    try {
      const resp = await mockAdminService.ejecutarCierreForzadoAdmin(turnoId, req);
      if (resp.exito && resp.datos) {
        showToast(
          'success',
          `✓ Cierre forzado de Turno #${String(resp.datos.correlativo).padStart(3, '0')} ejecutado. Terminal POS liberada para nuevo cajero.`
        );
        setIsModalCierreForzadoOpen(false);
        await cargarDatos();
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo forzar el cierre de caja.';
        showToast('error', errorMsg);
      }
    } catch {
      showToast('error', 'Error de comunicación al forzar el cierre.');
    } finally {
      setIsSubmittingCierreForzado(false);
    }
  };

  // Sandbox QA
  const handleSelectEscenarioQA = async (
    escenario: 'superavit' | 'deficit' | 'discrepancia_pendiente' | 'terminal_bloqueada' | 'dias_vacios' | 'restablecer'
  ) => {
    if (escenario === 'superavit') {
      mockAdminService.restablecerSemillasFinanzasQA();
      setPeriodo('este_mes');
      setFechaDesde('2026-10-01');
      setFechaHasta('2026-10-31');
      showToast('success', 'Sandbox: Mes normal con superávit de +S/ 11,630 y margen 40.8%.');
    } else if (escenario === 'deficit') {
      mockAdminService.simularDeficitOperativoQA();
      showToast('error', 'Sandbox: Simulando compras masivas/alquiler. Balance en déficit temporal (-S/ 2,750).');
    } else if (escenario === 'discrepancia_pendiente') {
      mockAdminService.simularTurnoConDiscrepanciaQA();
      setTabActiva('turnos_z');
      showToast('info', 'Sandbox: Turno #042 configurado con faltante (-S/ 15) pendiente de visado.');
    } else if (escenario === 'terminal_bloqueada') {
      mockAdminService.simularTerminalBloqueadaQA();
      setTabActiva('turnos_z');
      showToast('error', 'Sandbox: Turno activo abandonado por Juan Pérez. Terminal bloqueada.');
    } else if (escenario === 'dias_vacios') {
      mockAdminService.simularDiasVaciosQA();
      setPeriodo('personalizado');
      setFechaDesde('2026-11-01');
      setFechaHasta('2026-11-05');
      showToast('info', 'Sandbox: Simulación de días vacíos sin actividad operacional.');
    } else if (escenario === 'restablecer') {
      mockAdminService.restablecerSemillasFinanzasQA();
      setPeriodo('este_mes');
      setFechaDesde('2026-10-01');
      setFechaHasta('2026-10-31');
      showToast('info', 'Sandbox: Semillas de tesorería y turnos restablecidas.');
    }
    await cargarDatos();
  };

  if (loading || !resumenFlujo || !turnosData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-aurea-copper mb-3" />
        <p className="text-sm font-medium">Calculando balance neto y conciliando gavetas...</p>
      </div>
    );
  }

  const estadoBadgeTexto =
    resumenFlujo.balance_neto < 0
      ? 'Déficit Temp'
      : turnosData.kpis.turno_activo?.cajero_nombre === 'Juan Pérez'
      ? 'Term. Bloqueada'
      : turnosData.turnos.some((t) => !t.revisado && t.estado === 'cerrada')
      ? 'Por Visar'
      : 'Superávit Net';

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Flotante */}
      {toast && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium flex items-center gap-2.5 animate-in slide-in-from-top-3 max-w-md ${
            toast.tipo === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-600'
              : toast.tipo === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-600'
              : 'bg-slate-900/90 text-slate-100 border-slate-700'
          }`}
        >
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.mensaje}</span>
        </div>
      )}

      {/* Cabecera Principal del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-aurea-navy text-white text-xs font-mono font-bold tracking-wide border border-aurea-copper/40">
              CU-ADMIN-14
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Sede: Miraflores • Centro de Control de Tesorería & Cierres Z
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            Gestión de Flujo de Caja, Gastos y Auditoría de Cierres Z
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoreo en tiempo real de ingresos 100% de salón, egresos operativos, visado de Reportes Z y rescate de terminal.
          </p>
        </div>

        {/* Pestañas Principales (Tablist) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold self-start md:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setTabActiva('flujo')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              tabActiva === 'flujo'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-aurea-copper" />
            <span>Flujo de Caja & Balance</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('turnos_z')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative ${
              tabActiva === 'turnos_z'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-aurea-copper" />
            <span>Auditoría de Turnos & Cierres Z</span>
            {turnosData.kpis.turnos_pendientes_auditoria > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('gastos')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              tabActiva === 'gastos'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 text-aurea-copper" />
            <span>Egresos & Gastos Sede</span>
          </button>
        </div>
      </div>

      {/* Contenido según Pestaña Activa */}
      {tabActiva === 'flujo' && (
        <FlujoCajaDashboardView
          resumen={resumenFlujo}
          periodoSeleccionado={periodo}
          onCambiarPeriodo={(p) => handleCambiarPeriodo(p)}
          onAbrirModalGasto={() => setIsModalGastoOpen(true)}
        />
      )}

      {tabActiva === 'turnos_z' && (
        <AuditoriaTurnosZView
          kpis={turnosData.kpis}
          turnos={turnosData.turnos}
          onAuditarTurnoZ={handleAuditarTurnoZ}
          onAbrirCierreForzado={handleAbrirCierreForzado}
        />
      )}

      {tabActiva === 'gastos' && (
        <GastosOperativosTableView
          gastos={gastos}
          onAbrirModalGasto={() => setIsModalGastoOpen(true)}
        />
      )}

      {/* MODAL VISTA 3: Visor Oficial Reporte Z & Visado Gerencial */}
      <ModalVisorReporteZAdmin
        isOpen={isModalReporteZOpen}
        turno={turnoReporteZ}
        reporteZ={reporteZDetalle}
        onClose={() => setIsModalReporteZOpen(false)}
        onVisarTurno={handleVisarTurno}
        isSubmitting={isSubmittingVisado}
      />

      {/* MODAL VISTA 4: Registro de Gasto Operativo Manual */}
      <ModalRegistroGastoManual
        isOpen={isModalGastoOpen}
        onClose={() => setIsModalGastoOpen(false)}
        onGuardarGasto={handleGuardarGasto}
        isSubmitting={isSubmittingGasto}
      />

      {/* MODAL VISTA 5: Cierre Forzado Administrativo (Rescate) */}
      <ModalCierreForzadoAdmin
        isOpen={isModalCierreForzadoOpen}
        turno={turnoCierreForzado}
        onClose={() => setIsModalCierreForzadoOpen(false)}
        onConfirmarCierreForzado={handleConfirmarCierreForzado}
        isSubmitting={isSubmittingCierreForzado}
      />

      {/* Widget QA Sandbox */}
      <DemoAdminFinanzasWidget
        onSelectEscenario={handleSelectEscenarioQA}
        estadoActual={estadoBadgeTexto}
      />
    </div>
  );
};
