import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Wallet, TrendingUp, CreditCard, Receipt, Building2, type LucideIcon } from 'lucide-react';
import {
  FlujoCajaResumenDTO,
  PeriodoFlujoCaja,
  TurnoCajaResumenDTO,
  AuditoriaTurnosKPIsDTO,
  GastoOperativoDTO,
  RegistrarGastoRequestDTO,
  VisarTurnoRequestDTO,
  LevantarObservacionRequestDTO,
  CierreForzadoAdminRequestDTO,
} from '@/types/admin';
import { BalancePreArqueoDTO, ReporteZDTO } from '@/types/caja';
import { flujoCajaService } from '@/services/serviceAdapter';
import { FlujoCajaDashboardView } from '../components/flujo-caja/FlujoCajaDashboardView';
import { AuditoriaTurnosZView } from '../components/flujo-caja/AuditoriaTurnosZView';
import { GastosOperativosTableView } from '../components/flujo-caja/GastosOperativosTableView';
import { ModalVisorReporteZAdmin } from '../components/flujo-caja/ModalVisorReporteZAdmin';
import { ModalRegistroGastoManual } from '../components/flujo-caja/ModalRegistroGastoManual';
import { ModalCierreForzadoAdmin } from '../components/flujo-caja/ModalCierreForzadoAdmin';
import { Button, PageHeader, EstadoError, useToast } from '@/components/ui';
import { cn, hoyLocalStr, hoyServidorStr } from '@/shared/utils';
import { ROUTES } from '@/router/routes.constants';

type TabFinanzas = 'flujo' | 'turnos_z' | 'gastos';

const TABS_FINANZAS: Array<{
  valor: TabFinanzas;
  icono: LucideIcon;
  etiqueta: string;
  activa: string;
  reposo: string;
}> = [
  { valor: 'flujo', icono: TrendingUp, etiqueta: 'Flujo de caja', activa: 'bg-aurea-copper text-aurea-navy', reposo: 'text-aurea-copper' },
  { valor: 'turnos_z', icono: CreditCard, etiqueta: 'Cierres Z', activa: 'bg-blue-600 text-white', reposo: 'text-blue-600' },
  { valor: 'gastos', icono: Receipt, etiqueta: 'Gastos', activa: 'bg-red-600 text-white', reposo: 'text-red-600' },
];

// Códigos del backend que indican que el estado del turno cambió mientras el administrador trabajaba
const ERR_TURNO_YA_VISADO = 'ERR_TURNO_YA_VISADO';
const ERR_CAJA_NO_ABIERTA = 'ERR_CAJA_NO_ABIERTA';
const ERR_TURNO_ABIERTO = 'ERR_TURNO_ABIERTO';
const ERR_GASTO_YA_ANULADO = 'ERR_GASTO_YA_ANULADO';
const ERR_GASTO_TURNO_CERRADO = 'ERR_GASTO_TURNO_CERRADO';
/** El usuario (propietario) todavía no eligió la sede con la que trabaja */
const ERR_LOCAL_REQUERIDO = 'ERR_LOCAL_REQUERIDO';

/** Cada cuántos milisegundos se refresca el balance mientras está abierto el cierre forzado. */
const INTERVALO_BALANCE_CIERRE_FORZADO_MS = 5000;

/** Texto de la diferencia de efectivo de un cierre, para el aviso de confirmación. */
const textoDiferencia = (discrepancia?: number | null): string => {
  if (discrepancia == null || Math.abs(discrepancia) < 0.005) return ' sin diferencia de efectivo';
  return ` con ${discrepancia < 0 ? 'faltante' : 'sobrante'} de S/ ${Math.abs(discrepancia).toFixed(2)}`;
};

export const AdminFlujoCajaPage: React.FC = () => {
  const { mostrar } = useToast();
  const navigate = useNavigate();

  // Pestaña activa y periodo consultado
  const [tabActiva, setTabActiva] = useState<TabFinanzas>('flujo');
  const [periodo, setPeriodo] = useState<PeriodoFlujoCaja>('este_mes');
  const [fechaDesde, setFechaDesde] = useState<string>(hoyLocalStr);
  const [fechaHasta, setFechaHasta] = useState<string>(hoyLocalStr);

  // Estados de datos
  const [resumenFlujo, setResumenFlujo] = useState<FlujoCajaResumenDTO | null>(null);
  const [turnosData, setTurnosData] = useState<{
    kpis: AuditoriaTurnosKPIsDTO;
    turnos: TurnoCajaResumenDTO[];
  } | null>(null);
  const [gastos, setGastos] = useState<GastoOperativoDTO[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorCargaCodigo, setErrorCargaCodigo] = useState<string | null>(null);

  // Modales: se montan solo al abrirse, para que cada apertura nazca con su estado limpio
  const [isModalGastoOpen, setIsModalGastoOpen] = useState<boolean>(false);
  const [isSubmittingGasto, setIsSubmittingGasto] = useState<boolean>(false);

  const [isModalReporteZOpen, setIsModalReporteZOpen] = useState<boolean>(false);
  const [turnoReporteZ, setTurnoReporteZ] = useState<TurnoCajaResumenDTO | null>(null);
  const [reporteZDetalle, setReporteZDetalle] = useState<ReporteZDTO | null>(null);
  const [isSubmittingVisado, setIsSubmittingVisado] = useState<boolean>(false);
  const abriendoReporteZRef = useRef<boolean>(false);

  const [isModalCierreForzadoOpen, setIsModalCierreForzadoOpen] = useState<boolean>(false);
  const [turnoCierreForzado, setTurnoCierreForzado] = useState<TurnoCajaResumenDTO | null>(null);
  const [balanceCierreForzado, setBalanceCierreForzado] = useState<BalancePreArqueoDTO | null>(null);
  const [isSubmittingCierreForzado, setIsSubmittingCierreForzado] = useState<boolean>(false);
  const abriendoCierreForzadoRef = useRef<boolean>(false);

  // Cada carga lleva un número: si el periodo cambia mientras una respuesta viaja, la vieja se descarta
  const solicitudRef = useRef<number>(0);

  // Carga consolidada de datos financieros y de turnos. Es la única fuente de carga: el efecto de abajo
  // la dispara cuando cambia el periodo y los manejadores la repiten tras cada cambio.
  const cargarDatos = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    const filtro = { periodo, desde: fechaDesde, hasta: fechaHasta };

    setCargando(true);
    setErrorCarga(null);
    setErrorCargaCodigo(null);
    try {
      const [resFlujo, resTurnos, resGastos] = await Promise.all([
        flujoCajaService.getFlujoCajaResumen(filtro),
        flujoCajaService.getTurnosCajaHistorial(filtro),
        flujoCajaService.getGastosOperativos(filtro),
      ]);
      if (solicitud !== solicitudRef.current) return;

      const fallo = [resFlujo, resTurnos, resGastos].find((r) => !r.exito || !r.datos);
      if (fallo) {
        const codigo = fallo.errores?.[0]?.codigo ?? null;
        const mensaje = fallo.errores?.[0]?.mensaje || 'No se pudieron cargar los datos financieros de la sede.';
        setErrorCarga(mensaje);
        setErrorCargaCodigo(codigo);
        // Sin sede elegida la pantalla ya explica qué hacer: no hace falta además un aviso emergente
        if (codigo !== ERR_LOCAL_REQUERIDO) mostrar(mensaje, 'error');
        return;
      }

      setResumenFlujo(resFlujo.datos);
      setTurnosData(resTurnos.datos);
      setGastos(resGastos.datos);
    } catch (err) {
      if (solicitud !== solicitudRef.current) return;
      console.error('Error al cargar datos financieros:', err);
      const mensaje = 'Error al sincronizar los datos financieros de la sede. Verifica tu conexión.';
      setErrorCarga(mensaje);
      mostrar(mensaje, 'error');
    } finally {
      if (solicitud === solicitudRef.current) setCargando(false);
    }
  }, [periodo, fechaDesde, fechaHasta, mostrar]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const handleCambiarPeriodo = (nuevoPeriodo: PeriodoFlujoCaja, desde?: string, hasta?: string) => {
    if (nuevoPeriodo === 'personalizado') {
      if (desde) setFechaDesde(desde);
      if (hasta) setFechaHasta(hasta);
    }
    setPeriodo(nuevoPeriodo);
  };

  // Lleva la vista al rango personalizado que alcanza el turno sin visar más antiguo
  const handleVerObservados = () => {
    const masAntiguo = turnosData?.kpis.observado_mas_antiguo;
    handleCambiarPeriodo('personalizado', masAntiguo ? masAntiguo.slice(0, 10) : undefined, hoyServidorStr());
  };

  const handleVerPendientes = () => {
    const masAntiguo = turnosData?.kpis.pendiente_mas_antiguo;
    handleCambiarPeriodo('personalizado', masAntiguo ? masAntiguo.slice(0, 10) : undefined, hoyServidorStr());
  };

  // Manejador: Registrar Gasto
  const handleGuardarGasto = async (req: RegistrarGastoRequestDTO) => {
    setIsSubmittingGasto(true);
    try {
      const resp = await flujoCajaService.registrarGastoOperativo(req);
      if (resp.exito && resp.datos) {
        mostrar(
          `Gasto de S/ ${resp.datos.monto.toFixed(2)} registrado (${
            resp.datos.origen_fondos === 'efectivo_caja' ? 'descontado de la gaveta activa' : 'vía banco'
          }).`,
          'ok'
        );
        setIsModalGastoOpen(false);
        await cargarDatos();
      } else {
        mostrar(resp.errores?.[0]?.mensaje || 'No se pudo registrar el gasto.', 'error');
      }
    } catch {
      mostrar('Fallo de comunicación al registrar el gasto de sede.', 'error');
    } finally {
      setIsSubmittingGasto(false);
    }
  };

  // Manejador: Anular un gasto. Devuelve true cuando el diálogo ya no tiene nada que hacer (anulado o
  // ya resuelto por otra vía) y false cuando el administrador debe corregir algo y reintentar.
  const handleAnularGasto = async (gasto: GastoOperativoDTO, motivo: string): Promise<boolean> => {
    try {
      const resp = await flujoCajaService.anularGastoOperativo(gasto.id, motivo);
      if (resp.exito && resp.datos) {
        mostrar(
          `Gasto de S/ ${resp.datos.monto.toFixed(2)} anulado${
            resp.datos.origen_fondos === 'efectivo_caja' ? ': el efectivo volvió al esperado de la gaveta' : ''
          }.`,
          'ok'
        );
        await cargarDatos();
        return true;
      }

      const error = resp.errores?.[0];
      const mensaje = error?.mensaje || 'No se pudo anular el gasto.';
      if (error?.codigo === ERR_GASTO_YA_ANULADO || error?.codigo === ERR_GASTO_TURNO_CERRADO) {
        // El gasto cambió mientras se trabajaba (otra persona lo anuló o su turno se cerró): se sincroniza
        mostrar(mensaje, 'info');
        await cargarDatos();
        return true;
      }
      mostrar(mensaje, 'error');
      return false;
    } catch {
      mostrar('Error de comunicación al anular el gasto.', 'error');
      return false;
    }
  };

  // Manejador: Auditar Reporte Z (el visor solo se abre cuando el Z real llegó)
  const handleAuditarTurnoZ = async (turno: TurnoCajaResumenDTO) => {
    if (abriendoReporteZRef.current) return;
    abriendoReporteZRef.current = true;
    try {
      // Sin Z archivado no hay nada que pedir: el visor abre solo con el formulario de visado
      if (turno.tiene_reporte_z === false) {
        setTurnoReporteZ(turno);
        setReporteZDetalle(null);
        setIsModalReporteZOpen(true);
        return;
      }
      const respZ = await flujoCajaService.getReporteZTurno(turno.id);
      if (respZ.exito && respZ.datos) {
        setTurnoReporteZ(turno);
        setReporteZDetalle(respZ.datos);
        setIsModalReporteZOpen(true);
      } else {
        mostrar(respZ.errores?.[0]?.mensaje || 'No se pudo obtener el Reporte Z oficial del turno.', 'error');
      }
    } catch {
      mostrar('Error de comunicación al obtener el Reporte Z oficial del turno.', 'error');
    } finally {
      abriendoReporteZRef.current = false;
    }
  };

  const handleCerrarVisorZ = () => {
    setIsModalReporteZOpen(false);
    setTurnoReporteZ(null);
    setReporteZDetalle(null);
  };

  // Manejador: Visar Turno Z
  const handleVisarTurno = async (turnoId: string, req: VisarTurnoRequestDTO) => {
    setIsSubmittingVisado(true);
    try {
      const resp = await flujoCajaService.visarTurnoZ(turnoId, req);
      if (resp.exito && resp.datos) {
        mostrar(
          `Turno #${String(resp.datos.correlativo).padStart(3, '0')} ${
            req.conforme ? 'auditado y visado conforme por la administración.' : 'observado por la administración.'
          }`,
          'ok'
        );
        handleCerrarVisorZ();
        await cargarDatos();
        return;
      }

      const error = resp.errores?.[0];
      const mensaje = error?.mensaje || 'No se pudo visar el turno.';
      if (error?.codigo === ERR_TURNO_YA_VISADO || error?.codigo === ERR_TURNO_ABIERTO) {
        // Otra persona ya lo visó, o el turno cambió de estado: se sincroniza la lista
        mostrar(mensaje, 'info');
        handleCerrarVisorZ();
        await cargarDatos();
      } else {
        mostrar(mensaje, 'error');
      }
    } catch {
      mostrar('Error de comunicación al registrar el visado gerencial.', 'error');
    } finally {
      setIsSubmittingVisado(false);
    }
  };

  // Manejador: levantar la observación de un turno observado (cierra el seguimiento con una nota)
  const handleLevantarObservacion = async (turnoId: string, req: LevantarObservacionRequestDTO) => {
    setIsSubmittingVisado(true);
    try {
      const resp = await flujoCajaService.levantarObservacionTurno(turnoId, req);
      if (resp.exito && resp.datos) {
        mostrar(`Observación del turno #${String(resp.datos.correlativo).padStart(3, '0')} resuelta.`, 'ok');
        handleCerrarVisorZ();
        await cargarDatos();
        return;
      }

      const error = resp.errores?.[0];
      const mensaje = error?.mensaje || 'No se pudo levantar la observación.';
      if (error?.codigo === 'ERR_OBSERVACION_YA_RESUELTA' || error?.codigo === 'ERR_TURNO_NO_OBSERVADO') {
        mostrar(mensaje, 'info');
        handleCerrarVisorZ();
        await cargarDatos();
      } else {
        mostrar(mensaje, 'error');
      }
    } catch {
      mostrar('Error de comunicación al levantar la observación.', 'error');
    } finally {
      setIsSubmittingVisado(false);
    }
  };

  // Manejador: Cierre Forzado Administrativo (Rescate)
  // Se consulta el balance vigente antes de abrir: el modal nace con el esperado real y el estado del salón
  const handleAbrirCierreForzado = async (turno: TurnoCajaResumenDTO) => {
    if (abriendoCierreForzadoRef.current) return;
    abriendoCierreForzadoRef.current = true;
    try {
      const resp = await flujoCajaService.getBalanceTurno(turno.id);
      if (resp.exito && resp.datos) {
        setTurnoCierreForzado(turno);
        setBalanceCierreForzado(resp.datos);
        setIsModalCierreForzadoOpen(true);
        return;
      }

      if (resp.errores?.[0]?.codigo === ERR_CAJA_NO_ABIERTA) {
        mostrar('Este turno ya no está abierto. Se actualizó la lista.', 'info');
        await cargarDatos();
      } else {
        mostrar(resp.errores?.[0]?.mensaje || 'No se pudo consultar el balance del turno.', 'error');
      }
    } catch {
      mostrar('Error de comunicación al consultar el balance del turno.', 'error');
    } finally {
      abriendoCierreForzadoRef.current = false;
    }
  };

  const handleCerrarCierreForzado = () => {
    setIsModalCierreForzadoOpen(false);
    setTurnoCierreForzado(null);
    setBalanceCierreForzado(null);
  };

  const handleConfirmarCierreForzado = async (turnoId: string, req: CierreForzadoAdminRequestDTO) => {
    setIsSubmittingCierreForzado(true);
    try {
      const resp = await flujoCajaService.ejecutarCierreForzadoAdmin(turnoId, req);
      if (resp.exito && resp.datos) {
        mostrar(
          `Cierre forzado del Turno #${String(resp.datos.correlativo).padStart(3, '0')} ejecutado${textoDiferencia(resp.datos.discrepancia)}. La terminal POS quedó libre para un nuevo cajero.`,
          'ok'
        );
        handleCerrarCierreForzado();
        await cargarDatos();
        // El turno ya está cerrado y su Reporte Z archivado: se abre para visarlo de inmediato
        void handleAuditarTurnoZ(resp.datos);
        return;
      }

      const error = resp.errores?.[0];
      const mensaje = error?.mensaje || 'No se pudo forzar el cierre de caja.';
      if (error?.codigo === ERR_CAJA_NO_ABIERTA) {
        // El turno ya se cerró (el cajero volvió o lo cerró otra persona): se sincroniza la lista
        mostrar('Este turno ya no está abierto. Se actualizó la lista.', 'info');
        handleCerrarCierreForzado();
        await cargarDatos();
      } else {
        // Incluye el bloqueo por mesas activas: el modal queda abierto para reintentar
        mostrar(mensaje, 'error');
      }
    } catch {
      mostrar('Error de comunicación al forzar el cierre.', 'error');
    } finally {
      setIsSubmittingCierreForzado(false);
    }
  };

  // Mientras el cierre forzado está abierto, el cajero puede seguir cobrando: el balance se refresca solo (en pausa si
  // la pestaña está oculta o el cierre se está enviando) y, si el turno se cerró, se avisa y se cierra el modal.
  useEffect(() => {
    if (!isModalCierreForzadoOpen || !turnoCierreForzado || isSubmittingCierreForzado) return;
    const turnoId = turnoCierreForzado.id;
    let activo = true;

    const refrescar = async () => {
      if (document.hidden) return;
      try {
        const resp = await flujoCajaService.getBalanceTurno(turnoId);
        if (!activo) return;
        if (resp.exito && resp.datos) {
          setBalanceCierreForzado(resp.datos);
        } else if (resp.errores?.[0]?.codigo === ERR_CAJA_NO_ABIERTA) {
          mostrar('El turno se cerró mientras lo revisabas. Se actualizó la lista.', 'info');
          setIsModalCierreForzadoOpen(false);
          setTurnoCierreForzado(null);
          setBalanceCierreForzado(null);
          await cargarDatos();
        }
      } catch {
        // Un fallo de red momentáneo no interrumpe el cierre: se reintenta en el siguiente ciclo
      }
    };

    const temporizador = window.setInterval(() => void refrescar(), INTERVALO_BALANCE_CIERRE_FORZADO_MS);
    return () => {
      activo = false;
      window.clearInterval(temporizador);
    };
  }, [isModalCierreForzadoOpen, turnoCierreForzado, isSubmittingCierreForzado, cargarDatos, mostrar]);

  // Primera carga
  if (!resumenFlujo || !turnosData) {
    if (errorCarga) {
      return (
        <div className="space-y-6 pb-20">
          <PageHeader
            icono={Wallet}
            titulo="Flujo de caja"
            descripcion="Ingresos y egresos de la sede, visado de cierres Z y gastos operativos."
          />
          {errorCargaCodigo === ERR_LOCAL_REQUERIDO ? (
            // El propietario entra a las finanzas de una sede concreta, no a las de toda la empresa
            <div className="flex flex-col items-center text-center gap-3 px-4 py-10 sm:py-12">
              <span className="w-12 h-12 rounded-2xl border bg-aurea-champagne/40 text-aurea-navy border-aurea-copper/30 flex items-center justify-center" aria-hidden="true">
                <Building2 className="w-6 h-6" />
              </span>
              <h3 className="font-serif font-bold text-xl text-aurea-navy">Elige una sede para ver su flujo de caja</h3>
              <p className="text-sm max-w-sm text-aurea-navy/70">
                Como propietario trabajas con una sede a la vez. Ingresa a una de tus sedes desde «Mis sedes» y vuelve a esta pantalla.
              </p>
              <Button variant="primary" onClick={() => navigate(ROUTES.PROPIETARIO_SEDES)} className="mt-1">
                Ir a Mis sedes
              </Button>
            </div>
          ) : (
            <EstadoError
              titulo="No se pudo cargar el flujo de caja"
              mensaje={errorCarga}
              onReintentar={() => void cargarDatos()}
              reintentando={cargando}
            />
          )}
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-aurea-copper mb-3" />
        <p className="text-sm font-medium">Calculando balance neto y conciliando gavetas...</p>
      </div>
    );
  }

  // Lo decide el backend con el horario de la sede: es un aviso, la terminal nunca se bloquea ni se cierra sola
  const hayTurnoAbandonado = turnosData.kpis.turno_activo?.abandonado === true;
  // Los pendientes cuentan toda la sede, no solo el periodo en pantalla (respaldo: el valor del periodo)
  const pendientesTotales = turnosData.kpis.pendientes_auditoria_total ?? turnosData.kpis.turnos_pendientes_auditoria;
  const observadosPendientes = turnosData.kpis.observados_pendientes_total ?? turnosData.kpis.turnos_observados_pendientes ?? 0;
  const hayTurnosPorVisar = pendientesTotales > 0;
  const hayObservadosPorResolver = observadosPendientes > 0;
  const sinMovimientos = resumenFlujo.ingresos_totales === 0 && resumenFlujo.egresos_totales === 0;

  const estadoBadgeTexto = hayTurnoAbandonado
    ? 'Turno sin cerrar'
    : resumenFlujo.balance_neto < 0
    ? 'Déficit temporal'
    : hayTurnosPorVisar
    ? 'Por visar'
    : hayObservadosPorResolver
    ? 'Por resolver'
    : sinMovimientos
    ? 'Sin movimientos'
    : 'Superávit neto';

  const estiloBadgeEstado =
    estadoBadgeTexto === 'Superávit neto'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : estadoBadgeTexto === 'Por visar' || estadoBadgeTexto === 'Por resolver'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : estadoBadgeTexto === 'Sin movimientos'
      ? 'bg-slate-50 text-slate-600 border-slate-200'
      : 'bg-red-50 text-red-700 border-red-200';

  const puntoBadgeEstado =
    estadoBadgeTexto === 'Superávit neto'
      ? 'bg-emerald-500'
      : estadoBadgeTexto === 'Por visar'
      ? 'bg-amber-500'
      : estadoBadgeTexto === 'Sin movimientos'
      ? 'bg-slate-400'
      : 'bg-red-500';

  return (
    <div className="space-y-6 pb-20" aria-busy={cargando}>
      {/* Cabecera */}
      <div className="space-y-4">
        <PageHeader
          icono={Wallet}
          titulo="Flujo de caja"
          descripcion="Ingresos y egresos de la sede, visado de cierres Z y gastos operativos."
          meta={
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
                estiloBadgeEstado
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', puntoBadgeEstado)} aria-hidden="true" />
              {estadoBadgeTexto}
            </span>
          }
        />
        <div
          role="tablist"
          aria-label="Sección de finanzas"
          className="grid grid-cols-3 sm:inline-flex sm:w-auto w-full gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-aurea-ivory/60 border border-aurea-champagne/70 shadow-sm"
        >
          {TABS_FINANZAS.map(({ valor, icono: Icono, etiqueta, activa, reposo }) => {
            const seleccionada = tabActiva === valor;
            const pendientes = valor === 'turnos_z' ? pendientesTotales + observadosPendientes : 0;
            return (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={seleccionada}
                onClick={() => setTabActiva(valor)}
                className={cn(
                  'relative min-h-tactil px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all',
                  seleccionada ? cn(activa, 'shadow-md') : 'bg-white text-tinta-700 hover:bg-white/80'
                )}
              >
                <Icono className={cn('w-4 h-4 shrink-0', seleccionada ? '' : reposo)} aria-hidden="true" />
                <span>{etiqueta}</span>
                {pendientes > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold leading-none',
                      seleccionada ? 'bg-white/25' : 'bg-amber-500 text-white'
                    )}
                  >
                    {pendientes}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fallo al refrescar con datos ya cargados: se conserva lo último visto y se ofrece reintentar */}
      {errorCarga && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between gap-3"
        >
          <span>{errorCarga} Los datos mostrados pueden estar desactualizados.</span>
          <button
            type="button"
            onClick={() => void cargarDatos()}
            disabled={cargando}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 disabled:opacity-60"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Mientras se recargan los datos (cambio de periodo, tras una acción) se avisa y se atenúa lo que se ve:
          así no se confunden las cifras del periodo anterior con las nuevas */}
      {cargando && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-aurea-copper" aria-hidden="true" />
          <span>Actualizando datos…</span>
        </div>
      )}

      {/* Contenido según Pestaña Activa */}
      <div className={cn('space-y-6 transition-opacity duration-200', cargando && 'opacity-50 pointer-events-none')}>
        {tabActiva === 'flujo' && (
          <FlujoCajaDashboardView
            resumen={resumenFlujo}
            periodoSeleccionado={periodo}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onCambiarPeriodo={handleCambiarPeriodo}
            onAbrirModalGasto={() => setIsModalGastoOpen(true)}
          />
        )}

        {tabActiva === 'turnos_z' && (
          <AuditoriaTurnosZView
            kpis={turnosData.kpis}
            turnos={turnosData.turnos}
            onVerPendientes={handleVerPendientes}
            onVerObservados={handleVerObservados}
            onAuditarTurnoZ={handleAuditarTurnoZ}
            onAbrirCierreForzado={handleAbrirCierreForzado}
          />
        )}

        {tabActiva === 'gastos' && (
          <GastosOperativosTableView
            gastos={gastos}
            onAbrirModalGasto={() => setIsModalGastoOpen(true)}
            onAnularGasto={handleAnularGasto}
          />
        )}
      </div>

      {/* Visor oficial del Reporte Z y visado gerencial */}
      {isModalReporteZOpen && (
        <ModalVisorReporteZAdmin
          isOpen={isModalReporteZOpen}
          turno={turnoReporteZ}
          reporteZ={reporteZDetalle}
          onClose={handleCerrarVisorZ}
          onVisarTurno={handleVisarTurno}
          onLevantarObservacion={handleLevantarObservacion}
          isSubmitting={isSubmittingVisado}
        />
      )}

      {/* Registro de gasto operativo manual */}
      {isModalGastoOpen && (
        <ModalRegistroGastoManual
          isOpen={isModalGastoOpen}
          onClose={() => setIsModalGastoOpen(false)}
          onGuardarGasto={handleGuardarGasto}
          isSubmitting={isSubmittingGasto}
        />
      )}

      {/* Cierre forzado administrativo (rescate de terminal) */}
      {isModalCierreForzadoOpen && (
        <ModalCierreForzadoAdmin
          isOpen={isModalCierreForzadoOpen}
          turno={turnoCierreForzado}
          balance={balanceCierreForzado}
          onClose={handleCerrarCierreForzado}
          onConfirmarCierreForzado={handleConfirmarCierreForzado}
          isSubmitting={isSubmittingCierreForzado}
        />
      )}
    </div>
  );
};
