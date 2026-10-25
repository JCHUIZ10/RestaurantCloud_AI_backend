import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle2, AlertCircle, Lock, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { BalancePreArqueoDTO, CerrarCajaRequest, ReporteZDTO } from '@/types/caja';
import { cajaService } from '@/services/serviceAdapter';
import { BalancePreArqueoView } from '../components/cierre/BalancePreArqueoView';
import { ModalArqueoConteo } from '../components/cierre/ModalArqueoConteo';
import { ReporteZCerradoView } from '../components/cierre/ReporteZCerradoView';
import { useCerrarSesion } from '@/shared/hooks/useCerrarSesion';

export const CajeroTurnoCierrePage: React.FC = () => {
  const navigate = useNavigate();
  const cerrarSesion = useCerrarSesion();

  // Estados de datos
  const [balance, setBalance] = useState<BalancePreArqueoDTO | null>(null);
  const [reporteEmitido, setReporteEmitido] = useState<ReporteZDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmittingCierre, setIsSubmittingCierre] = useState<boolean>(false);

  // Control de modal de arqueo (Vista 2)
  const [isModalArqueoOpen, setIsModalArqueoOpen] = useState<boolean>(false);

  // Toast de feedback
  const [toast, setToast] = useState<{ tipo: 'success' | 'error' | 'info'; mensaje: string } | null>(null);

  const showToast = (tipo: 'success' | 'error' | 'info', mensaje: string) => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Carga secuencial de datos:
  // 1. Si hay caja abierta -> cargar Balance Pre-Arqueo (Vista 1).
  // 2. Si no hay caja abierta -> verificar si existe último Reporte Z generado (Vista 3).
  // 3. Si ninguno -> estado limpio con redirección a POS.
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const resBalance = await cajaService.getBalancePreArqueo();

      if (resBalance.exito && resBalance.datos) {
        setBalance(resBalance.datos);
        setReporteEmitido(null);
      } else {
        setBalance(null);
        const resUltimoZ = await cajaService.getUltimoReporteZ();
        if (resUltimoZ.exito && resUltimoZ.datos) {
          setReporteEmitido(resUltimoZ.datos);
        } else {
          setReporteEmitido(null);
        }
      }
    } catch (err) {
      console.error('Error al sincronizar datos de caja:', err);
      showToast('error', 'Error al sincronizar el balance de caja con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Short Polling de balance y estado del salón (cada 4.0s) mientras la caja esté abierta y no en arqueo
  useEffect(() => {
    if (reporteEmitido || isModalArqueoOpen || !balance) return;

    const pollingCierreInterval = setInterval(async () => {
      try {
        const resBalance = await cajaService.getBalancePreArqueo();
        if (resBalance?.exito && resBalance.datos) {
          setBalance(resBalance.datos);
        }
      } catch {
        // Silencioso
      }
    }, 4000);

    return () => clearInterval(pollingCierreInterval);
  }, [reporteEmitido, isModalArqueoOpen, balance]);

  // Manejo de atajos de teclado (F8 para conteo, Escape para cancelar modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (!reporteEmitido && !isModalArqueoOpen) {
          if (balance && !balance.salon_al_dia) {
            showToast(
              'error',
              `Bloqueo Poka-Yoke: Existen ${balance.mesas_activas_pendientes} mesas con comensales activos pendientes de cobro.`
            );
          } else if (balance) {
            setIsModalArqueoOpen(true);
          }
        }
      } else if (e.key === 'Escape') {
        if (isModalArqueoOpen && !isSubmittingCierre) {
          e.preventDefault();
          setIsModalArqueoOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reporteEmitido, isModalArqueoOpen, balance, isSubmittingCierre]);

  // Manejador: Iniciar Arqueo (Abre ModalArqueoConteo)
  const handleIniciarArqueo = () => {
    if (balance && !balance.salon_al_dia) {
      showToast(
        'error',
        `No es posible iniciar el arqueo: hay ${balance.mesas_activas_pendientes} mesas activas en el salón.`
      );
      return;
    }
    setIsModalArqueoOpen(true);
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
        setReporteEmitido(resp.datos);
        showToast(
          'success',
          `¡Turno #${String(resp.datos.turno_correlativo).padStart(3, '0')} cerrado con éxito!`
        );
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo completar el cierre de caja.';
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-aurea-copper mb-3" />
        <p className="text-sm font-medium">Calculando balance consolidado del turno...</p>
      </div>
    );
  }

  // Si no hay reporte emitido ni balance de caja abierta (caja no aperturada)
  if (!reporteEmitido && !balance) {
    return (
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
      </div>
    );
  }

  return (
    <div className="relative min-h-full pb-20">
      {/* Toast Flotante */}
      {toast && (
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
      )}

      {/* VISTA 3: Si el turno ya fue cerrado formalmente, se renderiza el Reporte Z Oficial Digital */}
      {reporteEmitido ? (
        <ReporteZCerradoView
          reporte={reporteEmitido}
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

      {/* VISTA 2: Modal de Conteo Físico Ciego y Conciliación (Arqueo 1040px) */}
      {!reporteEmitido && balance && (
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
