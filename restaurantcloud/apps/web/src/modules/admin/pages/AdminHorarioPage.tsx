import React, { useState, useEffect, useCallback } from 'react';
import {
  CrearExcepcionRequest,
  DiaHorarioDTO,
  ExcepcionHorarioDTO,
  NotificacionContactoDTO,
  ReservaConflictoDTO,
} from '@/types/admin';
import { horarioService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import {
  HorarioHeader,
  SemanaHorariaView,
  ExcepcionesCalendarioView,
  ModalCrearEditarExcepcion,
  ModalConflictoReservas,
  OnboardingHorarioVacio,
} from '../components/horario';
import { EstadoError, Skeleton, useToast } from '@/components/ui';

type Plantilla = 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo';
type DatosExcepcion = Pick<CrearExcepcionRequest, 'fecha' | 'cerrado' | 'hora_inicio' | 'hora_fin' | 'motivo'>;

/** Resultado de intentar aplicar un cambio que puede cancelar reservas. */
interface ResultadoCambio {
  ok: boolean;
  mensajeExito?: string;
  /** El API devolvió una lista de reservas afectadas distinta a la que se mostró. */
  reservasActualizadas?: ReservaConflictoDTO[];
  error?: string;
}

/** Cambio pendiente de resolver porque deja reservas sin atender. */
interface ConflictoPendiente {
  clave: number;
  titulo: string;
  descripcion: string;
  intro: string;
  textoConfirmar: string;
  reservas: ReservaConflictoDTO[];
  confirmar: (avisos: NotificacionContactoDTO[]) => Promise<ResultadoCambio>;
}

const fechaLegible = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

const reservasDeError = (detalles: unknown): ReservaConflictoDTO[] | null => {
  const reservas = (detalles as { reservas?: unknown } | undefined)?.reservas;
  return Array.isArray(reservas) ? (reservas as ReservaConflictoDTO[]) : null;
};

const textoReservas = (n: number) => `${n} reserva${n === 1 ? '' : 's'}`;

export const AdminHorarioPage: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<'semana' | 'excepciones'>('semana');
  const [dias, setDias] = useState<DiaHorarioDTO[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionHorarioDTO[]>([]);
  const [totalHorasSemanales, setTotalHorasSemanales] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardandoSemana, setGuardandoSemana] = useState(false);

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  // Cambia en cada apertura para que el formulario empiece limpio
  const [claveModalCrear, setClaveModalCrear] = useState(0);
  const [conflicto, setConflicto] = useState<ConflictoPendiente | null>(null);
  const [procesandoExcepcion, setProcesandoExcepcion] = useState(false);

  const { mostrar } = useToast();
  const mostrarToast = useCallback(
    (mensaje: string, tono: 'ok' | 'error' | 'info' = 'ok') => mostrar(mensaje, tono),
    [mostrar]
  );

  const abrirModalCrear = () => {
    setClaveModalCrear((k) => k + 1);
    setModalCrearAbierto(true);
  };

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorCarga(false);
      const [resHorario, resExcepciones] = await Promise.all([
        horarioService.getHorarioSemana(),
        horarioService.getExcepcionesHorario(),
      ]);

      if (resHorario.exito && resHorario.datos) {
        setDias(resHorario.datos.dias || []);
        setTotalHorasSemanales(resHorario.datos.total_horas_semanales || 0);
      }

      if (resExcepciones.exito && resExcepciones.datos) {
        setExcepciones(resExcepciones.datos);
      }
    } catch {
      setErrorCarga(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /** Abre el modal que exige decidir el aviso de cada reserva afectada antes de cancelarlas. */
  const abrirConflicto = (conflictoNuevo: Omit<ConflictoPendiente, 'clave'>) => {
    setConflicto((actual) => ({ ...conflictoNuevo, clave: (actual?.clave ?? 0) + 1 }));
  };

  // El API recalcula las reservas afectadas: si cambiaron desde la consulta previa, se vuelve a mostrar la lista vigente
  const refrescarConflicto = (reservas: ReservaConflictoDTO[]) => {
    setConflicto((actual) => (actual ? { ...actual, reservas, clave: actual.clave + 1 } : actual));
  };

  const confirmarConflicto = async (avisos: NotificacionContactoDTO[]) => {
    if (!conflicto) return;
    setProcesandoExcepcion(true);
    try {
      const resultado = await conflicto.confirmar(avisos);

      if (resultado.ok) {
        setConflicto(null);
        await cargarDatos();
        mostrarToast(resultado.mensajeExito ?? 'Cambio guardado');
      } else if (resultado.reservasActualizadas) {
        refrescarConflicto(resultado.reservasActualizadas);
        mostrarToast(resultado.error ?? 'Las reservas afectadas cambiaron. Revisa la lista actualizada.', 'info');
      } else {
        mostrarToast(resultado.error ?? 'No se pudo completar el cambio', 'error');
      }
    } catch (error) {
      // Se conserva el modal y las decisiones para reintentar
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo conectar con el servidor. Intenta nuevamente.'), 'error');
    } finally {
      setProcesandoExcepcion(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Horario semanal
  // ---------------------------------------------------------------------------

  /** Guarda el horario o la plantilla; si deja reservas sin cabida, las cancela con el aviso decidido. */
  const aplicarCambioSemanal = async (
    guardar: (avisos?: NotificacionContactoDTO[]) => ReturnType<typeof horarioService.guardarHorarioSemana>,
    avisos?: NotificacionContactoDTO[]
  ): Promise<ResultadoCambio & { reservasCanceladas?: number }> => {
    const res = await guardar(avisos);

    if (res.exito && res.datos) {
      setDias(res.datos.dias);
      setTotalHorasSemanales(res.datos.total_horas_semanales || 0);
      return { ok: true, mensajeExito: avisos?.length ? `Horario guardado; ${textoReservas(avisos.length)} cancelada${avisos.length === 1 ? '' : 's'}` : 'Horario guardado' };
    }

    const error = res.errores?.[0];
    const reservas = error?.codigo === 'ERR_RESERVAS_AFECTADAS' ? reservasDeError(error.detalles) : null;
    if (reservas) {
      return { ok: false, reservasActualizadas: reservas, error: 'Las reservas afectadas cambiaron. Revisa la lista actualizada.' };
    }
    return { ok: false, error: error?.mensaje ?? 'No se pudo guardar el horario.' };
  };

  const resolverCambioSemanal = async (
    precheck: ReturnType<typeof horarioService.precheckHorarioSemana>,
    guardar: (avisos?: NotificacionContactoDTO[]) => ReturnType<typeof horarioService.guardarHorarioSemana>
  ): Promise<boolean> => {
    const simulacion = await precheck;
    if (!simulacion.exito) {
      throw new Error(simulacion.errores?.[0]?.mensaje ?? 'No se pudo verificar las reservas afectadas.');
    }

    if (simulacion.datos.hay_conflictos) {
      const reservas = simulacion.datos.reservas;
      abrirConflicto({
        titulo: `${textoReservas(reservas.length)} no caben en el nuevo horario`,
        descripcion: 'Cambio del horario semanal de atención',
        intro: 'Al guardar el nuevo horario, estas reservas futuras ya no podrán atenderse.',
        textoConfirmar: 'Guardar horario y cancelar reservas',
        reservas,
        confirmar: (avisos) => aplicarCambioSemanal(guardar, avisos),
      });
      return false;
    }

    const resultado = await aplicarCambioSemanal(guardar);
    if (!resultado.ok && resultado.reservasActualizadas) {
      // Apareció una reserva afectada entre la consulta y el guardado
      abrirConflicto({
        titulo: `${textoReservas(resultado.reservasActualizadas.length)} no caben en el nuevo horario`,
        descripcion: 'Cambio del horario semanal de atención',
        intro: 'Al guardar el nuevo horario, estas reservas futuras ya no podrán atenderse.',
        textoConfirmar: 'Guardar horario y cancelar reservas',
        reservas: resultado.reservasActualizadas,
        confirmar: (avisos) => aplicarCambioSemanal(guardar, avisos),
      });
      return false;
    }
    if (!resultado.ok) throw new Error(resultado.error);
    mostrarToast(resultado.mensajeExito ?? 'Horario guardado');
    return true;
  };

  // Guardar configuración semanal
  const handleGuardarSemana = async (diasNuevos: DiaHorarioDTO[]): Promise<boolean> => {
    try {
      setGuardandoSemana(true);
      return await resolverCambioSemanal(
        horarioService.precheckHorarioSemana({ dias: diasNuevos }),
        (avisos) =>
          horarioService.guardarHorarioSemana({
            dias: diasNuevos,
            ...(avisos ? { cancelar_reservas: true, reservas_notificadas: avisos } : {}),
          })
      );
    } catch (error) {
      throw new Error(mensajeDeErrorApi(error, 'No se pudo guardar el horario.'));
    } finally {
      setGuardandoSemana(false);
    }
  };

  // Aplicar plantilla rápida
  const handleAplicarPlantilla = async (plantilla: Plantilla) => {
    try {
      setGuardandoSemana(true);
      await resolverCambioSemanal(
        horarioService.precheckHorarioSemana({ plantilla }),
        (avisos) =>
          horarioService.aplicarPlantillaHorario({
            plantilla,
            ...(avisos ? { cancelar_reservas: true, reservas_notificadas: avisos } : {}),
          })
      );
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo aplicar la plantilla.'), 'error');
    } finally {
      setGuardandoSemana(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Feriados y cierres
  // ---------------------------------------------------------------------------

  // Cargar Feriados de Perú 2026
  const handleCargarFeriadosPeru = async () => {
    try {
      const res = await horarioService.cargarFeriadosNacionalesPeru();
      if (!res.exito || !res.datos) {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudieron cargar los feriados', 'error');
        return;
      }

      await cargarDatos();
      const omitidos = res.datos.omitidos_por_reservas ?? [];
      const base =
        res.datos.agregados > 0
          ? `Se agregaron ${res.datos.agregados} feriados nacionales`
          : 'Los feriados nacionales ya estaban registrados';

      if (omitidos.length > 0) {
        const fechas = omitidos.map((o) => `${fechaLegible(o.fecha)} (${textoReservas(o.total_reservas)})`).join(', ');
        mostrarToast(
          `${base}. No se cerraron por tener reservas: ${fechas}. Regístralos con «Nuevo cierre» para avisar a los clientes.`,
          'info'
        );
      } else {
        mostrarToast(base, res.datos.agregados > 0 ? 'ok' : 'info');
      }
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudieron cargar los feriados'), 'error');
    }
  };

  // Eliminar Excepción
  const handleEliminarExcepcion = async (id: string) => {
    try {
      const res = await horarioService.eliminarExcepcion(id);
      if (res.exito) {
        setExcepciones((prev) => prev.filter((e) => e.id !== id));
        mostrarToast('Fecha eliminada');
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo eliminar la fecha', 'error');
      }
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo eliminar la fecha'), 'error');
    }
  };

  /** Registra la fecha; con `avisos` cancela las reservas afectadas con la decisión de aviso de cada una. */
  const registrarExcepcion = async (data: DatosExcepcion, avisos?: NotificacionContactoDTO[]): Promise<ResultadoCambio> => {
    const res = await horarioService.crearExcepcion(
      avisos ? { ...data, cancelar_reservas: true, reservas_notificadas: avisos } : data
    );

    if (res.exito) {
      const canceladas = res.datos?.reservas_canceladas_count ?? 0;
      return {
        ok: true,
        mensajeExito: canceladas > 0 ? `Fecha registrada; ${textoReservas(canceladas)} cancelada${canceladas === 1 ? '' : 's'}` : 'Fecha registrada',
      };
    }

    const error = res.errores?.[0];
    const reservas = error?.codigo === 'ERR_RESERVAS_AFECTADAS' ? reservasDeError(error.detalles) : null;
    if (reservas) {
      return { ok: false, reservasActualizadas: reservas, error: 'Las reservas afectadas cambiaron. Revisa la lista actualizada.' };
    }
    return { ok: false, error: error?.mensaje ?? 'No se pudo registrar la fecha' };
  };

  const abrirConflictoDeExcepcion = (data: DatosExcepcion, reservas: ReservaConflictoDTO[]) => {
    abrirConflicto({
      titulo: `${textoReservas(reservas.length)} para ${data.cerrado ? 'ese día' : 'ese horario'}`,
      descripcion: `${data.motivo} · ${fechaLegible(data.fecha)}`,
      intro: data.cerrado
        ? 'El local no atenderá ese día, así que estas reservas deben cancelarse.'
        : 'Con el horario especial, estas reservas no podrán atenderse.',
      textoConfirmar: data.cerrado ? 'Cerrar y cancelar reservas' : 'Registrar y cancelar reservas',
      reservas,
      confirmar: (avisos) => registrarExcepcion(data, avisos),
    });
  };

  // Iniciar flujo de creación: primero se consultan las reservas afectadas
  const handleSolicitarCrearExcepcion = async (data: DatosExcepcion) => {
    try {
      setProcesandoExcepcion(true);

      const precheck = await horarioService.precheckExcepcion(data);
      if (!precheck.exito) {
        mostrarToast(precheck.errores?.[0]?.mensaje || 'No se pudo verificar las reservas de esa fecha', 'error');
        return;
      }

      if (precheck.datos.hay_conflictos) {
        setModalCrearAbierto(false);
        abrirConflictoDeExcepcion(data, precheck.datos.reservas);
        return;
      }

      const resultado = await registrarExcepcion(data);
      if (resultado.ok) {
        setModalCrearAbierto(false);
        await cargarDatos();
        mostrarToast(resultado.mensajeExito ?? 'Fecha registrada');
      } else if (resultado.reservasActualizadas) {
        // Apareció una reserva afectada entre la consulta y el guardado
        setModalCrearAbierto(false);
        abrirConflictoDeExcepcion(data, resultado.reservasActualizadas);
      } else {
        mostrarToast(resultado.error ?? 'No se pudo registrar la fecha', 'error');
      }
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo conectar con el servidor. Intenta nuevamente.'), 'error');
    } finally {
      setProcesandoExcepcion(false);
    }
  };

  const handleIniciarVacioManual = () => {
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const diasIniciales: DiaHorarioDTO[] = nombresDias.map((nombre, idx) => ({
      dia_semana: idx + 1,
      nombre_dia: nombre,
      atiende: false,
      turnos: [],
    }));
    setDias(diasIniciales);
  };

  return (
    <div className="space-y-6">
      <HorarioHeader
        tabActiva={tabActiva}
        onCambiarTab={setTabActiva}
        totalExcepciones={excepciones.length}
        totalHorasSemanales={totalHorasSemanales}
      />

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando horario">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje="No se pudo cargar el horario del local." onReintentar={cargarDatos} />
      ) : tabActiva === 'semana' ? (
        dias.length === 0 ? (
          <OnboardingHorarioVacio
            onAplicarPlantillaEstandar={() => handleAplicarPlantilla('restaurante_estandar')}
            onIniciarVacioManual={handleIniciarVacioManual}
            loading={guardandoSemana}
          />
        ) : (
          <SemanaHorariaView dias={dias} onGuardar={handleGuardarSemana} guardando={guardandoSemana} />
        )
      ) : (
        <ExcepcionesCalendarioView
          excepciones={excepciones}
          onNuevoCierre={abrirModalCrear}
          onCargarFeriadosPeru={handleCargarFeriadosPeru}
          onEliminarExcepcion={handleEliminarExcepcion}
        />
      )}

      {/* Modal Crear / Editar Excepción */}
      <ModalCrearEditarExcepcion
        key={claveModalCrear}
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onSubmit={handleSolicitarCrearExcepcion}
        loading={procesandoExcepcion}
      />

      {/* Reservas afectadas: decidir el aviso de cada cliente antes de cancelar */}
      {conflicto && (
        <ModalConflictoReservas
          key={conflicto.clave}
          isOpen
          onClose={() => setConflicto(null)}
          titulo={conflicto.titulo}
          descripcion={conflicto.descripcion}
          intro={conflicto.intro}
          textoConfirmar={conflicto.textoConfirmar}
          reservas={conflicto.reservas}
          onConfirmar={confirmarConflicto}
          loading={procesandoExcepcion}
        />
      )}
    </div>
  );
};
