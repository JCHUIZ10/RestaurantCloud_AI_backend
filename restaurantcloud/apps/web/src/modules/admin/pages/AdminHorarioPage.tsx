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
import { Loader2, CheckCircle2 } from 'lucide-react';

export const AdminHorarioPage: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<'semana' | 'excepciones'>('semana');
  const [dias, setDias] = useState<DiaHorarioDTO[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionHorarioDTO[]>([]);
  const [totalHorasSemanales, setTotalHorasSemanales] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [guardandoSemana, setGuardandoSemana] = useState(false);

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
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

  // Notificación Toast flotante
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const mostrarToast = (mensaje: string) => {
    setToastMensaje(mensaje);
    setTimeout(() => {
      setToastMensaje(null);
    }, 4500);
  };

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error('Error al cargar datos de horario y excepciones:', err);
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
        mostrarToast('¡Horario semanal de atención actualizado exitosamente!');
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
        mostrarToast('Plantilla aplicada correctamente a los 7 días de la semana.');
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
        `🇵🇪 Se incorporaron ${res.datos.agregados} feriados oficiales del calendario de Perú 2026.`
      );
    }
  };

  // Eliminar Excepción
  const handleEliminarExcepcion = async (id: string) => {
    const res = await adminService.eliminarExcepcion(id);
    if (res.exito) {
      setExcepciones((prev) => prev.filter((e) => e.id !== id));
      mostrarToast('Fecha de excepción eliminada del calendario.');
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
          mostrarToast('Excepcion programada exitosamente.');
        } else {
          mostrarToast(resCrear.errores?.[0]?.mensaje || 'No se pudo programar la excepcion.');
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
          mostrarToast('Excepción programada exitosamente sin conflicto de reservas.');
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
      mostrarToast('La cancelacion y notificacion de reservas se habilitara en el punto 5B.');
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
        mostrarToast(
          `Cierre confirmado. Se cancelaron ${conflictoData.reservas.length} reservas registradas para esta fecha.`
        );
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
    mostrarToast('Simulación activa: Sede sin turnos configurados.');
  };

  const handleRestablecerSemillas = async () => {
    mockAdminService.restablecerSemillasHorario();
    await cargarDatos();
    mostrarToast('Semillas canónicas de Áurea Miraflores restablecidas.');
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
        <span className="text-sm font-medium">Cargando horario y excepciones del local...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">
      {/* Toast Flotante */}
      {toastMensaje && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Header Principal */}
      <HorarioHeader
        tabActiva={tabActiva}
        onCambiarTab={setTabActiva}
        totalExcepciones={excepciones.length}
        totalHorasSemanales={totalHorasSemanales}
      />

      {/* Contenido según Pestaña */}
      <main className="mt-4">
        {tabActiva === 'semana' ? (
          dias.length === 0 ? (
            <OnboardingHorarioVacio
              onAplicarPlantillaEstandar={() => handleAplicarPlantilla('restaurante_estandar')}
              onIniciarVacioManual={handleIniciarVacioManual}
              loading={guardandoSemana}
            />
          ) : (
            <SemanaHorariaView
              dias={dias}
              onGuardar={handleGuardarSemana}
              guardando={guardandoSemana}
            />
          )
        ) : (
          <ExcepcionesCalendarioView
            excepciones={excepciones}
            onNuevoCierre={() => setModalCrearAbierto(true)}
            onCargarFeriadosPeru={handleCargarFeriadosPeru}
            onEliminarExcepcion={handleEliminarExcepcion}
          />
        )}
      </main>

      {/* Modal Crear / Editar Excepción */}
      <ModalCrearEditarExcepcion
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onSubmit={handleSolicitarCrearExcepcion}
        loading={procesandoExcepcion}
      />

      {/* Modal Conflicto de Reservas (680px) con Enlace WhatsApp y Cancelación Atómica */}
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
      {!IS_REAL_API && (
        <DemoAdminHorarioWidget
          onSimularConflictoNavidad={handleSimularConflictoNavidad}
          onCargarFeriadosPeru={handleCargarFeriadosPeru}
          onSimularSedeSinHorario={handleSimularSedeSinHorario}
          onRestablecerSemillas={handleRestablecerSemillas}
        />
      )}
    </div>
  );
};
