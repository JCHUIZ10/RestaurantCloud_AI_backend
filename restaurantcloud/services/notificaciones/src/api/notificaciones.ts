/**
 * Bandeja y canal SSE del navegador (ficha del servicio, sección 3).
 *
 * Todas las rutas validan el JWT, aceptan solo los cinco roles con bandeja y toman empresa, sede y
 * usuario del token. Qué avisos se ven lo decide `datos/bandeja.ts`; aquí solo se arma el contexto.
 */

import type { OutgoingHttpHeaders } from 'node:http';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Db } from 'mongodb';
import type { Config } from '../config.js';
import {
  avisoApi,
  contarNoLeidos,
  listarAvisos,
  marcarLeida,
  marcarTodasLeidas,
  type ContextoBandeja,
} from '../datos/bandeja.js';
import { ROLES_CON_BANDEJA } from '../datos/esquema.js';
import type { Rol } from '../dominio/reglas.js';
import type { Reparto } from '../dominio/reparto.js';
import { instanteConZona } from '../soporte/fechas.js';
import { sesionAutenticada } from '../soporte/jwt.js';
import { ErrorApi, responderOk } from '../soporte/respuestas.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Segundos antes del vencimiento del JWT en que el canal pide renovarlo y se cierra. */
export const ANTICIPO_RENOVAR_SEGUNDOS = 30;
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function esRolConBandeja(rol: string): rol is Rol {
  return (ROLES_CON_BANDEJA as readonly string[]).includes(rol);
}

interface Autenticado {
  ctx: ContextoBandeja;
  exp: number;
}

/**
 * Orden de las comprobaciones: token válido (401), rol (403) y sede. La sede es la del token; el
 * propietario no trae una y puede limitar con `X-Local-Id`. Quien tiene sede no puede pedir otra.
 */
async function autenticar(request: FastifyRequest, config: Config): Promise<Autenticado> {
  const sesion = await sesionAutenticada(request, config);
  if (!esRolConBandeja(sesion.rol)) {
    throw new ErrorApi(403, 'ERR_ROL_NO_PERMITIDO', 'Tu rol no tiene bandeja de avisos.');
  }
  if (sesion.empresaId === null) throw new ErrorApi(401, 'ERR_TOKEN_INVALIDO', 'El token no trae empresa.');

  const cabecera = request.headers['x-local-id'];
  const pedida = (Array.isArray(cabecera) ? cabecera[0] : cabecera)?.trim().toLowerCase() || null;
  if (pedida !== null && !UUID.test(pedida)) {
    throw new ErrorApi(422, 'ERR_PARAMETRO_INVALIDO', 'X-Local-Id no es un identificador válido.');
  }

  let localId: string | null;
  if (sesion.localId !== null) {
    if (pedida !== null && pedida !== sesion.localId) {
      throw new ErrorApi(403, 'ERR_SEDE_NO_PERMITIDA', 'No puedes consultar otra sede.');
    }
    localId = sesion.localId;
  } else if (sesion.rol === 'propietario') {
    localId = pedida;
  } else {
    // Sin sede en el token, un rol de sede vería avisos de toda la empresa: el token es inválido.
    throw new ErrorApi(401, 'ERR_TOKEN_INVALIDO', 'El token no trae sede.');
  }

  return {
    ctx: { usuarioId: sesion.usuarioId, rol: sesion.rol, empresaId: sesion.empresaId, localId },
    exp: sesion.exp,
  };
}

function enteroDeQuery(valor: unknown, nombre: string, porDefecto: number, minimo: number, maximo: number): number {
  if (valor === undefined) return porDefecto;
  if (typeof valor !== 'string' || !/^\d+$/.test(valor) || Number(valor) < minimo || Number(valor) > maximo) {
    throw new ErrorApi(422, 'ERR_PARAMETRO_INVALIDO', `${nombre} debe ser un entero entre ${minimo} y ${maximo}.`, {
      campos: [{ campo: nombre, motivo: `entre ${minimo} y ${maximo}` }],
    });
  }
  return Number(valor);
}

function booleanoDeQuery(valor: unknown, nombre: string): boolean {
  if (valor === undefined) return false;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  throw new ErrorApi(422, 'ERR_PARAMETRO_INVALIDO', `${nombre} debe ser true o false.`, {
    campos: [{ campo: nombre, motivo: 'true o false' }],
  });
}

export function rutasNotificaciones(app: FastifyInstance, db: Db, config: Config, reparto: Reparto): void {
  const zona = config.zonaHoraria;

  app.get('/api/v1/notificaciones', async (request, reply) => {
    const { ctx } = await autenticar(request, config);
    const consulta = request.query as Record<string, unknown>;
    const opciones = {
      soloNoLeidas: booleanoDeQuery(consulta['solo_no_leidas'], 'solo_no_leidas'),
      pagina: enteroDeQuery(consulta['pagina'], 'pagina', 1, 1, 1_000_000),
      porPagina: enteroDeQuery(consulta['por_pagina'], 'por_pagina', 20, 1, 50),
    };
    const { avisos, total } = await listarAvisos(db, ctx, opciones);
    return responderOk(
      reply,
      avisos.map((a) => avisoApi(a, ctx.usuarioId, zona)),
      zona,
      200,
      { total, pagina: opciones.pagina, por_pagina: opciones.porPagina },
    );
  });

  app.get('/api/v1/notificaciones/no-leidas/total', async (request, reply) => {
    const { ctx } = await autenticar(request, config);
    return responderOk(reply, await contarNoLeidos(db, ctx), zona);
  });

  app.patch<{ Params: { id: string } }>('/api/v1/notificaciones/:id/leida', async (request, reply) => {
    const { ctx } = await autenticar(request, config);
    const { id } = request.params;
    if (!(await marcarLeida(db, ctx, id))) {
      throw new ErrorApi(404, 'ERR_AVISO_NO_ENCONTRADO', 'El aviso no existe.');
    }
    return responderOk(reply, { id, leida: true }, zona);
  });

  app.post('/api/v1/notificaciones/marcar-todas-leidas', async (request, reply) => {
    const { ctx } = await autenticar(request, config);
    return responderOk(reply, { afectadas: await marcarTodasLeidas(db, ctx) }, zona);
  });

  // Canales abiertos: se cierran al apagar el servicio para que `app.close()` no espere para siempre.
  const cierres = new Set<() => void>();
  app.addHook('preClose', async () => {
    for (const cerrar of [...cierres]) cerrar();
  });

  app.get('/api/v1/notificaciones/stream', async (request, reply) => {
    // Todas las comprobaciones van antes de abrir el canal: un error sale como JSON normal.
    const { ctx, exp } = await autenticar(request, config);

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      ...(reply.getHeaders() as OutgoingHttpHeaders),
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    });
    raw.socket?.setNoDelay(true);

    const escribir = (texto: string): void => {
      if (!raw.destroyed && !raw.writableEnded) raw.write(texto);
    };
    const evento = (nombre: string, datos: unknown, id?: string): void => {
      escribir(`${id ? `id: ${id}\n` : ''}event: ${nombre}\ndata: ${JSON.stringify(datos)}\n\n`);
    };

    let cerrado = false;
    let latido: NodeJS.Timeout | undefined;
    let vencimiento: NodeJS.Timeout | undefined;
    let darDeBaja: () => void = () => {};
    const cerrar = (): void => {
      if (cerrado) return;
      cerrado = true;
      clearInterval(latido);
      clearTimeout(vencimiento);
      darDeBaja();
      cierres.delete(cerrar);
      if (!raw.destroyed && !raw.writableEnded) raw.end();
    };
    cierres.add(cerrar);
    raw.on('close', cerrar);

    // Se registra antes de avisar que está conectado: ningún aviso se pierde entre una cosa y otra.
    darDeBaja = reparto.registrar(ctx, (aviso) => {
      evento('aviso', avisoApi(aviso, ctx.usuarioId, zona), aviso._id.toHexString());
    });
    evento('conectado', { expira_en: instanteConZona(new Date(exp * 1000), zona) });

    latido = setInterval(() => escribir(': latido\n\n'), config.latidoSegundos * 1000);
    // Con el token vencido el canal no deja pasar más avisos: pide renovarlo y se cierra antes de `exp`.
    const hastaRenovar = (exp - ANTICIPO_RENOVAR_SEGUNDOS) * 1000 - Date.now();
    vencimiento = setTimeout(
      () => {
        evento('renovar', { motivo: 'token_por_vencer' });
        cerrar();
      },
      Math.min(Math.max(0, hastaRenovar), MAX_TIMEOUT_MS),
    );
    return reply;
  });
}
