import React, { useState, useEffect, useMemo } from 'react';
import { ReservaCardDTO, CrearReservaRequestDTO } from '@/types/mozo';
import { mozoService } from '@/services/serviceAdapter';
import { ReservasHeader } from '../components/reservas/ReservasHeader';
import { ReservasKPICards } from '../components/reservas/ReservasKPICards';
import { ReservasFiltrosPills, FiltroReservaEstado } from '../components/reservas/ReservasFiltrosPills';
import { ReservasTable } from '../components/reservas/ReservasTable';
import { ModalNuevaReserva } from '../components/reservas/ModalNuevaReserva';
import { ModalFichaReserva } from '../components/reservas/ModalFichaReserva';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';
import { generarEnlaceWhatsApp } from '@/shared/utils/whatsapp';

const getHoyFechaStr = () => new Date().toISOString().split('T')[0];

const formatearFechaDisplay = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const hoyStr = getHoyFechaStr();

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const textoFecha = date.toLocaleDateString('es-PE', options);

    if (dateStr === hoyStr) return `Hoy, ${textoFecha}`;
    if (dateStr === ayerStr) return `Ayer, ${textoFecha}`;
    if (dateStr === mananaStr) return `Mañana, ${textoFecha}`;
    return textoFecha;
  } catch {
    return dateStr;
  }
};

export const MozoReservasPage: React.FC = () => {
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [reservas, setReservas] = useState<ReservaCardDTO[]>([]);
  const [fechaStr, setFechaStr] = useState(getHoyFechaStr());
  const [fechaDisplay, setFechaDisplay] = useState(() => formatearFechaDisplay(getHoyFechaStr()));
  const [turnoActivo, setTurnoActivo] = useState<'almuerzo' | 'cena'>('almuerzo');
  const [horarioTurnoTexto, setHorarioTurnoTexto] = useState<string>('12:00 a 17:00');
  const [filtroActivo, setFiltroActivo] = useState<FiltroReservaEstado>('todas');

  // Modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [reservaFichaSeleccionada, setReservaFichaSeleccionada] = useState<ReservaCardDTO | null>(null);

  // Toast
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  useEffect(() => {
    cargarReservas();
  }, [fechaStr, turnoActivo]);

  // Consultar horarios dinámicos de turnos desde BD
  useEffect(() => {
    mozoService.obtenerPoliticasReserva().then((res: any) => {
      if (res?.exito && res.datos?.turnos_operativos) {
        const t = res.datos.turnos_operativos[turnoActivo];
        if (t?.inicio && t?.fin) {
          setHorarioTurnoTexto(`${t.inicio.slice(0, 5)} a ${t.fin.slice(0, 5)}`);
        }
      }
    });
  }, [turnoActivo]);

  const cargarReservas = async () => {
    setCargando(true);
    try {
      const res = await mozoService.obtenerReservas(fechaStr, turnoActivo);
      if (res.exito && res.datos) {
        setReservas(res.datos);
      }
    } finally {
      setCargando(false);
    }
  };

  const cambiarDia = (offset: number) => {
    try {
      const [year, month, day] = fechaStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + offset);
      const nuevaStr = d.toISOString().split('T')[0];
      setFechaStr(nuevaStr);
      setFechaDisplay(formatearFechaDisplay(nuevaStr));
    } catch {
      // no-op
    }
  };

  const irAHoy = () => {
    const hoy = getHoyFechaStr();
    setFechaStr(hoy);
    setFechaDisplay(formatearFechaDisplay(hoy));
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
    const total = reservas.length;
    const enEspera = reservas.filter((r) => r.estado === 'confirmada' || r.estado === 'bloqueada').length;
    const atendidas = reservas.filter((r) => r.estado === 'atendida').length;
    const inasistencias = reservas.filter((r) => r.estado === 'no_show' || r.estado === 'cancelada').length;
    const proximasEnHora = reservas.filter(
      (r) => (r.estado === 'confirmada' || r.estado === 'bloqueada') && r.minutos_restantes <= 60
    ).length;

    return {
      total,
      enEspera,
      atendidas,
      inasistencias,
      proximasEnHora,
    };
  }, [reservas]);

  // Acciones sobre Reservas
  const handleSentarReserva = async (reserva: ReservaCardDTO) => {
    const res = await mozoService.sentarReserva(reserva.id);
    if (res.exito) {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reserva.id ? { ...r, estado: 'atendida' as const, pedido_id: res.datos.pedido_id } : r
        )
      );
      mostrarToast(
        `✓ ${reserva.cliente_nombre} sentados en ${reserva.mesas_etiqueta}. Comanda abierta exitosamente.`
      );
      if (reserva.mesa_ids.length > 0) {
        navigate(ROUTES.MOZO_COMANDA(reserva.mesa_ids[0]));
      }
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'Error al sentar comensales');
    }
  };

  const handleRegistrarNoShow = async (reservaId: string, motivo: string) => {
    const res = await mozoService.registrarNoShow(reservaId, motivo);
    if (res.exito) {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reservaId
            ? {
                ...r,
                estado: 'no_show' as const,
                notas: `${r.notas ? r.notas + ' | ' : ''}Inasistencia: ${motivo}`,
              }
            : r
        )
      );
      mostrarToast(`⚠️ Inasistencia registrada. Mesa liberada inmediatamente a verde LIBRE.`);
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'Error al registrar inasistencia');
    }
  };

  const handleCancelarReserva = async (reservaId: string, motivo: string) => {
    const res = await mozoService.cancelarReserva(reservaId, motivo);
    if (res.exito) {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reservaId
            ? { ...r, estado: 'cancelada' as const, notas: `${r.notas ? r.notas + ' | ' : ''}Cancelada: ${motivo}` }
            : r
        )
      );
      mostrarToast(`Reserva cancelada correctamente. Mesa liberada.`);
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'Error al cancelar reserva');
    }
  };

  const handleCrearNuevaReserva = async (payload: CrearReservaRequestDTO) => {
    const res = await mozoService.crearReserva(payload);
    if (res.exito && res.datos) {
      setReservas((prev) => [res.datos, ...prev]);
      mostrarToast(
        `📅 Reserva confirmada para ${res.datos.cliente_nombre} a las ${res.datos.hora_texto} en ${res.datos.mesas_etiqueta}`
      );
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo crear la reserva');
    }
  };

  const handleAbrirWhatsApp = (reserva: ReservaCardDTO) => {
    const mensaje = `Hola ${reserva.cliente_nombre}, le saludamos de RestaurantCloud AI para confirmar su reserva de hoy a las ${reserva.hora_texto} para ${reserva.num_personas} personas en ${reserva.mesas_etiqueta}. ¿Desea confirmar su asistencia?`;
    const url = generarEnlaceWhatsApp(reserva.cliente_telefono, mensaje);
    window.open(url, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/60 overflow-hidden select-none">
      {/* Toast Notificación */}
      {toastMensaje && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-aurea-champagne text-xs font-semibold shadow-xl border border-aurea-copper/40 flex items-center gap-2 animate-bounce-slow">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Cabecera de Reservas */}
      <ReservasHeader
        fechaTexto={fechaDisplay}
        turnoActivo={turnoActivo}
        onCambiarTurno={(turno) => setTurnoActivo(turno)}
        onFechaAnterior={() => cambiarDia(-1)}
        onFechaSiguiente={() => cambiarDia(1)}
        onFechaHoy={irAHoy}
        onNuevaReserva={() => setModalNuevaAbierto(true)}
      />

      {/* Contenido Central */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* 4 KPIs de Resumen de Turno */}
        <ReservasKPICards
          totalReservas={metricas.total}
          proximasEnUnaHora={metricas.proximasEnHora}
          atendidasHoy={metricas.atendidas}
          inasistenciasHoy={metricas.inasistencias}
        />

        {/* Barra de Filtros en Píldoras */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <ReservasFiltrosPills
            filtroActivo={filtroActivo}
            onCambiarFiltro={(filtro) => setFiltroActivo(filtro)}
            conteos={{
              todas: metricas.total,
              enEspera: metricas.enEspera,
              atendidas: metricas.atendidas,
              inasistencias: metricas.inasistencias,
            }}
          />

          <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
            Horario activo: <strong>{horarioTurnoTexto}</strong> (Turno {turnoActivo === 'almuerzo' ? 'Almuerzo' : 'Cena'})
          </span>
        </div>

        {/* Tabla Operativa de Citas */}
        {cargando ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            Cargando reservas de salón en tiempo real...
          </div>
        ) : (
          <ReservasTable
            reservas={reservasFiltradas}
            onSentarReserva={handleSentarReserva}
            onAbrirFicha={(res) => {
              setReservaFichaSeleccionada(res);
              setModalFichaAbierto(true);
            }}
            onAbrirWhatsApp={handleAbrirWhatsApp}
          />
        )}
      </div>

      {/* Modal Nueva Reserva con Mini-Mapa (Vista 2) */}
      <ModalNuevaReserva
        abierto={modalNuevaAbierto}
        onCerrar={() => setModalNuevaAbierto(false)}
        onConfirmar={handleCrearNuevaReserva}
      />

      {/* Modal Ficha y Recepción (Vista 3) */}
      <ModalFichaReserva
        abierto={modalFichaAbierto}
        reserva={reservaFichaSeleccionada}
        onCerrar={() => {
          setModalFichaAbierto(false);
          setReservaFichaSeleccionada(null);
        }}
        onSentarComensales={handleSentarReserva}
        onRegistrarNoShow={handleRegistrarNoShow}
        onCancelarReserva={handleCancelarReserva}
        onEnviarWhatsApp={handleAbrirWhatsApp}
      />
    </div>
  );
};
