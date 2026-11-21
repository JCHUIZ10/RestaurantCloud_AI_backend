import React from 'react';
import { AlertTriangle, CloudOff, Info } from 'lucide-react';
import { Button, EstadoBadge } from '@/components/ui';
import type { SedePrediccionDTO } from '@/types/prediccion';
import { NIVELES, formatoEntero, formatoSolesEntero, textoProgreso } from '@/modules/admin/components/prediccion';
import { totalDeSede } from './periodos';

interface TarjetaSedePrediccionProps {
  sede: SedePrediccionDTO;
  fechas: string[];
  calculando: boolean;
  onCalcular: (sede: SedePrediccionDTO) => void;
  onVer: (sede: SedePrediccionDTO) => void;
}

/** Resumen de una sede: cuánto venderá, cuánto tendrá que comprar y cómo va la decisión de su administrador. */
export const TarjetaSedePrediccion: React.FC<TarjetaSedePrediccionProps> = ({ sede, fechas, calculando, onCalcular, onVer }) => {
  const nivel = sede.nivel === null ? null : NIVELES[sede.nivel];
  const r = sede.reposicion;
  const decididas = r ? r.decisiones.aceptadas + r.decisiones.ajustadas + r.decisiones.descartadas : 0;
  const totalLineas = r ? decididas + r.decisiones.pendientes : 0;
  const urgentes = r?.por_prioridad.urgente ?? 0;
  const avance = sede.nivel === null ? null : textoProgreso(sede.nivel, { dias_con_ventas: sede.dias_con_ventas ?? 0, faltan_para_siguiente: sede.nivel === 1 ? Math.max(1, 28 - (sede.dias_con_ventas ?? 0)) : null });

  return (
    <article className="bg-white border border-tinta-100 rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-2xl text-aurea-navy">{sede.nombre}</h3>
          {sede.creada_en && <p className="text-sm text-aurea-navy/60">Calculado el {new Date(sede.creada_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}</p>}
        </div>
        {nivel && <EstadoBadge tono={nivel.tono}>{nivel.nombre}</EstadoBadge>}
      </div>

      {sede.estado === 'sin_pronostico' ? (
        <div className="rounded-2xl bg-aurea-champagne/25 p-4 space-y-3">
          <p className="text-sm text-aurea-navy">Esta sede todavía no tiene una semana calculada.</p>
          <Button onClick={() => onCalcular(sede)} loading={calculando}>Calcular semana</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-tinta-50 p-4">
              <p className="text-xs text-tinta-500">Venderá</p>
              <p className="text-2xl font-bold text-aurea-navy tabular-nums">{sede.pronostico ? `≈ ${formatoEntero(totalDeSede(sede, fechas))}` : '—'}</p>
              <p className="text-xs text-tinta-500">platos y bebidas</p>
            </div>
            <div className="rounded-2xl bg-aurea-champagne/35 p-4">
              <p className="text-xs text-tinta-500">Compra sugerida</p>
              <p className="text-2xl font-bold text-aurea-navy tabular-nums">{r ? formatoSolesEntero(r.costo) : '—'}</p>
              <p className="text-xs text-tinta-500">para {sede.cobertura_dias} días</p>
            </div>
          </div>

          {r && totalLineas > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-aurea-navy">Decisiones del administrador</span>
                <span className="text-tinta-600">{decididas} de {totalLineas} revisadas</span>
              </div>
              <div
                role="img"
                aria-label={`${r.decisiones.aceptadas + r.decisiones.ajustadas} aceptadas, ${r.decisiones.descartadas} descartadas, ${r.decisiones.pendientes} sin revisar`}
                className="flex h-2.5 rounded-full overflow-hidden bg-tinta-50"
              >
                <div className="bg-estado-ok-600" style={{ width: `${((r.decisiones.aceptadas + r.decisiones.ajustadas) / totalLineas) * 100}%` }} />
                <div className="bg-tinta-300" style={{ width: `${(r.decisiones.descartadas / totalLineas) * 100}%` }} />
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-600">
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-estado-ok-600" aria-hidden="true" />{r.decisiones.aceptadas + r.decisiones.ajustadas} aceptadas</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-tinta-300" aria-hidden="true" />{r.decisiones.descartadas} descartadas</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-tinta-100" aria-hidden="true" />{r.decisiones.pendientes} sin revisar</li>
              </ul>
            </div>
          )}

          {urgentes > 0 && (
            <p className="flex gap-2.5 rounded-2xl bg-estado-error-50 text-estado-error-800 text-sm p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {urgentes} {urgentes === 1 ? 'insumo no alcanza' : 'insumos no alcanzan'} para el primer día o {urgentes === 1 ? 'está' : 'están'} por debajo del mínimo.
            </p>
          )}
          {sede.estado === 'no_disponible' && (
            <p className="flex gap-2.5 rounded-2xl bg-estado-alerta-50 text-estado-alerta-900 text-sm p-3">
              <CloudOff className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              La predicción no está disponible ahora. Mostramos la última compra sugerida.
            </p>
          )}
          {avance && sede.nivel !== null && sede.nivel < 3 && (
            <p className="flex gap-2.5 rounded-2xl bg-aurea-champagne/25 text-aurea-navy text-sm p-3">
              <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {avance}
            </p>
          )}

          <Button variant="outline" onClick={() => onVer(sede)}>Ver la semana de {sede.nombre}</Button>
        </>
      )}
    </article>
  );
};
