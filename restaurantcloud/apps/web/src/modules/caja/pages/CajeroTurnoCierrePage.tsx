import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { BalancePreArqueoDTO, CerrarCajaRequest, ReporteZDTO } from '@/types/caja';
import { mockCajaService } from '../services/mockCajaService';
import { BalancePreArqueoView } from '../components/cierre/BalancePreArqueoView';
import { ModalArqueoConteo } from '../components/cierre/ModalArqueoConteo';
import { ReporteZCerradoView } from '../components/cierre/ReporteZCerradoView';
import { DemoCajaCierreWidget } from '../components/DemoCajaCierreWidget';

export const CajeroTurnoCierrePage: React.FC = () => {
  const navigate = useNavigate();

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

  // Carga de balance y verificación de si ya existe un Reporte Z emitido para este turno
  const cargarDatos = useCallback(async () => {
    try {
      const [resBalance, resUltimoZ] = await Promise.all([
        mockCajaService.getBalancePreArqueo(),
        mockCajaService.getUltimoReporteZ(),
      ]);

      if (resBalance.exito && resBalance.datos) {
        setBalance(resBalance.datos);
      }

      if (resUltimoZ.exito && resUltimoZ.datos) {
        setReporteEmitido(resUltimoZ.datos);
      }
    } catch (err) {
      console.error('Error al cargar balance de pre-arqueo:', err);
      showToast('error', 'Error al sincronizar el balance de caja con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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
          } else {
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
  const handleConfirmarCierre = async (req: CerrarCajaRequest) => {
    setIsSubmittingCierre(true);
    try {
      const resp = await mockCajaService.cerrarTurno(req);

      if (resp.exito && resp.datos) {
        setReporteEmitido(resp.datos);
        setIsModalArqueoOpen(false);
        showToast(
          'success',
          `¡Turno #${String(resp.datos.turno_correlativo).padStart(3, '0')} cerrado con éxito! Reporte Z oficial SUNAT generado.`
        );
        // Recargar balance
        await cargarDatos();
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

  // Manejador: Liquidar Mesas Activas en Demo
  const handleLiquidarMesasDemo = async () => {
    mockCajaService.simularSalonAlDiaQA();
    showToast('info', 'Demostración: Mesas liquidadas en salón. Salón 100% al día.');
    await cargarDatos();
  };

  // Manejador: Acciones posteriores al Reporte Z (Vista 3)
  const handleIrAperturaNuevoTurno = () => {
    navigate(ROUTES.CAJERO_POS);
  };

  const handleCerrarSesion = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleVolverPos = () => {
    navigate(ROUTES.CAJERO_POS);
  };

  // Manejador del Sandbox QA
  const handleSelectEscenarioQA = async (
    escenario: 'salon_al_dia' | 'mesas_pendientes' | 'faltante' | 'sobrante' | 'caja_cerrada' | 'restablecer'
  ) => {
    if (escenario === 'salon_al_dia') {
      mockCajaService.simularSalonAlDiaQA();
      setReporteEmitido(null);
      setIsModalArqueoOpen(false);
      showToast('success', 'Sandbox: Salón al día (0 mesas pendientes). Arqueo F8 habilitado.');
    } else if (escenario === 'mesas_pendientes') {
      mockCajaService.simularSalonConMesasPendientesQA();
      setReporteEmitido(null);
      setIsModalArqueoOpen(false);
      showToast('error', 'Sandbox: Provocando mesas activas con comensales. Poka-Yoke activado.');
    } else if (escenario === 'faltante') {
      mockCajaService.simularSalonAlDiaQA();
      setReporteEmitido(null);
      setIsModalArqueoOpen(true);
      showToast('info', 'Sandbox: Modal de Arqueo abierto. Ingrese S/ 285.00 para probar faltante (-S/ 15).');
    } else if (escenario === 'sobrante') {
      mockCajaService.simularSalonAlDiaQA();
      setReporteEmitido(null);
      setIsModalArqueoOpen(true);
      showToast('info', 'Sandbox: Modal de Arqueo abierto. Ingrese S/ 320.00 para probar sobrante (+S/ 20).');
    } else if (escenario === 'caja_cerrada') {
      mockCajaService.simularSalonAlDiaQA();
      const respZ = await mockCajaService.cerrarTurno({
        monto_real_fisico: 300.0,
        notas_cierre: 'Cierre demostrativo automático sin discrepancia.',
      });
      if (respZ.exito && respZ.datos) {
        setReporteEmitido(respZ.datos);
        setIsModalArqueoOpen(false);
        showToast('success', 'Sandbox: Mostrando Vista 3 (Reporte Z Oficial SUNAT cerrado).');
      }
    } else if (escenario === 'restablecer') {
      mockCajaService.restablecerSemillasCierreQA();
      setReporteEmitido(null);
      setIsModalArqueoOpen(false);
      showToast('info', 'Sandbox: Semillas de cierre restablecidas al estado pre-arqueo inicial.');
    }
    await cargarDatos();
  };

  if (loading || !balance) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-aurea-copper mb-3" />
        <p className="text-sm font-medium">Calculando balance consolidado del turno...</p>
      </div>
    );
  }

  // Estado textual para el widget QA
  const estadoBadgeTexto = reporteEmitido
    ? 'Caja Cerrada (Z)'
    : !balance.salon_al_dia
    ? 'Mesas Activas'
    : isModalArqueoOpen
    ? 'Arqueo en Curso'
    : 'Listo p/ Cierre';

  return (
    <div className="relative min-h-full pb-20">
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

      {/* VISTA 3: Si el turno ya fue cerrado formalmente, se renderiza el Reporte Z Oficial Digital */}
      {reporteEmitido ? (
        <ReporteZCerradoView
          reporte={reporteEmitido}
          onIrAperturaNuevoTurno={handleIrAperturaNuevoTurno}
          onCerrarSesion={handleCerrarSesion}
        />
      ) : (
        /* VISTA 1: Pre-Arqueo y Balance Operativo del Turno */
        <BalancePreArqueoView
          balance={balance}
          onIniciarArqueo={handleIniciarArqueo}
          onVolverPos={handleVolverPos}
          onLiquidarMesasDemo={handleLiquidarMesasDemo}
        />
      )}

      {/* VISTA 2: Modal de Conteo Físico Ciego y Conciliación (Arqueo 1040px) */}
      {!reporteEmitido && (
        <ModalArqueoConteo
          isOpen={isModalArqueoOpen}
          balance={balance}
          onClose={() => setIsModalArqueoOpen(false)}
          onConfirmarCierre={handleConfirmarCierre}
          isSubmitting={isSubmittingCierre}
        />
      )}

      {/* Widget Flotante de Pruebas QA (Esquina inferior derecha) */}
      <DemoCajaCierreWidget
        onSelectEscenario={handleSelectEscenarioQA}
        estadoActual={estadoBadgeTexto}
      />
    </div>
  );
};
