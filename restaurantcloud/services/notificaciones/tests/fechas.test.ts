import { describe, expect, it } from 'vitest';
import { instanteConZona } from '../src/soporte/fechas.js';

describe('instanteConZona', () => {
  it('escribe la hora de Lima con su desplazamiento', () => {
    // 02:40:11 UTC del 17/11 son las 21:40:11 del 16/11 en Lima (UTC−5): cambia el día.
    const fecha = new Date('2026-11-17T02:40:11.789Z');
    expect(instanteConZona(fecha, 'America/Lima')).toBe('2026-11-16T21:40:11-05:00');
  });

  it('usa +00:00 en UTC', () => {
    expect(instanteConZona(new Date('2026-01-01T00:00:00Z'), 'UTC')).toBe('2026-01-01T00:00:00+00:00');
  });

  it('sigue el horario de verano y los desplazamientos con minutos', () => {
    expect(instanteConZona(new Date('2026-07-01T12:00:00Z'), 'Europe/Madrid')).toBe('2026-07-01T14:00:00+02:00');
    expect(instanteConZona(new Date('2026-01-01T12:00:00Z'), 'Europe/Madrid')).toBe('2026-01-01T13:00:00+01:00');
    expect(instanteConZona(new Date('2026-01-01T12:00:00Z'), 'Asia/Kolkata')).toBe('2026-01-01T17:30:00+05:30');
  });

  it('representa el mismo instante que la fecha original', () => {
    const fecha = new Date('2026-11-16T21:40:11-05:00');
    expect(new Date(instanteConZona(fecha, 'America/Lima')).getTime()).toBe(fecha.getTime());
  });
});
