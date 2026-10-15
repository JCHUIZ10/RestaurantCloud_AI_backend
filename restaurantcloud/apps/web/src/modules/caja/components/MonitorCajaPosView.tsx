import React, { useState } from 'react';
import {
  Users,
  Clock,
  Receipt,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  Coffee,
} from 'lucide-react';
import { CajaTurnoDTO, MesaCajaMonitorDTO, CajaMetricasPosDTO } from '@/types/caja';

interface MonitorCajaPosViewProps {
  turnoActivo: CajaTurnoDTO;
  mesas: MesaCajaMonitorDTO[];
  metricas: CajaMetricasPosDTO;
  onSolicitarCobroMesa: (mesa: MesaCajaMonitorDTO) => void;
  onProcederCierre: () => void;
}

export const MonitorCajaPosView: React.FC<MonitorCajaPosViewProps> = ({
  turnoActivo,
  mesas,
  metricas,
  onSolicitarCobroMesa,
  onProcederCierre,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'cuenta_pedida' | 'ocupada' | 'libre'>('todas');
  const [filtroAmbiente, setFiltroAmbiente] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Ambientes únicos
  const ambientes = Array.from(new Set(mesas.map((m) => m.piso_nombre)));

  // Filtrado reactivo
  const mesasFiltradas = mesas.filter((m) => {
    // Filtro por estado
    if (filtroEstado !== 'todas' && m.estado !== filtroEstado) {
      return false;
    }
    // Filtro por ambiente
    if (filtroAmbiente !== 'todos' && m.piso_nombre !== filtroAmbiente) {
      return false;
    }
    // Búsqueda por número o mozo
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const coincideNum = m.numero.toLowerCase().includes(q);
      const coincideMozo = m.mozo_nombre?.toLowerCase().includes(q) || false;
      if (!coincideNum && !coincideMozo) return false;
    }
    return true;
  });

  const countCuentaPedida = mesas.filter((m) => m.estado === 'cuenta_pedida').length;
  const countOcupadas = mesas.filter((m) => m.estado === 'ocupada').length;
  const countLibres = mesas.filter((m) => m.estado === 'libre').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Estado del Turno Activo */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold tracking-wide">
                ● Turno #{String(turnoActivo.correlativo).padStart(3, '0')} ABIERTO
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Terminal Habilitado • {turnoActivo.cajero_nombre}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-3 font-mono">
              <span>Fondo Inicial: <strong>S/ {turnoActivo.monto_apertura.toFixed(2)}</strong></span>
              <span>•</span>
              <span>Ventas del Turno: <strong>{turnoActivo.total_ventas || 0} ops (S/ {(turnoActivo.monto_ventas || 0).toFixed(2)})</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">EFECTIVO EN GAVETA</span>
            <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
              S/ {(turnoActivo.efectivo_actual || turnoActivo.monto_apertura).toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={onProcederCierre}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Arqueo / Cierre de Turno</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 Métricas Operativas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Métrica 1: Cuentas Pedidas */}
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-200">
            <span className="text-xs font-bold uppercase tracking-wider">Cuentas Pedidas</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-extrabold text-amber-900 dark:text-amber-100">
              {metricas.mesas_cuenta_pedida}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">por cobrar</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Atención prioritaria de cobro
          </p>
        </div>

        {/* Métrica 2: Monto por Cobrar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monto por Cobrar</span>
            <Receipt className="w-4 h-4 text-aurea-copper" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              S/ {metricas.monto_por_cobrar.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            En mesas con comensales listos
          </p>
        </div>

        {/* Métrica 3: Efectivo en Caja */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Efectivo en Caja</span>
            <span className="text-xs font-mono font-bold text-emerald-600">PEN S/</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              S/ {metricas.efectivo_en_caja.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Fondo inicial + cobros efectivo
          </p>
        </div>

        {/* Métrica 4: Ocupación de Salón */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ocupación Salón</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              {metricas.porcentaje_ocupacion}%
            </span>
            <span className="text-xs text-slate-500">
              ({metricas.mesas_ocupadas_count}/{metricas.total_mesas_count})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metricas.porcentaje_ocupacion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controles de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tabs de Filtro de Estado */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFiltroEstado('todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'todas'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas ({mesas.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('cuenta_pedida')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filtroEstado === 'cuenta_pedida'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <span>⚡ Cuenta Pedida</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
              {countCuentaPedida}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('ocupada')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'ocupada'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ocupadas ({countOcupadas})
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado('libre')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === 'libre'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Libres ({countLibres})
          </button>
        </div>

        {/* Búsqueda y Selector de Ambiente */}
        <div className="flex items-center gap-2">
          {/* Selector de Ambiente */}
          <div className="relative">
            <select
              value={filtroAmbiente}
              onChange={(e) => setFiltroAmbiente(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-aurea-copper"
            >
              <option value="todos">Todos los Ambientes</option>
              {ambientes.map((amb) => (
                <option key={amb} value={amb}>
                  {amb}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar mesa o mozo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-aurea-copper w-44"
            />
          </div>
        </div>
      </div>

      {/* Grid de Mesas del Salón */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mesasFiltradas.map((mesa) => {
          const isCuentaPedida = mesa.estado === 'cuenta_pedida';
          const isOcupada = mesa.estado === 'ocupada';
          const isLibre = mesa.estado === 'libre';

          return (
            <div
              key={mesa.id}
              className={`rounded-3xl p-5 border transition-all relative flex flex-col justify-between ${
                isCuentaPedida
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                  : isOcupada
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
                  : 'bg-slate-50/60 dark:bg-slate-950/30 border-slate-200/60 dark:border-slate-800/60 opacity-80'
              }`}
            >
              {/* Cabecera de la Tarjeta */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                      {mesa.piso_nombre}
                    </span>
                    <h4 className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-0.5">
                      Mesa {mesa.numero}
                    </h4>
                  </div>

                  {isCuentaPedida && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wide animate-pulse uppercase">
                      Cuenta Pedida
                    </span>
                  )}

                  {isOcupada && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[10px] font-semibold border border-sky-200 dark:border-sky-800">
                      Ocupada
                    </span>
                  )}

                  {isLibre && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold">
                      Libre
                    </span>
                  )}
                </div>

                {/* Datos de Comensales y Mozo */}
                {!isLibre ? (
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mozo: {mesa.mozo_nombre}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{mesa.comensales} p.</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{mesa.minutos_en_mesa} min</span>
                      </span>
                      {isCuentaPedida && mesa.minutos_espera_cuenta && (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          Espera: {mesa.minutos_espera_cuenta} min
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 py-4 text-center text-slate-400 text-xs">
                    <Coffee className="w-6 h-6 mx-auto mb-1 opacity-40" />
                    <span>Mesa disponible</span>
                  </div>
                )}
              </div>

              {/* Pie de Tarjeta: Consumo y CTA */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {!isLibre ? (
                  <div className="space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-mono text-slate-400">Total Consumo:</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                        S/ {mesa.total_consumo.toFixed(2)}
                      </span>
                    </div>

                    {isCuentaPedida ? (
                      <button
                        type="button"
                        onClick={() => onSolicitarCobroMesa(mesa)}
                        className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 group"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-white" />
                        <span>Cobrar / Precuenta</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSolicitarCobroMesa(mesa)}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Emitir Precuenta</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-slate-400 font-mono py-1">
                    S/ 0.00
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
