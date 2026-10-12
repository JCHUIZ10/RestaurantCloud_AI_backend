import React from 'react';
import { Clock, Phone, MessageSquare, User, Check, Eye, ArrowUpRight } from 'lucide-react';
import { ReservaCardDTO } from '@/types/mozo';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface ReservasTableProps {
  reservas: ReservaCardDTO[];
  onSentarReserva: (reserva: ReservaCardDTO) => void;
  onAbrirFicha: (reserva: ReservaCardDTO) => void;
  onAbrirWhatsApp: (reserva: ReservaCardDTO) => void;
}

export const ReservasTable: React.FC<ReservasTableProps> = ({
  reservas,
  onSentarReserva,
  onAbrirFicha,
  onAbrirWhatsApp,
}) => {
  const navigate = useNavigate();

  // Badge de anticipación relativo a la hora de cita
  const renderAnticipacionBadge = (reserva: ReservaCardDTO) => {
    if (reserva.estado === 'atendida') {
      return (
        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
          En mesa
        </span>
      );
    }
    if (reserva.estado === 'no_show') {
      return (
        <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
          Inasistencia
        </span>
      );
    }
    if (reserva.estado === 'cancelada') {
      return (
        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
          Cancelada
        </span>
      );
    }

    if (reserva.minutos_restantes <= 0) {
      const retraso = Math.abs(reserva.minutos_restantes);
      return (
        <span className="text-[10px] text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded font-bold border border-rose-300 animate-pulse">
          ⏱️ +{retraso} min retraso
        </span>
      );
    }

    if (reserva.minutos_restantes <= 30) {
      return (
        <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-bold border border-amber-300">
          ⏱️ En {reserva.minutos_restantes} min
        </span>
      );
    }

    const horas = Math.floor(reserva.minutos_restantes / 60);
    const mins = reserva.minutos_restantes % 60;
    const tiempoTexto = horas > 0 ? `${horas}h ${mins > 0 ? `${mins}m` : ''}` : `${mins} min`;

    return (
      <span className="text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-medium border border-sky-200">
        ⏱️ En {tiempoTexto}
      </span>
    );
  };

  // Badge de estado operativo de reserva
  const renderEstadoBadge = (estado: ReservaCardDTO['estado']) => {
    switch (estado) {
      case 'confirmada':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            CONFIRMADA
          </span>
        );
      case 'bloqueada':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            BLOQUEADA
          </span>
        );
      case 'atendida':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            <span>ATENDIDA</span>
          </span>
        );
      case 'no_show':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            INASISTENCIA
          </span>
        );
      case 'cancelada':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            CANCELADA
          </span>
        );
      default:
        return null;
    }
  };

  if (reservas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-700 mb-1">
          No hay reservas para los filtros seleccionados
        </h3>
        <p className="text-slate-500 text-xs max-w-sm mx-auto">
          No se encontraron citas programadas en esta franja. Utiliza el botón "+ Nueva Reserva" para agendar una mesa en salón.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-3 text-center">PAX</th>
              <th className="py-3 px-4">Mesa Asignada</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {reservas.map((reserva) => {
              const esActiva = reserva.estado === 'confirmada' || reserva.estado === 'bloqueada';
              return (
                <tr
                  key={reserva.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    reserva.estado === 'bloqueada' ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* Hora */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <div className="text-sm font-semibold">{reserva.hora_texto}</div>
                    <div className="mt-0.5">{renderAnticipacionBadge(reserva)}</div>
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {reserva.cliente_nombre}
                    </div>
                    {reserva.notas && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xs mt-0.5">
                        "{reserva.notas}"
                      </p>
                    )}
                  </td>

                  {/* Teléfono y WhatsApp */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reserva.cliente_telefono}</span>
                    </div>
                  </td>

                  {/* PAX */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-800">
                      <User className="w-3 h-3 text-slate-500" />
                      {reserva.num_personas}p
                    </span>
                  </td>

                  {/* Mesa Asignada */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-aurea-navy/5 text-aurea-navy font-bold border border-aurea-navy/15">
                      {reserva.mesas_etiqueta}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderEstadoBadge(reserva.estado)}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {esActiva && (
                        <button
                          onClick={() => onSentarReserva(reserva)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs active:scale-95"
                          title="Sentar comensales y abrir comanda"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Sentar</span>
                        </button>
                      )}

                      {reserva.estado === 'atendida' && (
                        <button
                          onClick={() => {
                            if (reserva.mesa_ids.length > 0) {
                              navigate(ROUTES.MOZO_COMANDA(reserva.mesa_ids[0]));
                            } else {
                              onAbrirFicha(reserva);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Ver comanda en curso"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-aurea-copper" />
                          <span>Ver Comanda</span>
                        </button>
                      )}

                      <button
                        onClick={() => onAbrirFicha(reserva)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                        title="Ver ficha de reserva"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ficha</span>
                      </button>

                      <button
                        onClick={() => onAbrirWhatsApp(reserva)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        title="Contactar por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Mostrando {reservas.length} registros del turno</span>
        <span className="font-medium text-slate-600">
          * Módulo exclusivo para Planes Pro y Enterprise SaaS
        </span>
      </div>
    </div>
  );
};
