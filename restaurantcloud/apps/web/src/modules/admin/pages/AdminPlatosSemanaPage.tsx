import React, { useMemo } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { EstadoBadge, EstadoError, EstadoVacio, PageHeader, Skeleton } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { cn } from '@/shared/utils';
import type { PlatoPronosticoDTO } from '@/types/prediccion';
import {
  AvisosPrediccion,
  IndicadorNivel,
  SinPlanPrediccion,
  diaCorto,
  formatoEntero,
  nombreDia,
  rangoDeSemana,
  suma,
  useUltimaPrediccion,
} from '../components/prediccion';

interface PlatoResumen {
  plato: PlatoPronosticoDTO;
  semana: number;
  /** El plato se calcula con lo vendido en semanas anteriores, no con el modelo */
  enPreparacion: boolean;
  sinVentas: boolean;
}

/** Barra de un día: lo más probable y, encima, lo que podría llegar a vender si el día viene movido. */
const BarraDia: React.FC<{ p50: number; p90: number; escala: number; cerrado: boolean }> = ({ p50, p90, escala, cerrado }) => {
  if (cerrado) {
    return (
      <div
        className="w-8 h-11 rounded-md bg-[repeating-linear-gradient(135deg,#E7EAEF_0_6px,#F5F6F8_6px_12px)]"
        role="img"
        aria-label="Cerrado"
      />
    );
  }
  const base = Math.round((p50 / escala) * 100);
  const extra = Math.max(0, Math.round(((p90 - p50) / escala) * 100));
  return (
    <div className="w-8 h-11 rounded-md bg-tinta-50 overflow-hidden flex flex-col justify-end" aria-hidden="true">
      <div className="bg-aurea-champagne" style={{ height: `${extra}%` }} />
      <div className="bg-aurea-navy" style={{ height: `${base}%` }} />
    </div>
  );
};

const FILA = 'grid grid-cols-[minmax(0,2.2fr)_repeat(7,minmax(0,1fr))_minmax(0,1fr)] gap-2 items-center px-5';

/** Lo que vas a vender: los favoritos de la semana y cada plato, día por día. */
export const AdminPlatosSemanaPage: React.FC = () => {
  const { estado, datos, error, recargar } = useUltimaPrediccion();

  const platos = useMemo<PlatoResumen[]>(() => {
    const lista = (datos?.pronostico?.predicciones ?? []).map((plato) => ({
      plato,
      semana: suma(plato.dias.map((d) => d.p50)),
      enPreparacion: plato.dias.some((d) => d.metodo === 'baseline'),
      sinVentas: plato.dias.every((d) => d.metodo === 'sin_historial' || d.metodo === 'cerrado'),
    }));
    return lista.sort((a, b) => b.semana - a.semana || a.plato.nombre.localeCompare(b.plato.nombre));
  }, [datos]);

  const escala = Math.max(1, ...platos.flatMap((p) => p.plato.dias.map((d) => d.p90)));
  const fechas = platos[0]?.plato.dias.map((d) => d.fecha) ?? [];
  const favoritos = platos.filter((p) => !p.sinVentas).slice(0, 3);
  const totalSemana = suma(platos.map((p) => p.semana));

  const cabecera = (
    <PageHeader
      titulo="Lo que vas a vender"
      icono={UtensilsCrossed}
      volver={{ etiqueta: 'Volver a Planificar la semana', to: ROUTES.ADMIN_PLANIFICAR_SEMANA }}
      descripcion={
        datos?.pronostico
          ? `Cerca de ${formatoEntero(Math.round(totalSemana))} platos y bebidas ${rangoDeSemana(fechas)}. Cada número es lo más probable; la franja clara muestra hasta dónde podría llegar un día muy movido.`
          : 'Los platos de tu carta, día por día.'
      }
    />
  );

  if (estado === 'cargando') {
    return (
      <div className="space-y-6">
        {cabecera}
        <Skeleton className="h-44" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (estado === 'sin_plan') return <div className="space-y-6">{cabecera}<SinPlanPrediccion /></div>;
  if (estado === 'error') return <div className="space-y-6">{cabecera}<EstadoError mensaje={error ?? 'No se pudo cargar la predicción.'} onReintentar={() => recargar()} /></div>;
  if (estado === 'vacio' || datos === null || datos.pronostico === null) {
    return (
      <div className="space-y-6">
        {cabecera}
        {datos && <AvisosPrediccion datos={datos} onReintentar={() => recargar()} reintentando={false} />}
        <EstadoVacio
          icono={UtensilsCrossed}
          titulo="Aún no hay una semana calculada"
          descripcion="Calcula tu semana desde «Planificar la semana» y aquí verás cada plato, día por día."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cabecera}
      <IndicadorNivel nivel={datos.nivel} progreso={datos.progreso} confianza={datos.confianza} />
      <AvisosPrediccion datos={datos} onReintentar={() => recargar()} reintentando={false} />

      {favoritos.length > 0 && (
        <section aria-labelledby="titulo-favoritos" className="space-y-3">
          <h2 id="titulo-favoritos" className="font-serif text-2xl text-aurea-navy">Los favoritos de la semana</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {favoritos.map(({ plato, semana }, i) => {
              const mayor = Math.max(...plato.dias.map((d) => d.p50));
              const mejor = plato.dias.find((d) => d.p50 === mayor)!;
              const oscura = i === 0;
              return (
                <article
                  key={plato.producto_id}
                  className={cn('rounded-3xl p-5 space-y-3 border', oscura ? 'bg-aurea-navy text-aurea-ivory border-aurea-navy' : 'bg-white text-aurea-navy border-aurea-copper/40')}
                >
                  <p className={cn('text-sm font-bold', oscura ? 'text-aurea-champagne' : 'text-aurea-copper')}>
                    {['El más pedido', 'Segundo', 'Tercero'][i]}
                  </p>
                  <h3 className="font-serif text-2xl leading-tight">{plato.nombre}</h3>
                  <p className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums">≈ {formatoEntero(Math.round(semana))}</span>
                    <span className={cn('text-sm', oscura ? 'text-aurea-ivory/80' : 'text-tinta-600')}>en la semana</span>
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 items-end h-16" aria-hidden="true">
                    {plato.dias.map((d) => (
                      <div key={d.fecha} className="flex flex-col items-center justify-end gap-1 h-full">
                        <div className={cn('w-full rounded-t-md', oscura ? 'bg-aurea-copper' : 'bg-aurea-navy')} style={{ height: `${Math.max(6, Math.round((d.p50 / mayor) * 100))}%` }} />
                        <span className={cn('text-xs', oscura ? 'text-aurea-ivory/70' : 'text-tinta-500')}>{diaCorto(d.fecha).dia.charAt(0)}</span>
                      </div>
                    ))}
                  </div>
                  <p className={cn('text-sm', oscura ? 'text-aurea-ivory/85' : 'text-tinta-600')}>
                    Su mejor día será el {nombreDia(mejor.fecha)}: entre {formatoEntero(Math.round(mejor.p50))} y {formatoEntero(Math.round(mejor.p90))} platos.
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-todos" className="bg-white border border-tinta-100 rounded-3xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-tinta-50">
          <h2 id="titulo-todos" className="text-lg font-bold text-aurea-navy">Todos los platos, día por día</h2>
          <ul className="flex flex-wrap gap-4 text-xs text-tinta-600">
            <li className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-aurea-navy" aria-hidden="true" />Lo más probable</li>
            <li className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-aurea-champagne" aria-hidden="true" />Si el día viene muy movido</li>
          </ul>
        </div>

        {/* Escritorio: tabla */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[820px]">
            <div className={cn(FILA, 'py-3 bg-tinta-50 text-xs font-semibold text-tinta-600')} role="row">
              <span>Plato</span>
              {fechas.map((f) => <span key={f} className="text-center">{diaCorto(f).dia} {diaCorto(f).numero}</span>)}
              <span className="text-right">Semana</span>
            </div>
            {platos.map(({ plato, semana, enPreparacion, sinVentas }) => (
              <div key={plato.producto_id} className={cn(FILA, 'py-3 border-t border-tinta-50')} role="row">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-aurea-navy truncate">{plato.nombre}</p>
                  {sinVentas ? <EstadoBadge tono="neutro">Sin ventas todavía</EstadoBadge> : enPreparacion && <EstadoBadge tono="alerta">En preparación</EstadoBadge>}
                </div>
                {plato.dias.map((d) => (
                  <div key={d.fecha} className="flex flex-col items-center gap-1" title={d.metodo === 'cerrado' ? 'Cerrado' : `Lo más probable ${Math.round(d.p50)}; en un día muy movido hasta ${Math.round(d.p90)}`}>
                    <BarraDia p50={d.p50} p90={d.p90} escala={escala} cerrado={d.metodo === 'cerrado'} />
                    <span className="text-sm font-semibold tabular-nums text-aurea-navy">{d.metodo === 'cerrado' ? '—' : formatoEntero(Math.round(d.p50))}</span>
                  </div>
                ))}
                <span className="text-right text-base font-bold tabular-nums text-aurea-navy">{sinVentas ? '—' : formatoEntero(Math.round(semana))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Celular: una tarjeta por plato */}
        <ul className="md:hidden divide-y divide-tinta-50">
          {platos.map(({ plato, semana, enPreparacion, sinVentas }) => (
            <li key={plato.producto_id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-aurea-navy">{plato.nombre}</p>
                  {sinVentas ? <EstadoBadge tono="neutro">Sin ventas todavía</EstadoBadge> : enPreparacion && <EstadoBadge tono="alerta">En preparación</EstadoBadge>}
                </div>
                <p className="text-lg font-bold tabular-nums text-aurea-navy shrink-0">{sinVentas ? '—' : `≈ ${formatoEntero(Math.round(semana))}`}</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {plato.dias.map((d) => (
                  <div key={d.fecha} className="flex flex-col items-center gap-1">
                    <BarraDia p50={d.p50} p90={d.p90} escala={escala} cerrado={d.metodo === 'cerrado'} />
                    <span className="text-xs font-semibold tabular-nums text-aurea-navy">{d.metodo === 'cerrado' ? '—' : formatoEntero(Math.round(d.p50))}</span>
                    <span className="text-xs text-tinta-500">{diaCorto(d.fecha).dia.charAt(0)}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
