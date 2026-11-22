import React, { useMemo } from 'react';
import { CreditCard, Banknote, Smartphone, Wallet, type LucideIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { MedioPagoVentaDTO } from '@/types/reportes';
import { colorDeMedioPago, tenue } from './colores';
import { TooltipGrafico, VariacionPildora } from './piezas';
import { entero, nombreMedioPago, porcentaje, soles, solesCompacto } from './utilidades';

const ICONO: Record<string, LucideIcon> = { tarjeta: CreditCard, efectivo: Banknote, billetera_digital: Smartphone };

interface Props {
  medios: MedioPagoVentaDTO[];
  total: number;
  /** Medios del periodo anterior; sin ellos no se muestra el cambio */
  anteriores?: MedioPagoVentaDTO[] | null;
}

/**
 * Cómo pagan los clientes: una dona y, al lado, cada medio con su parte. La disposición depende del ancho de la
 * tarjeta (no de la pantalla): apilada si es angosta, en dos columnas si hay lugar.
 */
export const GraficoMedios: React.FC<Props> = ({ medios, total, anteriores }) => {
  const filas = useMemo(
    () =>
      medios.map((m, i) => {
        const antes = anteriores?.find((a) => a.medio_pago === m.medio_pago)?.porcentaje;
        return {
          ...m,
          nombre: nombreMedioPago(m.medio_pago),
          color: colorDeMedioPago(m.medio_pago, i),
          cambio: anteriores && m.porcentaje !== null ? Math.round((m.porcentaje - (antes ?? 0)) * 10) / 10 : null,
        };
      }),
    [medios, anteriores]
  );
  const descripcion = filas.map((f) => `${f.nombre} ${f.porcentaje === null ? '' : porcentaje(f.porcentaje)}`).join(', ');

  return (
    <div className="[container-type:inline-size]">
      <div className="flex flex-col items-center gap-5 [@container_(min-width:28rem)]:flex-row [@container_(min-width:28rem)]:justify-center [@container_(min-width:28rem)]:gap-8">
        <div className="relative w-44 h-44 [@container_(min-width:42rem)]:w-52 [@container_(min-width:42rem)]:h-52 shrink-0" role="img" aria-label={`Medios de pago: ${descripcion}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={filas} dataKey="total" nameKey="nombre" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>
                {filas.map((f) => (
                  <Cell key={f.medio_pago} fill={f.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const f = active ? (payload?.[0]?.payload as (typeof filas)[number] | undefined) : undefined;
                  if (!f) return null;
                  return (
                    <TooltipGrafico
                      titulo={f.nombre}
                      filas={[
                        { etiqueta: 'Parte', valor: f.porcentaje === null ? '—' : porcentaje(f.porcentaje) },
                        { etiqueta: 'Total', valor: soles(f.total) },
                        { etiqueta: 'Cuentas', valor: entero(f.comprobantes) },
                      ]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-aurea-navy/65">Total</span>
            <span className="font-bold text-lg text-aurea-navy tabular-nums">{solesCompacto(total)}</span>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-4 [@container_(min-width:28rem)]:max-w-md">
          {filas.map((f) => {
            const Icono = ICONO[f.medio_pago] ?? Wallet;
            return (
              <li key={f.medio_pago} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tenue(f.color, 0.12), color: f.color }} aria-hidden="true">
                  <Icono className="w-[18px] h-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-aurea-navy">{f.nombre}</p>
                  <p className="text-xs text-aurea-navy/65 tabular-nums">
                    {soles(f.total)} <span className="whitespace-nowrap">· {entero(f.comprobantes)} cuentas</span>
                  </p>
                  <span className="mt-1.5 block h-1.5 rounded-full bg-aurea-navy/[0.06] overflow-hidden" aria-hidden="true">
                    <span className="block h-full rounded-full" style={{ width: `${f.porcentaje ?? 0}%`, background: f.color }} />
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-aurea-navy tabular-nums">{f.porcentaje === null ? '—' : porcentaje(f.porcentaje)}</p>
                  <VariacionPildora valor={f.cambio} sufijo="pts" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
