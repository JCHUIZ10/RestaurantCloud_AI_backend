import React from 'react';
import { Users, Receipt, RotateCcw } from 'lucide-react';
import { ProveedoresKPIsDTO } from '@/types/admin';
import { TarjetaIndicador } from '@/components/ui';

interface ProveedoresKpisProps {
  kpis: ProveedoresKPIsDTO;
}

export const ProveedoresKpis: React.FC<ProveedoresKpisProps> = ({ kpis }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <TarjetaIndicador
      tono="ok"
      icono={Users}
      etiqueta="Proveedores activos"
      valor={kpis.total_activos}
      unidad="vigentes"
      detalle="Disponibles al registrar compras"
    />
    <TarjetaIndicador
      tono="cobre"
      icono={Receipt}
      etiqueta="Compras del mes"
      valor={`S/ ${kpis.compras_mes_total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      detalle={`En ${kpis.fichas_mes_total} ficha${kpis.fichas_mes_total === 1 ? '' : 's'} de compra`}
    />
    <TarjetaIndicador
      icono={RotateCcw}
      etiqueta="Frecuentes"
      valor={kpis.proveedores_frecuentes}
      unidad="regulares"
      detalle="Con compras semanales continuas"
      className="sm:col-span-2 lg:col-span-1"
    />
  </div>
);
