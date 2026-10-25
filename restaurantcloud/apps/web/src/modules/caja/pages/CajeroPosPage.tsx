import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/router/routes.constants';
import {
  EstadoCajaSesionDTO,
  MesaCajaMonitorDTO,
  CajaMetricasPosDTO,
  CajaTurnoDTO,
  PrecuentaResponseDTO,
  SubcuentaComandaDTO,
  ProcesarCobroFiscalResponseDTO,
} from '@/types/caja';
import {
  cajaService,
} from '@/services/serviceAdapter';
import {
  mockCajaService,
  CAJERO_ACTUAL_MOCK,
} from '../services/mockCajaService';
import { ModalAperturaTurno } from '../components/apertura/ModalAperturaTurno';
import { ModalBloqueoTurnoPrevio } from '../components/apertura/ModalBloqueoTurnoPrevio';
import { MonitorCajaPosView } from '../components/monitor/MonitorCajaPosView';
import { ModalCobroFiscalPos } from '../components/cobro/ModalCobroFiscalPos';
import { ModalPrecuentaCompleta } from '@/modules/mozo/components/precuenta/ModalPrecuentaCompleta';
import { ModalDividirCuenta } from '@/modules/mozo/components/split/ModalDividirCuenta';
import { ModalHistorialComprobantesPos } from '../components/comprobantes/ModalHistorialComprobantesPos';
import { ModalEmisionNotaCredito } from '../components/comprobantes/ModalEmisionNotaCredito';
import { DemoCajaTurnoWidget } from '../components/demo/DemoCajaTurnoWidget';
import type { DividirCuentaResponseDTO } from '@/types/mozo';
import type {
  ComprobanteHistorialItemDTO,
  EmitirNotaCreditoResponseDTO,
} from '@/types/caja';
import { SoloDemo } from '@/components/ui/SoloDemo';
import { useCerrarSesion } from '@/shared/hooks/useCerrarSesion';

export const CajeroPosPage: React.FC = () => {
  const navigate = useNavigate();
  const cerrarSesion = useCerrarSesion();
  const usuario = useAuthStore((s) => s.usuario);

  // Estados de datos
  const [session, setSession] = useState<EstadoCajaSesionDTO | null>(null);
  const [mesas, setMesas] = useState<MesaCajaMonitorDTO[]>([]);
  const [metricas, setMetricas] = useState<CajaMetricasPosDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmittingApertura, setIsSubmittingApertura] = useState<boolean>(false);

  // Modales Canónicos Unificados
  const [mesaPrecuentaActiva, setMesaPrecuentaActiva] = useState<MesaCajaMonitorDTO | null>(null);
  const [mesaDividirActiva, setMesaDividirActiva] = useState<MesaCajaMonitorDTO | null>(null);
  const [mesaCobroFiscalActiva, setMesaCobroFiscalActiva] = useState<MesaCajaMonitorDTO | null>(null);
  const [subcuentaCobroFiscalActiva, setSubcuentaCobroFiscalActiva] = useState<SubcuentaComandaDTO | null>(null);
  const [precuentaFiscalActiva, setPrecuentaFiscalActiva] = useState<PrecuentaResponseDTO | null>(null);

  // Estados para CU-CAJA-04: Historial de Comprobantes y Anulaciones / Nota de Crédito
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState<boolean>(false);
  const [comprobanteParaAnular, setComprobanteParaAnular] = useState<ComprobanteHistorialItemDTO | null>(null);

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
        cajaService.getEstadoSesion(),
        cajaService.getMesasMonitor(),
        cajaService.getMetricasPos(),
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

    // Short Polling silencioso de mesas y métricas cada 3.5 segundos
    const pollingMesasInterval = setInterval(async () => {
      try {
        const [resMesas, resMetricas] = await Promise.all([
          cajaService.getMesasMonitor(),
          cajaService.getMetricasPos(),
        ]);
        if (resMesas?.exito && resMesas.datos) {
          setMesas(resMesas.datos);
        }
        if (resMetricas?.exito && resMetricas.datos) {
          setMetricas(resMetricas.datos);
        }
      } catch {
        // Silencioso: no interrumpe la UI del cajero
      }
    }, 3500);

    // Polling de sincronización de estado de sesión/turno cada 10 segundos
    const pollingSessionInterval = setInterval(async () => {
      try {
        const resSession = await cajaService.getEstadoSesion();
        if (resSession?.exito && resSession.datos) {
          setSession((prev) => {
            if (!prev) return resSession.datos;
            if (
              prev.estado_caja !== resSession.datos.estado_caja ||
              prev.turno_activo?.id !== resSession.datos.turno_activo?.id ||
              (prev.turno_activo &&
                resSession.datos.turno_activo &&
                (prev.turno_activo.total_ventas !== resSession.datos.turno_activo.total_ventas ||
                  prev.turno_activo.efectivo_actual !== resSession.datos.turno_activo.efectivo_actual))
            ) {
              return resSession.datos;
            }
            return prev;
          });
        }
      } catch {
        // Silencioso
      }
    }, 10000);

    return () => {
      clearInterval(pollingMesasInterval);
      clearInterval(pollingSessionInterval);
    };
  }, [cargarDatos]);

  // Atajo de teclado global F4 para alternar Historial de Comprobantes (CU-CAJA-04)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setModalHistorialAbierto((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manejador de Apertura de Turno (Vista 1)
  const handleConfirmarApertura = async (monto: number, notas?: string) => {
    setIsSubmittingApertura(true);
    try {
      const resp = await cajaService.abrirTurno({
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

  // 1. Abrir Modal Canónico de Precuenta (CU-MOZO-08 / CU-CAJA-02)
  const handleAbrirPrecuenta = (mesa: MesaCajaMonitorDTO) => {
    setMesaPrecuentaActiva(mesa);
  };

  // 2. Abrir Modal Canónico de Dividir Cuenta (CU-MOZO-09 / CU-CAJA-04)
  const handleAbrirDividir = (mesa: MesaCajaMonitorDTO) => {
    setMesaDividirActiva(mesa);
  };

  // 3. Abrir Emisión de Comprobante Fiscal (CU-CAJA-03)
  const handleAbrirEmitirComprobante = async (mesa: MesaCajaMonitorDTO, subcuenta?: SubcuentaComandaDTO) => {
    let precuentaData: PrecuentaResponseDTO | null = null;
    try {
      const res = await cajaService.getPrecuentaMesa(mesa.id);
      if (res.exito && res.datos) {
        precuentaData = res.datos;
        setPrecuentaFiscalActiva(res.datos);
      } else {
        setPrecuentaFiscalActiva(null);
      }
    } catch {
      setPrecuentaFiscalActiva(null);
    }
    const mesaConPedido: MesaCajaMonitorDTO = {
      ...mesa,
      pedido_id: mesa.pedido_id || precuentaData?.pedido_id,
    };
    setMesaCobroFiscalActiva(mesaConPedido);
    setSubcuentaCobroFiscalActiva(subcuenta || null);
  };

  // Manejador tras notificar precuenta en mesa (Conmuta a CUENTA PEDIDA)
  const handlePrecuentaNotificada = async (mesaId: string, totalNeto: number) => {
    try {
      const resp = await cajaService.conmutarACuentaPedida(mesaId);
      if (resp.exito && resp.datos) {
        showToast(
          'success',
          `Mesa ${resp.datos.numero} conmutada a CUENTA PEDIDA (Esperando Comprobante). Total fijado: S/ ${totalNeto.toFixed(2)}.`
        );
      }
    } catch {
      showToast('error', 'Error al actualizar el estado de la mesa a Cuenta Pedida.');
    } finally {
      setMesaPrecuentaActiva(null);
      await cargarDatos();
    }
  };

  // Manejador tras confirmar división de cuenta en mesa (Conmuta a CUENTA PEDIDA con subcuentas)
  const handleDivisionConfirmada = async (datos: DividirCuentaResponseDTO) => {
    try {
      const subcuentasDTO: SubcuentaComandaDTO[] = datos.subcuentas_resumen.map((s) => ({
        id: s.id,
        numero_subcuenta: s.numero,
        titular_referencia: s.nombre_referencia,
        subtotal_bruto: s.total,
        descuento: 0,
        total_neto: s.total,
        tipo_comprobante_sugerido: (s.tipo_comprobante.toUpperCase() as 'BOLETA' | 'FACTURA' | 'NOTA_VENTA') || 'BOLETA',
        estado: s.estado,
        estado_pago: s.estado,
        items: [],
      }));

      await mockCajaService.registrarDivisionCuenta(datos.mesa_id, subcuentasDTO);
      showToast(
        'success',
        `Mesa ${datos.mesa_numero} subdividida en ${datos.partes} cuentas. Estado conmutado a CUENTA PEDIDA (Esperando Comprobante).`
      );
    } catch {
      showToast('error', 'Error al registrar la subdivisión de cuenta en la comanda.');
    } finally {
      setMesaDividirActiva(null);
      await cargarDatos();
    }
  };

  // Manejador tras emitir comprobante fiscal (CU-CAJA-03)
  const handleComprobanteEmitido = async (response: ProcesarCobroFiscalResponseDTO) => {
    await cargarDatos();
    if (response.mesa_liberada) {
      showToast(
        'success',
        `Comprobante ${response.serie_numero} emitido exitosamente por S/ ${response.total_cobrado.toFixed(2)}. ¡Mesa ${response.mesa_numero} liberada!`
      );
      setMesaCobroFiscalActiva(null);
      setSubcuentaCobroFiscalActiva(null);
      setPrecuentaFiscalActiva(null);
    } else {
      showToast(
        'info',
        `Comprobante ${response.serie_numero} emitido por S/ ${response.total_cobrado.toFixed(2)}. Quedan ${response.subcuentas_pendientes} subcuentas pendientes en Mesa ${response.mesa_numero}.`
      );
      if (mesaCobroFiscalActiva) {
        const res = await cajaService.getPrecuentaMesa(mesaCobroFiscalActiva.id);
        if (res.exito && res.datos) {
          setPrecuentaFiscalActiva(res.datos);
        }
      }
      setSubcuentaCobroFiscalActiva(null);
    }
  };

  // ============================================================================
  // Manejadores para CU-CAJA-04: Anulación de Comprobante y Nota de Crédito
  // ============================================================================
  const handleAnularComprobanteDesdeHistorial = (comp: ComprobanteHistorialItemDTO) => {
    setComprobanteParaAnular(comp);
  };

  const handleNotaCreditoEmitida = async (nc: EmitirNotaCreditoResponseDTO) => {
    showToast(
      'success',
      `Nota de Crédito ${nc.serie_numero} emitida con éxito. Comprobante ${nc.documento_modificado} anulado formalmente.`
    );
    await cargarDatos();
  };

  const handleVerComprobanteDesdeHistorial = (comp: ComprobanteHistorialItemDTO, esNC?: boolean) => {
    const token = (esNC && comp.nota_credito_token) ? comp.nota_credito_token : comp.token_digital;
    const url = token ? `${window.location.origin}/c/${token}` : comp.url_publica_qr;
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Manejador de Notificar a Administración (Vista 2)
  const handleNotificarAdmin = async () => {
    try {
      const nombreCajero = usuario?.nombre || CAJERO_ACTUAL_MOCK.nombre;
      const resp = await mockCajaService.notificarAdministradorCajaBloqueada(nombreCajero);
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
      showToast('success', 'Sandbox: Turno #042 activo. Salón operativo listo.');
    } else if (escenario === 'forzar_cierre') {
      mockCajaService.simularCierreDesdeCuAdmin14QA();
      showToast('info', 'Sandbox: Cierre de caja ejecutado por Administradora en CU-ADMIN-14.');
    } else if (escenario === 'restablecer') {
      mockCajaService.restablecerSemillasCajaQA();
      showToast('info', 'Sandbox: Semillas restablecidas al estado cerrado inicial.');
    }
    await cargarDatos();
  };

  // Demo QA: Abrir mesa directamente
  const handleSelectMesaDemo = (mesaId: string) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa) return;
    if (mesa.estado === 'cuenta_pedida') {
      handleAbrirEmitirComprobante(mesa);
    } else if (mesa.estado === 'ocupada') {
      handleAbrirPrecuenta(mesa);
    }
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
  const currentUserId = usuario?.id || CAJERO_ACTUAL_MOCK.id;
  const isTurnoPrevioDeOtroCajero =
    turnoActivo !== null && turnoActivo.cajero_id !== currentUserId;
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

      {/* Contenido Base del Monitor POS (Atenuado si está bloqueado, plenamente interactivo si está desbloqueado) */}
      <div className={!isPosDesbloqueado ? 'opacity-30 pointer-events-none filter blur-[1px]' : ''}>
        <MonitorCajaPosView
          turnoActivo={
            turnoActivo || {
              id: 'turno-temp',
              local_id: session.sede_nombre || 'local-1',
              cajero_id: currentUserId,
              cajero_nombre: usuario?.nombre || CAJERO_ACTUAL_MOCK.nombre,
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
          onAbrirPrecuenta={handleAbrirPrecuenta}
          onAbrirDividir={handleAbrirDividir}
          onEmitirComprobante={handleAbrirEmitirComprobante}
          onAbrirHistorialComprobantes={() => setModalHistorialAbierto(true)}
          onProcederCierre={() => {
            showToast('info', 'Redirigiendo a Arqueo y Cierre Z (CU-CAJA-05)...');
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
          onCerrarSesion={cerrarSesion}
          isSubmitting={isSubmittingApertura}
        />
      )}

      {/* VISTA 2: Bloqueo de Pantalla por Conflicto 409 (Turno Previo Pendiente de Cierre) */}
      {isTurnoPrevioDeOtroCajero && (
        <ModalBloqueoTurnoPrevio
          isOpen={true}
          turnoActivo={turnoActivo}
          onNotificarAdmin={handleNotificarAdmin}
          onCerrarSesion={cerrarSesion}
          onSimularCierreAdmin14={handleSimularCierreAdmin14}
        />
      )}

      {/* MODAL 1: Precuenta Completa en Mesa (Reutilización Canónica de CU-MOZO-08) */}
      {mesaPrecuentaActiva && (
        <ModalPrecuentaCompleta
          isOpen={Boolean(mesaPrecuentaActiva)}
          onClose={() => setMesaPrecuentaActiva(null)}
          mesaId={mesaPrecuentaActiva.id}
          mesaEstadoActual={mesaPrecuentaActiva.estado}
          onCuentaNotificada={handlePrecuentaNotificada}
          actor="cajero"
        />
      )}

      {/* MODAL 2: Dividir Cuenta en Mesa (Reutilización Canónica de CU-MOZO-09) */}
      {mesaDividirActiva && (
        <ModalDividirCuenta
          isOpen={Boolean(mesaDividirActiva)}
          onClose={() => setMesaDividirActiva(null)}
          mesaId={mesaDividirActiva.id}
          onDivisionConfirmada={handleDivisionConfirmada}
          actor="cajero"
        />
      )}

      {/* MODAL 3: Emisión de Comprobante Fiscal SUNAT (CU-CAJA-03 Oficial) */}
      {mesaCobroFiscalActiva && (
        <ModalCobroFiscalPos
          isOpen={Boolean(mesaCobroFiscalActiva)}
          mesa={mesaCobroFiscalActiva}
          subcuenta={subcuentaCobroFiscalActiva}
          precuenta={precuentaFiscalActiva}
          onClose={() => {
            setMesaCobroFiscalActiva(null);
            setSubcuentaCobroFiscalActiva(null);
            setPrecuentaFiscalActiva(null);
          }}
          onComprobanteEmitido={handleComprobanteEmitido}
        />
      )}

      {/* MODAL 4: Historial de Comprobantes Emitidos en Turno (CU-CAJA-04 Vista 1) */}
      {modalHistorialAbierto && turnoActivo && (
        <ModalHistorialComprobantesPos
          isOpen={modalHistorialAbierto}
          onClose={() => setModalHistorialAbierto(false)}
          turnoActivo={turnoActivo}
          onAnularComprobante={handleAnularComprobanteDesdeHistorial}
          onVerComprobante={handleVerComprobanteDesdeHistorial}
        />
      )}

      {/* MODAL 5: Emisión de Nota de Crédito Electrónica SUNAT (CU-CAJA-04 Vista 2 y 3) */}
      {comprobanteParaAnular && (
        <ModalEmisionNotaCredito
          isOpen={Boolean(comprobanteParaAnular)}
          comprobanteId={comprobanteParaAnular.id}
          onClose={() => setComprobanteParaAnular(null)}
          onNotaCreditoEmitida={handleNotaCreditoEmitida}
        />
      )}

      {/* Widget Flotante de Pruebas QA (Esquina inferior derecha) */}
      <SoloDemo>
        <DemoCajaTurnoWidget
          onSelectEscenario={handleSelectEscenarioQA}
          estadoActual={estadoBadgeTexto}
          onSelectMesaDemo={handleSelectMesaDemo}
        />
      </SoloDemo>
    </div>
  );
};
