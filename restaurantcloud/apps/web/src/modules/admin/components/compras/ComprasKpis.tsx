import React from 'react';
import { ShoppingBag, Receipt, ShieldCheck, Clock } from 'lucide-react';
import { FichasCompraKPIsDTO } from '@/types/admin';
import { Skeleton, TarjetaIndicador } from '@/components/ui';
import { soles } from './formatoCompra';

interface ComprasKpisProps {
  kpis: FichasCompraKPIsDTO;
  cargando?: boolean;
}

export const ComprasKpis: React.FC<ComprasKpisProps> = ({ kpis, cargando = false }) => {
  if (cargando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Cargando indicadores">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const mes = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date());
  const variacion = kpis.variacion_gasto_mes_pct;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <TarjetaIndicador
        tono="cobre"
        icono={ShoppingBag}
        etiqueta={`Gasto de ${mes}`}
        valor={soles(kpis.gasto_mes_total)}
        detalle={
          <span className={variacion > 0 ? 'text-estado-error-700' : variacion < 0 ? 'text-estado-ok-700' : undefined}>
            {variacion > 0 ? '+' : ''}
            {variacion}% frente al mes anterior
          </span>
        }
      />
      <TarjetaIndicador
        icono={Receipt}
        etiqueta="Compras del mes"
        valor={kpis.total_compras_mes}
        unidad={kpis.total_compras_mes === 1 ? 'comprobante' : 'comprobantes'}
        detalle="Registradas y vigentes"
      />
      <TarjetaIndicador
        tono="ok"
        icono={ShieldCheck}
        etiqueta="IGV recuperable"
        valor={soles(kpis.facturas_con_igv_monto)}
        detalle="Crédito fiscal de facturas"
      />
      <TarjetaIndicador
        tono={kpis.creditos_pendientes_monto > 0 ? 'alerta' : 'navy'}
        icono={Clock}
        etiqueta="Por pagar"
        valor={soles(kpis.creditos_pendientes_monto)}
        detalle="Compras a crédito de 30 días"
      />
    </div>
  );
};
