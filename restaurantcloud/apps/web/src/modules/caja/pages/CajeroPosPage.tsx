import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import {
  EstadoCajaSesionDTO,
  MesaCajaMonitorDTO,
  CajaMetricasPosDTO,
  CajaTurnoDTO,
} from '@/types/caja';
import {
  mockCajaService,
  CAJERO_ACTUAL_MOCK,
} from '../services/mockCajaService';
import { ModalAperturaTurno } from '../components/ModalAperturaTurno';
import { ModalBloqueoTurnoPrevio } from '../components/ModalBloqueoTurnoPrevio';
import { MonitorCajaPosView } from '../components/MonitorCajaPosView';
import { ModalCobroPrecuentaDemo } from '../components/ModalCobroPrecuentaDemo';
import { DemoCajaTurnoWidget } from '../components/DemoCajaTurnoWidget';

export const CajeroPosPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados de datos
  const [session, setSession] = useState<EstadoCajaSesionDTO | null>(null);
  const [mesas, setMesas] = useState<MesaCajaMonitorDTO[]>([]);
  const [metricas, setMetricas] = useState<CajaMetricasPosDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmittingApertura, setIsSubmittingApertura] = useState<boolean>(false);

  // Modales interactivos
  const [mesaCobroActiva, setMesaCobroActiva] = useState<MesaCajaMonitorDTO | null>(null);

  // Toast de feedback
  const [toast, setToast] = useState<{ tipo: 'success' | 'error' | 'info'; mensaje: string } | null>(null);

  const showToast = (tipo: 'success' | 'error' | 'info', mensaje: string) => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Carga de datos de caja
  const cargarDatos = useCallback(async () => {
    try {
      const [resSession, resMesas, resMetricas] = await Promise.all([
        mockCajaService.getEstadoSesion(),
        mockCajaService.getMesasMonitor(),
        mockCajaService.getMetricasPos(),
      ]);

      if (resSession.exito && resSession.datos) {
        setSession(resSession.datos);
      }
      if (resMesas.exito && resMesas.datos) {
        setMesas(resMesas.datos);
      }
      if (resMetricas.exito && resMetricas.datos) {
        setMetricas(resMetricas.datos);
      }
    } catch (err) {
      console.error('Error al cargar datos de caja:', err);
      showToast('error', 'Error al sincronizar el estado de la terminal de caja.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejador de Apertura de Turno (Vista 1)
  const handleConfirmarApertura = async (monto: number, notas?: string) => {
    setIsSubmittingApertura(true);
    try {
      const resp = await mockCajaService.abrirTurno({
        monto_apertura: monto,
        notas,
      });

      if (resp.exito && resp.datos) {
        showToast(
          'success',
          `¡Turno #${String(resp.datos.correlativo).padStart(3, '0')} aperturado con éxito! Fondo registrado: S/ ${monto.toFixed(2)}.`
        );
        await cargarDatos();
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo aperturar el turno.';
        showToast('error', errorMsg);
        await cargarDatos();
      }
    } catch {
      showToast('error', 'Fallo de comunicación al registrar la apertura.');
    } finally {
      setIsSubmittingApertura(false);
    }
  };

  // Manejador de Cobro Demostrativo (Vista 3)
  const handleConfirmarCobroMesa = async (mesaId: string) => {
    try {
      const resp = await mockCajaService.cobrarMesaMock(mesaId);
      if (resp.exito && resp.datos) {
        showToast(
          'success',
          `Mesa ${resp.datos.mesa_numero} cobrada por S/ ${resp.datos.total_cobrado.toFixed(2)}. Gaveta y métricas actualizadas.`
        );
        await cargarDatos();
      }
    } catch {
      showToast('error', 'Error al procesar el cobro de la mesa.');
    }
  };

  // Manejador de Notificar a Administración (Vista 2)
  const handleNotificarAdmin = async () => {
    try {
      const resp = await mockCajaService.notificarAdministradorCajaBloqueada(CAJERO_ACTUAL_MOCK.nombre);
      if (resp.exito && resp.datos) {
        showToast(
          'info',
          `Aviso enviado: ${resp.datos.admin_nombre} (Administradora) resolverá el cierre en CU-ADMIN-14.`
        );
      }
    } catch {
      showToast('error', 'Error al notificar a la administración.');
    }
  };

  // Manejador de Simulación de Cierre Formal desde CU-ADMIN-14
  const handleSimularCierreAdmin14 = async () => {
    mockCajaService.simularCierreDesdeCuAdmin14QA();
    showToast(
      'success',
      'Cierre formal ejecutado por Mariana Ramos en CU-ADMIN-14. Terminal liberada para nueva apertura.'
    );
    await cargarDatos();
  };

  // Manejador de Cambio de Escenario QA
  const handleSelectEscenarioQA = async (
    escenario: 'cerrada' | 'conflicto_409' | 'abierta_operativa' | 'forzar_cierre' | 'restablecer'
  ) => {
    if (escenario === 'cerrada') {
      mockCajaService.simularCajaCerradaQA();
      showToast('info', 'Sandbox: Caja cerrada. Mostrando Vista 1 (Modal de Apertura).');
    } else if (escenario === 'conflicto_409') {
      mockCajaService.simularTurnoPrevioAbiertoQA();
      showToast('error', 'Sandbox: Provocando conflicto 409 (Turno previo no cerrado). Mostrando Vista 2.');
    } else if (escenario === 'abierta_operativa') {
      mockCajaService.simularTurnoAbiertoOperativoQA();
      showToast('success', 'Sandbox: Turno #042 de Carlos Mendoza activo. Mostrando Vista 3 (POS Desbloqueado).');
    } else if (escenario === 'forzar_cierre') {
      mockCajaService.simularCierreDesdeCuAdmin14QA();
      showToast('info', 'Sandbox: Cierre de caja ejecutado por Administradora en CU-ADMIN-14.');
    } else if (escenario === 'restablecer') {
      mockCajaService.restablecerSemillasCajaQA();
      showToast('info', 'Sandbox: Semillas restablecidas al estado cerrado inicial.');
    }
    await cargarDatos();
  };

  if (loading || !session || !metricas) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-aurea-copper mb-3" />
        <p className="text-sm font-medium">Verificando estado de la terminal de caja...</p>
      </div>
    );
  }

  // Determinación de la Vista Canónica
  const turnoActivo: CajaTurnoDTO | null = session.turno_activo || null;
  const isTurnoPrevioDeOtroCajero =
    turnoActivo !== null && turnoActivo.cajero_id !== CAJERO_ACTUAL_MOCK.id;
  const isCajaCerrada = session.estado_caja === 'cerrada' && !turnoActivo;
  const isPosDesbloqueado = turnoActivo !== null && !isTurnoPrevioDeOtroCajero;

  const estadoBadgeTexto = isTurnoPrevioDeOtroCajero
    ? '409 Conflicto'
    : isCajaCerrada
    ? 'Caja Cerrada'
    : 'Turno Abierto';

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

      {/* Contenido Base del Monitor POS (Atenuado si está bloqueado, plenamente interactivo si está desbloqueado) */}
      <div className={!isPosDesbloqueado ? 'opacity-30 pointer-events-none filter blur-[1px]' : ''}>
        <MonitorCajaPosView
          turnoActivo={
            turnoActivo || {
              id: 'turno-temp',
              local_id: 'local-1',
              cajero_id: CAJERO_ACTUAL_MOCK.id,
              cajero_nombre: CAJERO_ACTUAL_MOCK.nombre,
              correlativo: session.correlativo_proyectado,
              monto_apertura: 0,
              estado: 'cerrada',
              fecha_apertura: new Date().toISOString(),
              total_ventas: 0,
              monto_ventas: 0,
              efectivo_actual: 0,
            }
          }
          mesas={mesas}
          metricas={metricas}
          onSolicitarCobroMesa={(mesa) => setMesaCobroActiva(mesa)}
          onProcederCierre={() => {
            showToast('info', 'Redirigiendo a Arqueo y Cierre Z (CU-CAJA-03/05)...');
            navigate(ROUTES.CAJERO_TURNO);
          }}
        />
      </div>

      {/* VISTA 1: Modal de Apertura de Turno (Gating Central con Backdrop Oscuro 75%) */}
      {isCajaCerrada && (
        <ModalAperturaTurno
          isOpen={true}
          correlativoProyectado={session.correlativo_proyectado}
          sedeNombre={session.sede_nombre}
          onConfirmarApertura={handleConfirmarApertura}
          onCerrarSesion={() => {
            navigate(ROUTES.ADMIN_DASHBOARD);
          }}
          isSubmitting={isSubmittingApertura}
        />
      )}

      {/* VISTA 2: Bloqueo de Pantalla por Conflicto 409 (Turno Previo Pendiente de Cierre) */}
      {isTurnoPrevioDeOtroCajero && (
        <ModalBloqueoTurnoPrevio
          isOpen={true}
          turnoActivo={turnoActivo}
          onNotificarAdmin={handleNotificarAdmin}
          onCerrarSesion={() => {
            navigate(ROUTES.LOGIN);
          }}
          onSimularCierreAdmin14={handleSimularCierreAdmin14}
        />
      )}

      {/* Sub-modal demostrativo de Precuenta y Cobro (CU-CAJA-02) */}
      <ModalCobroPrecuentaDemo
        isOpen={Boolean(mesaCobroActiva)}
        mesa={mesaCobroActiva}
        onClose={() => setMesaCobroActiva(null)}
        onConfirmarCobro={handleConfirmarCobroMesa}
      />

      {/* Widget Flotante de Pruebas QA (Esquina inferior derecha) */}
      <DemoCajaTurnoWidget
        onSelectEscenario={handleSelectEscenarioQA}
        estadoActual={estadoBadgeTexto}
      />
    </div>
  );
};
