import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, AlertTriangle, Coins, Plus, Truck, Package } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { ResumenInventarioDTO } from '@/types/admin';
import { Button, PageHeader, TarjetaIndicador } from '@/components/ui';

interface InsumosHeaderProps {
  kpis: ResumenInventarioDTO;
  onAbrirNuevoInsumo: () => void;
}

export const InsumosHeader: React.FC<InsumosHeaderProps> = ({ kpis, onAbrirNuevoInsumo }) => {
  const navigate = useNavigate();
  const hayQuiebre = kpis.total_agotados > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icono={Package}
        titulo="Insumos de bodega"
        descripcion="Existencias, mínimos y costo de cada insumo. Cuando uno se agota, los platos que lo usan se pausan solos en la carta."
        acciones={
          <>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.ADMIN_PROVEEDORES)}
              leftIcon={<Truck className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
            >
              Proveedores
            </Button>
            <Button
              onClick={onAbrirNuevoInsumo}
              leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
            >
              Nuevo insumo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TarjetaIndicador
          tono="ok"
          icono={Boxes}
          etiqueta="Insumos activos"
          valor={kpis.total_activos}
          unidad="en uso"
          detalle={kpis.total_inactivos > 0 ? `${kpis.total_inactivos} archivados aparte` : 'Disponibles para las recetas'}
        />
        <TarjetaIndicador
          tono={hayQuiebre ? 'error' : 'ok'}
          icono={AlertTriangle}
          etiqueta="Agotados"
          valor={kpis.total_agotados}
          unidad={hayQuiebre ? 'en quiebre' : 'sin quiebres'}
          detalle={hayQuiebre ? 'Pausan platos en la carta; reponer o recontar' : 'Existencias suficientes para hoy'}
        />
        <TarjetaIndicador
          tono="cobre"
          icono={Coins}
          etiqueta="Valor en bodega"
          valor={`S/ ${kpis.valorizacion_total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          detalle="Stock actual × costo unitario"
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </div>
  );
};
