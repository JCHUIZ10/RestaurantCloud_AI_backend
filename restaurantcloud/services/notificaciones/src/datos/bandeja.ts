/**
 * Bandeja de avisos de quien llama (ficha del servicio, sección 3).
 *
 * Esta es la ÚNICA capa que decide qué avisos ve cada usuario. `filtroVisible` (para MongoDB) y
 * `esVisible` (para el canal SSE, que decide en memoria) expresan la misma regla y viven juntas; una
 * prueba las compara sobre todas las combinaciones de empresa, sede, rol y usuario. Ninguna consulta
 * de esta capa se arma sin pasar por `filtroVisible`.
 *
 * Un aviso es visible si es de la empresa del token y además:
 *  - es personal y va a su usuario, o
 *  - va a su rol en su sede. El propietario no tiene sede en el token: ve su rol en toda la empresa y
 *    `X-Local-Id` (opcional) lo limita a una sede.
 */

import { ObjectId, type Db, type Document, type WithId } from 'mongodb';
import type { Rol } from '../dominio/reglas.js';
import { instanteConZona } from '../soporte/fechas.js';
import type { DocAviso } from './avisos.js';
import { COLECCION_AVISOS } from './mongo.js';

export interface ContextoBandeja {
  usuarioId: string;
  rol: Rol;
  empresaId: string;
  /** Sede que limita la bandeja de rol; `null` solo para el propietario sin `X-Local-Id`. */
  localId: string | null;
}

function exigirSede(ctx: ContextoBandeja): void {
  // Defensa en profundidad: quien no es propietario siempre trae sede. Sin ella, la regla de rol
  // abarcaría toda la empresa, así que se corta aquí en vez de devolver de más.
  if (ctx.rol !== 'propietario' && ctx.localId === null) {
    throw new Error('Contexto de bandeja sin sede para un rol que no es propietario.');
  }
}

/** Condición de MongoDB que cumplen exactamente los avisos visibles para `ctx`. */
export function filtroVisible(ctx: ContextoBandeja): Document {
  exigirSede(ctx);
  const deRol: Document = { 'destinatario.tipo': 'rol', 'destinatario.rol': ctx.rol };
  if (ctx.localId !== null) deRol['local_id'] = ctx.localId;
  return {
    empresa_id: ctx.empresaId,
    $or: [{ 'destinatario.tipo': 'usuario', 'destinatario.usuario_id': ctx.usuarioId }, deRol],
  };
}

/** La misma regla de `filtroVisible`, evaluada sobre un aviso ya cargado. */
export function esVisible(aviso: Pick<DocAviso, 'empresa_id' | 'local_id' | 'destinatario'>, ctx: ContextoBandeja): boolean {
  exigirSede(ctx);
  if (aviso.empresa_id !== ctx.empresaId) return false;
  const { destinatario } = aviso;
  if (destinatario.tipo === 'usuario') return destinatario.usuario_id === ctx.usuarioId;
  return destinatario.rol === ctx.rol && (ctx.localId === null || aviso.local_id === ctx.localId);
}

const sinLeer = (ctx: ContextoBandeja): Document => ({ 'leida_por.usuario_id': { $ne: ctx.usuarioId } });

function coleccion(db: Db) {
  return db.collection<DocAviso>(COLECCION_AVISOS);
}

/** Aviso como lo devuelve la API: `leida` y `leida_en` se calculan para quien llama. */
export function avisoApi(aviso: WithId<DocAviso>, usuarioId: string, zona: string) {
  const lectura = aviso.leida_por.find((l) => l.usuario_id === usuarioId);
  return {
    id: aviso._id.toHexString(),
    tipo: aviso.tipo,
    severidad: aviso.severidad,
    titulo: aviso.titulo,
    mensaje: aviso.mensaje,
    datos: aviso.datos,
    local_id: aviso.local_id,
    leida: lectura !== undefined,
    leida_en: lectura ? instanteConZona(lectura.en, zona) : null,
    creada_en: instanteConZona(aviso.creada_en, zona),
  };
}

export interface OpcionesListado {
  soloNoLeidas: boolean;
  pagina: number;
  porPagina: number;
}

export async function listarAvisos(db: Db, ctx: ContextoBandeja, opciones: OpcionesListado) {
  const filtro: Document = opciones.soloNoLeidas ? { $and: [filtroVisible(ctx), sinLeer(ctx)] } : filtroVisible(ctx);
  const [avisos, total] = await Promise.all([
    coleccion(db)
      .find(filtro)
      .sort({ creada_en: -1, _id: -1 })
      .skip((opciones.pagina - 1) * opciones.porPagina)
      .limit(opciones.porPagina)
      .toArray(),
    coleccion(db).countDocuments(filtro),
  ]);
  return { avisos, total };
}

export async function contarNoLeidos(db: Db, ctx: ContextoBandeja): Promise<{ total: number; criticas: number }> {
  const filtro: Document = { $and: [filtroVisible(ctx), sinLeer(ctx)] };
  const [total, criticas] = await Promise.all([
    coleccion(db).countDocuments(filtro),
    coleccion(db).countDocuments({ $and: [filtro, { severidad: 'critica' }] }),
  ]);
  return { total, criticas };
}

/**
 * Marca un aviso como leído por quien llama. Devuelve `false` si el aviso no existe o no es visible
 * para él (se ven igual: no se revela que existe). Marcarlo dos veces no duplica el registro: la
 * condición `leida_por.usuario_id != yo` y la operación son una sola actualización atómica.
 */
export async function marcarLeida(db: Db, ctx: ContextoBandeja, id: string): Promise<boolean> {
  if (!ObjectId.isValid(id) || id.length !== 24) return false;
  const _id = new ObjectId(id);
  const visible: Document = { $and: [{ _id }, filtroVisible(ctx)] };
  await coleccion(db).updateOne(
    { $and: [visible, sinLeer(ctx)] },
    { $addToSet: { leida_por: { usuario_id: ctx.usuarioId, en: new Date() } } },
  );
  // Visible y ya leído (o recién marcado) responde igual: se confirma que el aviso es suyo.
  return (await coleccion(db).countDocuments(visible, { limit: 1 })) > 0;
}

/** Marca como leídos todos los avisos visibles que quien llama aún no leyó. Devuelve cuántos. */
export async function marcarTodasLeidas(db: Db, ctx: ContextoBandeja): Promise<number> {
  const resultado = await coleccion(db).updateMany(
    { $and: [filtroVisible(ctx), sinLeer(ctx)] },
    { $addToSet: { leida_por: { usuario_id: ctx.usuarioId, en: new Date() } } },
  );
  return resultado.modifiedCount;
}
