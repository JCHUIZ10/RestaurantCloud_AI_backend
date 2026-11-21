import { describe, expect, it } from 'vitest';
import type { SedePrediccionDTO } from '@/types/prediccion';
import { fechasDelPeriodo, platosComparados, totalDeSede, totalDelPanorama } from './periodos';

// Sábado 21 al viernes 27 de noviembre de 2026
const SEMANA = ['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'];

function sede(id: string, totales: number[], platos: [string, number][] = []): SedePrediccionDTO {
  return {
    local_id: id, nombre: id, estado: 'ok', nivel: 3, dias_con_ventas: 300, creada_en: null, cobertura_dias: 3, reposicion: null,
    pronostico: {
      fecha_inicio: SEMANA[0], total_semana: totales.reduce((a, b) => a + b, 0), advertencias: [],
      dias: SEMANA.map((fecha, i) => ({ fecha, total_p50: totales[i], total_p90: totales[i] + 10 })),
      platos: platos.map(([nombre, total_p50]) => ({ nombre, total_p50 })),
    },
  };
}

describe('fechasDelPeriodo', () => {
  it('mañana es el primer día del pronóstico', () => {
    expect(fechasDelPeriodo(SEMANA, 'manana')).toEqual(['2026-11-21']);
  });

  it('el fin de semana son el sábado y el domingo', () => {
    expect(fechasDelPeriodo(SEMANA, 'fin_de_semana')).toEqual(['2026-11-21', '2026-11-22']);
  });

  it('los 7 días son todos', () => {
    expect(fechasDelPeriodo(SEMANA, 'semana')).toHaveLength(7);
  });
});

describe('totales del periodo', () => {
  const a = sede('a', [600, 558, 278, 289, 316, 384, 516]);

  it('suma solo los días del periodo', () => {
    expect(totalDeSede(a, fechasDelPeriodo(SEMANA, 'fin_de_semana'))).toBe(1158);
    expect(totalDeSede(a, fechasDelPeriodo(SEMANA, 'manana'))).toBe(600);
  });

  it('una sede sin pronóstico suma cero', () => {
    expect(totalDeSede({ ...a, pronostico: null }, SEMANA)).toBe(0);
  });

  it('el panorama suma las sedes', () => {
    const panorama = { total_semana: 0, dias: SEMANA.map((fecha) => ({ fecha, total_p50: 100, por_sede: {} })) };
    expect(totalDelPanorama(panorama, SEMANA.slice(0, 3))).toBe(300);
  });
});

describe('platosComparados', () => {
  it('ordena por el total de todas las sedes y deja vacío donde una sede no vende el plato', () => {
    const a = sede('a', [1, 1, 1, 1, 1, 1, 1], [['Lomo', 246], ['Jalea', 191]]);
    const b = sede('b', [1, 1, 1, 1, 1, 1, 1], [['Lomo', 171]]);

    const r = platosComparados([a, b], 5);

    expect(r.map((p) => p.nombre)).toEqual(['Lomo', 'Jalea']);
    expect(r[1].porSede).toEqual({ a: 191, b: null });
  });
});
