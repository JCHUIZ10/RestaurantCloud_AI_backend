import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Banknote } from 'lucide-react';
import { TarjetaIndicador } from '@/components/ui';
import type { TotalesReposicionDTO } from '@/types/prediccion';
import { formatoSolesEntero } from './utilidades';

interface ResumenPrediccionProps {
  totales: TotalesReposicionDTO;
}

/** Cuatro números para entender la compra: qué es urgente, qué se acaba pronto, qué está cubierto y cuánto cuesta. */
export const ResumenPrediccion: React.FC<ResumenPrediccionProps> = ({ totales }) => (
  <section aria-label="Resumen de la compra" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <TarjetaIndicador
      icono={AlertTriangle}
      etiqueta="Comprar cuanto antes"
      tono="error"
      valor={totales.por_prioridad.urgente}
      detalle="no alcanzan para el primer día"
    />
    <TarjetaIndicador
      icono={Clock}
      etiqueta="Se acaban pronto"
      tono="alerta"
      valor={totales.por_prioridad.pronto}
      detalle="antes de que termine tu compra"
    />
    <TarjetaIndicador
      icono={CheckCircle2}
      etiqueta="Tienes suficiente"
      tono="ok"
      valor={totales.por_prioridad.cubierto}
      detalle="insumos cubiertos"
    />
    <TarjetaIndicador
      icono={Banknote}
      etiqueta="Inversión estimada"
      tono="cobre"
      valor={formatoSolesEntero(totales.costo)}
      detalle="con los precios de tu última compra"
    />
  </section>
);
