/** Datos genéricos de boleta a consumidor final (SUNAT). */
export const CONSUMIDOR_FINAL_DOC = '00000000';
export const CONSUMIDOR_FINAL_NOMBRE = 'CONSUMIDOR FINAL';

/** Desde este monto (S/) la boleta exige identificar al cliente con DNI. */
export const LIMITE_BOLETA_CONSUMIDOR_FINAL = 700;

/** Una boleta solo puede ser consumidor final si su total es menor al límite. */
export const permiteConsumidorFinal = (totalNeto: number): boolean =>
  totalNeto < LIMITE_BOLETA_CONSUMIDOR_FINAL;
