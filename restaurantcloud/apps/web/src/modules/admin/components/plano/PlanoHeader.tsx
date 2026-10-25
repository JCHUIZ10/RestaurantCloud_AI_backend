import React from 'react';
import { CuotaMesasPlanDTO } from '@/types/admin';
import { LayoutGrid, Users, Plus, RefreshCw, Gauge, Armchair } from 'lucide-react';
import { Button, IconButton, PageHeader, TarjetaIndicador, type TonoIndicador } from '@/components/ui';
import { cn } from '@/shared/utils';

interface PlanoHeaderProps {
  cuota: CuotaMesasPlanDTO;
  totalCapacidadSentados: number;
  totalMesasLocal: number;
  totalPisosLocal: number;
  onAbrirMesaIndividual: () => void;
  onRecargar?: () => void;
  isReloading?: boolean;
}

const BARRA_CUPO: Record<TonoIndicador, string> = {
  navy: 'bg-aurea-navy',
  cobre: 'bg-aurea-copper',
  ok: 'bg-estado-ok-600',
  alerta: 'bg-estado-alerta-500',
  error: 'bg-estado-error-600',
};

export const PlanoHeader: React.FC<PlanoHeaderProps> = ({
  cuota,
  totalCapacidadSentados,
  totalMesasLocal,
  totalPisosLocal,
  onAbrirMesaIndividual,
  onRecargar,
  isReloading = false,
}) => {
  const porcentajeUso = cuota.max_mesas_plan > 0
    ? Math.min(100, Math.round((cuota.mesas_activas_empresa / cuota.max_mesas_plan) * 100))
    : 0;
  const tonoCupo: TonoIndicador = porcentajeUso >= 90 ? 'error' : porcentajeUso >= 70 ? 'alerta' : 'cobre';
  const promedio = totalMesasLocal > 0 ? (totalCapacidadSentados / totalMesasLocal).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <PageHeader
        icono={LayoutGrid}
        titulo="Plano de mesas"
        descripcion="Distribuye las mesas de cada ambiente tal como están en el local; los mozos ven este mismo plano al tomar pedidos."
        acciones={
          <>
            {onRecargar && (
              <IconButton
                variant="outline"
                etiqueta="Actualizar plano"
                icono={RefreshCw}
                onClick={onRecargar}
                disabled={isReloading}
                className={cn(isReloading && '[&_svg]:animate-spin')}
              />
            )}
            <Button
              onClick={onAbrirMesaIndividual}
              disabled={cuota.mesas_disponibles <= 0 || totalPisosLocal === 0}
              leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
            >
              Nueva mesa
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TarjetaIndicador
          icono={Armchair}
          etiqueta="Mesas en el local"
          valor={totalMesasLocal}
          unidad="activas"
          detalle={`En ${totalPisosLocal} ambiente${totalPisosLocal === 1 ? '' : 's'}`}
        />
        <TarjetaIndicador
          tono="ok"
          icono={Users}
          etiqueta="Aforo sentado"
          valor={totalCapacidadSentados}
          unidad="comensales"
          detalle={`${promedio} personas por mesa en promedio`}
        />
        <TarjetaIndicador
          tono={tonoCupo}
          icono={Gauge}
          etiqueta={`Cupo plan ${cuota.plan_nombre || 'actual'}`}
          valor={cuota.mesas_activas_empresa}
          unidad={`/ ${cuota.max_mesas_plan} mesas`}
          detalle={`${cuota.mesas_disponibles} disponibles · máx. ${cuota.max_pisos_plan} ambientes`}
          className="sm:col-span-2 lg:col-span-1"
        >
          <div
            className="mt-3 h-2 w-full rounded-full bg-aurea-champagne/30 overflow-hidden"
            role="progressbar"
            aria-label="Uso del cupo de mesas"
            aria-valuenow={porcentajeUso}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn('h-full rounded-full transition-all duration-500', BARRA_CUPO[tonoCupo])}
              style={{ width: `${porcentajeUso}%` }}
            />
          </div>
        </TarjetaIndicador>
      </div>
    </div>
  );
};
