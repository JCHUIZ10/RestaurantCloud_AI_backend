import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ReservaCardDTO,
  CrearReservaRequestDTO,
  JornadaReservaDTO,
  PoliticasReservaDTO,
  TurnoReserva,
} from '@/types/mozo';
import { mozoService } from '@/services/serviceAdapter';
import { ReservasHeader } from '../components/reservas/ReservasHeader';
import { ReservasKPICards } from '../components/reservas/ReservasKPICards';
import { ReservasFiltrosPills, FiltroReservaEstado } from '../components/reservas/ReservasFiltrosPills';
import { ReservasTable } from '../components/reservas/ReservasTable';
import { ModalNuevaReserva } from '../components/reservas/ModalNuevaReserva';
import { ModalFichaReserva } from '../components/reservas/ModalFichaReserva';
import { AlertTriangle, CalendarX2, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';
import { generarEnlaceWhatsApp } from '@/shared/utils/whatsapp';
import { codigoDeErrorApi, mensajeDeErrorApi } from '@/shared/utils/errorApi';
import {
  etiquetaRelativaFecha,
  fechaLargaStr,
  hoyLocalStr,
  relativoDeFecha,
  sumarDiasStr,
} from '@/shared/utils/fechaLocal';

const INTERVALO_REFRESCO_MS = 60_000;
const CODIGO_MODULO_NO_CONTRATADO = 'ERR_MODULO_RESERVAS_NO_CONTRATADO';
const ETIQUETA_TURNO: Record<TurnoReserva, string> = { almuerzo: 'Almuerzo', cena: 'Cena' };

type TipoToast = 'exito' | 'error';

export const MozoReservasPage: React.FC = () => {
  const navigate = useNavigate();

  // Políticas del local y jornada en curso (según el servidor)
  const [politicas, setPoliticas] = useState<PoliticasReservaDTO | null>(null);
  // Jornada (turnos, feriados y excepciones) de la fecha visible
  const [jornada, setJornada] = useState<JornadaReservaDTO | null>(null);

  const [fechaStr, setFechaStr] = useState<string | null>(null);
  const [turnoActivo, setTurnoActivo] = useState<TurnoReserva>('almuerzo');
  const [filtroActivo, setFiltroActivo] = useState<FiltroReservaEstado>('todas');

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  // El plan de la empresa no incluye reservas: mensaje del API (con los planes que sí lo incluyen)
  const [moduloNoContratado, setModuloNoContratado] = useState<string | null>(null);
  const [reservas, setReservas] = useState<ReservaCardDTO[]>([]);

  // Modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);
  const [reservaFichaSeleccionada, setReservaFichaSeleccionada] = useState<ReservaCardDTO | null>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: TipoToast } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Descarta respuestas de consultas que ya no corresponden a la fecha/turno visibles
  const peticionReservasRef = useRef(0);
  const peticionJornadaRef = useRef(0);

  const mostrarToast = useCallback((mensaje: string, tipo: TipoToast = 'exito') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ mensaje, tipo });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  // 1. Arranque: la fecha y el turno iniciales los decide el servidor (jornada en curso)
  const cargarPoliticas = useCallback(async (esArranque: boolean) => {
    try {
      const res = await mozoService.obtenerPoliticasReserva();
      if (!res.exito || !res.datos) throw new Error('Sin datos de políticas');
      setPoliticas(res.datos);
      if (esArranque) {
        setJornada(res.datos.jornada);
        setFechaStr(res.datos.fecha_operativa);
        setTurnoActivo(res.datos.turno_actual);
      }
    } catch (error) {
      if (codigoDeErrorApi(error) === CODIGO_MODULO_NO_CONTRATADO) {
        setModuloNoContratado(mensajeDeErrorApi(error, 'El plan de tu empresa no incluye el módulo de reservas.'));
        return;
      }
      if (esArranque) {
        setErrorCarga(mensajeDeErrorApi(error, 'No se pudo consultar el horario de atención del local.'));
        setFechaStr(hoyLocalStr());
      }
    }
  }, []);

  useEffect(() => {
    cargarPoliticas(true);
  }, [cargarPoliticas]);

  // 2. Jornada de la fecha visible (si cambia de día)
  useEffect(() => {
    if (!fechaStr || jornada?.fecha === fechaStr) return;
    const peticion = ++peticionJornadaRef.current;
    mozoService
      .obtenerPoliticasReserva(fechaStr)
      .then((res) => {
        if (peticion === peticionJornadaRef.current && res.exito && res.datos) {
          setJornada(res.datos.jornada);
        }
      })
      .catch((error) => {
        if (peticion === peticionJornadaRef.current) {
          setErrorCarga(mensajeDeErrorApi(error, 'No se pudo consultar el horario de la fecha.'));
        }
      });
  }, [fechaStr, jornada?.fecha]);

  // Si la fecha no tiene el turno elegido (ej. domingo solo almuerzo), pasar al turno disponible
  useEffect(() => {
    if (!jornada || jornada.fecha !== fechaStr || jornada.turnos[turnoActivo]) return;
    const alternativo = (Object.keys(ETIQUETA_TURNO) as TurnoReserva[]).find((t) => jornada.turnos[t]);
    if (alternativo) setTurnoActivo(alternativo);
  }, [jornada, fechaStr, turnoActivo]);

  // 3. Reservas del turno visible
  const cargarReservas = useCallback(
    async (silencioso = false) => {
      if (!fechaStr) return;
      const peticion = ++peticionReservasRef.current;
      if (!silencioso) setCargando(true);
      try {
        const res = await mozoService.obtenerReservas(fechaStr, turnoActivo);
        if (peticion !== peticionReservasRef.current) return;
        if (res.exito && res.datos) {
          setReservas(res.datos);
          setErrorCarga(null);
        } else {
          throw new Error('Respuesta sin datos');
        }
      } catch (error) {
        if (peticion !== peticionReservasRef.current) return;
        if (codigoDeErrorApi(error) === CODIGO_MODULO_NO_CONTRATADO) {
          setModuloNoContratado(mensajeDeErrorApi(error, 'El plan de tu empresa no incluye el módulo de reservas.'));
          return;
        }
        if (!silencioso) setReservas([]);
        setErrorCarga(mensajeDeErrorApi(error, 'No se pudieron cargar las reservas. Reintentando en un minuto.'));
      } finally {
        if (peticion === peticionReservasRef.current && !silencioso) setCargando(false);
      }
    },
    [fechaStr, turnoActivo]
  );

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  // Refresco periódico: minutos restantes, KPIs y cambio de jornada pasada la medianoche
  useEffect(() => {
    // Sin el módulo en el plan no hay nada que refrescar
    if (moduloNoContratado) return;
    const intervalo = setInterval(() => {
      cargarReservas(true);
      cargarPoliticas(false);
    }, INTERVALO_REFRESCO_MS);
    return () => clearInterval(intervalo);
  }, [cargarReservas, cargarPoliticas, moduloNoContratado]);

  // La ficha abierta muestra siempre los datos del último refresco (minutos restantes, estado)
  useEffect(() => {
    setReservaFichaSeleccionada((actual) => (actual ? reservas.find((r) => r.id === actual.id) ?? actual : actual));
  }, [reservas]);

  const fechaOperativa = politicas?.fecha_operativa ?? hoyLocalStr();
  // El administrador puede suspender las reservas nuevas; las existentes se siguen atendiendo
  const canalSuspendido = politicas !== null && !politicas.acepta_reservas;
  const esFechaOperativa = fechaStr === fechaOperativa;
  const toleranciaMin = politicas?.tolerancia_no_show_min ?? 15;
  const turnoVisible = jornada?.fecha === fechaStr ? jornada.turnos[turnoActivo] : null;
  const diaCerrado = jornada?.fecha === fechaStr && !jornada.atiende;

  const cambiarFecha = (nueva: string) => {
    setFechaStr(nueva);
    setFiltroActivo('todas');
  };

  // Filtrado reactivo de reservas
  const reservasFiltradas = useMemo(() => {
    if (filtroActivo === 'en_espera') {
      return reservas.filter((r) => r.estado === 'confirmada' || r.estado === 'bloqueada');
    }
    if (filtroActivo === 'atendidas') {
      return reservas.filter((r) => r.estado === 'atendida');
    }
    if (filtroActivo === 'inasistencias') {
      return reservas.filter((r) => r.estado === 'no_show' || r.estado === 'cancelada');
    }
    return reservas;
  }, [reservas, filtroActivo]);

  // Conteos para KPIs y Píldoras
  const metricas = useMemo(() => {
    const enEspera = reservas.filter((r) => r.estado === 'confirmada' || r.estado === 'bloqueada');
    return {
      total: reservas.length,
      enEspera: enEspera.length,
      atendidas: reservas.filter((r) => r.estado === 'atendida').length,
      inasistencias: reservas.filter((r) => r.estado === 'no_show' || r.estado === 'cancelada').length,
      proximasEnHora: enEspera.filter((r) => r.minutos_restantes >= 0 && r.minutos_restantes <= 60).length,
    };
  }, [reservas]);

  // Acciones sobre Reservas: devuelven true si la API las aceptó (los modales solo se cierran entonces)
  const handleSentarReserva = async (reserva: ReservaCardDTO): Promise<boolean> => {
    try {
      const res = await mozoService.sentarReserva(reserva.id);
      if (!res.exito) throw new Error();
      mostrarToast(`✓ ${reserva.cliente_nombre} sentados en ${reserva.mesas_etiqueta}. Comanda abierta.`);
      if (reserva.mesa_ids.length > 0) {
        navigate(ROUTES.MOZO_COMANDA(res.datos?.mesa_id ?? reserva.mesa_ids[0]));
      } else {
        cargarReservas(true);
      }
      return true;
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo sentar a los comensales.'), 'error');
      cargarReservas(true);
      return false;
    }
  };

  const handleRegistrarNoShow = async (reservaId: string, motivo: string): Promise<boolean> => {
    try {
      const res = await mozoService.registrarNoShow(reservaId, motivo);
      if (!res.exito) throw new Error();
      mostrarToast('Inasistencia registrada. La mesa quedó libre.');
      await cargarReservas(true);
      return true;
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo registrar la inasistencia.'), 'error');
      cargarReservas(true);
      return false;
    }
  };

  const handleCancelarReserva = async (reservaId: string, motivo: string): Promise<boolean> => {
    try {
      const res = await mozoService.cancelarReserva(reservaId, motivo);
      if (!res.exito) throw new Error();
      mostrarToast('Reserva cancelada correctamente. Mesa liberada.');
      await cargarReservas(true);
      return true;
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo cancelar la reserva.'), 'error');
      cargarReservas(true);
      return false;
    }
  };

  const handleCrearNuevaReserva = async (payload: CrearReservaRequestDTO): Promise<boolean> => {
    try {
      const res = await mozoService.crearReserva(payload);
      if (!res.exito || !res.datos) throw new Error();
      mostrarToast(
        `📅 Reserva confirmada para ${res.datos.cliente_nombre} a las ${res.datos.hora_texto} en ${res.datos.mesas_etiqueta}`
      );
      await cargarReservas(true);
      return true;
    } catch (error) {
      mostrarToast(mensajeDeErrorApi(error, 'No se pudo crear la reserva.'), 'error');
      // El administrador suspendió el canal después de la última consulta: reflejarlo de inmediato
      if (codigoDeErrorApi(error) === 'ERR_RESERVAS_DESHABILITADAS') cargarPoliticas(false);
      return false;
    }
  };

  const handleAbrirWhatsApp = (reserva: ReservaCardDTO) => {
    const fechaReserva = new Date(reserva.fecha_hora).toLocaleDateString('en-CA');
    const relativo = relativoDeFecha(fechaReserva);
    const cuando =
      relativo === 'Hoy' ? 'de hoy' : relativo === 'Mañana' ? 'de mañana' : `del ${fechaLargaStr(fechaReserva)}`;
    const mensaje = `Hola ${reserva.cliente_nombre}, le escribimos para confirmar su reserva ${cuando} a las ${reserva.hora_texto} para ${reserva.num_personas} personas en ${reserva.mesas_etiqueta}. ¿Nos confirma su asistencia?`;
    const url = generarEnlaceWhatsApp(reserva.cliente_telefono, mensaje);
    if (url) window.open(url, '_blank');
  };

  const renderContenido = () => {
    if (diaCerrado && jornada) {
      return (
        <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center">
          <CalendarX2 className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-slate-800 mb-1">El local no atiende esta fecha</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {jornada.cerrado_por_excepcion
              ? `Cierre registrado: ${jornada.motivo_excepcion}.`
              : 'El horario semanal del local no tiene turnos para este día.'}
          </p>
        </div>
      );
    }

    if (cargando || !fechaStr) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Cargando reservas del salón...
        </div>
      );
    }

    return (
      <ReservasTable
        reservas={reservasFiltradas}
        permiteSentar={esFechaOperativa}
        onSentarReserva={handleSentarReserva}
        onAbrirFicha={setReservaFichaSeleccionada}
        onAbrirWhatsApp={handleAbrirWhatsApp}
      />
    );
  };

  if (moduloNoContratado) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/60 p-6 text-center select-none">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 max-w-md space-y-3">
          <CalendarX2 className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-aurea-navy">Reservas no disponibles</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{moduloNoContratado}</p>
          <p className="text-xs text-slate-500">
            Consulta con el administrador o el propietario del local para habilitar el módulo.
          </p>
          <Link
            to={ROUTES.MOZO_MESAS}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            ‹ Volver al Salón
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/60 overflow-hidden select-none">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[60] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 max-w-sm ${
            toast.tipo === 'error'
              ? 'bg-rose-700 text-white border border-rose-400'
              : 'bg-slate-900 text-aurea-champagne border border-aurea-copper/40'
          }`}
        >
          {toast.tipo === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.mensaje}</span>
        </div>
      )}

      {/* Cabecera de Reservas */}
      <ReservasHeader
        fechaStr={fechaStr ?? fechaOperativa}
        fechaTexto={fechaStr ? etiquetaRelativaFecha(fechaStr) : 'Cargando...'}
        esFechaOperativa={esFechaOperativa}
        turnoActivo={turnoActivo}
        turnos={jornada?.fecha === fechaStr ? jornada.turnos : null}
        onCambiarTurno={setTurnoActivo}
        onFechaAnterior={() => fechaStr && cambiarFecha(sumarDiasStr(fechaStr, -1))}
        onFechaSiguiente={() => fechaStr && cambiarFecha(sumarDiasStr(fechaStr, 1))}
        onFechaHoy={() => cambiarFecha(fechaOperativa)}
        onSeleccionarFecha={cambiarFecha}
        onNuevaReserva={() => setModalNuevaAbierto(true)}
        nuevaReservaDeshabilitada={canalSuspendido}
      />

      {/* Contenido Central */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {canalSuspendido && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              El administrador suspendió la recepción de <strong>nuevas reservas</strong>. Las reservas ya registradas
              siguen vigentes: puedes sentarlas, registrar inasistencias o cancelarlas con normalidad.
            </span>
          </div>
        )}

        {errorCarga && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}

        {jornada?.fecha === fechaStr && jornada.es_horario_especial && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            Horario especial esta fecha: {jornada.motivo_excepcion}
          </div>
        )}

        {/* KPIs de Resumen de Turno */}
        <ReservasKPICards
          totalReservas={metricas.total}
          proximasEnUnaHora={metricas.proximasEnHora}
          atendidas={metricas.atendidas}
          inasistencias={metricas.inasistencias}
          etiquetaTurno={ETIQUETA_TURNO[turnoActivo].toLowerCase()}
        />

        {/* Barra de Filtros en Píldoras */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <ReservasFiltrosPills
            filtroActivo={filtroActivo}
            onCambiarFiltro={setFiltroActivo}
            conteos={{
              todas: metricas.total,
              enEspera: metricas.enEspera,
              atendidas: metricas.atendidas,
              inasistencias: metricas.inasistencias,
            }}
          />

          {turnoVisible && (
            <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
              Horario de {ETIQUETA_TURNO[turnoActivo]}: <strong>{turnoVisible.inicio} a {turnoVisible.fin}</strong>
              {turnoVisible.nombre !== ETIQUETA_TURNO[turnoActivo] && ` (${turnoVisible.nombre})`}
            </span>
          )}
        </div>

        {/* Tabla Operativa de Citas */}
        {renderContenido()}
      </div>

      {/* Modal Nueva Reserva con Mini-Mapa */}
      <ModalNuevaReserva
        abierto={modalNuevaAbierto && !canalSuspendido}
        fechaInicial={fechaStr && fechaStr >= fechaOperativa ? fechaStr : fechaOperativa}
        turnoInicial={turnoActivo}
        fechaOperativa={fechaOperativa}
        maxDiasAnticipacion={politicas?.max_dias_anticipacion ?? 30}
        onCerrar={() => setModalNuevaAbierto(false)}
        onConfirmar={handleCrearNuevaReserva}
      />

      {/* Modal Ficha y Recepción */}
      <ModalFichaReserva
        abierto={reservaFichaSeleccionada !== null}
        reserva={reservaFichaSeleccionada}
        toleranciaMin={toleranciaMin}
        nombreTurno={turnoVisible?.nombre ?? ETIQUETA_TURNO[turnoActivo]}
        permiteSentar={esFechaOperativa}
        onCerrar={() => setReservaFichaSeleccionada(null)}
        onSentarComensales={handleSentarReserva}
        onRegistrarNoShow={handleRegistrarNoShow}
        onCancelarReserva={handleCancelarReserva}
        onEnviarWhatsApp={handleAbrirWhatsApp}
      />
    </div>
  );
};
