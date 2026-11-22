import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MozoDesempenoDTO } from '@/types/reportes';
import { LINEA_GUIA } from './colores';
import { TooltipGrafico } from './piezas';
import { entero, soles, solesCompacto } from './utilidades';

interface Props {
  mozos: MozoDesempenoDTO[];
  /** Color de cada mozo, el mismo que lleva su tarjeta */
  colores: string[];
}

const ALTO_POR_MOZO = 48;

/** Ventas de cada mozo en el periodo, de mayor a menor. */
export const GraficoMozos: React.FC<Props> = ({ mozos, colores }) => {
  const datos = mozos.map((m) => ({ nombre: m.mozo_nombre ?? 'Sin nombre', ventas: m.ventas_total, comprobantes: m.comprobantes }));
  return (
    <div role="img" aria-label={`Ventas por mozo: ${datos.map((d) => `${d.nombre} ${soles(d.ventas)}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height={datos.length * ALTO_POR_MOZO + 40}>
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 72, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={LINEA_GUIA} />
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="nombre" width={116} tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: '#0B2340' }} />
          <Tooltip
            cursor={{ fill: 'rgba(213,160,111,0.12)' }}
            content={({ active, payload }) => {
              const d = active ? (payload?.[0]?.payload as (typeof datos)[number] | undefined) : undefined;
              if (!d) return null;
              return (
                <TooltipGrafico
                  titulo={d.nombre}
                  filas={[
                    { etiqueta: 'Ventas', valor: soles(d.ventas) },
                    { etiqueta: 'Cuentas', valor: entero(d.comprobantes) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="ventas" barSize={28} radius={[0, 8, 8, 0]} background={{ fill: 'rgba(11,35,64,0.04)', radius: 8 }} isAnimationActive={false}>
            {datos.map((d, i) => (
              <Cell key={d.nombre + i} fill={colores[i % colores.length]} />
            ))}
            <LabelList dataKey="ventas" position="right" formatter={(v: number) => solesCompacto(v)} style={{ fontSize: 13, fontWeight: 700, fill: '#0B2340' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
