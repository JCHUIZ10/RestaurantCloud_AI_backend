import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Store } from 'lucide-react';
import { Button, EstadoBadge } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { cn } from '@/shared/utils';
import type { LineaReposicionDTO, PrioridadReposicion } from '@/types/prediccion';
import { cantidadAComprar, formatoCantidad, formatoSoles, textoEstado, textoPrioridad } from './utilidades';

interface TarjetaInsumoProps {
  linea: LineaReposicionDTO;
  cobertura: number;
  /** Quita los botones: la línea ya se decidió o se está mostrando como resumen */
  soloLectura?: boolean;
  guardando?: boolean;
  onAceptar?: (linea: LineaReposicionDTO) => void;
  onDescartar?: (linea: LineaReposicionDTO) => void;
}

const TONO: Record<PrioridadReposicion, { badge: 'error' | 'alerta' | 'ok'; falta: string; icono: string }> = {
  urgente: { badge: 'error', falta: 'bg-estado-error-300', icono: 'bg-estado-error-50 text-estado-error-700' },
  pronto: { badge: 'alerta', falta: 'bg-estado-alerta-300', icono: 'bg-estado-alerta-50 text-estado-alerta-700' },
  cubierto: { badge: 'ok', falta: 'bg-estado-ok-300', icono: 'bg-estado-ok-50 text-estado-ok-700' },
};

/** Porcentajes de la barra: lo que tienes, lo que falta para el consumo más probable y la reserva. */
function porcentajes(l: LineaReposicionDTO) {
  const necesidad = l.consumo_previsto + l.margen_seguridad;
  if (necesidad <= 0) return null;
  const tienes = (Math.min(l.stock_al_calcular, necesidad) / necesidad) * 100;
  const probable = (l.consumo_previsto / necesidad) * 100;
  const falta = Math.max(0, probable - tienes);
  const reserva = Math.max(0, 100 - Math.max(probable, tienes));
  return { tienes, falta, reserva };
}

/** Un insumo: cuánto tienes, cuánto usarás, cuánto comprar y qué decidir. */
export const TarjetaInsumo: React.FC<TarjetaInsumoProps> = ({ linea, cobertura, soloLectura, guardando, onAceptar, onDescartar }) => {
  const tono = TONO[linea.prioridad];
  const barra = porcentajes(linea);
  const decidida = linea.estado !== 'pendiente';
  const comprar = cantidadAComprar(linea);
  const u = linea.unidad_medida;

  return (
    <article className={cn('bg-white border border-tinta-100 rounded-2xl p-4 sm:p-5 flex flex-col gap-4', linea.estado === 'descartada' && 'opacity-60')}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="flex items-start gap-3 min-w-0">
          <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0', tono.icono)} aria-hidden="true">
            {linea.insumo.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-bold text-aurea-navy">{linea.insumo}</h3>
            <EstadoBadge tono={tono.badge}>{textoPrioridad(linea, cobertura)}</EstadoBadge>
            <p className="flex items-center gap-1.5 text-xs text-aurea-navy/60">
              <Store className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {linea.proveedor
                ? `${linea.proveedor.nombre} · ${formatoSoles(linea.proveedor.precio)} por ${u === 'und' ? 'unidad' : u}`
                : 'Sin compras anteriores registradas'}
            </p>
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          {barra ? (
            <>
              <div
                role="img"
                aria-label={`Tienes ${formatoCantidad(linea.stock_al_calcular, u)}, usarás cerca de ${formatoCantidad(linea.consumo_previsto, u)} y conviene una reserva de ${formatoCantidad(linea.margen_seguridad, u)}`}
                className="flex h-3.5 rounded-full overflow-hidden bg-tinta-50"
              >
                <div className="bg-aurea-navy" style={{ width: `${barra.tienes}%` }} />
                <div className={tono.falta} style={{ width: `${barra.falta}%` }} />
                <div className="bg-aurea-champagne/70" style={{ width: `${barra.reserva}%` }} />
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-600">
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-aurea-navy" aria-hidden="true" />Tienes {formatoCantidad(linea.stock_al_calcular, u)}</li>
                <li className="inline-flex items-center gap-1.5"><span className={cn('w-2.5 h-2.5 rounded-sm', tono.falta)} aria-hidden="true" />Usarás ≈ {formatoCantidad(linea.consumo_previsto, u)}</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-aurea-champagne" aria-hidden="true" />Reserva {formatoCantidad(linea.margen_seguridad, u)}</li>
              </ul>
            </>
          ) : (
            <p className="text-sm text-tinta-600">
              Tienes {formatoCantidad(linea.stock_al_calcular, u)}; el mínimo que dejaste es {formatoCantidad(linea.stock_minimo, u)}.
            </p>
          )}
        </div>

        <div className="lg:text-right">
          <p className="text-xs text-aurea-navy/60">Comprar</p>
          <p className="text-2xl font-bold text-aurea-navy leading-tight tabular-nums">{comprar > 0 ? formatoCantidad(comprar, u) : 'Nada'}</p>
          <p className="text-sm text-tinta-600">{comprar > 0 ? `≈ ${formatoSoles(linea.costo_estimado)}` : 'Te alcanza'}</p>
        </div>
      </div>

      {!soloLectura && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tinta-50 pt-3">
          {decidida ? (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-aurea-navy min-h-tactil">
              {linea.estado !== 'descartada' && <Check className="w-4 h-4 text-estado-ok-600" aria-hidden="true" />}
              {textoEstado(linea)}
              {linea.estado === 'ajustada' && linea.cantidad_final !== null && <span className="font-normal text-tinta-600">: {formatoCantidad(linea.cantidad_final, u)}</span>}
            </p>
          ) : comprar > 0 ? (
            <>
              <Button variant="ghost" onClick={() => onDescartar?.(linea)} disabled={guardando}>Descartar</Button>
              <Link
                to={ROUTES.ADMIN_PREPARAR_COMPRA}
                className="inline-flex items-center justify-center min-h-tactil px-4 rounded-xl border border-aurea-copper/50 bg-white text-sm font-semibold text-aurea-navy hover:bg-aurea-champagne/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2"
              >
                Ajustar cantidad
              </Link>
              <Button variant="secondary" onClick={() => onAceptar?.(linea)} loading={guardando} leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}>
                Aceptar
              </Button>
            </>
          ) : (
            <p className="text-sm text-tinta-600 min-h-tactil flex items-center">No hace falta comprar.</p>
          )}
        </div>
      )}
    </article>
  );
};
