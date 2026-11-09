import type { OpcionPagoMozoDTO } from '@/types/mozo';

/**
 * Convierte los medios de pago habilitados que devuelve el backend (metodo_pago_local) en las
 * opciones que muestra la precuenta, recalculando la comisión sobre el total vigente.
 *
 * No inventa opciones: si la sede no tiene medios habilitados devuelve una lista vacía y los datos
 * de cobro de la billetera (teléfono, titular, RUC) solo salen de la configuración de la sede.
 */
export const construirOpcionesPago = (
  opcionesBackend: any[] | undefined | null,
  totalNeto: number
): OpcionPagoMozoDTO[] =>
  (opcionesBackend || []).map((op: any) => {
    const comisionPct = Number(op.comision_porcentaje || 0);
    const comision = Math.round(totalNeto * (comisionPct / 100) * 100) / 100;

    // El QR cobra el total con el recargo del medio, no solo el consumo
    const totalEstimado = Math.round((totalNeto + comision) * 100) / 100;
    const detalleBilletera = op.detalle_billetera
      ? { ...op.detalle_billetera, monto_exacto: totalEstimado }
      : null;

    return {
      id: op.id,
      codigo: op.codigo,
      nombre: op.nombre || op.metodo_pago_nombre || op.codigo,
      icono: op.icono || 'wallet',
      comision_porcentaje: comisionPct,
      monto_comision: comision,
      total_estimado: totalEstimado,
      detalle_billetera: detalleBilletera,
      datos_adicionales: op.datos_adicionales,
    };
  });
