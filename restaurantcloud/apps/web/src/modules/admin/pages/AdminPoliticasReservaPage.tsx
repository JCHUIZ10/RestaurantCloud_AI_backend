import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PoliticasReservaDTO, ReservaResumenDTO } from '@/types/admin';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';
import { PoliticasHeader } from '../components/politicas/PoliticasHeader';
import { SwitchMaestroReservas } from '../components/politicas/SwitchMaestroReservas';
import { PanelParametrosView } from '../components/politicas/PanelParametrosView';
import { SimuladorLineaTiempoView } from '../components/politicas/SimuladorLineaTiempoView';
import { ModalBloqueoDesactivacion } from '../components/politicas/ModalBloqueoDesactivacion';
import { PaywallStarterReservas } from '../components/politicas/PaywallStarterReservas';
import { DemoAdminPoliticasWidget } from '../components/politicas/DemoAdminPoliticasWidget';

export const AdminPoliticasReservaPage: React.FC = () => {
  // Estado de carga y plan
  const [cargando, setCargando] = useState(true);
  const [esPlanStarter, setEsPlanStarter] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);

  // Vistas activas: 'parametros' | 'simulador'
  const [vistaActiva, setVistaActiva] = useState<'parametros' | 'simulador'>('parametros');

  // Datos de políticas
  const [politicasOriginales, setPoliticasOriginales] = useState<PoliticasReservaDTO | null>(null);
  const [politicasBorrador, setPoliticasBorrador] = useState<PoliticasReservaDTO | null>(null);

  // Feedback Toast
  const [toastMensaje, setToastMensaje] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  // Modal de bloqueo 409 por reservas activas
  const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false);
  const [reservasConflicto, setReservasConflicto] = useState<ReservaResumenDTO[]>([]);

  // Disparar toast temporal
  const mostrarToast = useCallback((texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
    setToastMensaje({ tipo, texto });
    setTimeout(() => {
      setToastMensaje(null);
    }, 4500);
  }, []);

  // Cargar políticas desde el servicio
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await mockAdminService.getPoliticasReserva();
      if (!resp.exito) {
        if (resp.errores?.some((e) => e.codigo === 'ERR_MODULO_RESERVAS_NO_CONTRATADO')) {
          setEsPlanStarter(true);
        } else {
          mostrarToast(resp.errores?.[0]?.mensaje || 'Error al cargar políticas', 'error');
        }
        setPoliticasOriginales(null);
        setPoliticasBorrador(null);
      } else {
        setEsPlanStarter(false);
        setPoliticasOriginales(JSON.parse(JSON.stringify(resp.datos)));
        setPoliticasBorrador(JSON.parse(JSON.stringify(resp.datos)));
      }
    } catch (err) {
      mostrarToast('Error de conexión al cargar parámetros', 'error');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Detección de cambios sin guardar
  const isDirty = Boolean(
    politicasOriginales &&
      politicasBorrador &&
      JSON.stringify(politicasOriginales) !== JSON.stringify(politicasBorrador)
  );

  // Modificación de campos en el borrador
  const handleCambiarCampo = <K extends keyof PoliticasReservaDTO>(campo: K, valor: PoliticasReservaDTO[K]) => {
    if (!politicasBorrador) return;
    setPoliticasBorrador({
      ...politicasBorrador,
      [campo]: valor,
    });
  };

  // Switch maestro
  const handleToggleAceptaReservas = async (nuevoEstado: boolean) => {
    if (!politicasBorrador) return;

    // Si se intenta desactivar el interruptor maestro, prechequear salvaguarda
    if (!nuevoEstado) {
      const precheck = await mockAdminService.precheckDesactivacionReservas();
      if (precheck.exito && !precheck.datos.permite_desactivar) {
        // Bloquear y abrir modal 409
        setReservasConflicto(precheck.datos.reservas || []);
        setModalBloqueoAbierto(true);
        return; // No mutar el borrador a inactivo
      }
    }

    handleCambiarCampo('acepta_reservas', nuevoEstado);
  };

  // Guardar configuración completa
  const handleGuardar = async () => {
    if (!politicasBorrador) return;
    setIsGuardando(true);

    try {
      const resp = await mockAdminService.actualizarPoliticasReserva({
        acepta_reservas: politicasBorrador.acepta_reservas,
        duracion_reserva_min: politicasBorrador.duracion_reserva_min,
        buffer_reserva_min: politicasBorrador.buffer_reserva_min,
        tolerancia_no_show_min: politicasBorrador.tolerancia_no_show_min,
        minutos_bloqueo_previo: politicasBorrador.minutos_bloqueo_previo,
        margen_recordatorio_min: politicasBorrador.margen_recordatorio_min,
        anticipacion_minima_horas: politicasBorrador.anticipacion_minima_horas,
        anticipacion_maxima_dias: politicasBorrador.anticipacion_maxima_dias,
      });

      if (!resp.exito) {
        // Detección de 409 Conflict
        if (resp.errores?.some((e) => e.codigo === 'ERR_RESERVAS_FUTURAS_PENDIENTES')) {
          const datosConflicto = resp.datos as any;
          setReservasConflicto(datosConflicto?.reservas || []);
          setModalBloqueoAbierto(true);
          // Restaurar borrador de recepción a activo
          setPoliticasBorrador((prev) => (prev ? { ...prev, acepta_reservas: true } : prev));
        } else {
          mostrarToast(resp.errores?.[0]?.mensaje || 'No se pudieron guardar las políticas', 'error');
        }
      } else {
        setPoliticasOriginales(JSON.parse(JSON.stringify(resp.datos)));
        setPoliticasBorrador(JSON.parse(JSON.stringify(resp.datos)));
        mostrarToast('Políticas de reserva actualizadas exitosamente en Sede Miraflores', 'exito');
      }
    } catch (err) {
      mostrarToast('Error de comunicación con el servidor', 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  // Descartar cambios
  const handleDescartar = () => {
    if (politicasOriginales) {
      setPoliticasBorrador(JSON.parse(JSON.stringify(politicasOriginales)));
      mostrarToast('Cambios descartados', 'info');
    }
  };

  // Restaurar recomendados
  const handleRestaurarRecomendados = async () => {
    setIsGuardando(true);
    try {
      const resp = await mockAdminService.restaurarPoliticasDefault();
      if (resp.exito) {
        setPoliticasOriginales(JSON.parse(JSON.stringify(resp.datos)));
        setPoliticasBorrador(JSON.parse(JSON.stringify(resp.datos)));
        mostrarToast('Parámetros restablecidos a los valores recomendados de salón', 'exito');
      }
    } catch (err) {
      mostrarToast('Error al restaurar valores recomendados', 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  // Aplicar parámetros desde el simulador
  const handleAplicarDesdeSimulador = (nuevos: Partial<PoliticasReservaDTO>) => {
    if (!politicasBorrador) return;
    setPoliticasBorrador({
      ...politicasBorrador,
      ...nuevos,
    });
    mostrarToast('Parámetros aplicados al borrador de configuración', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Flotante */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300 ${
            toastMensaje.tipo === 'exito'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-600'
              : toastMensaje.tipo === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-700'
              : 'bg-stone-900 text-stone-100 border-stone-700'
          }`}
        >
          {toastMensaje.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMensaje.tipo === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMensaje.tipo === 'info' && <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toastMensaje.texto}</span>
        </div>
      )}

      {/* Si la sede está en Plan Starter, mostrar Paywall Didáctico */}
      {esPlanStarter ? (
        <PaywallStarterReservas onVerPlanes={() => mostrarToast('Contacta a comercial@restaurantcloud.pe para ampliar tu suscripción', 'info')} />
      ) : cargando || !politicasBorrador ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-aurea-navy border-t-aurea-copper rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">
            Cargando políticas y parámetros de reserva de Sede Miraflores...
          </span>
        </div>
      ) : (
        <>
          {/* Encabezado Principal */}
          <PoliticasHeader
            vistaActiva={vistaActiva}
            onCambiarVista={setVistaActiva}
            onRestaurarRecomendados={handleRestaurarRecomendados}
            isGuardando={isGuardando}
          />

          {/* Switch Maestro de Habilitación de Reservas */}
          <SwitchMaestroReservas
            aceptaReservas={politicasBorrador.acepta_reservas}
            onToggle={handleToggleAceptaReservas}
            disabled={isGuardando}
          />

          {/* Vistas Alternables: Panel de Parámetros vs Simulador */}
          {vistaActiva === 'parametros' ? (
            <PanelParametrosView
              politicas={politicasBorrador}
              onChangeCampo={handleCambiarCampo}
              onRestaurarRecomendados={handleRestaurarRecomendados}
              onDescartarCambios={handleDescartar}
              onGuardar={handleGuardar}
              isDirty={isDirty}
              isGuardando={isGuardando}
            />
          ) : (
            <SimuladorLineaTiempoView
              politicas={politicasBorrador}
              onVolverPanel={() => setVistaActiva('parametros')}
              onAplicarParametros={handleAplicarDesdeSimulador}
            />
          )}
        </>
      )}

      {/* Modal de Bloqueo 409 por reservas activas */}
      <ModalBloqueoDesactivacion
        isOpen={modalBloqueoAbierto}
        onClose={() => setModalBloqueoAbierto(false)}
        onIrAGestionReservas={() => {
          setModalBloqueoAbierto(false);
          mostrarToast('Navegando a la consola operativa de reservas...', 'info');
        }}
        reservas={reservasConflicto}
      />

      {/* QA Test Bench Flotante */}
      <DemoAdminPoliticasWidget onRecargar={cargarDatos} />
    </div>
  );
};
