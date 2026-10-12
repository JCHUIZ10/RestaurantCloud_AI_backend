import React from 'react';
import { CalendarCheck2, Clock, CheckCircle2, UserX } from 'lucide-react';

interface ReservasKPICardsProps {
  totalReservas: number;
  proximasEnUnaHora: number;
  atendidasHoy: number;
  inasistenciasHoy: number;
}

export const ReservasKPICards: React.FC<ReservasKPICardsProps> = ({
  totalReservas,
  proximasEnUnaHora,
  atendidasHoy,
  inasistenciasHoy,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* KPI 1: Reservas de Hoy */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reservas de Hoy
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy mt-0.5">
            {totalReservas}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Agendadas en el día</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-aurea-navy">
          <CalendarCheck2 className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 2: Próximas en 1 Hora */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-sky-200 shadow-2xs flex items-center justify-between bg-gradient-to-br from-white to-sky-50/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
            Próximas en 1 Hora
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-sky-900 mt-0.5">
            {proximasEnUnaHora}
          </div>
          <div className="text-[11px] text-sky-700 font-medium">Clientes por llegar</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3: Atendidas Hoy */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Comensales Atendidos
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-900 mt-0.5">
            {atendidasHoy}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">En mesa activa</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4: Inasistencias del Día */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-200 shadow-2xs flex items-center justify-between bg-gradient-to-br from-white to-rose-50/40">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
            Inasistencias del Día
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-rose-900 mt-0.5">
            {inasistenciasHoy}
          </div>
          <div className="text-[11px] text-rose-700 font-medium">Mesas liberadas</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
          <UserX className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
