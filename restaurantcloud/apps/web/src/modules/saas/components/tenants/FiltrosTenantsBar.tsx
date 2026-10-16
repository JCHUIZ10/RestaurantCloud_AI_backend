import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus, Filter } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import type { ParametrosFiltroTenants, MetricasSaaSResumenDTO } from '@/types/saasTenants';

interface FiltrosTenantsBarProps {
  filtros: ParametrosFiltroTenants;
  onFiltrosChange: (nuevosFiltros: Partial<ParametrosFiltroTenants>) => void;
  onAbrirModalAlta?: () => void;
  metricas?: MetricasSaaSResumenDTO;
  conteoBaja?: number;
}

export const FiltrosTenantsBar: React.FC<FiltrosTenantsBarProps> = ({
  filtros,
  onFiltrosChange,
  onAbrirModalAlta,
  metricas,
  conteoBaja = 1,
}) => {
  const navigate = useNavigate();
  interface TabItem {
    id: 'todos' | 'activa' | 'periodo_gracia' | 'suspendida' | 'pendiente_baja';
    label: string;
    count: number;
    highlight?: boolean;
  }

  const tabs: TabItem[] = [
    { id: 'todos', label: 'Todos', count: metricas?.total_empresas ?? 0 },
    { id: 'activa', label: 'Activos', count: metricas?.suscripciones_activas ?? 0 },
    {
      id: 'periodo_gracia',
      label: 'En Gracia',
      count: metricas?.suscripciones_en_gracia ?? 0,
      highlight: (metricas?.suscripciones_en_gracia ?? 0) > 0,
    },
    { id: 'suspendida', label: 'Suspendidos', count: metricas?.suscripciones_suspendidas ?? 0 },
    { id: 'pendiente_baja', label: 'Baja', count: conteoBaja },
  ];

  return (
    <div className="space-y-4">
      {/* Fila superior: Tabs y botón de Alta Manual */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Pestañas de estado con conteo dinámico */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const activo = filtros.tab_estado === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFiltrosChange({ tab_estado: tab.id })}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  activo
                    ? 'bg-aurea-navy text-white shadow-sm'
                    : 'bg-white text-aurea-navy/70 border border-aurea-copper/25 hover:bg-aurea-champagne/20'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    activo
                      ? 'bg-aurea-copper text-aurea-navy'
                      : tab.highlight
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-aurea-champagne/40 text-aurea-navy/80'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Acciones principales: Nueva Alta Manual B2B */}
        <button
          onClick={() => {
            if (onAbrirModalAlta) {
              onAbrirModalAlta();
            } else {
              navigate(ROUTES.SAAS_TENANT_NUEVO);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy text-aurea-ivory text-sm font-semibold hover:bg-opacity-95 shadow-md border border-aurea-copper/40 transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4 text-aurea-copper" />
          <span>Nueva Alta Manual B2B</span>
        </button>
      </div>

      {/* Fila secundaria: Buscador y selector de Plan */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filtros.buscar || ''}
            onChange={(e) => onFiltrosChange({ buscar: e.target.value })}
            placeholder="Buscar por razón social, nombre comercial, RUC o código..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
          />
          {filtros.buscar && (
            <button
              onClick={() => onFiltrosChange({ buscar: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-aurea-navy/40 hover:text-aurea-navy"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Plan */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-aurea-copper shrink-0 hidden sm:block" />
          <select
            value={filtros.plan_id ?? 'todos'}
            onChange={(e) =>
              onFiltrosChange({
                plan_id: e.target.value === 'todos' ? 'todos' : Number(e.target.value),
              })
            }
            aria-label="Filtrar por plan"
            className="w-full sm:w-48 px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 font-medium"
          >
            <option value="todos">Plan: Todos</option>
            <option value="1">Starter (S/ 99)</option>
            <option value="2">Plan Pro (S/ 249)</option>
            <option value="3">Enterprise (S/ 499)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
