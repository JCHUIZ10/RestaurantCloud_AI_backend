/**
 * Reglas de validación del wizard de alta manual B2B.
 *
 * Fuente única para los pasos (habilitan su botón "Siguiente") y para la página
 * (impide saltar pasos desde el stepper y revalida todo antes de enviar).
 * Deben mantenerse alineadas con SaasTenantController@altaManual.
 */
import { extraerDigitosMovilPeru, hoyLocalStr, validarRucModulo11 } from '@/shared/utils';
import type { AltaManualTenantRequestDTO } from '@/types/saasTenants';

export const MIN_RAZON_SOCIAL = 3;
export const MIN_NOMBRE_TITULAR = 3;
export const MIN_NUMERO_OPERACION = 4;
export const MIN_NOTA_ADMINISTRATIVA = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esTelefonoMovilPeruValido(telefono: string): boolean {
  const digitos = extraerDigitosMovilPeru(telefono);
  return digitos.length === 9 && digitos.startsWith('9');
}

export function validarPaso1(datos: Pick<AltaManualTenantRequestDTO, 'ruc' | 'razon_social'>): boolean {
  return (
    datos.ruc.trim().length === 11 &&
    validarRucModulo11(datos.ruc).valido &&
    datos.razon_social.trim().length >= MIN_RAZON_SOCIAL
  );
}

export function validarPaso2(
  datos: Pick<AltaManualTenantRequestDTO, 'propietario_nombre' | 'propietario_email' | 'propietario_telefono'>
): boolean {
  return (
    datos.propietario_nombre.trim().length >= MIN_NOMBRE_TITULAR &&
    EMAIL_REGEX.test(datos.propietario_email.trim()) &&
    esTelefonoMovilPeruValido(datos.propietario_telefono)
  );
}

/** El fin del periodo debe ser posterior al inicio (comparación de cadenas YYYY-MM-DD). */
export function esPeriodoValido(fechaInicio: string, fechaFinPeriodo: string): boolean {
  return Boolean(fechaInicio) && Boolean(fechaFinPeriodo) && fechaFinPeriodo > fechaInicio;
}

export function validarPaso3(
  datos: Pick<AltaManualTenantRequestDTO, 'plan_id' | 'fecha_inicio' | 'fecha_fin_periodo'>
): boolean {
  return datos.plan_id > 0 && esPeriodoValido(datos.fecha_inicio, datos.fecha_fin_periodo);
}

/** La operación bancaria no puede tener fecha futura. */
export function esFechaOperacionValida(fechaOperacion: string): boolean {
  return Boolean(fechaOperacion) && fechaOperacion <= hoyLocalStr();
}

export function validarPaso4(
  datos: Pick<
    AltaManualTenantRequestDTO,
    'monto_cobrado_pen' | 'numero_operacion' | 'fecha_operacion' | 'nota_administrativa'
  >
): boolean {
  return (
    datos.monto_cobrado_pen > 0 &&
    datos.numero_operacion.trim().length >= MIN_NUMERO_OPERACION &&
    esFechaOperacionValida(datos.fecha_operacion) &&
    datos.nota_administrativa.trim().length >= MIN_NOTA_ADMINISTRATIVA
  );
}

const VALIDADORES_POR_PASO: Record<number, (datos: AltaManualTenantRequestDTO) => boolean> = {
  1: validarPaso1,
  2: validarPaso2,
  3: validarPaso3,
  4: validarPaso4,
};

/**
 * Primer paso inválido entre 1 y `hastaPaso` (inclusive), o null si todos son válidos.
 */
export function primerPasoInvalido(datos: AltaManualTenantRequestDTO, hastaPaso = 4): number | null {
  for (let paso = 1; paso <= hastaPaso; paso++) {
    if (!VALIDADORES_POR_PASO[paso](datos)) return paso;
  }
  return null;
}
