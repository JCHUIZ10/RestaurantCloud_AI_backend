import React, { useState, useEffect, useMemo } from 'react';
import { ReservaCardDTO, CrearReservaRequestDTO } from '@/types/mozo';
import { mockMozoService } from '../services/mockMozoService';
import { ReservasHeader } from '../components/reservas/ReservasHeader';
import { ReservasKPICards } from '../components/reservas/ReservasKPICards';
import { ReservasFiltrosPills, FiltroReservaEstado } from '../components/reservas/ReservasFiltrosPills';
import { ReservasTable } from '../components/reservas/ReservasTable';
import { ModalNuevaReserva } from '../components/reservas/ModalNuevaReserva';
import { ModalFichaReserva } from '../components/reservas/ModalFichaReserva';
import { ModalSobreasignacionAlerta } from '../components/reservas/ModalSobreasignacionAlerta';
import { ModalPaywallReservas } from '../components/reservas/ModalPaywallReservas';
import { DemoReservasWidget } from '../components/reservas/DemoReservasWidget';
import { Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

export const MozoReservasPage: React.FC = () => {
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [reservas, setReservas] = useState<ReservaCardDTO[]>([]);
  const [fechaStr, setFechaStr] = useState('2026-10-09');
  const [fechaDisplay, setFechaDisplay] = useState('Hoy, 09 Octubre 2026');
  const [turnoActivo, setTurnoActivo] = useState<'almuerzo' | 'cena'>('almuerzo');
  const [filtroActivo, setFiltroActivo] = useState<FiltroReservaEstado>('todas');

  // Modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [reservaFichaSeleccionada, setReservaFichaSeleccionada] = useState<ReservaCardDTO | null>(null);
  const [modalSobreasignacionAbierto, setModalSobreasignacionAbierto] = useState(false);
  const [modalPaywallAbierto, setModalPaywallAbierto] = useState(false);
  const [esPlanStarter, setEsPlanStarter] = useState(false);

  // Toast
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  useEffect(() => {
    cargarReservas();
  }, [fechaStr, turnoActivo]);

  const cargarReservas = async () => {
    setCargando(true);
    try {
      const res = await mockMozoService.obtenerReservas(fechaStr, turnoActivo);
      if (res.exito) {
        setReservas(res.datos);
      }
    } finally {
      setCargando(false);
    }
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
    const res = await mockMozoService.sentarReserva(reserva.id);
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
        // Opción de redirigir a toma de comanda en salón
        navigate(ROUTES.MOZO_COMANDA(reserva.mesa_ids[0]));
      }
    }
  };

  const handleRegistrarNoShow = async (reservaId: string, motivo: string) => {
    const res = await mockMozoService.registrarNoShow(reservaId, motivo);
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
    }
  };

  const handleCancelarReserva = async (reservaId: string, motivo: string) => {
    const res = await mockMozoService.cancelarReserva(reservaId, motivo);
    if (res.exito) {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reservaId
            ? { ...r, estado: 'cancelada' as const, notas: `${r.notas ? r.notas + ' | ' : ''}Cancelada: ${motivo}` }
            : r
        )
      );
      mostrarToast(`Reserva cancelada correctamente. Mesa liberada.`);
    }
  };

  const handleCrearNuevaReserva = async (payload: CrearReservaRequestDTO) => {
    const res = await mockMozoService.crearReserva(payload);
    if (res.exito) {
      setReservas((prev) => [res.datos, ...prev]);
      mostrarToast(
        `📅 Reserva confirmada para ${res.datos.cliente_nombre} a las ${res.datos.hora_texto} en ${res.datos.mesas_etiqueta}`
      );
    }
  };

  const handleAbrirWhatsApp = (reserva: ReservaCardDTO) => {
    const telefonoLimpio = reserva.cliente_telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent(
      `Hola ${reserva.cliente_nombre}, le saludamos de RestaurantCloud AI para confirmar su reserva de hoy a las ${reserva.hora_texto} para ${reserva.num_personas} personas en ${reserva.mesas_etiqueta}. ¿Desea confirmar su asistencia?`
    );
    window.open(`https://wa.me/${telefonoLimpio}?text=${mensaje}`, '_blank');
  };

  // Simulación SSE
  const handleSimularNuevaReservaSSE = () => {
    const nuevaMock: ReservaCardDTO = {
      id: `res-sse-${Date.now()}`,
      cliente_nombre: 'Ing. Fernando Soto',
      cliente_telefono: '+51 922 887 766',
      fecha_hora: '2026-10-09T14:45:00Z',
      hora_texto: '14:45',
      minutos_restantes: 65,
      num_personas: 4,
      mesas_etiqueta: 'Mesa 10',
      mesa_ids: ['mesa-10'],
      estado: 'confirmada',
      notas: 'Reserva agendada online vía Carta QR',
      en_tolerancia: false,
      tolerancia_expiro: false,
      created_at: new Date().toISOString(),
    };
    setReservas((prev) => [nuevaMock, ...prev]);
    mostrarToast("📡 SSE: Nueva reserva recibida en tiempo real para Ing. Fernando Soto (14:45 • Mesa 10)");
  };

  const handleSimularBloqueoPreventivoSSE = () => {
    setReservas((prev) =>
      prev.map((r) =>
        r.id === 'res-005'
          ? { ...r, estado: 'bloqueada' as const, minutos_restantes: 20 }
          : r
      )
    );
    mostrarToast("📡 SSE: Mesa 08 conmutó a contorno punteado [BLOQUEADA RESERVA • Fam. Gómez]");
  };

  const handleReasignarSobreasignacion = async () => {
    const res = await mockMozoService.reasignarMesaReserva(
      'res-005',
      'mesa-05',
      'Reasignada para permitir ocupación casual en Mesa 08'
    );
    if (res.exito) {
      setReservas((prev) =>
        prev.map((r) => (r.id === 'res-005' ? res.datos : r))
      );
      mostrarToast('🔄 Reserva de Fam. Gómez reasignada con éxito a Mesa 05. Mesa 08 disponible para comensales en sala.');
    }
  };

  const handleForzarOcupacionRapida = async () => {
    mostrarToast('⚠️ Mesa 08 ocupada en modalidad consumo express (< 20 min). Alerta emitida al salón.');
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
        onFechaAnterior={() => {
          setFechaStr('2026-10-08');
          setFechaDisplay('Ayer, 08 Octubre 2026');
        }}
        onFechaSiguiente={() => {
          setFechaStr('2026-10-10');
          setFechaDisplay('Mañana, 10 Octubre 2026');
        }}
        onFechaHoy={() => {
          setFechaStr('2026-10-09');
          setFechaDisplay('Hoy, 09 Octubre 2026');
        }}
        onNuevaReserva={() => {
          if (esPlanStarter) {
            setModalPaywallAbierto(true);
          } else {
            setModalNuevaAbierto(true);
          }
        }}
        esPlanStarter={esPlanStarter}
      />

      {/* Contenido Central */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Banner Didáctico de Plan Starter si está activo */}
        {esPlanStarter && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Modo Simulación Plan Starter Activo:</strong> Puedes consultar este paywall didáctico simulando una cuenta en plan básico.
              </span>
            </div>
            <button
              onClick={() => setModalPaywallAbierto(true)}
              className="px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-amber-950 text-xs shrink-0"
            >
              Ver Paywall Completo
            </button>
          </div>
        )}

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
            Horario activo: <strong>12:00 a 16:30</strong> (Turno Almuerzo)
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

      {/* Modal Sobreasignación Preventiva (Vista 4 Izquierda) */}
      <ModalSobreasignacionAlerta
        abierto={modalSobreasignacionAbierto}
        mesaNumero="08"
        clienteReservaNombre="Fam. Gómez (4 personas)"
        horaReserva="14:00"
        minutosRestantes={20}
        mesaAlternativaNumero="05"
        onCerrar={() => setModalSobreasignacionAbierto(false)}
        onReasignarReserva={handleReasignarSobreasignacion}
        onForzarOcupacionRapida={handleForzarOcupacionRapida}
      />

      {/* Modal Paywall Starter (Vista 4 Derecha) */}
      <ModalPaywallReservas
        abierto={modalPaywallAbierto}
        onCerrar={() => setModalPaywallAbierto(false)}
      />

      {/* Widget de Simulación y Pruebas CU-MOZO-05 */}
      <DemoReservasWidget
        onSimularNuevaReservaSSE={handleSimularNuevaReservaSSE}
        onSimularBloqueoPreventivoSSE={handleSimularBloqueoPreventivoSSE}
        onAbrirSobreasignacion={() => setModalSobreasignacionAbierto(true)}
        onAlternarPlanStarter={() => setEsPlanStarter(!esPlanStarter)}
        esPlanStarter={esPlanStarter}
        onAbrirNuevaReserva={() => {
          if (esPlanStarter) {
            setModalPaywallAbierto(true);
          } else {
            setModalNuevaAbierto(true);
          }
        }}
        onAbrirFichaDemo={() => {
          const famGomez = reservas.find((r) => r.id === 'res-005') || reservas[0];
          setReservaFichaSeleccionada(famGomez);
          setModalFichaAbierto(true);
        }}
      />
    </div>
  );
};
