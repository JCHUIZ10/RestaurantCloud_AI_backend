import React from 'react';
import { FacturaSuscripcionDTO } from '@/types/propietarioSuscripcion';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HistorialFacturasTablaProps {
  facturas: FacturaSuscripcionDTO[];
}

export const HistorialFacturasTabla: React.FC<HistorialFacturasTablaProps> = ({
  facturas,
}) => {
  const handleDescargar = (factura: FacturaSuscripcionDTO) => {
    propietarioSuscripcionService.descargarFactura(factura);
  };

  const renderEstadoBadge = (estado: FacturaSuscripcionDTO['estado']) => {
    switch (estado) {
      case 'exitoso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Exitoso
          </span>
        );
      case 'fallido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            Fallido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {estado}
          </span>
        );
    }
  };

  const formatearFecha = (fechaIso: string) => {
    try {
      return new Date(fechaIso).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaIso;
    }
  };

  if (!facturas || facturas.length === 0) {
    return (
      <div className="rounded-2xl border border-aurea-navy/10 bg-white p-8 text-center">
        <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="font-serif text-lg font-bold text-aurea-navy">Sin comprobantes registrados</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Aún no se han generado cobros o facturas para tu suscripción activa.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-aurea-navy/10 bg-white p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy flex items-center gap-2">
            <Receipt className="w-5 h-5 text-aurea-copper" />
            Historial de Facturación y Comprobantes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprobantes electrónicos oficiales con validez tributaria ante SUNAT emitidos por RestaurantCloud AI.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono self-start sm:self-center">
          {facturas.length} {facturas.length === 1 ? 'comprobante' : 'comprobantes'}
        </div>
      </div>

      {/* Vista de Escritorio (Tabla md en adelante) */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono bg-slate-50/60">
              <th className="py-3 px-4">N° Comprobante</th>
              <th className="py-3 px-4">Fecha Emisión</th>
              <th className="py-3 px-4">Descripción / Periodo</th>
              <th className="py-3 px-4">Monto</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Comprobante Oficial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {facturas.map((fac) => (
              <tr
                key={fac.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                <td className="py-3.5 px-4 font-mono font-bold text-aurea-navy">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-aurea-copper" />
                    <span>{fac.numero_comprobante}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600">
                  {formatearFecha(fac.fecha)}
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-800">
                  {fac.descripcion || 'Suscripción RestaurantCloud Pro'}
                </td>
                <td className="py-3.5 px-4 font-sans font-bold text-aurea-navy">
                  S/ {fac.monto.toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {renderEstadoBadge(fac.estado)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDescargar(fac)}
                    className="border-slate-200 hover:border-aurea-copper hover:text-aurea-copper text-slate-700 text-xs font-semibold py-1 px-2.5 inline-flex items-center gap-1.5"
                    title={`Descargar factura electrónica ${fac.numero_comprobante}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF/TXT</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil (Tarjetas para smartphones y tablets pequeñas) */}
      <div className="md:hidden space-y-3 mt-4">
        {facturas.map((fac) => (
          <div
            key={fac.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-aurea-copper" />
                <span className="font-mono font-bold text-aurea-navy text-sm">
                  {fac.numero_comprobante}
                </span>
              </div>
              {renderEstadoBadge(fac.estado)}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-800">
                {fac.descripcion || 'Suscripción RestaurantCloud Pro'}
              </p>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <span>{formatearFecha(fac.fecha)}</span>
                <span className="font-bold text-aurea-navy font-sans text-sm">
                  S/ {fac.monto.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleDescargar(fac)}
              className="w-full border-slate-200 hover:border-aurea-copper hover:text-aurea-copper text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Comprobante Tributario</span>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};
