import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const jwt = vi.hoisted(() => ({ actual: 'jwt-viejo', obtenerJwt: vi.fn() }));
vi.mock('./jwtServicios', () => ({ obtenerJwt: jwt.obtenerJwt }));

import { clienteMicroservicios, microserviciosGet } from './clienteMicroservicios';

interface Respuesta {
  status: number;
  data?: unknown;
}

let cola: Respuesta[] = [];
let llamadas: InternalAxiosRequestConfig[] = [];

beforeEach(() => {
  localStorage.clear();
  cola = [];
  llamadas = [];
  jwt.actual = 'jwt-viejo';
  jwt.obtenerJwt.mockReset();
  jwt.obtenerJwt.mockImplementation(async (forzar = false) => {
    if (forzar) jwt.actual = 'jwt-nuevo';
    return jwt.actual;
  });

  // Sin red: cada petición toma la siguiente respuesta de la cola
  clienteMicroservicios.defaults.adapter = async (config) => {
    llamadas.push(config);
    const siguiente = cola.shift() ?? { status: 200, data: { exito: true, datos: {} } };
    const respuesta = { status: siguiente.status, data: siguiente.data, headers: {}, statusText: '', config } as AxiosResponse;
    if (siguiente.status >= 400) throw new AxiosError('falló', 'ERR_BAD_REQUEST', config, null, respuesta);
    return respuesta;
  };
});

const cabecera = (config: InternalAxiosRequestConfig, nombre: string) => config.headers.get(nombre);

describe('clienteMicroservicios', () => {
  it('envía el JWT del núcleo, no el token de sesión', async () => {
    localStorage.setItem('auth_token', 'token-de-sesion');

    await microserviciosGet('/analitica/ventas/resumen', { desde: '2026-11-01' });

    expect(cabecera(llamadas[0], 'Authorization')).toBe('Bearer jwt-viejo');
  });

  it('el propietario elige la sede con X-Local-Id', async () => {
    localStorage.setItem('auth_usuario', JSON.stringify({ rol: 'propietario' }));
    localStorage.setItem('active_local_id', 'sede-2');

    await microserviciosGet('/analitica/ventas/resumen');

    expect(cabecera(llamadas[0], 'X-Local-Id')).toBe('sede-2');
  });

  it('quien tiene sede fija no manda X-Local-Id aunque quede una sede elegida de otra sesión', async () => {
    localStorage.setItem('auth_usuario', JSON.stringify({ rol: 'admin_local' }));
    localStorage.setItem('active_local_id', 'sede-que-quedo-de-un-propietario');

    await microserviciosGet('/analitica/ventas/resumen');

    expect(cabecera(llamadas[0], 'X-Local-Id')).toBeUndefined();
  });

  it('ante un 401 renueva el JWT y reintenta una sola vez', async () => {
    cola = [{ status: 401, data: { message: 'token expired' } }, { status: 200, data: { exito: true, datos: { ok: 1 } } }];

    const respuesta = await microserviciosGet<{ ok: number }>('/analitica/ventas/resumen');

    expect(respuesta).toEqual({ exito: true, datos: { ok: 1 } });
    expect(llamadas).toHaveLength(2);
    expect(jwt.obtenerJwt).toHaveBeenCalledWith(true);
    expect(cabecera(llamadas[1], 'Authorization')).toBe('Bearer jwt-nuevo');
  });

  it('si el reintento también da 401 se rinde: no entra en un bucle', async () => {
    cola = [{ status: 401 }, { status: 401 }];

    await expect(microserviciosGet('/analitica/ventas/resumen')).rejects.toMatchObject({ response: { status: 401 } });
    expect(llamadas).toHaveLength(2);
  });

  it('un error de negocio del servicio llega como respuesta, con su código', async () => {
    const cuerpo = { exito: false, errores: [{ codigo: 'ERR_MODULO_NO_INCLUIDO', mensaje: 'Tu plan no incluye este reporte.' }] };
    cola = [{ status: 403, data: cuerpo }];

    expect(await microserviciosGet('/analitica/productos/ranking')).toEqual(cuerpo);
  });

  it('un error del gateway (sin el cuerpo del contrato) se lanza', async () => {
    cola = [{ status: 429, data: { message: 'API rate limit exceeded' } }];

    await expect(microserviciosGet('/analitica/ventas/resumen')).rejects.toMatchObject({ response: { status: 429 } });
  });
});
