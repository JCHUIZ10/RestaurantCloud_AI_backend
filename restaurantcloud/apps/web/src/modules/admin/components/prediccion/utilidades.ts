import type {
  LineaReposicionDTO,
  NivelPrediccion,
  PrediccionDTO,
  PronosticoDTO,
} from '@/types/prediccion';

/** Nombre y explicación de cada nivel de la predicción (doc-2u/03-prediccion-en-locales-nuevos.md, N-1). */
export const NIVELES: Record<NivelPrediccion, { nombre: string; explicacion: string; tono: 'neutro' | 'alerta' | 'info' | 'ok' }> = {
  0: {
    nombre: 'Esperando tus primeras ventas',
    explicacion: 'Cuando vendas, empezaremos a calcular tu semana.',
    tono: 'neutro',
  },
  1: {
    nombre: 'En preparación',
    explicacion: 'Usamos tus primeros días de venta. Cada día que pasa, la predicción mejora.',
    tono: 'alerta',
  },
  2: {
    nombre: 'Casi a punto',
    explicacion: 'Ya conocemos tu semana: repetimos lo que vendiste en los mismos días.',
    tono: 'info',
  },
  3: {
    nombre: 'Al punto',
    explicacion: 'Predicción hecha a la medida de tu local, aprendida de tus ventas.',
    tono: 'ok',
  },
};

/** Frase de avance hacia el siguiente nivel, en lenguaje de usuario. */
export function textoProgreso(nivel: NivelPrediccion, progreso: PrediccionDTO['progreso']): string | null {
  if (nivel === 3 || progreso === null) return null;
  const dias = progreso.dias_con_ventas;
  if (nivel === 0) return 'Aún no registras ventas.';
  const llevas = `Llevas ${dias} ${dias === 1 ? 'día' : 'días'} de ventas.`;
  if (nivel === 1 && progreso.faltan_para_siguiente !== null) {
    const faltan = progreso.faltan_para_siguiente;
    return `${llevas} Faltan ${faltan} ${faltan === 1 ? 'día' : 'días'} para el siguiente nivel.`;
  }
  return `${llevas} El último nivel se activa cuando preparamos el modelo de tu local.`;
}

// --- Fechas ---

/** `YYYY-MM-DD` como fecha local, sin que la zona horaria la corra de día. */
export function fechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function nombreDia(fecha: string): string {
  return NOMBRES_DIA[fechaLocal(fecha).getDay()];
}

/** «Sáb» y «21», para la cinta de la semana. */
export function diaCorto(fecha: string): { dia: string; numero: string } {
  const nombre = nombreDia(fecha);
  return { dia: nombre.charAt(0).toUpperCase() + nombre.slice(1, 3), numero: String(fechaLocal(fecha).getDate()) };
}

/** «lunes 23». */
export function diaConNumero(fecha: string): string {
  return `${nombreDia(fecha)} ${fechaLocal(fecha).getDate()}`;
}

/** «sábado 21 de noviembre». */
export function diaLargo(fecha: string): string {
  const f = fechaLocal(fecha);
  return `${nombreDia(fecha)} ${f.getDate()} de ${NOMBRES_MES[f.getMonth()]}`;
}

/** «del sábado 21 al viernes 27 de noviembre». */
export function rangoDeSemana(fechas: string[]): string {
  if (fechas.length === 0) return '';
  const primero = fechas[0];
  const ultimo = fechas[fechas.length - 1];
  const mes = NOMBRES_MES[fechaLocal(ultimo).getMonth()];
  return `del ${nombreDia(primero)} ${fechaLocal(primero).getDate()} al ${nombreDia(ultimo)} ${fechaLocal(ultimo).getDate()} de ${mes}`;
}

// --- Cantidades ---

const PLURAL: Record<string, string> = {
  kg: 'kg',
  L: 'L',
  und: 'unidades',
  botella: 'botellas',
  lata: 'latas',
  saco: 'sacos',
  caja: 'cajas',
  paquete: 'paquetes',
  bidon: 'bidones',
  jaba: 'jabas',
};

const SINGULAR: Record<string, string> = { und: 'unidad', botella: 'botella', lata: 'lata', saco: 'saco', caja: 'caja', paquete: 'paquete', bidon: 'bidón', jaba: 'jaba' };

const UN_DECIMAL = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });
const ENTERO = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

export function nombreUnidad(unidad: string, cantidad: number): string {
  return cantidad === 1 ? (SINGULAR[unidad] ?? unidad) : (PLURAL[unidad] ?? unidad);
}

/** «64,3 kg» o «103 botellas». */
export function formatoCantidad(valor: number, unidad: string): string {
  const entero = Number.isInteger(valor) || ['und', 'botella', 'lata', 'saco', 'caja', 'paquete', 'bidon', 'jaba'].includes(unidad);
  return `${entero ? ENTERO.format(valor) : UN_DECIMAL.format(valor)} ${nombreUnidad(unidad, valor)}`;
}

export function formatoSoles(valor: number): string {
  return `S/ ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)}`;
}

export function formatoSolesEntero(valor: number): string {
  return `S/ ${ENTERO.format(valor)}`;
}

export function formatoEntero(valor: number): string {
  return ENTERO.format(valor);
}

// --- Pronóstico ---

export interface TotalDia {
  fecha: string;
  /** Lo más probable */
  p50: number;
  /** Si el día viene muy movido */
  p90: number;
}

/** Platos y bebidas esperados cada día, sumando todos los platos. */
export function totalesPorDia(pronostico: PronosticoDTO): TotalDia[] {
  const porFecha = new Map<string, TotalDia>();
  for (const plato of pronostico.predicciones) {
    for (const d of plato.dias) {
      const actual = porFecha.get(d.fecha) ?? { fecha: d.fecha, p50: 0, p90: 0 };
      actual.p50 += d.p50;
      actual.p90 += d.p90;
      porFecha.set(d.fecha, actual);
    }
  }
  return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Un día es «fuerte» si está cerca del mejor de la semana (85 % o más). */
export function esDiaFuerte(total: number, mayor: number): boolean {
  return mayor > 0 && total >= mayor * 0.85;
}

/** Suma de dos números ya redondeados a un decimal, sin arrastrar ruido de coma flotante. */
export function suma(valores: number[]): number {
  return Math.round(valores.reduce((a, b) => a + b, 0) * 10) / 10;
}

// --- Reposición ---

/** Lo que se va a comprar: lo que decidió el administrador o, si aún no decide, lo sugerido. */
export function cantidadAComprar(linea: LineaReposicionDTO): number {
  return linea.cantidad_final ?? linea.cantidad_sugerida;
}

export interface GrupoProveedor {
  clave: string;
  proveedorId: string | null;
  nombre: string;
  lineas: LineaReposicionDTO[];
  subtotal: number;
}

export const SIN_PROVEEDOR = 'Sin proveedor registrado';

/** Lo que falta por comprar, agrupado por último proveedor (los descartados y los que no hay que comprar no entran). */
export function agruparPorProveedor(lineas: LineaReposicionDTO[]): GrupoProveedor[] {
  const grupos = new Map<string, GrupoProveedor>();
  for (const l of lineas) {
    if (l.estado === 'descartada' || cantidadAComprar(l) <= 0) continue;
    const clave = l.proveedor?.id ?? 'sin-proveedor';
    const grupo = grupos.get(clave) ?? {
      clave,
      proveedorId: l.proveedor?.id ?? null,
      nombre: l.proveedor?.nombre ?? SIN_PROVEEDOR,
      lineas: [],
      subtotal: 0,
    };
    grupo.lineas.push(l);
    grupo.subtotal += (l.proveedor?.precio ?? 0) * cantidadAComprar(l);
    grupos.set(clave, grupo);
  }
  return [...grupos.values()].sort((a, b) => Number(a.proveedorId === null) - Number(b.proveedorId === null) || a.nombre.localeCompare(b.nombre));
}

/** Estado de una línea, para mostrarlo al usuario. */
export function textoEstado(linea: LineaReposicionDTO): string {
  switch (linea.estado) {
    case 'aceptada':
      return 'Aceptada';
    case 'ajustada':
      return 'Ajustada';
    case 'descartada':
      return 'Descartada';
    default:
      return 'Por revisar';
  }
}

/** Por qué una línea está donde está, en una frase. */
export function textoPrioridad(linea: LineaReposicionDTO, cobertura: number): string {
  if (linea.motivo === 'bajo_minimo') return 'Ya está por debajo del mínimo';
  if (linea.stock_al_calcular < linea.stock_minimo) return 'Ya está por debajo del mínimo';
  const dias = linea.alcanza_dias ?? 0;
  if (dias === 0) return 'No alcanza para el primer día';
  if (dias < cobertura) return `Alcanza solo ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return linea.cantidad_sugerida > 0 ? 'Alcanza; sumamos una pequeña reserva' : 'Tienes suficiente';
}
