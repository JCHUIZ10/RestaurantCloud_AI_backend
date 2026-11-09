import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle2, AlertCircle, Lock, ChevronRight, WifiOff, FileText } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { BalancePreArqueoDTO, CerrarCajaRequest, ReporteZDTO } from '@/types/caja';
import { cajaService } from '@/services/serviceAdapter';
import { BalancePreArqueoView } from '../components/cierre/BalancePreArqueoView';
import { ModalArqueoConteo } from '../components/cierre/ModalArqueoConteo';
import { ReporteZCerradoView } from '../components/cierre/ReporteZCerradoView';
import { useCerrarSesion } from '@/shared/hooks/useCerrarSesion';

// Códigos del backend que indican que el estado de la caja cambió mientras el cajero trabajaba
const ERR_CAJA_NO_ABIERTA = 'ERR_CAJA_NO_ABIERTA';
const ERR_DISCREPANCIA_SIN_JUSTIFICAR = 'ERR_DISCREPANCIA_SIN_JUSTIFICAR';
const ERR_SALON_CON_MESAS_ACTIVAS = 'ERR_SALON_CON_MESAS_ACTIVAS';

export const CajeroTurnoCierrePage: React.FC = () => {
  const navigate = useNavigate();
  const cerrarSesion = useCerrarSesion();

  // Estados de datos
  const [balance, setBalance] = useState<BalancePreArqueoDTO | null>(null);
  const [reporteEmitido, setReporteEmitido] = useState<ReporteZDTO | null>(null);
  // 'cierre': el Z que acaba de generar el cajero; 'consulta': el último Z pedido de forma explícita
  const [modoReporte, setModoReporte] = useState<'cierre' | 'consulta'>('cierre');
  const [cargandoUltimoZ, setCargandoUltimoZ] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [isSubmittingCierre, setIsSubmittingCierre] = useState<boolean>(false);

  // Control de modal de arqueo (Vista 2)
  const [isModalArqueoOpen, setIsModalArqueoOpen] = useState<boolean>(false);
  const abriendoArqueoRef = useRef<boolean>(false);

  // Toast de feedback
  const [toast, setToast] = useState<{ tipo: 'success' | 'error' | 'info'; mensaje: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((tipo: 'success' | 'error' | 'info', mensaje: string) => {
    // Un toast nuevo cancela el temporizador del anterior para que éste no lo borre antes de tiempo
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ tipo, mensaje });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Vuelve a consultar el balance y lo deja en el estado. Devuelve el balance vigente
  // o null si la consulta falló (el estado previo se conserva).
  const refrescarBalance = useCallback(async (): Promise<BalancePreArqueoDTO | null> => {
    try {
      const res = await cajaService.getBalancePreArqueo();
      if (res?.exito && res.datos) {
        setBalance(res.datos);
        return res.datos;
      }
    } catch {
      // Silencioso: el llamador decide qué hacer con null
    }
    return null;
  }, []);

  // Carga de datos:
  // 1. Si hay caja abierta -> cargar Balance Pre-Arqueo (Vista 1).
  // 2. Solo si el backend confirma ERR_CAJA_NO_ABIERTA -> vista "No hay un turno abierto".
  // 3. Cualquier otro fallo (red, 500, 401) NO equivale a "caja cerrada": se muestra error con reintento.
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const resBalance = await cajaService.getBalancePreArqueo();

      if (resBalance.exito && resBalance.datos) {
        setBalance(resBalance.datos);
        setReporteEmitido(null);
        return;
      }

      if (resBalance.errores?.[0]?.codigo !== ERR_CAJA_NO_ABIERTA) {
        setErrorCarga(
          resBalance.errores?.[0]?.mensaje || 'No se pudo consultar el balance de caja con el servidor.'
        );
        return;
      }

      // Sin caja abierta no se muestra ningún Reporte Z de forma automática: el último Z de la sede puede
      // ser de otro día u otro cajero. El Z "recién cerrado" llega solo desde la respuesta de cerrarTurno;
      // el resto de las veces se consulta de forma explícita (consultarUltimoZ).
      setBalance(null);
      setReporteEmitido(null);
    } catch (err) {
      console.error('Error al sincronizar datos de caja:', err);
      setErrorCarga('Error al sincronizar el balance de caja con el servidor.');
      showToast('error', 'Error al sincronizar el balance de caja con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Short Polling del balance (cada 4.0s) mientras la caja esté abierta. Sigue activo con el modal
  // de arqueo abierto para que el esperado no quede congelado; se pausa solo mientras se envía el cierre.
  const hayBalance = balance !== null;
  useEffect(() => {
    if (reporteEmitido || isSubmittingCierre || !hayBalance) return;

    // Con la pestaña oculta no se consulta; al volver a verla se actualiza de inmediato
    const pollingCierreInterval = setInterval(() => {
      if (document.visibilityState === 'visible') void refrescarBalance();
    }, 4000);
    const alVolverAVer = () => {
      if (document.visibilityState === 'visible') void refrescarBalance();
    };
    document.addEventListener('visibilitychange', alVolverAVer);

    return () => {
      clearInterval(pollingCierreInterval);
      document.removeEventListener('visibilitychange', alVolverAVer);
    };
  }, [reporteEmitido, isSubmittingCierre, hayBalance, refrescarBalance]);

  // Abre el modal de arqueo con el balance recién consultado, para que el esperado
  // autorrellenado sea el vigente y no el de la carga inicial de la página.
  const abrirArqueo = useCallback(async () => {
    if (abriendoArqueoRef.current) return;
    abriendoArqueoRef.current = true;
    try {
      const vigente = await refrescarBalance();
      if (!vigente) {
        showToast('error', 'No se pudo actualizar el balance de caja. Verifique la conexión e intente nuevamente.');
        return;
      }
      if (!vigente.salon_al_dia) {
        showToast(
          'error',
          `No es posible iniciar el arqueo: hay ${vigente.mesas_activas_pendientes} mesas activas en el salón.`
        );
        return;
      }
      setIsModalArqueoOpen(true);
    } finally {
      abriendoArqueoRef.current = false;
    }
  }, [refrescarBalance, showToast]);

  // Atajos de teclado: F8 inicia el arqueo; Esc cierra el modal o, desde el balance, vuelve al POS.
  // (F9 para confirmar el cierre vive en el modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (!reporteEmitido && !isModalArqueoOpen && hayBalance) {
          void abrirArqueo();
        }
      } else if (e.key === 'Escape') {
        if (isModalArqueoOpen) {
          if (!isSubmittingCierre) {
            e.preventDefault();
            setIsModalArqueoOpen(false);
          }
        } else if (hayBalance && !reporteEmitido) {
          e.preventDefault();
          navigate(ROUTES.CAJERO_POS);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reporteEmitido, isModalArqueoOpen, hayBalance, isSubmittingCierre, abrirArqueo, navigate]);

  // Manejador: Iniciar Arqueo (Abre ModalArqueoConteo)
  const handleIniciarArqueo = () => {
    void abrirArqueo();
  };

  // Manejador: Confirmar y Cerrar Turno (Cierre Formal Z)
  // Al completarse exitosamente, muestra la vista oficial del Reporte Z cerrado (Vista 3)
  const handleConfirmarCierre = async (req: CerrarCajaRequest) => {
    setIsSubmittingCierre(true);
    try {
      const resp = await cajaService.cerrarTurno(req);

      if (resp.exito && resp.datos) {
        setIsModalArqueoOpen(false);
        setBalance(null);
        setModoReporte('cierre');
        setReporteEmitido(resp.datos);
        showToast(
          'success',
          `¡Turno #${String(resp.datos.turno_correlativo).padStart(3, '0')} cerrado con éxito!`
        );
        return;
      }

      const error = resp.errores?.[0];
      const errorMsg = error?.mensaje || 'No se pudo completar el cierre de caja.';

      if (error?.codigo === ERR_CAJA_NO_ABIERTA) {
        // Otro terminal o pestaña ya cerró el turno: se sincroniza para mostrar el Reporte Z real
        setIsModalArqueoOpen(false);
        showToast('info', 'Este turno ya fue cerrado desde otro terminal.');
        void cargarDatos();
      } else if (error?.codigo === ERR_SALON_CON_MESAS_ACTIVAS) {
        setIsModalArqueoOpen(false);
        await refrescarBalance();
        showToast('error', errorMsg);
      } else if (error?.codigo === ERR_DISCREPANCIA_SIN_JUSTIFICAR) {
        // El esperado cambió mientras el cajero contaba: el modal se recalcula con el balance nuevo
        await refrescarBalance();
        showToast('error', 'El efectivo esperado cambió; revise el monto contado y la justificación.');
      } else {
        showToast('error', errorMsg);
      }
    } catch {
      showToast('error', 'Fallo de comunicación al registrar el cierre Z.');
    } finally {
      setIsSubmittingCierre(false);
    }
  };

  // Manejador: Acciones posteriores al Reporte Z (Vista 3)
  const handleIrAperturaNuevoTurno = () => {
    navigate(ROUTES.CAJERO_POS);
  };

  const handleCerrarSesion = cerrarSesion;

  const handleVolverPos = () => {
    navigate(ROUTES.CAJERO_POS);
  };

  // Consulta explícita del último Reporte Z de la sede (no es el "recién cerrado")
  const consultarUltimoZ = async () => {
    if (cargandoUltimoZ) return;
    setCargandoUltimoZ(true);
    try {
      const res = await cajaService.getUltimoReporteZ();
      if (res.exito && res.datos) {
        setModoReporte('consulta');
        setReporteEmitido(res.datos);
      } else if (res.exito) {
        showToast('info', 'Aún no hay reportes Z registrados en esta sede.');
      } else {
        showToast('error', res.errores?.[0]?.mensaje || 'No se pudo consultar el último Reporte Z.');
      }
    } catch {
      showToast('error', 'No se pudo consultar el último Reporte Z.');
    } finally {
      setCargandoUltimoZ(false);
    }
  };

  const handleVolverDeConsulta = () => {
    setReporteEmitido(null);
    setModoReporte('cierre');
  };

  // Toast Flotante: se dibuja en todas las vistas (carga, error, vacía y principal)
  const toastEl = toast ? (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium flex items-center gap-2.5 animate-in slide-in-from-top-3 max-w-md ${
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
  ) : null;

  if (loading) {
    return (
      <>
        {toastEl}
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-aurea-copper mb-3" />
          <p className="text-sm font-medium">Calculando balance consolidado del turno...</p>
        </div>
      </>
    );
  }

  // Fallo de comunicación: no se asume nada sobre el estado de la caja
  if (errorCarga && !reporteEmitido && !balance) {
    return (
      <>
        {toastEl}
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-4 shadow-sm border border-rose-200 dark:border-rose-800">
            <WifiOff className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
            No se pudo consultar el estado de la caja
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">{errorCarga}</p>
          <button
            type="button"
            onClick={() => void cargarDatos()}
            className="px-5 py-2.5 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 text-aurea-navy font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </>
    );
  }

  // Si no hay reporte emitido ni balance de caja abierta (caja no aperturada)
  if (!reporteEmitido && !balance) {
    return (
      <>
        {toastEl}
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
            No hay un turno de caja abierto
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
            Para realizar arqueos y cierres de turno, primero debe realizar la apertura formal en el terminal POS.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAJERO_POS)}
            className="px-5 py-2.5 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 text-aurea-navy font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>Ir a Apertura en Monitor POS</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => void consultarUltimoZ()}
            disabled={cargandoUltimoZ}
            className="mt-3 px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargandoUltimoZ ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{cargandoUltimoZ ? 'Consultando...' : 'Consultar último Reporte Z'}</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-full pb-20">
      {toastEl}

      {/* VISTA 3: Si el turno ya fue cerrado formalmente, se renderiza el Reporte Z Oficial Digital */}
      {reporteEmitido ? (
        <ReporteZCerradoView
          reporte={reporteEmitido}
          modo={modoReporte}
          onVolver={handleVolverDeConsulta}
          onIrAperturaNuevoTurno={handleIrAperturaNuevoTurno}
          onCerrarSesion={handleCerrarSesion}
        />
      ) : balance ? (
        /* VISTA 1: Pre-Arqueo y Balance Operativo del Turno */
        <BalancePreArqueoView
          balance={balance}
          onIniciarArqueo={handleIniciarArqueo}
          onVolverPos={handleVolverPos}
        />
      ) : null}

      {/* VISTA 2: Modal de Arqueo y Conciliación (1040px). Se monta solo al abrirse para que cada
          apertura nazca con el esperado vigente y con monto, notas y justificación reiniciados. */}
      {!reporteEmitido && balance && isModalArqueoOpen && (
        <ModalArqueoConteo
          isOpen={isModalArqueoOpen}
          balance={balance}
          onClose={() => setIsModalArqueoOpen(false)}
          onConfirmarCierre={handleConfirmarCierre}
          isSubmitting={isSubmittingCierre}
        />
      )}
    </div>
  );
};
