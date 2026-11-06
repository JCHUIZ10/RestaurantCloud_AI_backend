/** Tasa del IGV vigente en Perú (18 %). Único punto del frontend de caja/mozo donde se define. */
export const TASA_IGV = 0.18;

/** Divisor para obtener la base imponible desde un monto con IGV incluido. */
export const DIVISOR_IGV = 1 + TASA_IGV;

/** Importe mínimo (S/) a pagar en un comprobante: la moneda más pequeña en circulación. */
export const MONTO_MINIMO_COMPROBANTE = 0.1;
