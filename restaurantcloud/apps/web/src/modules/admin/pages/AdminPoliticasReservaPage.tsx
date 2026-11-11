import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { PoliticasReservaDTO, ReservaResumenDTO } from '@/types/admin';
import { politicasReservaService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import { EstadoError, ModalConfirmacion, useToast } from '@/components/ui';
import { PoliticasHeader } from '../components/politicas/PoliticasHeader';
import { SwitchMaestroReservas } from '../components/politicas/SwitchMaestroReservas';
import { PanelParametrosView } from '../components/politicas/PanelParametrosView';
import { SimuladorLineaTiempoView } from '../components/politicas/SimuladorLineaTiempoView';
import { ModalBloqueoDesactivacion } from '../components/politicas/ModalBloqueoDesactivacion';
import { PaywallStarterReservas } from '../components/politicas/PaywallStarterReservas';

const copiar = (politicas: PoliticasReservaDTO): PoliticasReservaDTO => JSON.parse(JSON.stringify(politicas));

export const AdminPoliticasReservaPage: React.FC = () => {
  const { mostrar } = useToast();

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [moduloNoContratado, setModuloNoContratado] = useState<string | null>(null);
  const [isGuardando, setIsGuardando] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'parametros' | 'simulador'>('parametros');

  // Valores persistidos y borrador editable
  const [politicasOriginales, setPoliticasOriginales] = useState<PoliticasReservaDTO | null>(null);
  const [politicasBorrador, setPoliticasBorrador] = useState<PoliticasReservaDTO | null>(null);

  // Apagar el canal con reservas pendientes: el administrador debe confirmarlo
  const [modalReservasAbierto, setModalReservasAbierto] = useState(false);
  const [reservasPendientes, setReservasPendientes] = useState<ReservaResumenDTO[]>([]);
  const [desactivacionConfirmada, setDesactivacionConfirmada] = useState(false);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);

  // Descarta respuestas de cargas que ya no corresponden (recargas encadenadas)
  const cargaRef = useRef(0);

  const aplicarPersistidas = useCallback((politicas: PoliticasReservaDTO) => {
    setPoliticasOriginales(copiar(politicas));
    setPoliticasBorrador(copiar(politicas));
    setDesactivacionConfirmada(false);
  }, []);

  const cargarDatos = useCallback(async () => {
    const carga = ++cargaRef.current;
    setCargando(true);
    setErrorCarga(null);
    try {
      const resp = await politicasReservaService.getPoliticasReserva();
      if (carga !== cargaRef.current) return;

      if (resp.exito && resp.datos) {
        setModuloNoContratado(null);
        aplicarPersistidas(resp.datos);
      } else if (resp.errores?.[0]?.codigo === 'ERR_MODULO_RESERVAS_NO_CONTRATADO') {
        setModuloNoContratado(resp.errores[0].mensaje);
      } else {
        setErrorCarga(resp.errores?.[0]?.mensaje ?? 'No se pudieron cargar las políticas de reserva.');
      }
    } catch (error) {
      if (carga === cargaRef.current) {
        setErrorCarga(mensajeDeErrorApi(error, 'No se pudo conectar con el servidor para cargar las políticas.'));
      }
    } finally {
      if (carga === cargaRef.current) setCargando(false);
    }
  }, [aplicarPersistidas]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const isDirty = Boolean(
    politicasOriginales &&
      politicasBorrador &&
      (JSON.stringify(politicasOriginales) !== JSON.stringify(politicasBorrador) || desactivacionConfirmada)
  );

  // Cambios sin guardar: avisar antes de salir de la pantalla o cerrar la pestaña
  const bloqueador = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!isDirty) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [isDirty]);

  const handleCambiarCampo = <K extends keyof PoliticasReservaDTO>(campo: K, valor: PoliticasReservaDTO[K]) => {
    setPoliticasBorrador((actual) => (actual ? { ...actual, [campo]: valor } : actual));
  };

  // Interruptor maestro: al apagarlo se consultan las reservas pendientes, que siguen vigentes
  const handleToggleAceptaReservas = async (nuevoEstado: boolean) => {
    if (nuevoEstado) {
      setDesactivacionConfirmada(false);
      handleCambiarCampo('acepta_reservas', true);
      return;
    }

    // Si el canal ya estaba suspendido al cargar, volver a apagarlo no cambia nada que confirmar
    if (politicasOriginales && !politicasOriginales.acepta_reservas) {
      handleCambiarCampo('acepta_reservas', false);
      return;
    }

    try {
      const precheck = await politicasReservaService.precheckDesactivacionReservas();
      if (!precheck.exito) {
        if (precheck.errores?.[0]?.codigo === 'ERR_MODULO_RESERVAS_NO_CONTRATADO') {
          setModuloNoContratado(precheck.errores[0].mensaje);
        } else {
          mostrar(precheck.errores?.[0]?.mensaje ?? 'No se pudo verificar las reservas pendientes.', 'error');
        }
        return;
      }

      if (precheck.datos.total_pendientes > 0) {
        setReservasPendientes(precheck.datos.reservas ?? []);
        setModalReservasAbierto(true);
        return;
      }

      handleCambiarCampo('acepta_reservas', false);
    } catch (error) {
      mostrar(mensajeDeErrorApi(error, 'No se pudo verificar las reservas pendientes.'), 'error');
    }
  };

  const handleApagarIgualmente = () => {
    handleCambiarCampo('acepta_reservas', false);
    setDesactivacionConfirmada(true);
    setModalReservasAbierto(false);
    mostrar('El canal se suspenderá al guardar. Las reservas pendientes siguen vigentes.', 'info');
  };

  const handleGuardar = async () => {
    if (!politicasBorrador || isGuardando) return;
    setIsGuardando(true);

    try {
      const resp = await politicasReservaService.actualizarPoliticasReserva({
        acepta_reservas: politicasBorrador.acepta_reservas,
        duracion_reserva_min: politicasBorrador.duracion_reserva_min,
        buffer_reserva_min: politicasBorrador.buffer_reserva_min,
        tolerancia_no_show_min: politicasBorrador.tolerancia_no_show_min,
        minutos_bloqueo_previo: politicasBorrador.minutos_bloqueo_previo,
        margen_recordatorio_min: politicasBorrador.margen_recordatorio_min,
        anticipacion_minima_horas: politicasBorrador.anticipacion_minima_horas,
        anticipacion_maxima_dias: politicasBorrador.anticipacion_maxima_dias,
        confirmar_desactivacion: !politicasBorrador.acepta_reservas && desactivacionConfirmada,
        updated_at: politicasOriginales?.updated_at,
      });

      if (resp.exito && resp.datos) {
        aplicarPersistidas(resp.datos);
        mostrar('Políticas de reserva guardadas', 'ok');
        return;
      }

      const error = resp.errores?.[0];
      switch (error?.codigo) {
        case 'ERR_MODULO_RESERVAS_NO_CONTRATADO':
          setModuloNoContratado(error.mensaje);
          break;
        case 'ERR_RESERVAS_FUTURAS_PENDIENTES': {
          // Aparecieron reservas desde la consulta previa: se vuelve a pedir la confirmación con la lista vigente
          const detalles = error.detalles as { reservas?: ReservaResumenDTO[] } | undefined;
          setReservasPendientes(detalles?.reservas ?? []);
          setDesactivacionConfirmada(false);
          setModalReservasAbierto(true);
          break;
        }
        case 'ERR_POLITICAS_MODIFICADAS':
          mostrar(error.mensaje, 'alerta');
          await cargarDatos();
          break;
        default:
          mostrar(error?.mensaje ?? 'No se pudieron guardar las políticas.', 'error');
      }
    } catch (error) {
      // El borrador se conserva para reintentar
      mostrar(mensajeDeErrorApi(error, 'No se pudo conectar con el servidor. Tus cambios siguen en pantalla.'), 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  const handleDescartar = () => {
    if (!politicasOriginales) return;
    setPoliticasBorrador(copiar(politicasOriginales));
    setDesactivacionConfirmada(false);
    mostrar('Cambios descartados', 'info');
  };

  // Restaura solo los parámetros; el estado del canal (interruptor) no cambia
  const handleRestaurarRecomendados = async () => {
    setConfirmarRestaurar(false);
    setIsGuardando(true);
    try {
      const resp = await politicasReservaService.restaurarPoliticasDefault();
      if (resp.exito && resp.datos) {
        aplicarPersistidas(resp.datos);
        mostrar('Parámetros restablecidos a los valores recomendados', 'ok');
      } else if (resp.errores?.[0]?.codigo === 'ERR_MODULO_RESERVAS_NO_CONTRATADO') {
        setModuloNoContratado(resp.errores[0].mensaje);
      } else {
        mostrar(resp.errores?.[0]?.mensaje ?? 'No se pudieron restaurar los valores recomendados.', 'error');
      }
    } catch (error) {
      mostrar(mensajeDeErrorApi(error, 'No se pudieron restaurar los valores recomendados.'), 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  const handleAplicarDesdeSimulador = (nuevos: Partial<PoliticasReservaDTO>) => {
    setPoliticasBorrador((actual) => (actual ? { ...actual, ...nuevos } : actual));
    mostrar('Parámetros aplicados al borrador. Guarda para confirmarlos.', 'info');
  };

  const renderContenido = () => {
    if (moduloNoContratado) {
      return <PaywallStarterReservas mensaje={moduloNoContratado} />;
    }

    if (errorCarga) {
      return <EstadoError mensaje={errorCarga} onReintentar={cargarDatos} reintentando={cargando} />;
    }

    if (cargando || !politicasBorrador) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-aurea-navy border-t-aurea-copper rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">Cargando políticas y parámetros de reserva...</span>
        </div>
      );
    }

    return (
      <>
        <PoliticasHeader
          vistaActiva={vistaActiva}
          onCambiarVista={setVistaActiva}
          onRestaurarRecomendados={() => setConfirmarRestaurar(true)}
          isGuardando={isGuardando}
          sedeNombre={politicasBorrador.local_nombre}
        />

        <SwitchMaestroReservas
          aceptaReservas={politicasBorrador.acepta_reservas}
          onToggle={handleToggleAceptaReservas}
          disabled={isGuardando}
        />

        {vistaActiva === 'parametros' ? (
          <PanelParametrosView
            politicas={politicasBorrador}
            onChangeCampo={handleCambiarCampo}
            onRestaurarRecomendados={() => setConfirmarRestaurar(true)}
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
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {renderContenido()}

      {/* Apagar el canal con reservas pendientes */}
      <ModalBloqueoDesactivacion
        isOpen={modalReservasAbierto}
        onClose={() => setModalReservasAbierto(false)}
        onApagarIgualmente={handleApagarIgualmente}
        reservas={reservasPendientes}
      />

      <ModalConfirmacion
        abierto={confirmarRestaurar}
        onCerrar={() => setConfirmarRestaurar(false)}
        onConfirmar={handleRestaurarRecomendados}
        titulo="¿Restaurar valores recomendados?"
        mensaje="Se reemplazarán los parámetros por los valores recomendados y se guardarán de inmediato. Los cambios sin guardar se perderán. El estado del interruptor de reservas no cambia."
        textoConfirmar="Restaurar"
        tono="alerta"
        cargando={isGuardando}
      />

      <ModalConfirmacion
        abierto={bloqueador.state === 'blocked'}
        onCerrar={() => bloqueador.reset?.()}
        onConfirmar={() => bloqueador.proceed?.()}
        titulo="¿Salir sin guardar?"
        mensaje="Modificaste las políticas de reserva pero no las guardaste. Si sales, se perderán esos cambios."
        textoConfirmar="Salir sin guardar"
        tono="alerta"
      />
    </div>
  );
};
