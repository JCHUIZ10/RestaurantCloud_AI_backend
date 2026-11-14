import type { FlujoDiarioDTO } from '@/types/admin';

export type AgrupacionCurva = 'dia' | 'semana' | 'mes';

export interface CurvaAgrupada {
  agrupacion: AgrupacionCurva;
  puntos: FlujoDiarioDTO[];
}

/** Máximo de tarjetas que se dibujan antes de agrupar. */
export const MAX_PUNTOS_CURVA = 45;

/** Hasta esta cantidad de días se agrupa por semana; más allá, por mes. */
const MAX_DIAS_POR_SEMANA = 183;

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

/** "2026-11-09" → "09/11" */
const diaMes = (fecha: string): string => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;

function sumar(grupo: FlujoDiarioDTO[]): FlujoDiarioDTO {
  const ingresos = redondear(grupo.reduce((total, p) => total + p.ingresos_dia, 0));
  const egresos = redondear(grupo.reduce((total, p) => total + p.egresos_dia, 0));
  const primero = grupo[0];
  const ultimo = grupo[grupo.length - 1];

  return {
    fecha: primero.fecha,
    etiqueta_dia: grupo.length === 1 ? primero.etiqueta_dia : `${diaMes(primero.fecha)} – ${diaMes(ultimo.fecha)}`,
    ingresos_dia: ingresos,
    egresos_dia: egresos,
    saldo_neto_dia: redondear(ingresos - egresos),
  };
}

/**
 * Una tarjeta por día es legible hasta unas semanas; un rango largo (hasta 366 días) se agrupa para que el
 * gráfico siga siendo útil: por semana (bloques de 7 días desde el primero) hasta ~6 meses, y por mes después.
 * Las sumas conservan los totales del periodo.
 */
export function agruparCurva(curva: FlujoDiarioDTO[], maxPuntos: number = MAX_PUNTOS_CURVA): CurvaAgrupada {
  if (curva.length <= maxPuntos) {
    return { agrupacion: 'dia', puntos: curva };
  }

  const grupos: FlujoDiarioDTO[][] = [];

  if (curva.length <= MAX_DIAS_POR_SEMANA) {
    for (let i = 0; i < curva.length; i += 7) {
      grupos.push(curva.slice(i, i + 7));
    }
    return { agrupacion: 'semana', puntos: grupos.map(sumar) };
  }

  const porMes = new Map<string, FlujoDiarioDTO[]>();
  for (const punto of curva) {
    const mes = punto.fecha.slice(0, 7);
    const grupo = porMes.get(mes);
    if (grupo) grupo.push(punto);
    else porMes.set(mes, [punto]);
  }

  return { agrupacion: 'mes', puntos: Array.from(porMes.values(), sumar) };
}
