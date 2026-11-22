import type { AvisoDTO, EstadoCanal } from '@/types/notificaciones';
import { clienteMicroservicios, localElegido } from './clienteMicroservicios';
import { obtenerJwt, SinSesionError } from './jwtServicios';

/**
 * Canal en tiempo real de avisos (CU-TRANS-01): `GET /notificaciones/stream` de ms-notificaciones, por Kong.
 *
 * `EventSource` no permite cabeceras, así que se lee el flujo con `fetch` y `Authorization: Bearer`. El servidor
 * cierra el canal 30 s antes de que venza el JWT (evento `renovar`); el cliente renueva el JWT y se reconecta sin
 * espera. Si el canal cae, reintenta con espera creciente y, mientras esté caído, pide el respaldo cada 30 s.
 */

export interface EventoSse {
  evento: string;
  id: string | null;
  datos: string;
}

/**
 * Separa un flujo `text/event-stream` en eventos. Los trozos llegan donde la red los corta (a mitad de línea, o con
 * el `\r\n` partido), así que se acumula el texto y solo se entrega lo que ya tiene su línea en blanco final.
 * Los comentarios (`: latido`) mantienen viva la conexión y no producen evento.
 */
export class LectorSse {
  private pendiente = '';

  alimentar(trozo: string): EventoSse[] {
    this.pendiente += trozo;
    const bloques = this.pendiente.split(/\r\n\r\n|\n\n|\r\r/);
    this.pendiente = bloques.pop() ?? '';

    const eventos: EventoSse[] = [];
    for (const bloque of bloques) {
      let evento = 'message';
      let id: string | null = null;
      const datos: string[] = [];
      let hay = false;
      for (const linea of bloque.split(/\r\n|\n|\r/)) {
        if (linea === '' || linea.startsWith(':')) continue;
        const i = linea.indexOf(':');
        const campo = i === -1 ? linea : linea.slice(0, i);
        const valor = i === -1 ? '' : linea.slice(i + 1).replace(/^ /, '');
        if (campo === 'event') evento = valor;
        else if (campo === 'id') id = valor;
        else if (campo === 'data') datos.push(valor);
        else continue;
        hay = true;
      }
      if (hay) eventos.push({ evento, id, datos: datos.join('\n') });
    }
    return eventos;
  }
}

export interface OpcionesFlujo {
  /** Un aviso creado desde que se abrió el canal. */
  alAviso: (aviso: AvisoDTO) => void;
  alEstado: (estado: EstadoCanal) => void;
  /** Se abrió el canal después de haber estado caído o de renovar el token: hay que ponerse al día. */
  alReconectar: () => void;
  /** Con el canal caído, cada `respaldoMs`: consultar el contador. */
  alRespaldo: () => void;
  url?: string;
  respaldoMs?: number;
  /** Espera antes del reintento número `n` (desde 0). */
  esperaMs?: (n: number) => number;
  fetchFn?: typeof fetch;
  jwt?: (forzar?: boolean) => Promise<string>;
  local?: () => string | null;
}

export const RESPALDO_MS = 30_000;
const ESPERA_MAXIMA_MS = 30_000;
const esperaPorDefecto = (n: number) => Math.min(1000 * 2 ** n, ESPERA_MAXIMA_MS);

class Detenido extends Error {}

/** Abre el canal y lo mantiene abierto hasta que se llame a `cerrar`. */
export function abrirFlujoNotificaciones(opciones: OpcionesFlujo): { cerrar: () => void } {
  const url = opciones.url ?? `${clienteMicroservicios.defaults.baseURL ?? '/api/v1'}/notificaciones/stream`;
  const respaldoMs = opciones.respaldoMs ?? RESPALDO_MS;
  const esperaDe = opciones.esperaMs ?? esperaPorDefecto;
  const pedirFetch = opciones.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const pedirJwt = opciones.jwt ?? obtenerJwt;
  const sede = opciones.local ?? localElegido;

  const control = new AbortController();
  let respaldo: ReturnType<typeof setInterval> | null = null;
  let esperando: ReturnType<typeof setTimeout> | null = null;
  let despertar: (() => void) | null = null;
  let estado: EstadoCanal | null = null;
  // Hubo una caída o un cierre por vencimiento desde la última vez que estuvo vivo: al reabrir hay que ponerse al día
  let faltaPonerseAlDia = false;

  const cambiarEstado = (nuevo: EstadoCanal) => {
    if (nuevo === estado) return;
    estado = nuevo;
    opciones.alEstado(nuevo);
    if (nuevo === 'caido') faltaPonerseAlDia = true;
    if (nuevo === 'caido' && respaldo === null) {
      respaldo = setInterval(opciones.alRespaldo, respaldoMs);
    } else if (nuevo !== 'caido' && respaldo !== null) {
      clearInterval(respaldo);
      respaldo = null;
    }
  };

  const dormir = (ms: number) =>
    new Promise<void>((resolver) => {
      despertar = resolver;
      esperando = setTimeout(resolver, ms);
    });

  async function leerCanal(respuesta: Response): Promise<{ renovar: boolean; abrio: boolean }> {
    const lector = new LectorSse();
    const decodificador = new TextDecoder();
    const cuerpo = respuesta.body!.getReader();
    let renovar = false;
    let abrio = false;
    for (;;) {
      const { done, value } = await cuerpo.read();
      if (done) return { renovar, abrio };
      for (const e of lector.alimentar(decodificador.decode(value, { stream: true }))) {
        if (e.evento === 'conectado') {
          abrio = true;
          cambiarEstado('vivo');
          if (faltaPonerseAlDia) {
            faltaPonerseAlDia = false;
            opciones.alReconectar();
          }
        } else if (e.evento === 'aviso') {
          try {
            opciones.alAviso(JSON.parse(e.datos) as AvisoDTO);
          } catch {
            // Un aviso mal formado no debe tumbar el canal; la puesta al día lo recupera.
          }
        } else if (e.evento === 'renovar') {
          renovar = true;
        }
      }
    }
  }

  async function ciclo() {
    let fallos = 0;
    let forzarJwt = false;
    let reintentoPor401 = false;

    while (!control.signal.aborted) {
      let pausa = 0;
      try {
        const jwt = await pedirJwt(forzarJwt);
        forzarJwt = false;
        const cabeceras: Record<string, string> = { Authorization: `Bearer ${jwt}`, Accept: 'text/event-stream' };
        const local = sede();
        if (local) cabeceras['X-Local-Id'] = local;

        const respuesta = await pedirFetch(url, { headers: cabeceras, signal: control.signal });
        if (respuesta.status === 403) throw new Detenido(); // el rol no tiene bandeja: no hay nada que reintentar
        if (respuesta.status === 401 && !reintentoPor401) {
          // El JWT debía estar vigente: se pide uno nuevo y se reintenta sin esperar, una sola vez
          reintentoPor401 = true;
          forzarJwt = true;
          continue;
        }
        if (!respuesta.ok || !respuesta.body) throw new Error(`El canal respondió ${respuesta.status}`);
        reintentoPor401 = false;

        const { renovar, abrio } = await leerCanal(respuesta);
        if (abrio) fallos = 0;
        if (renovar) {
          // Cierre ordenado por vencimiento del token: renovar y reabrir ya, y ponerse al día al reabrir
          forzarJwt = true;
          faltaPonerseAlDia = true;
          continue;
        }
        throw new Error('El canal se cerró');
      } catch (error) {
        if (control.signal.aborted || error instanceof Detenido || error instanceof SinSesionError) return;
        cambiarEstado('caido');
        pausa = esperaDe(fallos++);
      }
      await dormir(pausa);
    }
  }

  cambiarEstado('conectando');
  void ciclo();

  return {
    cerrar() {
      control.abort();
      if (respaldo !== null) clearInterval(respaldo);
      if (esperando !== null) clearTimeout(esperando);
      despertar?.();
    },
  };
}
