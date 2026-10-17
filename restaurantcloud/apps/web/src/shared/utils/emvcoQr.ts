/**
 * Utilidades para generación de códigos QR interoperables bajo el estándar
 * EMVCo Merchant-Presented Mode (MPM), adoptado por el BCRP y billeteras en Perú (Yape, Plin, etc.)
 */

/**
 * Calcula el checksum CRC16-CCITT con polinomio 0x1021 y valor inicial 0xFFFF.
 * Requerido obligatoriamente por la especificación EMVCo (Tag 63).
 */
export function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Empaqueta una tupla TLV (Tag - Length - Value) según EMVCo.
 * Length siempre formateado a 2 dígitos.
 */
export function buildTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Normaliza cadenas a caracteres alfanuméricos ASCII sin tildes ni caracteres especiales.
 */
export function cleanAsciiString(str: string, maxLength = 25): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

export interface EmvcoQrOptions {
  phone: string;
  name?: string;
  amount?: number;
  isDynamic?: boolean;
  city?: string;
}

/**
 * Genera el payload string EMVCo compatible al 100% con la app de Yape en Android / iOS.
 */
export function generateYapeEmvcoPayload({
  phone,
  name = 'RESTAURANTE',
  amount = 0,
  isDynamic = true,
  city = 'LIMA',
}: EmvcoQrOptions): string {
  const cleanPhone = phone.replace(/\D/g, '').slice(-9); // 9 dígitos
  const cleanName = cleanAsciiString(name, 25) || 'RESTAURANTE';
  const cleanCity = cleanAsciiString(city, 15) || 'LIMA';

  // Tag 00: Payload Format Indicator (fijo '01')
  const tag00 = buildTlv('00', '01');

  // Tag 01: Point of Initiation Method: '11' = Estático, '12' = Dinámico con monto
  const hasAmount = isDynamic && amount > 0;
  const tag01 = buildTlv('01', hasAmount ? '12' : '11');

  // Tag 26: Merchant Account Information BCP / Yape
  // Subtag 00: Identificador de billetera 'com.bcp.yape'
  // Subtag 01: Teléfono registrado
  // Subtag 02: Nombre de la app 'YAPE'
  const sub00 = buildTlv('00', 'com.bcp.yape');
  const sub01 = buildTlv('01', cleanPhone);
  const sub02 = buildTlv('02', 'YAPE');
  const tag26 = buildTlv('26', `${sub00}${sub01}${sub02}`);

  // Tag 52: Merchant Category Code (0000 = Comercio general)
  const tag52 = buildTlv('52', '0000');

  // Tag 53: Moneda ISO 4217 (604 = Soles PEN)
  const tag53 = buildTlv('53', '604');

  // Tag 54: Monto de la transacción (solo si es dinámico)
  let tag54 = '';
  if (hasAmount) {
    tag54 = buildTlv('54', amount.toFixed(2));
  }

  // Tag 58: País (PE)
  const tag58 = buildTlv('58', 'PE');

  // Tag 59: Nombre del Comercio
  const tag59 = buildTlv('59', cleanName);

  // Tag 60: Ciudad
  const tag60 = buildTlv('60', cleanCity);

  // Armar prefijo antes del checksum
  const rawDataBeforeCrc = `${tag00}${tag01}${tag26}${tag52}${tag53}${tag54}${tag58}${tag59}${tag60}6304`;

  // Tag 63: Checksum CRC16-CCITT
  const crc = crc16Ccitt(rawDataBeforeCrc);

  return `${rawDataBeforeCrc}${crc}`;
}
