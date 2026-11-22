import React, { useMemo } from 'react';
import { Clock, Receipt, Ticket, User, XCircle } from 'lucide-react';
import { EstadoError, Skeleton } from '@/components/ui';
import { reportesService } from '@/services/serviceAdapter';
import type { RangoDTO, ResumenVentasDTO, VentasPorHoraDTO } from '@/types/reportes';
import { COLOR, colorDeTipoComprobante, tenue } from './colores';
import { CargandoReporte, ErrorReporte, SinVentasReporte, type OtroPeriodo } from './EstadosReporte';
import { GraficoHoras } from './GraficoHoras';
import { GraficoMedios } from './GraficoMedios';
import { LoMasImportante, NotaInformativa, TarjetaKpi, VariacionPildora } from './piezas';
import {
  HORA_DE_CORTE,
  entero,
  etiquetaRangoCorta,
  frasePrincipalVentas,
  hora,
  nombreTipoComprobante,
  periodoAnterior,
  porcentaje,
  soles,
} from './utilidades';
import { useReporte } from './useReporte';

type ResultadoResumen = ReturnType<typeof useReporte<ResumenVentasDTO>>;

interface Props {
  rango: RangoDTO;
  comparando: boolean;
  resumen: ResultadoResumen;
  otroPeriodo: OtroPeriodo | null;
}

const FONDO_HEROE = [
  'radial-gradient(120% 140% at 100% 0%, rgba(213,160,111,.38) 0%, rgba(213,160,111,0) 46%)',
  'radial-gradient(90% 120% at 0% 100%, rgba(14,148,136,.28) 0%, rgba(14,148,136,0) 50%)',
  'linear-gradient(135deg, #0B2340 0%, #163A63 100%)',
].join(', ');

const TARJETA = 'bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm p-4 sm:p-5 min-w-0';

/** Pestaña «Ventas»: el resumen del periodo, la curva por hora, los medios de pago y los comprobantes. */
export const VistaVentas: React.FC<Props> = ({ rango, comparando, resumen, otroPeriodo }) => {
  const horas = useReporte(() => reportesService.porHora(rango), [rango.desde, rango.hasta], {
    estaVacio: (d) => d.franjas.every((f) => f.comprobantes === 0),
  });

  if (resumen.estado === 'cargando') return <CargandoReporte variante="ventas" />;
  if (resumen.estado === 'error' || !resumen.datos) return <ErrorReporte mensaje={resumen.error ?? 'No se pudieron cargar los reportes.'} onReintentar={() => void resumen.recargar()} />;
  if (resumen.estado === 'vacio') return <SinVentasReporte otroPeriodo={otroPeriodo} />;

  return <ContenidoVentas datos={resumen.datos} rango={rango} comparando={comparando} horas={horas} />;
};

interface ContenidoProps {
  datos: ResumenVentasDTO;
  rango: RangoDTO;
  comparando: boolean;
  horas: ReturnType<typeof useReporte<VentasPorHoraDTO>>;
}

const ContenidoVentas: React.FC<ContenidoProps> = ({ datos, rango, comparando, horas }) => {
  const { actual, anterior, variacion_pct: variacion } = datos;
  const compara = comparando && anterior !== null;
  const variacionDe = (clave: keyof NonNullable<typeof variacion>) => (compara ? (variacion?.[clave] ?? null) : null);
  const mayor = Math.max(actual.ventas_total, anterior?.ventas_total ?? 0, 1);
  const sinBase = compara && anterior.ventas_total === 0;

  const franjas = useMemo(() => horas.datos?.franjas ?? [], [horas.datos]);
  const punta = horas.datos?.hora_punta ?? null;
  const promedioDePunta = punta ? franjas.find((f) => f.hora === punta.hora)?.promedio_por_dia : null;
  const mitades = useMemo(() => {
    const antes = franjas.filter((f) => f.hora < HORA_DE_CORTE).reduce((s, f) => s + f.total, 0);
    const despues = franjas.filter((f) => f.hora >= HORA_DE_CORTE).reduce((s, f) => s + f.total, 0);
    return { antes, despues, total: antes + despues };
  }, [franjas]);

  const anuladosPct = actual.ventas_total > 0 ? (actual.anulados.total / actual.ventas_total) * 100 : 0;
  const descuentosPct = actual.ventas_total > 0 ? (actual.descuentos / actual.ventas_total) * 100 : 0;
  const tiposTotal = actual.por_tipo.reduce((s, t) => s + t.total, 0);

  return (
    <div className="space-y-4">
      <LoMasImportante>{frasePrincipalVentas(datos, comparando)}</LoMasImportante>

      <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
        <article className="relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-aurea-navy/20 flex flex-col" style={{ background: FONDO_HEROE }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-aurea-champagne">Ventas del periodo</h3>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-2xl text-aurea-champagne">S/</span>
            <span className="font-serif font-bold text-[clamp(2.5rem,6vw,3.5rem)] leading-none tabular-nums">{entero(actual.ventas_total)}</span>
            {compara && <VariacionPildora valor={variacion?.ventas_total ?? null} oscuro />}
            {sinBase && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-sm">No hubo ventas en el periodo anterior</span>}
          </p>
          <p className="mt-1.5 text-sm text-white/80 tabular-nums">
            {entero(actual.comprobantes)} cuentas cobradas en {entero(actual.dias_con_ventas)} {actual.dias_con_ventas === 1 ? 'día' : 'días'} con ventas
          </p>

          {compara && anterior && (
            <div className="mt-5 space-y-2.5" aria-label="Ventas del periodo frente al anterior">
              {[
                { etiqueta: etiquetaRangoCorta(rango), total: actual.ventas_total, fondo: 'linear-gradient(90deg,#F4D7B0,#D5A06F)' },
                { etiqueta: etiquetaRangoCorta(periodoAnterior(rango)), total: anterior.ventas_total, fondo: 'rgba(255,255,255,.4)' },
              ].map((fila) => (
                <div key={fila.etiqueta} className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="text-white/80 truncate">{fila.etiqueta}</span>
                  <span className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${(fila.total / mayor) * 100}%`, background: fila.fondo }} />
                  </span>
                  <span className="font-semibold tabular-nums">{soles(fila.total)}</span>
                </div>
              ))}
            </div>
          )}

          {punta && promedioDePunta != null && (
            <p className="mt-auto pt-5">
              <span className="flex items-start gap-2 border-t border-white/15 pt-4 text-sm text-white/90">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-aurea-champagne" aria-hidden="true" />
                <span>
                  La hora punta es a las <strong>{hora(punta.hora)}</strong>: se venden {soles(promedioDePunta)} por día en esa sola hora.
                </span>
              </span>
            </p>
          )}
        </article>

        <div className="grid gap-4 sm:grid-cols-2 content-start">
          <TarjetaKpi
            icono={Receipt}
            color={COLOR.azul}
            etiqueta="Cuentas cobradas"
            valor={entero(actual.comprobantes)}
            variacion={variacionDe('comprobantes')}
            detalle={actual.comprobantes_por_dia === null ? undefined : `${porcentaje(actual.comprobantes_por_dia, 1).replace(' %', '')} por día`}
            comparacion={compara && anterior ? { actual: actual.comprobantes, anterior: anterior.comprobantes } : undefined}
          />
          <TarjetaKpi
            icono={Ticket}
            color={COLOR.turquesa}
            etiqueta="Ticket promedio"
            valor={actual.ticket_promedio === null ? '—' : soles(actual.ticket_promedio, 2)}
            unidad={actual.ticket_promedio === null ? undefined : 'por cuenta'}
            variacion={variacionDe('ticket_promedio')}
            comparacion={compara && anterior && actual.ticket_promedio !== null && anterior.ticket_promedio !== null ? { actual: actual.ticket_promedio, anterior: anterior.ticket_promedio } : undefined}
          />
          <TarjetaKpi
            icono={User}
            color={COLOR.ciruela}
            etiqueta="Gasto por comensal"
            valor={actual.ticket_por_comensal === null ? '—' : soles(actual.ticket_por_comensal, 2)}
            variacion={variacionDe('ticket_por_comensal')}
            detalle={actual.comensales > 0 ? `${entero(actual.comensales)} comensales` : 'Sin comensales registrados'}
            comparacion={compara && anterior && actual.ticket_por_comensal !== null && anterior.ticket_por_comensal !== null ? { actual: actual.ticket_por_comensal, anterior: anterior.ticket_por_comensal } : undefined}
          />
          <TarjetaKpi
            icono={XCircle}
            color={COLOR.terracota}
            etiqueta="Anulados"
            valor={entero(actual.anulados.comprobantes)}
            unidad={actual.anulados.comprobantes === 1 ? 'comprobante' : 'comprobantes'}
            detalle={`${soles(actual.anulados.total)} · ${porcentaje(anuladosPct, 2)} de las ventas`}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className={TARJETA} aria-labelledby="t-horas">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 id="t-horas" className="text-base font-bold text-aurea-navy">Ventas por hora del día</h3>
              <p className="text-sm text-aurea-navy/65">Promedio por día con ventas, en soles</p>
            </div>
            {punta && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold" style={{ background: tenue(COLOR.cobre, 0.14), color: '#8A4A12' }}>
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Hora punta {hora(punta.hora)}
              </span>
            )}
          </div>
          {horas.estado === 'cargando' && <Skeleton className="h-72" />}
          {horas.estado === 'error' && <EstadoError mensaje={horas.error ?? 'No se pudo cargar la curva por hora.'} onReintentar={() => void horas.recargar()} />}
          {horas.estado === 'vacio' && <p className="py-12 text-center text-sm text-aurea-navy/65">No hubo ventas en este periodo.</p>}
          {horas.estado === 'ok' && horas.datos && (
            <>
              <GraficoHoras franjas={horas.datos.franjas} horaPunta={punta?.hora ?? null} />
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-aurea-navy/75">
                <li className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[3px]" style={{ background: COLOR.cobre }} />Antes de las {HORA_DE_CORTE}:00</li>
                <li className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[3px]" style={{ background: COLOR.azul }} />Desde las {HORA_DE_CORTE}:00</li>
              </ul>
              {mitades.total > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { etiqueta: `Antes de las ${HORA_DE_CORTE}:00`, total: mitades.antes, color: COLOR.cobre },
                    { etiqueta: `Desde las ${HORA_DE_CORTE}:00`, total: mitades.despues, color: COLOR.azul },
                  ].map((m) => (
                    <div key={m.etiqueta} className="rounded-xl p-3" style={{ background: tenue(m.color, 0.1) }}>
                      <p className="text-sm text-aurea-navy/75">{m.etiqueta}</p>
                      <p className="font-serif font-bold text-2xl text-aurea-navy tabular-nums">{porcentaje((m.total / mitades.total) * 100)}</p>
                      <p className="text-sm text-aurea-navy/70 tabular-nums">{soles(m.total)} en el periodo</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className={`${TARJETA} [container-type:inline-size]`} aria-labelledby="t-medios">
          <h3 id="t-medios" className="text-base font-bold text-aurea-navy">Cómo pagan tus clientes</h3>
          <p className="text-sm text-aurea-navy/65 mb-4">Parte de las ventas por medio de pago</p>
          <GraficoMedios medios={actual.por_medio_pago} total={actual.ventas_total} anteriores={compara ? anterior?.por_medio_pago : null} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={TARJETA} aria-labelledby="t-tipos">
          <h3 id="t-tipos" className="text-base font-bold text-aurea-navy">Comprobantes emitidos</h3>
          <p className="text-sm text-aurea-navy/65 mb-4">Por tipo, en soles</p>
          <div className="flex h-4 gap-0.5 rounded-full overflow-hidden" role="img" aria-label={actual.por_tipo.map((t) => `${nombreTipoComprobante(t.tipo)} ${porcentaje(tiposTotal > 0 ? (t.total / tiposTotal) * 100 : 0)}`).join(', ')}>
            {actual.por_tipo.map((t, i) => (
              <span key={t.tipo} style={{ width: `${tiposTotal > 0 ? (t.total / tiposTotal) * 100 : 0}%`, background: colorDeTipoComprobante(t.tipo, i) }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {actual.por_tipo.map((t, i) => (
              <li key={t.tipo} className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto_3.5rem] items-center gap-3 text-sm text-aurea-navy">
                <i className="w-3 h-3 rounded" style={{ background: colorDeTipoComprobante(t.tipo, i) }} />
                <span className="truncate">
                  {nombreTipoComprobante(t.tipo)} <span className="text-aurea-navy/60 tabular-nums">· {entero(t.comprobantes)}</span>
                </span>
                <span className="font-semibold tabular-nums">{soles(t.total)}</span>
                <span className="text-right text-aurea-navy/65 tabular-nums">{porcentaje(tiposTotal > 0 ? (t.total / tiposTotal) * 100 : 0)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={TARJETA} aria-labelledby="t-descuentos">
          <h3 id="t-descuentos" className="text-base font-bold text-aurea-navy">Descuentos y anulaciones</h3>
          <p className="text-sm text-aurea-navy/65 mb-4">Lo que dejó de entrar en el periodo</p>
          <ul className="space-y-3">
            <li className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tenue(COLOR.ciruela, 0.12), color: COLOR.ciruela }} aria-hidden="true"><Ticket className="w-[18px] h-[18px]" /></span>
              <span><span className="block text-sm font-semibold text-aurea-navy">Descuentos aplicados</span><span className="block text-xs text-aurea-navy/65">Promociones y cortesías</span></span>
              <span className="text-right"><strong className="block text-aurea-navy tabular-nums">{soles(actual.descuentos)}</strong><span className="text-xs text-aurea-navy/65 tabular-nums">{porcentaje(descuentosPct)} de las ventas</span></span>
            </li>
            <li className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tenue(COLOR.terracota, 0.12), color: COLOR.terracota }} aria-hidden="true"><XCircle className="w-[18px] h-[18px]" /></span>
              <span><span className="block text-sm font-semibold text-aurea-navy">Comprobantes anulados</span><span className="block text-xs text-aurea-navy/65">Con nota de crédito</span></span>
              <span className="text-right"><strong className="block text-aurea-navy tabular-nums">{soles(actual.anulados.total)}</strong><span className="text-xs text-aurea-navy/65 tabular-nums">{entero(actual.anulados.comprobantes)} {actual.anulados.comprobantes === 1 ? 'comprobante' : 'comprobantes'}</span></span>
            </li>
          </ul>
          <NotaInformativa className="mt-4">Las anulaciones representan el {porcentaje(anuladosPct, 2)} de las ventas.</NotaInformativa>
        </section>
      </div>
    </div>
  );
};

