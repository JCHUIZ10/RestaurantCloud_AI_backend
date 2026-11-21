import React from 'react';
import { CloudOff, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/shared/utils';
import type { PrediccionDTO } from '@/types/prediccion';
import { diaConNumero } from './utilidades';

interface AvisoProps {
  tono: 'alerta' | 'info';
  icono: LucideIcon;
  titulo: string;
  children: React.ReactNode;
  accion?: React.ReactNode;
}

const Aviso: React.FC<AvisoProps> = ({ tono, icono: Icono, titulo, children, accion }) => (
  <div
    role="status"
    className={cn(
      'flex flex-wrap items-start gap-3 rounded-2xl border p-4',
      tono === 'alerta' ? 'bg-estado-alerta-50 border-estado-alerta-200 text-estado-alerta-900' : 'bg-aurea-champagne/25 border-aurea-copper/40 text-aurea-navy'
    )}
  >
    <Icono className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
    <div className="flex-1 min-w-0 space-y-0.5">
      <p className="text-sm font-bold">{titulo}</p>
      <p className="text-sm">{children}</p>
    </div>
    {accion}
  </div>
);

interface AvisosPrediccionProps {
  datos: PrediccionDTO;
  onReintentar: () => void;
  reintentando: boolean;
}

/** Avisos que el usuario debe conocer antes de confiar en las cifras. Si no hay ninguno, no dibuja nada. */
export const AvisosPrediccion: React.FC<AvisosPrediccionProps> = ({ datos, onReintentar, reintentando }) => {
  const p = datos.pronostico;

  if (p === null) {
    return (
      <Aviso
        tono="alerta"
        icono={CloudOff}
        titulo="La predicción no está disponible ahora"
        accion={
          <Button variant="outline" size="sm" onClick={onReintentar} loading={reintentando}>
            Intentar de nuevo
          </Button>
        }
      >
        El resto del sistema funciona normal. Tu última lista de compras sigue aquí y puedes seguir decidiendo sobre ella.
      </Aviso>
    );
  }

  const avisos: React.ReactNode[] = [];

  if (p.advertencias.includes('datos_desactualizados')) {
    const hasta = p.datos.actualizados_hasta;
    avisos.push(
      <Aviso key="atrasadas" tono="alerta" icono={TriangleAlert} titulo={hasta ? `No vemos ventas desde el ${diaConNumero(hasta.slice(0, 10))}` : 'No vemos ventas recientes'}>
        Si el local atendió esos días, la predicción puede quedarse corta. Revisa antes de comprar.
      </Aviso>
    );
  }

  // Platos que van por debajo del nivel del local
  const conEstimacionBasica = p.predicciones.filter((pl) => pl.dias.some((d) => d.metodo === 'baseline')).length;
  const sinVentas = p.predicciones.filter((pl) => pl.dias.every((d) => d.metodo === 'sin_historial' || d.metodo === 'cerrado')).length;

  if (datos.nivel >= 2 && conEstimacionBasica > 0) {
    avisos.push(
      <Aviso key="basica" tono="info" icono={Info} titulo={`${conEstimacionBasica} ${conEstimacionBasica === 1 ? 'plato está' : 'platos están'} en preparación`}>
        Se calculan con lo vendido en los mismos días de semanas anteriores, porque aún tienen pocas ventas.
      </Aviso>
    );
  }
  if (datos.nivel >= 1 && sinVentas > 0) {
    avisos.push(
      <Aviso key="sinventas" tono="info" icono={Info} titulo={`${sinVentas} ${sinVentas === 1 ? 'plato' : 'platos'} sin ventas todavía`}>
        No tienen predicción hasta que se vendan unos días.
      </Aviso>
    );
  }

  return avisos.length === 0 ? null : <div className="space-y-3">{avisos}</div>;
};
