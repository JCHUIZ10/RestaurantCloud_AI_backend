import type { PrediccionPropietarioDTO, SedePrediccionDTO } from '@/types/prediccion';
import { nombreDia } from '@/modules/admin/components/prediccion';

export type PeriodoPrediccion = 'manana' | 'fin_de_semana' | 'semana';

export const PERIODOS: { valor: PeriodoPrediccion; etiqueta: string }[] = [
  { valor: 'manana', etiqueta: 'Mañana' },
  { valor: 'fin_de_semana', etiqueta: 'Este fin de semana' },
  { valor: 'semana', etiqueta: 'Próximos 7 días' },
];

/** Fechas del periodo elegido, a partir de los días que trae el pronóstico (el primero es mañana). */
export function fechasDelPeriodo(fechas: string[], periodo: PeriodoPrediccion): string[] {
  if (periodo === 'manana') return fechas.slice(0, 1);
  if (periodo === 'fin_de_semana') return fechas.filter((f) => ['sábado', 'domingo'].includes(nombreDia(f)));
  return fechas;
}

/** Platos y bebidas que una sede venderá en el periodo (lo más probable). */
export function totalDeSede(sede: SedePrediccionDTO, fechas: string[]): number {
  const dias = sede.pronostico?.dias ?? [];
  return Math.round(dias.filter((d) => fechas.includes(d.fecha)).reduce((n, d) => n + d.total_p50, 0));
}

/** Total de todas las sedes en el periodo. */
export function totalDelPanorama(panorama: PrediccionPropietarioDTO['panorama'], fechas: string[]): number {
  return Math.round(panorama.dias.filter((d) => fechas.includes(d.fecha)).reduce((n, d) => n + d.total_p50, 0));
}

/** Sumas por plato entre las sedes que tienen pronóstico, de mayor a menor. */
export function platosComparados(sedes: SedePrediccionDTO[], limite = 5) {
  const total = new Map<string, number>();
  for (const s of sedes) for (const p of s.pronostico?.platos ?? []) total.set(p.nombre, (total.get(p.nombre) ?? 0) + p.total_p50);
  return [...total.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([nombre]) => ({
      nombre,
      porSede: Object.fromEntries(sedes.map((s) => [s.local_id, s.pronostico?.platos.find((p) => p.nombre === nombre)?.total_p50 ?? null])),
    }));
}
