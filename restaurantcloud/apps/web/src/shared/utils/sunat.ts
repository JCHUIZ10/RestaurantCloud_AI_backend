/**
 * Utilitarios de validación y formateo fiscal SUNAT (Perú)
 *
 * Implementa el algoritmo matemático Módulo 11 oficial de SUNAT para RUC (11 dígitos).
 * Cero dependencias externas y ejecución en tiempo real (< 1 ms).
 */

export interface ResultadoValidacionRuc {
  valido: boolean;
  mensaje?: string;
  tipo?: 'RUC_20' | 'RUC_10';
  tipoLabel?: string;
}

/**
 * Validador oficial del algoritmo Módulo 11 para RUC peruano (11 dígitos).
 * No realiza peticiones de red ni llamadas a servicios externos.
 */
export function validarRucModulo11(ruc: string): ResultadoValidacionRuc {
  const rucLimpio = ruc.trim().replace(/\D/g, '');

  if (rucLimpio.length !== 11) {
    return { valido: false, mensaje: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
  }

  const prefijo = rucLimpio.substring(0, 2);
  let tipo: 'RUC_20' | 'RUC_10';
  let tipoLabel: string;

  if (prefijo === '20') {
    tipo = 'RUC_20';
    tipoLabel = 'RUC 20 — Persona Jurídica (Empresa)';
  } else if (prefijo === '10' || prefijo === '15' || prefijo === '17') {
    tipo = 'RUC_10';
    tipoLabel = 'RUC 10 — Persona Natural con Negocio';
  } else {
    return { valido: false, mensaje: 'El prefijo del RUC debe iniciar con 10, 15, 17 o 20.' };
  }

  // Factores de ponderación para Módulo 11 SUNAT
  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(rucLimpio.charAt(i), 10) * factores[i];
  }

  const residuo = 11 - (suma % 11);
  let digitoVerificadorEsperado = residuo;
  if (residuo === 10) digitoVerificadorEsperado = 0;
  if (residuo === 11) digitoVerificadorEsperado = 1;

  const digitoReal = parseInt(rucLimpio.charAt(10), 10);

  if (digitoReal !== digitoVerificadorEsperado) {
    return {
      valido: false,
      mensaje: `Dígito verificador inválido. Se esperaba ${digitoVerificadorEsperado} pero se ingresó ${digitoReal}.`,
    };
  }

  return { valido: true, tipo, tipoLabel };
}
