import React from 'react';
import { Clock, User, Bell, Link2, CheckCircle2 } from 'lucide-react';
import { MesaCardDTO } from '@/types/mozo';

interface MesaCardProps {
  mesa: MesaCardDTO;
  onSeleccionar: (mesa: MesaCardDTO) => void;
  onAbrirMesaRapido?: (mesa: MesaCardDTO) => void;
  esSeleccionada?: boolean;
}

export const MesaCard: React.FC<MesaCardProps> = ({
  mesa,
  onSeleccionar,
  onAbrirMesaRapido,
  esSeleccionada = false,
}) => {
  const {
    numero,
    capacidad,
    forma,
    estado,
    etiqueta_union,
    minutos_ocupada,
    total_consumo,
    comensales_sentados,
    mozo_nombre,
    es_mi_mesa,
    platos_listos,
    platos_en_cocina,
    reserva_cliente,
    reserva_hora,
  } = mesa;

  // Icono o indicador de forma
  const formaBadge =
    forma === 'redonda' ? '● Redonda' : forma === 'rectangular' ? '▭ Rectangular' : null;

  // Render según estado
  if (estado === 'libre') {
    return (
      <div
        onClick={() => onSeleccionar(mesa)}
        className={`group relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none min-h-[148px] bg-white hover:bg-emerald-50/40 ${
          esSeleccionada
            ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md'
            : 'border-emerald-500/30 hover:border-emerald-500 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Mesa
            </span>
            <h3 className="font-serif text-2xl font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
              {numero}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            LIBRE
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Cap: {capacidad}
          </span>
          {formaBadge && (
            <span className="text-[10px] text-slate-400">{formaBadge}</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAbrirMesaRapido ? onAbrirMesaRapido(mesa) : onSeleccionar(mesa);
          }}
          className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-transparent transition-all flex items-center justify-center gap-1"
        >
          <span>＋ Sentar Comensales</span>
        </button>
      </div>
    );
  }

  if (estado === 'bloqueada') {
    return (
      <div
        onClick={() => onSeleccionar(mesa)}
        className="group relative flex flex-col justify-between p-4 rounded-xl border-2 border-dashed border-sky-400 bg-sky-50/50 hover:bg-sky-50 shadow-sm cursor-pointer select-none min-h-[148px] transition-all"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Mesa
            </span>
            <h3 className="font-serif text-2xl font-bold text-slate-800">{numero}</h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            RESERVA
          </span>
        </div>

        <div className="my-1.5 bg-white/80 p-2 rounded-lg border border-sky-200/60 text-xs">
          <div className="font-semibold text-slate-800 truncate">
            {reserva_cliente || 'Reserva confirmada'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-sky-700 font-mono mt-0.5">
            <Clock className="w-3 h-3" />
            <span>Hora: {reserva_hora || '14:00'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-sky-800 pt-1">
          <span className="text-[11px]">Cap: {capacidad}p</span>
          <span className="font-semibold text-[11px] underline group-hover:text-sky-900">
            [ Sentar ]
          </span>
        </div>
      </div>
    );
  }

  if (estado === 'cuenta_pedida') {
    return (
      <div
        onClick={() => onSeleccionar(mesa)}
        className={`group relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none min-h-[148px] bg-amber-50/90 hover:bg-amber-100/80 ${
          esSeleccionada
            ? 'border-amber-600 ring-2 ring-amber-500/40 shadow-lg'
            : 'border-amber-500 shadow-md animate-pulse-slow'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Mesa
            </span>
            <h3 className="font-serif text-2xl font-bold text-amber-950">{numero}</h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-900 shadow-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {mesa.es_cuenta_dividida ? `DIVIDIDA (${mesa.partes_subcuentas || 2})` : 'CUENTA PEDIDA'}
          </span>
        </div>

        <div className="my-1 text-center bg-white/90 p-2 rounded-lg border border-amber-300/80">
          <div className="text-[11px] text-slate-500">
            {mesa.es_cuenta_dividida ? 'Espera en Caja (Dividida):' : 'Espera en Caja POS:'}
          </div>
          <div className="font-serif text-lg font-bold text-slate-900">
            S/ {total_consumo?.toFixed(2) || '0.00'}
          </div>
          {mesa.es_cuenta_dividida && (
            <div className="mt-1 text-[10px] font-bold text-amber-800 bg-amber-100 rounded px-1.5 py-0.5">
              ➗ {mesa.partes_subcuentas || 2} comprobantes
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-amber-900 font-medium pt-1">
          <span>⏱️ {minutos_ocupada || 0} min</span>
          <span className="font-semibold truncate max-w-[100px]">{mozo_nombre}</span>
        </div>
      </div>
    );
  }

  // Estado Ocupada (Por defecto)
  return (
    <div
      onClick={() => onSeleccionar(mesa)}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none min-h-[156px] text-white ${
        esSeleccionada
          ? 'bg-aurea-navy border-aurea-copper ring-2 ring-aurea-copper/40 shadow-lg'
          : 'bg-[#0B2340] hover:bg-[#0f2c52] border-slate-700/60 hover:border-aurea-copper/60 shadow-md'
      }`}
    >
      {/* Encabezado: Número y Badge de Estado */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne/80">
              Mesa
            </span>
            {mesa.mesa_principal_id ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                <Link2 className="w-2.5 h-2.5" />
                Anexa
              </span>
            ) : etiqueta_union ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-aurea-copper/30 text-aurea-champagne border border-aurea-copper/40 flex items-center gap-0.5">
                <Link2 className="w-2.5 h-2.5" />
                Unida ({capacidad}p)
              </span>
            ) : null}
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
            {mesa.mesa_principal_id ? `M-${numero} ↳ Vinculada` : (etiqueta_union || numero)}
          </h3>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
            OCUPADA
          </span>
          {es_mi_mesa && (
            <span className="text-[9px] font-bold text-aurea-copper bg-aurea-copper/10 px-1.5 py-0.2 rounded border border-aurea-copper/30">
              ● Mi Mesa
            </span>
          )}
        </div>
      </div>

      {/* Métricas: Consumo acumulado y tiempo */}
      <div className="my-1.5 py-1.5 px-2.5 rounded-lg bg-black/25 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-aurea-copper" />
          <span>{minutos_ocupada || 0} min</span>
        </div>
        <div className="font-serif text-sm font-bold text-aurea-champagne">
          S/ {total_consumo?.toFixed(2) || '0.00'}
        </div>
      </div>

      {/* Alertas de Pase / Cocina o Comensales */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
        <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
          {mozo_nombre?.split(' ')[0] || 'Mozo'} {comensales_sentados ? `(${comensales_sentados}p)` : ''}
        </span>

        {platos_listos > 0 ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 animate-bounce">
            <Bell className="w-3 h-3" />
            {platos_listos} {platos_listos === 1 ? 'LISTO' : 'LISTOS'}
          </span>
        ) : platos_en_cocina > 0 ? (
          <span className="text-[10px] font-mono text-slate-400">
            ⏳ {platos_en_cocina} en prep
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> Servido
          </span>
        )}
      </div>
    </div>
  );
};
