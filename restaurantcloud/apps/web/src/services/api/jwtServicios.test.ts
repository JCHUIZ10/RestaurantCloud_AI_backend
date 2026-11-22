import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiClient: { post: vi.fn() } }));

import { apiClient } from './client';
import { SinSesionError, instanteDeVencimiento, modulosDelJwt, obtenerJwt, olvidarJwt } from './jwtServicios';

const post = vi.mocked(apiClient.post);

/** Lo que responde `POST /auth/token-servicios`, con la hora del servidor igual a la del dispositivo. */
function respuestaJwt(jwt: string, venceEnSegundos: number) {
  const ahora = Date.now();
  return {
    data: {
      exito: true,
      datos: { jwt, jwt_expira_en: new Date(ahora + venceEnSegundos * 1000).toISOString() },
      meta: { timestamp: new Date(ahora).toISOString() },
    },
  } as never;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-22T10:00:00-05:00'));
  localStorage.clear();
  localStorage.setItem('auth_token', 'sesion-1');
  olvidarJwt();
  post.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('obtenerJwt', () => {
  it('pide el JWT al núcleo y lo reutiliza mientras esté vigente', async () => {
    post.mockResolvedValue(respuestaJwt('jwt-a', 600));

    expect(await obtenerJwt()).toBe('jwt-a');
    expect(await obtenerJwt()).toBe('jwt-a');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/auth/token-servicios');
  });

  it('lo renueva cuando faltan menos de 60 segundos para que venza', async () => {
    post.mockResolvedValueOnce(respuestaJwt('jwt-a', 600)).mockResolvedValueOnce(respuestaJwt('jwt-b', 600));

    expect(await obtenerJwt()).toBe('jwt-a');
    vi.advanceTimersByTime(539_000); // quedan 61 s: todavía sirve
    expect(await obtenerJwt()).toBe('jwt-a');
    vi.advanceTimersByTime(2_000); // quedan 59 s: se renueva
    expect(await obtenerJwt()).toBe('jwt-b');

    expect(post).toHaveBeenCalledTimes(2);
  });

  it('las peticiones simultáneas comparten una sola renovación', async () => {
    post.mockResolvedValue(respuestaJwt('jwt-a', 600));

    const jwts = await Promise.all([obtenerJwt(), obtenerJwt(), obtenerJwt(), obtenerJwt()]);

    expect(jwts).toEqual(['jwt-a', 'jwt-a', 'jwt-a', 'jwt-a']);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('pide uno nuevo si cambia la sesión (otra cuenta u otro inicio de sesión)', async () => {
    post.mockResolvedValueOnce(respuestaJwt('jwt-de-la-sesion-1', 600)).mockResolvedValueOnce(respuestaJwt('jwt-de-la-sesion-2', 600));

    expect(await obtenerJwt()).toBe('jwt-de-la-sesion-1');
    localStorage.setItem('auth_token', 'sesion-2');
    expect(await obtenerJwt()).toBe('jwt-de-la-sesion-2');
  });

  it('forzar pide uno nuevo aunque el guardado siga vigente', async () => {
    post.mockResolvedValueOnce(respuestaJwt('jwt-a', 600)).mockResolvedValueOnce(respuestaJwt('jwt-b', 600));

    await obtenerJwt();
    expect(await obtenerJwt(true)).toBe('jwt-b');
    expect(await obtenerJwt()).toBe('jwt-b');
  });

  it('sin sesión iniciada no llama al núcleo', async () => {
    localStorage.removeItem('auth_token');

    await expect(obtenerJwt()).rejects.toBeInstanceOf(SinSesionError);
    expect(post).not.toHaveBeenCalled();
  });

  it('si la renovación falla no guarda nada y el siguiente intento vuelve a pedir', async () => {
    post.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(respuestaJwt('jwt-a', 600));

    await expect(obtenerJwt()).rejects.toThrow('503');
    expect(await obtenerJwt()).toBe('jwt-a');
    expect(post).toHaveBeenCalledTimes(2);
  });
});

describe('instanteDeVencimiento', () => {
  it('mide el vencimiento contra la hora del servidor, no contra el reloj del dispositivo', () => {
    const dispositivo = Date.parse('2026-11-22T09:00:00-05:00'); // una hora atrasado
    const servidor = '2026-11-22T10:00:00-05:00';
    const vence = '2026-11-22T10:10:00-05:00';

    expect(instanteDeVencimiento(vence, servidor, dispositivo)).toBe(dispositivo + 600_000);
  });

  it('sin hora del servidor usa el vencimiento tal cual', () => {
    expect(instanteDeVencimiento('2026-11-22T10:10:00-05:00', undefined, 0)).toBe(Date.parse('2026-11-22T10:10:00-05:00'));
  });

  it('un vencimiento ilegible cuenta como ya vencido', () => {
    expect(instanteDeVencimiento('no es una fecha', undefined, 1234)).toBe(1234);
  });
});

describe('modulosDelJwt', () => {
  const jwtCon = (carga: unknown) => `cabecera.${btoa(JSON.stringify(carga)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.firma`;

  it('lee los módulos del plan', () => {
    expect(modulosDelJwt(jwtCon({ modulos: ['prediccion', 'reportes_avanzados'] }))).toEqual(['prediccion', 'reportes_avanzados']);
  });

  it('un plan sin módulos da una lista vacía', () => {
    expect(modulosDelJwt(jwtCon({ modulos: [] }))).toEqual([]);
  });

  it('devuelve null si el token no se puede leer o no trae módulos', () => {
    expect(modulosDelJwt('basura')).toBeNull();
    expect(modulosDelJwt(jwtCon({ sub: 'x' }))).toBeNull();
    expect(modulosDelJwt(jwtCon({ modulos: 'reportes_avanzados' }))).toBeNull();
  });
});
