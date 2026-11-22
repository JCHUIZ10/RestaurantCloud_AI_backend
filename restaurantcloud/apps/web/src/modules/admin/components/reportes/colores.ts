/**
 * Colores de las marcas de datos de Reportes. Combinan con la marca ÁUREA (navy, cobre, marfil) y se validaron
 * contra daltonismo: los colores adyacentes se distinguen tanto con visión normal como con deuteranopía y
 * tritanopía. Cada color identifica siempre lo mismo (un grupo, un medio de pago), nunca su posición.
 * Los textos no usan estos colores; los llevan las marcas junto a ellos.
 */
export const COLOR = {
  azul: '#2563A8',
  cobre: '#D97B2B',
  turquesa: '#0E9488',
  terracota: '#C24A35',
  ciruela: '#8E3B8A',
  oro: '#C98F12',
} as const;

/** Texto del eje y las etiquetas de los gráficos (navy con opacidad, legible sobre blanco). */
export const TEXTO_EJE = 'rgba(11, 35, 64, 0.7)';
export const LINEA_GUIA = 'rgba(11, 35, 64, 0.08)';
export const LINEA_EJE = 'rgba(11, 35, 64, 0.25)';

const POR_MEDIO: Record<string, string> = {
  tarjeta: COLOR.azul,
  efectivo: COLOR.cobre,
  billetera_digital: COLOR.turquesa,
};
const DE_RESPALDO = [COLOR.ciruela, COLOR.oro, COLOR.terracota];

/** Color de un medio de pago; los que no tienen uno propio toman uno de respaldo según su posición. */
export const colorDeMedioPago = (clave: string, posicion: number): string =>
  POR_MEDIO[clave] ?? DE_RESPALDO[posicion % DE_RESPALDO.length];

const POR_TIPO: Record<string, string> = { boleta: COLOR.ciruela, factura: COLOR.turquesa, nota_venta: COLOR.oro };
export const colorDeTipoComprobante = (clave: string, posicion: number): string =>
  POR_TIPO[clave] ?? DE_RESPALDO[posicion % DE_RESPALDO.length];

/** Colores de las categorías de platos, en orden de ingresos. */
export const COLORES_CATEGORIA = [COLOR.azul, COLOR.cobre, COLOR.turquesa, COLOR.ciruela, COLOR.oro, COLOR.terracota];

/** Fondo tenue de un color de datos, para cajas e iconos (`#RRGGBB` + alfa). */
export function tenue(color: string, alfa: number): string {
  const canal = Math.round(Math.min(Math.max(alfa, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${canal}`;
}
