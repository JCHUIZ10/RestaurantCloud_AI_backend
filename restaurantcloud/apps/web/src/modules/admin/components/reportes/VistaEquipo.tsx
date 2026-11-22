import React from 'react';
import { AlertTriangle, ShieldCheck, Trophy } from 'lucide-react';
import { reportesService } from '@/services/serviceAdapter';
import type { DesempenoPersonalDTO, MozoDesempenoDTO, RangoDTO } from '@/types/reportes';
import { COLOR, tenue } from './colores';
import { CargandoReporte, ErrorReporte, SinPlanReportes, SinVentasReporte, type OtroPeriodo } from './EstadosReporte';
import { GraficoMozos } from './GraficoMozos';
import { LoMasImportante, NotaInformativa, VariacionPildora } from './piezas';
import { entero, frasePrincipalEquipo, porcentaje, soles } from './utilidades';
import { useReporte } from './useReporte';

/** Un color por mozo, en el orden del ranking; es el mismo en su tarjeta y en los gráficos. */
const COLORES_MOZO = [COLOR.azul, COLOR.cobre, COLOR.turquesa, COLOR.ciruela, COLOR.oro, COLOR.terracota];
const TARJETA = 'bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm p-4 sm:p-5 min-w-0';

const iniciales = (nombre: string | null): string =>
  (nombre ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

interface Props {
  rango: RangoDTO;
  incluido: boolean;
  /** Ticket promedio de toda la sede, para comparar a cada mozo con él */
  ticketSede: number | null;
  otroPeriodo: OtroPeriodo | null;
}

/** Pestaña «Equipo de salón»: cuánto vende cada mozo, su ticket y sus anulaciones. */
export const VistaEquipo: React.FC<Props> = ({ rango, incluido, ticketSede, otroPeriodo }) => {
  const desempeno = useReporte(() => reportesService.desempeno(rango), [rango.desde, rango.hasta], {
    habilitado: incluido,
    estaVacio: (d) => d.mozos.length === 0,
  });

  if (!incluido || desempeno.estado === 'sin_plan') {
    return (
      <SinPlanReportes
        titulo="Conoce cómo vende tu equipo"
        beneficios={['Ventas y ticket promedio de cada mozo.', 'Cómo se compara cada uno con el promedio de la sede.', 'Anulaciones y mermas por mozo.']}
      />
    );
  }
  if (desempeno.estado === 'cargando') return <CargandoReporte variante="equipo" />;
  if (desempeno.estado === 'error' || !desempeno.datos) return <ErrorReporte mensaje={desempeno.error ?? 'No se pudieron cargar los reportes.'} onReintentar={() => void desempeno.recargar()} />;
  if (desempeno.estado === 'vacio') return <SinVentasReporte otroPeriodo={otroPeriodo} titulo="Todavía no hay ventas del equipo en este periodo" descripcion="Cuando tus mozos cobren cuentas, aquí verás cuánto vende cada uno." />;

  return <ContenidoEquipo datos={desempeno.datos} ticketSede={ticketSede} />;
};

const TarjetaMozo: React.FC<{ mozo: MozoDesempenoDTO; puesto: number; color: string; totalSede: number }> = ({ mozo, puesto, color, totalSede }) => {
  const parte = totalSede > 0 ? (mozo.ventas_total / totalSede) * 100 : 0;
  const huboAnulaciones = mozo.comprobantes_anulados > 0 || mozo.anulaciones.cantidad > 0;
  return (
    <article className={`${TARJETA} relative flex flex-col gap-4`}>
      <span
        className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold"
        style={puesto === 1 ? { background: tenue(COLOR.oro, 0.16), color: '#8A6208' } : { background: '#FFF9F0', color: 'rgba(11,35,64,.7)' }}
      >
        {puesto === 1 && <Trophy className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="sr-only">Puesto </span>
        {puesto}.º
      </span>
      <div className="flex items-center gap-3 pr-14">
        <span className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg font-bold text-white ring-2 ring-white shadow-[0_0_0_4px_rgba(244,215,176,.8)]" style={{ background: color }} aria-hidden="true">
          {iniciales(mozo.mozo_nombre)}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-aurea-navy truncate">{mozo.mozo_nombre ?? 'Sin nombre'}</h3>
          <p className="text-sm text-aurea-navy/65 tabular-nums">Mozo · {entero(mozo.comprobantes)} cuentas</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/70">Ventas</p>
        <p className="font-serif font-bold text-3xl text-aurea-navy tabular-nums">{soles(mozo.ventas_total)}</p>
      </div>
      <div className="space-y-1.5">
        <span className="block h-2.5 rounded-full bg-aurea-navy/[0.06] overflow-hidden" aria-hidden="true">
          <span className="block h-full rounded-full" style={{ width: `${parte}%`, background: color }} />
        </span>
        <p className="text-sm text-aurea-navy/70 tabular-nums">{porcentaje(parte)} de las ventas de la sede</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {[
          { etiqueta: 'Ticket', valor: mozo.ticket_promedio === null ? '—' : soles(mozo.ticket_promedio) },
          { etiqueta: 'Comensales', valor: entero(mozo.comensales) },
          { etiqueta: 'Por cuenta', valor: mozo.comprobantes > 0 && mozo.comensales > 0 ? (mozo.comensales / mozo.comprobantes).toFixed(1) : '—' },
        ].map((d) => (
          <div key={d.etiqueta} className="rounded-xl bg-aurea-ivory p-2.5">
            <dt className="text-xs text-aurea-navy/65">{d.etiqueta}</dt>
            <dd className="font-bold text-aurea-navy tabular-nums">{d.valor}</dd>
          </div>
        ))}
      </dl>
      <p className={`mt-auto flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${huboAnulaciones ? 'bg-estado-alerta-50 text-estado-alerta-800' : 'bg-estado-ok-50 text-estado-ok-800'}`}>
        {huboAnulaciones ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> : <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />}
        <span>
          {huboAnulaciones
            ? [
                mozo.comprobantes_anulados > 0 && `${mozo.comprobantes_anulados} ${mozo.comprobantes_anulados === 1 ? 'comprobante anulado' : 'comprobantes anulados'}`,
                mozo.anulaciones.cantidad > 0 && `${mozo.anulaciones.cantidad} ${mozo.anulaciones.cantidad === 1 ? 'anulación' : 'anulaciones'} antes del cobro`,
              ]
                .filter(Boolean)
                .join(' y ')
            : 'Sin anulaciones en el periodo'}
        </span>
      </p>
    </article>
  );
};

const ContenidoEquipo: React.FC<{ datos: DesempenoPersonalDTO; ticketSede: number | null }> = ({ datos, ticketSede }) => {
  const { mozos, totales } = datos;
  const colores = mozos.map((_, i) => COLORES_MOZO[i % COLORES_MOZO.length]);
  const frase = frasePrincipalEquipo(datos, ticketSede);
  const mayorTicket = Math.max(...mozos.map((m) => m.ticket_promedio ?? 0), ticketSede ?? 0, 1);
  const conAnulaciones = mozos.filter((m) => m.anulaciones.cantidad > 0 || m.anulaciones.mermas > 0);

  return (
    <div className="space-y-4">
      {frase && <LoMasImportante>{frase}</LoMasImportante>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mozos.map((m, i) => (
          <TarjetaMozo key={m.mozo_id} mozo={m} puesto={i + 1} color={colores[i]} totalSede={totales.ventas_total} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={TARJETA} aria-labelledby="t-ventas-mozo">
          <h3 id="t-ventas-mozo" className="text-base font-bold text-aurea-navy">Ventas por mozo</h3>
          <p className="text-sm text-aurea-navy/65 mb-3">En soles, en el periodo</p>
          <GraficoMozos mozos={mozos} colores={colores} />
        </section>

        <section className={TARJETA} aria-labelledby="t-ticket-mozo">
          <h3 id="t-ticket-mozo" className="text-base font-bold text-aurea-navy">Ticket promedio frente a la sede</h3>
          <p className="text-sm text-aurea-navy/65 mb-4">{ticketSede === null ? 'No hay un ticket de la sede para comparar' : `La marca vertical es el promedio de la sede: ${soles(ticketSede, 2)}`}</p>
          <ul className="space-y-4">
            {mozos.map((m, i) => {
              const diferencia = ticketSede !== null && m.ticket_promedio !== null ? m.ticket_promedio - ticketSede : null;
              return (
                <li key={m.mozo_id} className="space-y-1.5">
                  <p className="flex items-center justify-between gap-3 text-sm text-aurea-navy">
                    <span className="font-semibold truncate">{m.mozo_nombre ?? 'Sin nombre'}</span>
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <strong>{m.ticket_promedio === null ? '—' : soles(m.ticket_promedio, 2)}</strong>
                      {diferencia !== null && (
                        <VariacionPildora valor={diferencia} etiqueta={`${diferencia >= 0 ? '+' : '−'}${soles(Math.abs(diferencia), 2)}`} className="text-xs" />
                      )}
                    </span>
                  </p>
                  <span className="relative block h-3 rounded-full bg-aurea-navy/[0.06]" aria-hidden="true">
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${((m.ticket_promedio ?? 0) / mayorTicket) * 100}%`, background: colores[i] }} />
                    {ticketSede !== null && <span className="absolute -inset-y-1 w-0.5 rounded bg-aurea-navy" style={{ left: `${(ticketSede / mayorTicket) * 100}%` }} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className={TARJETA} aria-labelledby="t-anulaciones">
        <h3 id="t-anulaciones" className="text-base font-bold text-aurea-navy">Anulaciones antes del cobro</h3>
        <p className="text-sm text-aurea-navy/65 mb-4">Platos o comandas retirados antes de cobrar, por mozo</p>
        {conAnulaciones.length === 0 ? (
          <p className="flex items-start gap-2 rounded-xl bg-estado-ok-50 px-3 py-2.5 text-sm text-estado-ok-800">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Ningún mozo anuló platos en este periodo. Cuando ocurra, aquí verás cuántos, el monto y el costo de lo que se perdió en cocina.</span>
          </p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full text-sm" aria-label="Anulaciones por mozo">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-aurea-navy/70 bg-aurea-ivory">
                    <th scope="col" className="text-left py-2.5 px-4 sm:px-5">Mozo</th>
                    <th scope="col" className="text-right py-2.5 px-3">Anulaciones</th>
                    <th scope="col" className="text-right py-2.5 px-3">Monto</th>
                    <th scope="col" className="text-right py-2.5 px-3">Con merma</th>
                    <th scope="col" className="text-right py-2.5 px-4 sm:px-5">Costo de merma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aurea-champagne/40 text-aurea-navy tabular-nums">
                  {conAnulaciones.map((m) => (
                    <tr key={m.mozo_id}>
                      <td className="py-2.5 px-4 sm:px-5 font-semibold">{m.mozo_nombre ?? 'Sin nombre'}</td>
                      <td className="text-right py-2.5 px-3">{entero(m.anulaciones.cantidad)}</td>
                      <td className="text-right py-2.5 px-3">{soles(m.anulaciones.monto, 2)}</td>
                      <td className="text-right py-2.5 px-3">{entero(m.anulaciones.mermas)}</td>
                      <td className="text-right py-2.5 px-4 sm:px-5">{soles(m.anulaciones.costo_merma, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <NotaInformativa className="mt-4">
              En total: {entero(totales.anulaciones.cantidad)} anulaciones por {soles(totales.anulaciones.monto, 2)}, de las cuales {entero(totales.anulaciones.mermas)} llegaron a producirse en cocina (costo {soles(totales.anulaciones.costo_merma, 2)}).
            </NotaInformativa>
          </>
        )}
      </section>
    </div>
  );
};
