import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FranjaHoraDTO } from '@/types/reportes';
import { COLOR, LINEA_EJE, LINEA_GUIA, TEXTO_EJE } from './colores';
import { TooltipGrafico } from './piezas';
import { HORA_DE_CORTE, entero, hora, rangoDeHoras, soles } from './utilidades';

interface Props {
  franjas: FranjaHoraDTO[];
  horaPunta: number | null;
}

interface Punto {
  hora: number;
  promedio: number;
  comprobantes: number;
  total: number;
}

/** Ventas promedio por día en cada hora. Solo se dibujan las horas con actividad, más una de margen a cada lado. */
export const GraficoHoras: React.FC<Props> = ({ franjas, horaPunta }) => {
  const puntos = useMemo<Punto[]>(() => {
    const [primera, ultima] = rangoDeHoras(franjas);
    return franjas
      .filter((f) => f.hora >= primera && f.hora <= ultima)
      .map((f) => ({ hora: f.hora, promedio: f.promedio_por_dia ?? 0, comprobantes: f.comprobantes, total: f.total }));
  }, [franjas]);

  const resumen = horaPunta === null ? 'Sin ventas en el periodo' : `La hora punta es a las ${hora(horaPunta)}`;

  return (
    <div role="img" aria-label={`Ventas promedio por hora del día. ${resumen}.`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={puntos} margin={{ top: 28, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={LINEA_GUIA} />
          <XAxis dataKey="hora" tickLine={false} axisLine={{ stroke: LINEA_EJE }} tick={{ fontSize: 12, fill: TEXTO_EJE }} interval="preserveStartEnd" />
          <YAxis width={52} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: TEXTO_EJE }} tickFormatter={(v: number) => entero(v)} />
          <Tooltip
            cursor={{ fill: 'rgba(213,160,111,0.12)' }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as Punto | undefined) : undefined;
              if (!p) return null;
              return (
                <TooltipGrafico
                  titulo={`${hora(p.hora)} a ${String(p.hora).padStart(2, '0')}:59`}
                  filas={[
                    { etiqueta: 'Por día', valor: soles(p.promedio) },
                    { etiqueta: 'Cuentas', valor: entero(p.comprobantes) },
                    { etiqueta: 'Total', valor: soles(p.total) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="promedio" maxBarSize={44} radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {puntos.map((p) => (
              <Cell key={p.hora} fill={p.hora < HORA_DE_CORTE ? COLOR.cobre : COLOR.azul} fillOpacity={p.hora === horaPunta ? 1 : 0.82} />
            ))}
            <LabelList
              dataKey="promedio"
              content={({ x, y, width, index }) => {
                const punto = typeof index === 'number' ? puntos[index] : undefined;
                if (!punto || punto.hora !== horaPunta) return null;
                return (
                  <text x={Number(x) + Number(width) / 2} y={Number(y) - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0B2340">
                    {soles(punto.promedio)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
