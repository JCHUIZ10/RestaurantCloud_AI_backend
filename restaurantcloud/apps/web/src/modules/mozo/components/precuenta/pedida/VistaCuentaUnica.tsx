import React, { useMemo } from 'react';
import type { DesgloseSUNATMozoDTO, PrecuentaMozoResponseDTO } from '../../../../../types/mozo';
import { DIVISOR_IGV } from '@/shared/constants/tributario';
import { PrecuentaConsolidadoCard } from '../PrecuentaConsolidadoCard';
import { DesgloseSUNATCard } from '../DesgloseSUNATCard';
import { TarjetaCuentaRegistrada } from './TarjetaCuentaRegistrada';

interface VistaCuentaUnicaProps {
  data: PrecuentaMozoResponseDTO;
}

export const VistaCuentaUnica: React.FC<VistaCuentaUnicaProps> = ({ data }) => {
  // Aplica la promoción con la que quedó registrada la cuenta, igual que al pedirla
  const desglose = useMemo<DesgloseSUNATMozoDTO>(() => {
    const consumoBruto = data.items.reduce((acc, it) => acc + it.subtotal, 0);
    const porcentaje = Number(data.promocion_activa?.porcentaje_descuento ?? 0) || 0;
    const descuento = Math.round(consumoBruto * (porcentaje / 100) * 100) / 100;
    const totalNeto = Math.round((consumoBruto - descuento) * 100) / 100;
    const base = Math.round((totalNeto / DIVISOR_IGV) * 100) / 100;

    return {
      consumo_bruto: consumoBruto,
      descuento_comercial: descuento,
      total_neto: totalNeto,
      base_imponible: base,
      igv: Math.round((totalNeto - base) * 100) / 100,
      tasa_igv: 0.18,
    };
  }, [data.items, data.promocion_activa]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7 min-w-0">
        <PrecuentaConsolidadoCard items={data.items} />
      </div>

      <div className="lg:col-span-5 space-y-4">
        {data.cuenta_registrada && (
          <TarjetaCuentaRegistrada
            cuenta={data.cuenta_registrada}
            promocion={data.promocion_activa}
          />
        )}
        <DesgloseSUNATCard desglose={desglose} />
      </div>
    </div>
  );
};
