import React, { useState, useEffect, useCallback } from 'react';
import {
  DiaHorarioDTO,
  ExcepcionHorarioDTO,
  ReservaConflictoDTO,
} from '@/types/admin';
import { mockAdminService } from '../services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import {
  HorarioHeader,
  SemanaHorariaView,
  ExcepcionesCalendarioView,
  ModalCrearEditarExcepcion,
  ModalConflictoReservas,
  OnboardingHorarioVacio,
  DemoAdminHorarioWidget,
} from '../components/horario';
import { EstadoError, Skeleton, SoloDemo, useToast } from '@/components/ui';

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
  const [modalConflictoAbierto, setModalConflictoAbierto] = useState(false);
  const [procesandoExcepcion, setProcesandoExcepcion] = useState(false);

  // Datos temporales para la excepción y su conflicto
  const [conflictoData, setConflictoData] = useState<{
    fecha: string;
    motivo: string;
    cerrado: boolean;
    hora_inicio?: string;
    hora_fin?: string;
    reservas: ReservaConflictoDTO[];
  } | null>(null);

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
        adminService.getHorarioSemana(),
        adminService.getExcepcionesHorario(),
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

  // Guardar configuración semanal
  const handleGuardarSemana = async (diasNuevos: DiaHorarioDTO[]) => {
    try {
      setGuardandoSemana(true);
      const res = await adminService.guardarHorarioSemana({ dias: diasNuevos });
      if (res.exito && res.datos) {
        setDias(res.datos.dias);
        setTotalHorasSemanales(res.datos.total_horas_semanales || 0);
        mostrarToast('Horario guardado');
      } else {
        throw new Error(res.errores?.[0]?.mensaje || 'No se pudo guardar el horario.');
      }
    } finally {
      setGuardandoSemana(false);
    }
  };

  // Aplicar plantilla rápida
  const handleAplicarPlantilla = async (
    plantilla: 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo'
  ) => {
    try {
      setGuardandoSemana(true);
      const res = await adminService.aplicarPlantillaHorario({ plantilla });
      if (res.exito && res.datos) {
        setDias(res.datos.dias);
        setTotalHorasSemanales(res.datos.total_horas_semanales || 0);
        mostrarToast('Horario de almuerzo y cena aplicado');
      }
    } finally {
      setGuardandoSemana(false);
    }
  };

  // Cargar Feriados de Perú 2026
  const handleCargarFeriadosPeru = async () => {
    const res = await adminService.cargarFeriadosNacionalesPeru();
    if (res.exito && res.datos) {
      await cargarDatos();
      mostrarToast(
        res.datos.agregados > 0
          ? `Se agregaron ${res.datos.agregados} feriados nacionales`
          : 'Los feriados nacionales ya estaban registrados',
        res.datos.agregados > 0 ? 'ok' : 'info'
      );
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'No se pudieron cargar los feriados', 'error');
    }
  };

  // Eliminar Excepción
  const handleEliminarExcepcion = async (id: string) => {
    const res = await adminService.eliminarExcepcion(id);
    if (res.exito) {
      setExcepciones((prev) => prev.filter((e) => e.id !== id));
      mostrarToast('Fecha eliminada');
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo eliminar la fecha', 'error');
    }
  };

  // Iniciar flujo de creación y precheck
  const handleSolicitarCrearExcepcion = async (data: {
    fecha: string;
    cerrado: boolean;
    hora_inicio?: string;
    hora_fin?: string;
    motivo: string;
  }) => {
    try {
      setProcesandoExcepcion(true);

      if (IS_REAL_API) {
        const resCrear = await adminService.crearExcepcion(data);

        if (resCrear.exito) {
          setModalCrearAbierto(false);
          await cargarDatos();
          mostrarToast('Fecha registrada');
        } else {
          mostrarToast(resCrear.errores?.[0]?.mensaje || 'No se pudo registrar la fecha', 'error');
        }

        return;
      }

      // Ejecutar precheck en base a reservas
      const precheck = await mockAdminService.precheckExcepcion({
        fecha: data.fecha,
        cerrado: data.cerrado,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
      });

      if (precheck.exito && precheck.datos.hay_conflictos) {
        // Hay comensales afectados: cerramos modal básico y abrimos modal de advertencia de 680px
        setModalCrearAbierto(false);
        setConflictoData({
          ...data,
          reservas: precheck.datos.reservas,
        });
        setModalConflictoAbierto(true);
      } else {
        // Sin conflictos: guardamos directamente
        const resCrear = await mockAdminService.crearExcepcion({
          ...data,
          cancelar_reservas: false,
        });

        if (resCrear.exito) {
          setModalCrearAbierto(false);
          await cargarDatos();
          mostrarToast('Fecha registrada');
        }
      }
    } finally {
      setProcesandoExcepcion(false);
    }
  };

  // Confirmar Cierre desde el Modal de Conflicto de Reservas
  const handleConfirmarConflicto = async (
    reservasNotificadas: {
      reserva_id: string;
      notificado: boolean;
      metodo_notificacion: 'whatsapp' | 'llamada' | 'presencial' | 'ninguno';
    }[]
  ) => {
    if (!conflictoData) return;

    if (IS_REAL_API) {
      mostrarToast('Todavía no se pueden cancelar reservas desde aquí.', 'info');
      return;
    }

    try {
      setProcesandoExcepcion(true);
      const res = await mockAdminService.crearExcepcion({
        fecha: conflictoData.fecha,
        cerrado: conflictoData.cerrado,
        hora_inicio: conflictoData.hora_inicio,
        hora_fin: conflictoData.hora_fin,
        motivo: conflictoData.motivo,
        cancelar_reservas: true,
        reservas_notificadas: reservasNotificadas,
      });

      if (res.exito) {
        setModalConflictoAbierto(false);
        setConflictoData(null);
        await cargarDatos();
        mostrarToast(`Fecha registrada; ${conflictoData.reservas.length} reservas canceladas`);
      }
    } finally {
      setProcesandoExcepcion(false);
    }
  };

  // Atajos de QA Test Bench
  const handleSimularConflictoNavidad = async () => {
    mockAdminService.simularConflictoNavidad();
    setTabActiva('excepciones');
    // Ejecutar precheck directo sobre 2026-12-25
    const precheck = await mockAdminService.precheckExcepcion({
      fecha: '2026-12-25',
      cerrado: true,
    });
    if (precheck.exito && precheck.datos.hay_conflictos) {
      setConflictoData({
        fecha: '2026-12-25',
        motivo: 'Navidad (Cierre Anual Obligatorio)',
        cerrado: true,
        reservas: precheck.datos.reservas,
      });
      setModalConflictoAbierto(true);
    }
  };

  const handleSimularSedeSinHorario = () => {
    mockAdminService.simularSedeSinHorario();
    setDias([]);
    setTotalHorasSemanales(0);
    setTabActiva('semana');
    mostrarToast('Simulación: local sin horario', 'info');
  };

  const handleRestablecerSemillas = async () => {
    mockAdminService.restablecerSemillasHorario();
    await cargarDatos();
    mostrarToast('Datos de prueba restablecidos', 'info');
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

      {/* Reservas afectadas por la fecha: avisar por WhatsApp antes de cancelar */}
      {conflictoData && (
        <ModalConflictoReservas
          isOpen={modalConflictoAbierto}
          onClose={() => {
            setModalConflictoAbierto(false);
            setConflictoData(null);
          }}
          fecha={conflictoData.fecha}
          motivo={conflictoData.motivo}
          reservas={conflictoData.reservas}
          onConfirmarCierre={handleConfirmarConflicto}
          loading={procesandoExcepcion}
        />
      )}

      {/* QA Test Bench Widget Flotante */}
      <SoloDemo>
        {!IS_REAL_API && (
          <DemoAdminHorarioWidget
            onSimularConflictoNavidad={handleSimularConflictoNavidad}
            onCargarFeriadosPeru={handleCargarFeriadosPeru}
            onSimularSedeSinHorario={handleSimularSedeSinHorario}
            onRestablecerSemillas={handleRestablecerSemillas}
          />
        )}
      </SoloDemo>
    </div>
  );
};
