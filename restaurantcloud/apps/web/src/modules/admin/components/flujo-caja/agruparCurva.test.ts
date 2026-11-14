import { describe, expect, it } from 'vitest';
import type { FlujoDiarioDTO } from '@/types/admin';
import { agruparCurva } from './agruparCurva';

/** `dias` días consecutivos desde `inicio` (YYYY-MM-DD), cada uno con S/ 10 de ingresos y S/ 4 de egresos. */
function curva(inicio: string, dias: number): FlujoDiarioDTO[] {
  const [a, m, d] = inicio.split('-').map(Number);
  return Array.from({ length: dias }, (_, i) => {
    const fecha = new Date(Date.UTC(a, m - 1, d + i)).toISOString().slice(0, 10);
    return { fecha, etiqueta_dia: `${d + i}`, ingresos_dia: 10, egresos_dia: 4, saldo_neto_dia: 6 };
  });
}

const sumaIngresos = (puntos: FlujoDiarioDTO[]) => puntos.reduce((total, p) => total + p.ingresos_dia, 0);

describe('agruparCurva', () => {
  it('no agrupa un rango corto', () => {
    const datos = curva('2026-11-01', 30);
    const resultado = agruparCurva(datos);
    expect(resultado.agrupacion).toBe('dia');
    expect(resultado.puntos).toBe(datos);
  });

  it('agrupa por semana hasta unos seis meses y conserva los totales', () => {
    const datos = curva('2026-01-01', 100);
    const resultado = agruparCurva(datos);
    expect(resultado.agrupacion).toBe('semana');
    expect(resultado.puntos).toHaveLength(15);
    expect(resultado.puntos[0]).toMatchObject({ fecha: '2026-01-01', etiqueta_dia: '01/01 – 07/01', ingresos_dia: 70, egresos_dia: 28, saldo_neto_dia: 42 });
    expect(resultado.puntos[14].etiqueta_dia).toBe('09/04 – 10/04');
    expect(sumaIngresos(resultado.puntos)).toBe(1000);
  });

  it('agrupa por mes cuando el rango es mayor a seis meses', () => {
    const datos = curva('2026-01-01', 366);
    const resultado = agruparCurva(datos);
    expect(resultado.agrupacion).toBe('mes');
    expect(resultado.puntos).toHaveLength(13);
    expect(resultado.puntos[0]).toMatchObject({ fecha: '2026-01-01', etiqueta_dia: '01/01 – 31/01', ingresos_dia: 310 });
    expect(sumaIngresos(resultado.puntos)).toBe(3660);
  });

  it('respeta un máximo de puntos distinto', () => {
    expect(agruparCurva(curva('2026-11-01', 10), 5).agrupacion).toBe('semana');
    expect(agruparCurva(curva('2026-11-01', 5), 5).agrupacion).toBe('dia');
  });
});
