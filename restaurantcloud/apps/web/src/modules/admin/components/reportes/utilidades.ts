import { sumarDiasStr } from '@/shared/utils/fechaLocal';
import type {
  ClasificacionMenu,
  DesempenoPersonalDTO,
  PlatoRankingDTO,
  RangoDTO,
  RankingProductosDTO,
  ResumenVentasDTO,
} from '@/types/reportes';

/* ------------------------------------------------------------------ Periodos */

export type OpcionPeriodo = 'hoy' | 'ayer' | 'siete_dias' | 'mes' | 'personalizado';

export const ETIQUETA_PERIODO: Record<OpcionPeriodo, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  siete_dias: 'Últimos 7 días',
  mes: 'Este mes',
  personalizado: 'Personalizado',
};

/** Tope de ms-analítica: 366 días contando ambos extremos. */
export const MAXIMO_DIAS_REPORTE = 366;

const aNumeros = (dia: string) => dia.split('-').map(Number) as [number, number, number];

/** Días que abarca un rango, contando ambos extremos. */
export function diasDelRango({ desde, hasta }: RangoDTO): number {
  const [a1, m1, d1] = aNumeros(desde);
  const [a2, m2, d2] = aNumeros(hasta);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000) + 1;
}

/** Rango de cada opción. `hoy` es la fecha del servidor, no la del dispositivo. */
export function rangoDePeriodo(opcion: OpcionPeriodo, hoy: string, personalizado?: RangoDTO): RangoDTO {
  switch (opcion) {
    case 'hoy':
      return { desde: hoy, hasta: hoy };
    case 'ayer': {
      const ayer = sumarDiasStr(hoy, -1);
      return { desde: ayer, hasta: ayer };
    }
    case 'siete_dias':
      return { desde: sumarDiasStr(hoy, -6), hasta: hoy };
    case 'mes':
      return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
    case 'personalizado':
      return personalizado ?? { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  }
}

/** Periodo anterior de la misma duración, que termina el día antes de `desde` (igual que ms-analítica). */
export function periodoAnterior(rango: RangoDTO): RangoDTO {
  const dias = diasDelRango(rango);
  return { desde: sumarDiasStr(rango.desde, -dias), hasta: sumarDiasStr(rango.desde, -1) };
}

/** Motivo por el que un rango no se puede consultar, o `null` si es válido. */
export function errorDeRango({ desde, hasta }: RangoDTO, hoy: string): string | null {
  if (!desde || !hasta) return 'Elige la fecha de inicio y la de fin.';
  if (desde > hasta) return 'La fecha de inicio no puede ser posterior a la de fin.';
  if (hasta > hoy) return 'La fecha de fin no puede ser futura.';
  if (diasDelRango({ desde, hasta }) > MAXIMO_DIAS_REPORTE) return 'El periodo puede abarcar hasta 366 días.';
  return null;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «12 oct 2026» */
export function fechaCorta(dia: string): string {
  const [anio, mes, d] = aNumeros(dia);
  return `${d} ${MESES[mes - 1]} ${anio}`;
}

/** «1 – 20 nov 2026», «28 oct – 3 nov 2026» o «20 nov 2026» si es un solo día. */
export function etiquetaRango({ desde, hasta }: RangoDTO): string {
  if (desde === hasta) return fechaCorta(desde);
  const [a1, m1, d1] = aNumeros(desde);
  const [a2, m2, d2] = aNumeros(hasta);
  if (a1 !== a2) return `${fechaCorta(desde)} – ${fechaCorta(hasta)}`;
  if (m1 !== m2) return `${d1} ${MESES[m1 - 1]} – ${d2} ${MESES[m2 - 1]} ${a2}`;
  return `${d1} – ${d2} ${MESES[m2 - 1]} ${a2}`;
}

/** Versión sin año para las etiquetas de las barras: «1 – 20 nov». */
export function etiquetaRangoCorta(rango: RangoDTO): string {
  return etiquetaRango(rango).replace(/ \d{4}$/, '');
}

export const textoDias = (n: number): string => `${n} ${n === 1 ? 'día' : 'días'}`;

/**
 * Cuándo llegó la última venta de la sede (`ultimo_evento_en`, ISO con la zona del servidor).
 * Es la llegada de la venta, no la hora en que se cobró.
 */
export function textoUltimaVenta(ultimo: string | null, hoy: string): string {
  if (!ultimo) return 'Aún no llegan ventas de esta sede';
  const dia = ultimo.slice(0, 10);
  const [anio, mes, d] = aNumeros(dia);
  const cuando = dia === hoy ? 'hoy' : `el ${d} ${MESES[mes - 1]}${anio === Number(hoy.slice(0, 4)) ? '' : ` ${anio}`}`;
  return `Última venta recibida ${cuando} a las ${ultimo.slice(11, 16)}`;
}

/** «el día anterior», «los 7 días anteriores». */
export const textoPeriodoAnterior = (dias: number): string =>
  dias === 1 ? 'el día anterior' : `los ${dias} días anteriores`;

/* ------------------------------------------------------------------ Formatos */

const numero = (n: number, decimales: number) =>
  new Intl.NumberFormat('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);

export const entero = (n: number): string => numero(n, 0);
export const soles = (n: number, decimales = 0): string => `S/ ${numero(n, decimales)}`;
export const porcentaje = (n: number, decimales = 1): string => `${numero(n, decimales)} %`;

/** «S/ 257.6 mil», para el centro de la dona. */
export function solesCompacto(n: number): string {
  return n >= 1000 ? `S/ ${numero(n / 1000, 1)} mil` : soles(n);
}

export const hora = (h: number): string => `${String(h).padStart(2, '0')}:00`;

const NOMBRE_MEDIO: Record<string, string> = {
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
  billetera_digital: 'Billetera digital',
  transferencia: 'Transferencia',
};
const NOMBRE_TIPO: Record<string, string> = { boleta: 'Boleta', factura: 'Factura', nota_venta: 'Nota de venta' };

function conMayuscula(clave: string): string {
  const texto = clave.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
export const nombreMedioPago = (clave: string): string => NOMBRE_MEDIO[clave] ?? conMayuscula(clave);
export const nombreTipoComprobante = (clave: string): string => NOMBRE_TIPO[clave] ?? conMayuscula(clave);

/* ------------------------------------------------------------------ Horas */

/** Corte entre las dos mitades del día en la curva horaria. No es el horario de la sede: es una división fija. */
export const HORA_DE_CORTE = 18;

/** Horas que se dibujan: desde una antes de la primera venta hasta una después de la última (0 a 23). */
export function rangoDeHoras(franjas: ReadonlyArray<{ hora: number; total: number }>): [number, number] {
  const conVentas = franjas.filter((f) => f.total > 0).map((f) => f.hora);
  if (conVentas.length === 0) return [0, 23];
  return [Math.max(0, Math.min(...conVentas) - 1), Math.min(23, Math.max(...conVentas) + 1)];
}

/* ------------------------------------------------------------------ Grupos del menú */

export interface GrupoMenu {
  clave: ClasificacionMenu;
  /** Plural, para títulos y filtros */
  nombre: string;
  singular: string;
  /** Qué hacer con los platos de este grupo */
  consejo: string;
  /** Color de la marca de datos (validado contra daltonismo) */
  color: string;
  /** Variante legible como texto sobre fondo claro */
  colorTexto: string;
}

/**
 * Nombres de pantalla: dicen qué hacer con cada grupo y no chocan con la escala de estrellas.
 * La clave es la de ms-analítica (`estrella`, `caballito`, `puzle`, `rezagado`).
 */
export const GRUPOS: Record<ClasificacionMenu, GrupoMenu> = {
  estrella: {
    clave: 'estrella',
    nombre: 'Imprescindibles',
    singular: 'Imprescindible',
    consejo: 'Se piden mucho y dejan buen margen. Cuida su receta y su presentación.',
    color: '#C98F12',
    colorTexto: '#8A6208',
  },
  caballito: {
    clave: 'caballito',
    nombre: 'Populares',
    singular: 'Popular',
    consejo: 'Se piden mucho pero dejan poco. Revisa su costo o sube un poco el precio.',
    color: '#2563A8',
    colorTexto: '#2563A8',
  },
  puzle: {
    clave: 'puzle',
    nombre: 'Por impulsar',
    singular: 'Por impulsar',
    consejo: 'Dejan buen margen pero se piden poco. Pide a los mozos que los recomienden.',
    color: '#0E9488',
    colorTexto: '#0B766C',
  },
  rezagado: {
    clave: 'rezagado',
    nombre: 'Por revisar',
    singular: 'Por revisar',
    consejo: 'Se piden poco y dejan poco. Evalúa cambiarlos en la próxima carta.',
    color: '#C24A35',
    colorTexto: '#A63B28',
  },
};

export const ORDEN_GRUPOS: ClasificacionMenu[] = ['estrella', 'caballito', 'puzle', 'rezagado'];

/**
 * La regla de un grupo con los umbrales reales de la carta (ms-analítica los calcula por periodo):
 * se pide mucho si llega a `popularidad_pct` de las unidades, y deja mucho si llega a `margen_unitario` por plato.
 */
export function reglaDeGrupo(clave: ClasificacionMenu, umbrales: NonNullable<RankingProductosDTO['umbrales']>): string {
  const popularidad = porcentaje(umbrales.popularidad_pct);
  const margen = soles(umbrales.margen_unitario, 2);
  const pide = clave === 'estrella' || clave === 'caballito';
  const deja = clave === 'estrella' || clave === 'puzle';
  return `${pide ? `${popularidad} o más` : `Menos de ${popularidad}`} de las unidades y ${deja ? `${margen} o más` : `menos de ${margen}`} por plato`;
}

/* ------------------------------------------------------------------ Estrellas de rentabilidad */

/** Con menos platos que tramos, una calificación no dice nada: un plato solo siempre tendría 5 estrellas. */
export const MINIMO_PLATOS_PARA_ESTRELLAS = 5;
export const TRAMOS_DE_ESTRELLAS = 5;

/**
 * Rentabilidad de cada plato en estrellas, de 1 a 5. Se ordenan los platos con costo por lo que dejan en total
 * (`margen`) y se reparten en cinco tramos iguales: el 20 % que más deja recibe 5 estrellas y el 20 % que menos
 * deja, 1. Los platos sin costo no se califican. Con menos de 5 platos con costo no se califica ninguno.
 */
export function calcularEstrellas(platos: ReadonlyArray<Pick<PlatoRankingDTO, 'producto_id' | 'nombre' | 'margen'>>): Map<string, number> {
  const conMargen = platos.filter((p): p is typeof p & { margen: number } => p.margen !== null);
  const estrellas = new Map<string, number>();
  if (conMargen.length < MINIMO_PLATOS_PARA_ESTRELLAS) return estrellas;

  const ordenados = [...conMargen].sort((a, b) => b.margen - a.margen || a.nombre.localeCompare(b.nombre, 'es'));
  ordenados.forEach((plato, i) => {
    estrellas.set(plato.producto_id, TRAMOS_DE_ESTRELLAS - Math.floor((i * TRAMOS_DE_ESTRELLAS) / ordenados.length));
  });
  return estrellas;
}

/* ------------------------------------------------------------------ Frases de «lo más importante» */

/** Variación como «15.7 % más» o «3.2 % menos»; `null` si no hay base de comparación. */
function masOMenos(variacion: number | null): string | null {
  if (variacion === null) return null;
  if (variacion === 0) return 'lo mismo';
  return `${porcentaje(Math.abs(variacion))} ${variacion > 0 ? 'más' : 'menos'}`;
}

/** La frase de la pestaña de ventas. Sin comparación, o sin base para compararla, resume solo el periodo. */
export function frasePrincipalVentas(resumen: ResumenVentasDTO, comparando: boolean): string {
  const { actual, variacion_pct: variacion } = resumen;
  if (actual.comprobantes === 0) return 'No hubo ventas en este periodo.';

  const sola = `Vendiste ${soles(actual.ventas_total)} en ${entero(actual.comprobantes)} cuentas${
    actual.ticket_promedio === null ? '.' : `, con un ticket promedio de ${soles(actual.ticket_promedio, 2)}.`
  }`;
  const ventas = comparando && resumen.anterior ? masOMenos(variacion?.ventas_total ?? null) : null;
  if (!ventas || !resumen.anterior) return sola;

  const dias = diasDelRango(resumen.anterior);
  const frase = ventas === 'lo mismo' ? 'Vendiste lo mismo' : `Vendiste ${ventas}`;
  const cuentas = variacion?.comprobantes ?? null;
  const ticket = variacion?.ticket_promedio ?? null;
  const piezas: string[] = [];
  if (cuentas) piezas.push(`hubo ${porcentaje(Math.abs(cuentas))} ${cuentas > 0 ? 'más' : 'menos'} cuentas`);
  if (ticket) piezas.push(`el ticket promedio ${ticket > 0 ? 'subió' : 'bajó'} ${porcentaje(Math.abs(ticket))}`);
  const detalle = piezas.length > 0 ? ` ${piezas.join(' y ').replace(/^h/, 'H').replace(/^e/, 'E')}.` : '';
  return `${frase} que en ${textoPeriodoAnterior(dias)}.${detalle}`;
}

/** Parte de los ingresos de un grupo del menú. */
export function ingresoPorGrupo(productos: ReadonlyArray<PlatoRankingDTO>): Record<ClasificacionMenu, { platos: number; ingreso: number }> {
  const base = Object.fromEntries(ORDEN_GRUPOS.map((g) => [g, { platos: 0, ingreso: 0 }])) as Record<ClasificacionMenu, { platos: number; ingreso: number }>;
  for (const p of productos) {
    if (p.clasificacion) {
      base[p.clasificacion].platos += 1;
      base[p.clasificacion].ingreso += p.ingreso;
    }
  }
  return base;
}

export function frasePrincipalPlatos(ranking: RankingProductosDTO): string | null {
  const clasificados = ranking.productos.filter((p) => p.clasificacion !== null);
  if (clasificados.length === 0) return null;
  const total = clasificados.reduce((s, p) => s + p.ingreso, 0);
  const grupos = ingresoPorGrupo(clasificados);
  const parte = (g: ClasificacionMenu) => (total > 0 ? Math.round((grupos[g].ingreso / total) * 100) : 0);

  if (grupos.estrella.platos === 0) return 'Ningún plato se pide mucho y deja buen margen a la vez: revisa los costos de los más pedidos.';
  const imprescindibles =
    grupos.estrella.platos === 1
      ? `Tu plato imprescindible trae el ${parte('estrella')} % de los ingresos.`
      : `Tus ${grupos.estrella.platos} platos imprescindibles traen el ${parte('estrella')} % de los ingresos.`;
  if (grupos.rezagado.platos === 0) return imprescindibles;
  return grupos.rezagado.platos === 1
    ? `${imprescindibles} El plato por revisar solo aporta el ${parte('rezagado')} %: es candidato a renovar en la carta.`
    : `${imprescindibles} Los ${grupos.rezagado.platos} platos por revisar solo aportan el ${parte('rezagado')} %: son candidatos a renovar en la carta.`;
}

/** Diferencia mínima, en puntos, entre la parte de unidades y la de ingresos para destacar una categoría. */
const BRECHA_DE_CATEGORIA = 10;

/** Señala la categoría que más pesa en unidades pero menos en ingresos (típicamente las bebidas); `null` si ninguna se destaca. */
export function notaDeCategorias(categorias: RankingProductosDTO['por_categoria']): string | null {
  const unidadesTotales = categorias.reduce((s, c) => s + c.unidades, 0);
  const ingresoTotal = categorias.reduce((s, c) => s + c.ingreso, 0);
  if (unidadesTotales === 0 || ingresoTotal === 0) return null;

  const brechas = categorias.map((c) => {
    const unidades = (c.unidades * 100) / unidadesTotales;
    const ingreso = (c.ingreso * 100) / ingresoTotal;
    return { nombre: c.categoria_nombre, unidades, ingreso, brecha: unidades - ingreso };
  });
  const mayor = brechas.sort((a, b) => b.brecha - a.brecha)[0];
  if (!mayor || mayor.brecha < BRECHA_DE_CATEGORIA) return null;
  return `${mayor.nombre}: ${porcentaje(mayor.unidades, 0)} de las unidades vendidas, pero solo ${porcentaje(mayor.ingreso, 0)} de los ingresos.`;
}

export function frasePrincipalEquipo(desempeno: DesempenoPersonalDTO, ticketSede: number | null): string | null {
  const { mozos, totales } = desempeno;
  if (mozos.length === 0 || totales.ventas_total === 0) return null;
  const primero = mozos[0];
  const parte = porcentaje((primero.ventas_total / totales.ventas_total) * 100);
  if (mozos.length === 1) return `${primero.mozo_nombre ?? 'Un mozo'} atendió todas las ventas del periodo.`;

  const lidera = `${primero.mozo_nombre ?? 'Un mozo'} lidera con el ${parte} de las ventas.`;
  const tickets = mozos.map((m) => m.ticket_promedio).filter((t): t is number => t !== null);
  if (ticketSede === null || tickets.length < 2) return lidera;

  const desvio = Math.max(...tickets.map((t) => Math.abs(t - ticketSede) / ticketSede)) * 100;
  return desvio < 3
    ? `${lidera} Todos están a menos del 3 % del ticket promedio de la sede, así que el equipo vende parejo.`
    : `${lidera} Sus tickets se separan hasta un ${porcentaje(desvio, 0)} del promedio de la sede.`;
}
