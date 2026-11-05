import React, { useState } from 'react';
import type { MetricaRecursoDTO, UsoRecursosDTO, UsoSedeDTO } from '@/types/propietarioSuscripcion';
import {
  Building2,
  Grid,
  Layers,
  LayoutGrid,
  Sparkles,
  Table as TableIcon,
  Users,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

interface ConsumoRecursosRealTimeProps {
  usoRecursos: UsoRecursosDTO;
  /** Clase opcional para el contenedor principal */
  className?: string;
  /** Mostrar u ocultar la cabecera del bloque (por si se embebe en tarjeta con su propio título) */
  mostrarCabecera?: boolean;
}

const getProgressColor = (porcentaje: number, limite: boolean) => {
  if (limite || porcentaje >= 90) return 'bg-amber-500';
  if (porcentaje >= 75) return 'bg-aurea-copper';
  return 'bg-aurea-navy';
};

const getTextColor = (porcentaje: number, limite: boolean) => {
  if (limite || porcentaje >= 90) return 'text-amber-700';
  if (porcentaje >= 75) return 'text-aurea-copper';
  return 'text-aurea-navy';
};

const evaluarEstadoSede = (sede: UsoSedeDTO) => {
  const algunoAlLimite =
    sede.pisos.limite_alcanzado || sede.mesas.limite_alcanzado || sede.usuarios_personal.limite_alcanzado;
  if (algunoAlLimite) {
    return {
      etiqueta: 'Límite alcanzado',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      dotClass: 'bg-red-500',
    };
  }
  const algunoCerca =
    sede.pisos.porcentaje >= 80 || sede.mesas.porcentaje >= 80 || sede.usuarios_personal.porcentaje >= 80;
  if (algunoCerca) {
    return {
      etiqueta: 'Alta ocupación',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    etiqueta: 'Capacidad óptima',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  };
};

interface FilaRecursoCardProps {
  icono: React.ElementType;
  etiqueta: string;
  metrica: MetricaRecursoDTO;
  unidad: string;
}

const FilaRecursoCard: React.FC<FilaRecursoCardProps> = ({ icono: Icono, etiqueta, metrica, unidad }) => {
  const disponibles = Math.max(0, metrica.maximo - metrica.usados);
  const colorBarra = getProgressColor(metrica.porcentaje, metrica.limite_alcanzado);
  const colorTexto = getTextColor(metrica.porcentaje, metrica.limite_alcanzado);

  return (
    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 transition-all hover:bg-slate-50">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
          <Icono className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
          {etiqueta}
        </span>
        <span className="font-mono text-xs">
          <strong className={colorTexto}>{metrica.usados}</strong>
          <span className="text-slate-400"> / {metrica.maximo}</span>
        </span>
      </div>

      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
          style={{ width: `${Math.min(100, metrica.porcentaje)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span>{metrica.porcentaje}% consumido</span>
        {metrica.limite_alcanzado ? (
          <span className="font-bold text-amber-600 flex items-center gap-1 text-[10px]">
            <AlertTriangle className="w-3 h-3" /> Tope alcanzado
          </span>
        ) : disponibles <= 3 ? (
          <span className="font-semibold text-amber-700 text-[10px]">
            ¡Solo {disponibles} {unidad} libres!
          </span>
        ) : (
          <span className="text-slate-400 text-[10px]">
            {disponibles} {disponibles === 1 ? unidad : `${unidad}s`} libres
          </span>
        )}
      </div>
    </div>
  );
};

export const ConsumoRecursosRealTime: React.FC<ConsumoRecursosRealTimeProps> = ({
  usoRecursos,
  className = '',
  mostrarCabecera = true,
}) => {
  const [vista, setVista] = useState<'tarjetas' | 'matriz'>('tarjetas');
  const locales = usoRecursos.locales;
  const sedes = usoRecursos.por_local;
  const cuposLocalesLibres = Math.max(0, locales.maximo - locales.usados);

  return (
    <div className={`space-y-4 ${className}`}>
      {mostrarCabecera && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/20">
              <Layers className="w-4 h-4 text-aurea-copper" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                Consumo de Recursos en Tiempo Real
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Capacidad operativa contratada en tu suscripción y cuotas por sede.
              </p>
            </div>
          </div>

          {/* Selector de Vistas: Tarjetas vs Matriz Visual */}
          {sedes.length > 0 && (
            <div className="inline-flex items-center self-start sm:self-auto p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setVista('tarjetas')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  vista === 'tarjetas'
                    ? 'bg-white text-aurea-navy font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista visual en tarjetas independientes por sede"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-aurea-copper" />
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setVista('matriz')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  vista === 'matriz'
                    ? 'bg-white text-aurea-navy font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista comparativa compacta en matriz visual"
              >
                <TableIcon className="w-3.5 h-3.5 text-aurea-copper" />
                <span>Matriz</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tarjeta Destacada: Cuota Global de Locales / Sedes (Nivel Empresa) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/20 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-aurea-navy text-white shadow-xs shrink-0">
              <Building2 className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Cuota Corporativa de Locales
                </span>
                {locales.limite_alcanzado ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Límite alcanzado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {cuposLocalesLibres} {cuposLocalesLibres === 1 ? 'cupo disponible' : 'cupos disponibles'}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-aurea-navy mt-0.5">
                {locales.usados} de {locales.maximo} locales activos{' '}
                <span className="font-normal text-xs text-slate-500 font-sans">
                  ({locales.porcentaje}% de capacidad asignada)
                </span>
              </p>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-[11px] text-slate-500 block">
              Gobernado a nivel empresa
            </span>
            <span className="text-[11px] font-semibold text-aurea-copper flex items-center sm:justify-end gap-1">
              <Sparkles className="w-3 h-3" /> Sedes independientes
            </span>
          </div>
        </div>

        {/* Barra de progreso de locales */}
        <div className="w-full bg-slate-200/90 rounded-full h-2 overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
              locales.porcentaje,
              locales.limite_alcanzado
            )}`}
            style={{ width: `${Math.min(100, locales.porcentaje)}%` }}
          />
        </div>
      </div>

      {/* Contenido Operativo por Sede */}
      {sedes.length > 0 ? (
        vista === 'tarjetas' ? (
          /* ========================================================================= */
          /* VISTA 1: TARJETAS VISUALES POR SEDE (ALTO IMPACTO Y CLARIDAD)             */
          /* ========================================================================= */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-aurea-copper" />
                Capacidad por sede operativa ({sedes.length})
              </span>
              <span className="text-[11px] text-slate-400">Pisos · Mesas · Personal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {sedes.map((sede) => {
                const estado = evaluarEstadoSede(sede);
                return (
                  <div
                    key={sede.local_id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Cabecera de la sede */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-aurea-copper shrink-0" />
                          <h4 className="font-serif text-sm font-bold text-aurea-navy truncate" title={sede.nombre}>
                            {sede.nombre}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${estado.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${estado.dotClass}`} />
                          {estado.etiqueta}
                        </span>
                      </div>

                      {/* 3 Recursos de la sede */}
                      <div className="space-y-2">
                        <FilaRecursoCard
                          icono={Layers}
                          etiqueta="Pisos / Áreas"
                          metrica={sede.pisos}
                          unidad="piso"
                        />
                        <FilaRecursoCard
                          icono={Grid}
                          etiqueta="Mesas de salón"
                          metrica={sede.mesas}
                          unidad="mesa"
                        />
                        <FilaRecursoCard
                          icono={Users}
                          etiqueta="Personal"
                          metrica={sede.usuarios_personal}
                          unidad="cuenta"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VISTA 2: MATRIZ VISUAL COMPARATIVA (REEMPLAZO MODERNO DE LA TABLA PLANA)  */
          /* ========================================================================= */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
              <span className="font-semibold text-slate-700">Matriz visual comparativa</span>
              <span className="text-[11px] text-slate-400">Valores y saturación en vivo</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
              <table className="w-full text-left text-xs min-w-[34rem]">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Sede Operativa</th>
                    <th className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-aurea-copper" /> Pisos
                      </span>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Grid className="w-3.5 h-3.5 text-aurea-copper" /> Mesas
                      </span>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-aurea-copper" /> Personal
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sedes.map((sede) => {
                    const estado = evaluarEstadoSede(sede);
                    const metricas = [
                      { item: sede.pisos, clave: 'pisos' },
                      { item: sede.mesas, clave: 'mesas' },
                      { item: sede.usuarios_personal, clave: 'usuarios' },
                    ];

                    return (
                      <tr key={sede.local_id} className="hover:bg-slate-50/60 transition-colors">
                        <th scope="row" className="py-3 px-4 font-semibold text-aurea-navy whitespace-nowrap">
                          {sede.nombre}
                        </th>

                        {metricas.map(({ item, clave }) => {
                          const barraColor = getProgressColor(item.porcentaje, item.limite_alcanzado);
                          const textoColor = getTextColor(item.porcentaje, item.limite_alcanzado);
                          return (
                            <td key={clave} className="py-2.5 px-3">
                              <div className="flex flex-col items-center">
                                <span className="font-mono text-xs">
                                  <strong className={textoColor}>{item.usados}</strong>
                                  <span className="text-slate-400">/{item.maximo}</span>
                                  <span className="text-[10px] text-slate-500 ml-1">({item.porcentaje}%)</span>
                                </span>
                                <div className="w-20 bg-slate-200/80 rounded-full h-1 mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barraColor}`}
                                    style={{ width: `${Math.min(100, item.porcentaje)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${estado.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${estado.dotClass}`} />
                            {estado.etiqueta}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
          No hay sedes registradas para mostrar consumo de recursos.
        </div>
      )}

      {/* Nota de pie explicativa de arquitectura SaaS */}
      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
        Los locales se contabilizan globalmente para tu empresa; mientras que pisos, mesas y personal cuentan con cuotas
        independientes configuradas para cada sede activa en tu Plan contratado.
      </p>
    </div>
  );
};
