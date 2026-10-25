import React from 'react';
import { Utensils, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';
import { KpisCartaDTO } from '@/types/admin';
import { TarjetaIndicador } from '@/components/ui';

interface ProductosKpisProps {
  kpis: KpisCartaDTO;
  totalCategorias?: number;
}

export const ProductosKpis: React.FC<ProductosKpisProps> = ({ kpis, totalCategorias = 0 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <TarjetaIndicador
      icono={Utensils}
      etiqueta="Platos en carta"
      valor={kpis.total_productos}
      unidad="platos / beb."
      detalle={`En ${totalCategorias} categoría${totalCategorias === 1 ? '' : 's'}`}
    />
    <TarjetaIndicador
      tono="ok"
      icono={CheckCircle2}
      etiqueta="Disponibles"
      valor={kpis.disponibles}
      unidad="para venta"
      detalle="Visibles en la comanda del mozo"
    />
    <TarjetaIndicador
      tono={kpis.agotados > 0 ? 'error' : 'ok'}
      icono={AlertOctagon}
      etiqueta="Agotados"
      valor={kpis.agotados}
      unidad="pausados"
      detalle={kpis.agotados > 0 ? 'Por falta de stock o decisión manual' : 'Ningún plato pausado'}
    />
    <TarjetaIndicador
      tono="cobre"
      icono={TrendingUp}
      etiqueta="Margen promedio"
      valor={`${kpis.margen_promedio}%`}
      unidad="bruto"
      detalle="Según el costo de las recetas"
    />
  </div>
);
