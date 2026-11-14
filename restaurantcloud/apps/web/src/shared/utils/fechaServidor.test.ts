import { afterEach, describe, expect, it, vi } from 'vitest';
import { hoyServidorStr, registrarMarcaServidor, reiniciarMarcaServidor } from './fechaServidor';

describe('hoyServidorStr', () => {
  afterEach(() => {
    reiniciarMarcaServidor();
    vi.useRealTimers();
  });

  it('usa la fecha local del dispositivo mientras no haya respuesta del servidor', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 10, 0, 0));
    expect(hoyServidorStr()).toBe('2026-11-14');
  });

  it('toma la fecha de la zona del servidor, no la del dispositivo', () => {
    // 23:30 en Lima (UTC-5) del 14/11 son las 04:30 UTC del 15/11: el servidor sigue en el día 14
    registrarMarcaServidor('2026-11-14T23:30:00-05:00', 1_000_000);
    expect(hoyServidorStr(1_000_000)).toBe('2026-11-14');
  });

  it('avanza con el tiempo transcurrido desde la última respuesta', () => {
    registrarMarcaServidor('2026-11-14T23:30:00-05:00', 1_000_000);
    // 45 minutos después ya es el día siguiente en el servidor
    expect(hoyServidorStr(1_000_000 + 45 * 60_000)).toBe('2026-11-15');
  });

  it('entiende marcas en UTC y con zona positiva', () => {
    registrarMarcaServidor('2026-11-14T23:30:00Z', 0);
    expect(hoyServidorStr(0)).toBe('2026-11-14');
    registrarMarcaServidor('2026-11-14T23:30:00+02:00', 0);
    expect(hoyServidorStr(0)).toBe('2026-11-14');
    registrarMarcaServidor('2026-11-14T23:30:00-05:00', 0);
    expect(hoyServidorStr(2 * 3_600_000)).toBe('2026-11-15');
  });

  it('ignora marcas inválidas y conserva la anterior', () => {
    registrarMarcaServidor('2026-11-14T10:00:00-05:00', 0);
    registrarMarcaServidor('no es una fecha', 0);
    expect(hoyServidorStr(0)).toBe('2026-11-14');
  });
});
