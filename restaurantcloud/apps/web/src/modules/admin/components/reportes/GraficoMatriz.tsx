import React, { useMemo } from 'react';
import { CartesianGrid, LabelList, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { ClasificacionMenu, PlatoRankingDTO, RankingProductosDTO } from '@/types/reportes';
import { LINEA_EJE, TEXTO_EJE, tenue } from './colores';
import { TooltipGrafico } from './piezas';
import { GRUPOS, entero, porcentaje, soles } from './utilidades';

interface Punto {
  id: string;
  nombre: string;
  /** Parte de las unidades de los platos con costo: la misma base con la que el servicio fija el umbral */
  popularidad: number;
  margenUnitario: number;
  grupo: ClasificacionMenu;
  unidades: number;
  ingreso: number;
}

interface Props {
  platos: PlatoRankingDTO[];
  umbrales: NonNullable<RankingProductosDTO['umbrales']>;
}

/** Cuántos platos llevan su nombre escrito en el gráfico; el resto se ve al pasar el cursor o tocarlo. */
const PLATOS_ROTULADOS = 3;

/**
 * Mapa de la carta: cuánto se pide cada plato (horizontal) frente a cuánto deja por unidad (vertical). Las dos
 * líneas punteadas son los umbrales del servicio y dividen el plano en los cuatro grupos.
 */
export const GraficoMatriz: React.FC<Props> = ({ platos, umbrales }) => {
  const { puntos, rotulados, maxX, maxY } = useMemo(() => {
    const clasificados = platos.filter((p) => p.clasificacion !== null && p.margen_unitario !== null);
    const unidadesTotales = clasificados.reduce((s, p) => s + p.unidades, 0);
    const lista: Punto[] = clasificados.map((p) => ({
      id: p.producto_id,
      nombre: p.nombre,
      popularidad: unidadesTotales > 0 ? (p.unidades * 100) / unidadesTotales : 0,
      margenUnitario: p.margen_unitario as number,
      grupo: p.clasificacion as ClasificacionMenu,
      unidades: p.unidades,
      ingreso: p.ingreso,
    }));
    const masVendidos = new Set([...lista].sort((a, b) => b.ingreso - a.ingreso).slice(0, PLATOS_ROTULADOS).map((p) => p.id));
    const x = Math.max(umbrales.popularidad_pct * 1.4, ...lista.map((p) => p.popularidad)) * 1.1;
    const y = Math.max(umbrales.margen_unitario * 1.4, ...lista.map((p) => p.margenUnitario)) * 1.1;
    return { puntos: lista, rotulados: masVendidos, maxX: Math.ceil(x), maxY: Math.ceil(y / 5) * 5 };
  }, [platos, umbrales]);

  const ux = umbrales.popularidad_pct;
  const uy = umbrales.margen_unitario;
  const zona = (grupo: ClasificacionMenu, x1: number, x2: number, y1: number, y2: number, posicion: 'insideTopLeft' | 'insideTopRight' | 'insideBottomLeft' | 'insideBottomRight') => (
    <ReferenceArea
      key={grupo}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
      fill={tenue(GRUPOS[grupo].color, 0.07)}
      stroke="none"
      ifOverflow="visible"
      label={{ value: GRUPOS[grupo].nombre, position: posicion, fill: GRUPOS[grupo].colorTexto, fontSize: 13, fontWeight: 700 }}
    />
  );

  return (
    <div className="overflow-x-auto" role="img" aria-label="Mapa de la carta: cuánto se pide cada plato frente a cuánto deja por unidad, dividido en cuatro grupos">
      <div className="min-w-[30rem]">
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid stroke="transparent" />
            {zona('puzle', 0, ux, uy, maxY, 'insideTopLeft')}
            {zona('estrella', ux, maxX, uy, maxY, 'insideTopRight')}
            {zona('rezagado', 0, ux, 0, uy, 'insideBottomLeft')}
            {zona('caballito', ux, maxX, 0, uy, 'insideBottomRight')}
            <XAxis
              type="number"
              dataKey="popularidad"
              domain={[0, maxX]}
              tickCount={6}
              tickLine={false}
              axisLine={{ stroke: LINEA_EJE }}
              tick={{ fontSize: 12, fill: TEXTO_EJE }}
              tickFormatter={(v: number) => `${Math.round(v)} %`}
              label={{ value: 'Popularidad: parte de las unidades vendidas', position: 'insideBottom', offset: -18, fontSize: 12, fill: TEXTO_EJE }}
            />
            <YAxis
              type="number"
              dataKey="margenUnitario"
              domain={[0, maxY]}
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: TEXTO_EJE }}
              tickFormatter={(v: number) => `S/ ${v}`}
              label={{ value: 'Margen por unidad', angle: -90, position: 'insideLeft', offset: 4, fontSize: 12, fill: TEXTO_EJE, style: { textAnchor: 'middle' } }}
            />
            <ReferenceLine x={ux} stroke="rgba(11,35,64,0.35)" strokeDasharray="4 4" />
            <ReferenceLine
              y={uy}
              stroke="rgba(11,35,64,0.35)"
              strokeDasharray="4 4"
              label={{ value: `margen medio ${soles(uy, 2)}`, position: 'insideBottomRight', fontSize: 12, fill: TEXTO_EJE }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: LINEA_EJE }}
              content={({ active, payload }) => {
                const p = active ? (payload?.[0]?.payload as Punto | undefined) : undefined;
                if (!p) return null;
                return (
                  <TooltipGrafico
                    titulo={p.nombre}
                    filas={[
                      { etiqueta: 'Grupo', valor: GRUPOS[p.grupo].singular },
                      { etiqueta: 'Popularidad', valor: porcentaje(p.popularidad) },
                      { etiqueta: 'Margen por unidad', valor: soles(p.margenUnitario, 2) },
                      { etiqueta: 'Unidades', valor: entero(p.unidades) },
                    ]}
                  />
                );
              }}
            />
            <Scatter
              data={puntos}
              isAnimationActive={false}
              shape={(forma: { cx?: number; cy?: number; payload?: Punto }) => (
                <circle cx={forma.cx} cy={forma.cy} r={7} fill={forma.payload ? GRUPOS[forma.payload.grupo].color : '#0B2340'} stroke="#fff" strokeWidth={2} />
              )}
            >
              <LabelList
                dataKey="nombre"
                content={({ x, y, index }) => {
                  const punto = typeof index === 'number' ? puntos[index] : undefined;
                  if (!punto || !rotulados.has(punto.id)) return null;
                  const derecha = punto.popularidad < maxX * 0.6;
                  return (
                    <text
                      x={Number(x) + (derecha ? 12 : -12)}
                      y={Number(y) + 4}
                      textAnchor={derecha ? 'start' : 'end'}
                      fontSize={12}
                      fontWeight={600}
                      fill="#0B2340"
                      stroke="#fff"
                      strokeWidth={3}
                      paintOrder="stroke"
                    >
                      {punto.nombre}
                    </text>
                  );
                }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
