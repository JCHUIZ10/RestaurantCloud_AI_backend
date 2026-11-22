import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AvisoDTO } from '@/types/notificaciones';
import { abrirFlujoNotificaciones, LectorSse, type OpcionesFlujo } from './flujoNotificaciones';

const aviso = (id: string): AvisoDTO => ({
  id,
  tipo: 'plato.listo',
  severidad: 'info',
  titulo: 'Pedido listo: Mesa 4',
  mensaje: 'Listo para llevar: 2 × Lomo saltado.',
  datos: {},
  local_id: 'sede',
  leida: false,
  leida_en: null,
  creada_en: '2026-11-22T12:00:00-05:00',
});

const bloque = (evento: string, datos: unknown, id?: string) =>
  `${id ? `id: ${id}\n` : ''}event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;

describe('LectorSse', () => {
  it('entrega un evento completo con su id', () => {
    const eventos = new LectorSse().alimentar(bloque('aviso', { a: 1 }, 'abc'));
    expect(eventos).toEqual([{ evento: 'aviso', id: 'abc', datos: '{"a":1}' }]);
  });

  it('junta un evento partido entre trozos, incluso a mitad de palabra', () => {
    const lector = new LectorSse();
    const texto = bloque('aviso', { titulo: 'Pedido listo' }, 'x1');
    const mitad = Math.floor(texto.length / 2);
    expect(lector.alimentar(texto.slice(0, mitad))).toEqual([]);
    expect(lector.alimentar(texto.slice(mitad))).toEqual([{ evento: 'aviso', id: 'x1', datos: '{"titulo":"Pedido listo"}' }]);
  });

  it('entiende un salto de línea CRLF cortado entre dos trozos', () => {
    const lector = new LectorSse();
    expect(lector.alimentar('event: aviso\r\ndata: 1\r\n\r')).toEqual([]);
    expect(lector.alimentar('\n')).toEqual([{ evento: 'aviso', id: null, datos: '1' }]);
  });

  it('entrega varios eventos de un mismo trozo y deja el incompleto para el siguiente', () => {
    const lector = new LectorSse();
    const eventos = lector.alimentar(bloque('conectado', {}) + bloque('aviso', { n: 1 }) + 'event: avi');
    expect(eventos.map((e) => e.evento)).toEqual(['conectado', 'aviso']);
    expect(lector.alimentar('so\ndata: 2\n\n')).toEqual([{ evento: 'aviso', id: null, datos: '2' }]);
  });

  it('ignora el latido y los comentarios', () => {
    const lector = new LectorSse();
    expect(lector.alimentar(': latido\n\n')).toEqual([]);
    expect(lector.alimentar(`: latido\n\n${bloque('aviso', { n: 1 })}`)).toHaveLength(1);
  });

  it('une las líneas data de un mismo evento', () => {
    expect(new LectorSse().alimentar('event: aviso\ndata: uno\ndata: dos\n\n')[0]?.datos).toBe('uno\ndos');
  });

  it('un evento sin nombre es «message»', () => {
    expect(new LectorSse().alimentar('data: x\n\n')[0]?.evento).toBe('message');
  });
});

// --- canal con un servidor falso -------------------------------------------------------------------

interface CanalFalso {
  respuesta: Response;
  enviar: (texto: string) => void;
  cerrar: () => void;
}

function canalFalso(): CanalFalso {
  let controlador!: ReadableStreamDefaultController<Uint8Array>;
  const codificador = new TextEncoder();
  const flujo = new ReadableStream<Uint8Array>({
    start(c) {
      controlador = c;
    },
  });
  return {
    respuesta: new Response(flujo, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
    enviar: (texto) => controlador.enqueue(codificador.encode(texto)),
    cerrar: () => controlador.close(),
  };
}

const vaciarPromesas = () => vi.advanceTimersByTimeAsync(0);

describe('abrirFlujoNotificaciones', () => {
  const alAviso = vi.fn();
  const alEstado = vi.fn();
  const alReconectar = vi.fn();
  const alRespaldo = vi.fn();
  const jwt = vi.fn();
  let respuestas: (Response | Error)[];
  let peticiones: { url: string; cabeceras: Record<string, string> }[];
  let abiertos: { cerrar: () => void }[];

  const fetchFn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    peticiones.push({ url: String(url), cabeceras: init?.headers as Record<string, string> });
    const siguiente = respuestas.shift();
    if (!siguiente) throw new Error('sin respuesta preparada');
    if (siguiente instanceof Error) throw siguiente;
    return siguiente;
  });

  function abrir(extra: Partial<OpcionesFlujo> = {}) {
    const flujo = abrirFlujoNotificaciones({
      alAviso,
      alEstado,
      alReconectar,
      alRespaldo,
      url: '/api/v1/notificaciones/stream',
      fetchFn: fetchFn as unknown as typeof fetch,
      jwt,
      local: () => null,
      ...extra,
    });
    abiertos.push(flujo);
    return flujo;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    for (const f of [alAviso, alEstado, alReconectar, alRespaldo, jwt, fetchFn]) f.mockClear();
    jwt.mockImplementation(async (forzar?: boolean) => (forzar ? 'jwt-nuevo' : 'jwt-viejo'));
    respuestas = [];
    peticiones = [];
    abiertos = [];
  });

  afterEach(() => {
    for (const f of abiertos) f.cerrar();
    vi.useRealTimers();
  });

  it('abre el canal con el JWT en la cabecera y entrega los avisos', async () => {
    const canal = canalFalso();
    respuestas.push(canal.respuesta);
    abrir();
    await vaciarPromesas();

    expect(peticiones[0]?.cabeceras).toMatchObject({ Authorization: 'Bearer jwt-viejo', Accept: 'text/event-stream' });

    canal.enviar(bloque('conectado', { expira_en: 'x' }));
    canal.enviar(bloque('aviso', aviso('a1'), 'a1'));
    await vaciarPromesas();

    expect(alEstado.mock.calls.map((c) => c[0])).toEqual(['conectando', 'vivo']);
    expect(alAviso).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1', titulo: 'Pedido listo: Mesa 4' }));
    expect(alReconectar).not.toHaveBeenCalled(); // la primera conexión no necesita ponerse al día
  });

  it('entrega un aviso partido entre dos trozos de red', async () => {
    const canal = canalFalso();
    respuestas.push(canal.respuesta);
    abrir();
    const texto = bloque('aviso', aviso('a2'), 'a2');
    canal.enviar(bloque('conectado', {}));
    canal.enviar(texto.slice(0, 30));
    await vaciarPromesas();
    expect(alAviso).not.toHaveBeenCalled();
    canal.enviar(texto.slice(30));
    await vaciarPromesas();
    expect(alAviso).toHaveBeenCalledTimes(1);
  });

  it('el propietario manda X-Local-Id con la sede elegida', async () => {
    respuestas.push(canalFalso().respuesta);
    abrir({ local: () => 'sede-2' });
    await vaciarPromesas();
    expect(peticiones[0]?.cabeceras['X-Local-Id']).toBe('sede-2');
  });

  it('con «renovar» pide un JWT nuevo, reabre sin esperar y se pone al día', async () => {
    const primero = canalFalso();
    const segundo = canalFalso();
    respuestas.push(primero.respuesta, segundo.respuesta);
    abrir();
    await vaciarPromesas();
    primero.enviar(bloque('conectado', {}));
    primero.enviar(bloque('renovar', { motivo: 'token_por_vencer' }));
    primero.cerrar();
    await vaciarPromesas();

    expect(jwt).toHaveBeenLastCalledWith(true);
    expect(peticiones).toHaveLength(2);
    expect(peticiones[1]?.cabeceras.Authorization).toBe('Bearer jwt-nuevo');

    segundo.enviar(bloque('conectado', {}));
    await vaciarPromesas();
    expect(alReconectar).toHaveBeenCalledTimes(1);
    // El cierre ordenado no se muestra como caída
    expect(alEstado.mock.calls.map((c) => c[0])).not.toContain('caido');
  });

  it('si el canal se corta sin avisar, queda caído y reintenta con espera creciente', async () => {
    respuestas.push(new Error('red'), new Error('red'), new Error('red'));
    abrir({ esperaMs: (n) => 1000 * 2 ** n });
    await vaciarPromesas();
    expect(alEstado).toHaveBeenLastCalledWith('caido');
    expect(peticiones).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(peticiones).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1); // 1 s
    expect(peticiones).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1999);
    expect(peticiones).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1); // 2 s más
    expect(peticiones).toHaveLength(3);
  });

  it('un canal que se cierra de golpe cuenta como caída', async () => {
    const canal = canalFalso();
    respuestas.push(canal.respuesta, new Error('red'));
    abrir();
    await vaciarPromesas();
    canal.enviar(bloque('conectado', {}));
    canal.cerrar();
    await vaciarPromesas();
    expect(alEstado).toHaveBeenLastCalledWith('caido');
  });

  it('mientras está caído consulta el respaldo cada 30 s; al volver, se pone al día y deja de consultar', async () => {
    const canal = canalFalso();
    respuestas.push(new Error('red'), canal.respuesta);
    abrir({ esperaMs: () => 45_000 });
    await vaciarPromesas();
    expect(alRespaldo).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(alRespaldo).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000); // a los 45 s reabre
    expect(peticiones).toHaveLength(2);
    expect(alRespaldo).toHaveBeenCalledTimes(1);

    canal.enviar(bloque('conectado', {}));
    await vaciarPromesas();
    expect(alReconectar).toHaveBeenCalledTimes(1);
    expect(alEstado).toHaveBeenLastCalledWith('vivo');

    await vi.advanceTimersByTimeAsync(120_000);
    expect(alRespaldo).toHaveBeenCalledTimes(1);
  });

  it('con un 401 renueva el JWT y reintenta una sola vez', async () => {
    const canal = canalFalso();
    respuestas.push(new Response('{}', { status: 401 }), canal.respuesta);
    abrir();
    await vaciarPromesas();
    expect(peticiones).toHaveLength(2);
    expect(peticiones[1]?.cabeceras.Authorization).toBe('Bearer jwt-nuevo');
    expect(alEstado.mock.calls.map((c) => c[0])).not.toContain('caido');
  });

  it('si el 401 se repite, queda caído y espera en vez de insistir sin pausa', async () => {
    respuestas.push(new Response('{}', { status: 401 }), new Response('{}', { status: 401 }));
    abrir({ esperaMs: () => 5000 });
    await vaciarPromesas();
    expect(peticiones).toHaveLength(2);
    expect(alEstado).toHaveBeenLastCalledWith('caido');
  });

  it('con un 403 (rol sin bandeja) se detiene: no reintenta', async () => {
    respuestas.push(new Response('{}', { status: 403 }));
    abrir({ esperaMs: () => 1000 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(peticiones).toHaveLength(1);
    expect(alRespaldo).not.toHaveBeenCalled();
  });

  it('sin sesión no reintenta', async () => {
    const { SinSesionError } = await import('./jwtServicios');
    jwt.mockRejectedValue(new SinSesionError());
    abrir();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(peticiones).toHaveLength(0);
  });

  it('cerrar() corta la conexión, la espera y el respaldo', async () => {
    respuestas.push(new Error('red'), canalFalso().respuesta);
    const flujo = abrir({ esperaMs: () => 10_000 });
    await vaciarPromesas();
    flujo.cerrar();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(peticiones).toHaveLength(1);
    expect(alRespaldo).not.toHaveBeenCalled();
  });
});
