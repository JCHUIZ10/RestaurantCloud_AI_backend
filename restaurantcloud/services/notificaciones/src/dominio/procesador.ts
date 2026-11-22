/**
 * De un cuerpo recibido en `/interno/eventos` a los documentos de aviso que se guardan.
 *
 * `interpretar` valida el sobre y los datos y decide si el evento se ignora; `construirAvisos` aplica
 * la regla del tipo y completa los campos comunes. Sin base de datos: se prueba sin MongoDB.
 */

import type { DocAviso } from '../datos/avisos.js';
import { ESQUEMA_SOBRE, ESQUEMAS_V1, esTipoConocido, VERSION_SOPORTADA, type Sobre, type TipoEvento } from './eventos.js';
import { avisosDe } from './reglas.js';
import { esObjeto, validarObjeto, type ErrorCampo } from './validacion.js';

export class EventoInvalido extends Error {
  override name = 'EventoInvalido';

  constructor(
    mensaje: string,
    readonly campos: ErrorCampo[] = [],
  ) {
    super(mensaje);
  }
}

export type Interpretacion =
  | { estado: 'ignorado'; sobre: Sobre }
  | { estado: 'valido'; sobre: Sobre; tipo: TipoEvento; datos: Record<string, unknown> };

export function interpretar(cuerpo: Buffer): Interpretacion {
  let json: unknown;
  try {
    json = JSON.parse(cuerpo.toString('utf8'));
  } catch {
    throw new EventoInvalido('El cuerpo no es un JSON válido.');
  }
  if (!esObjeto(json)) {
    throw new EventoInvalido('El cuerpo debe ser un objeto con el sobre del evento.');
  }

  const errores = validarObjeto(json, ESQUEMA_SOBRE);
  if (!esObjeto(json['datos'])) {
    errores.push({ campo: 'datos', motivo: 'debe ser un objeto' });
  }
  if (errores.length > 0) {
    throw new EventoInvalido('El sobre del evento no cumple el contrato.', errores);
  }
  const sobre = json as unknown as Sobre;

  // Un tipo que este servicio no usa se acepta sin hacer nada, para no marcarlo como fallido en el outbox.
  if (!esTipoConocido(sobre.tipo)) {
    return { estado: 'ignorado', sobre };
  }
  if (sobre.version !== VERSION_SOPORTADA) {
    throw new EventoInvalido(
      `La versión ${sobre.version} de ${sobre.tipo} no está soportada (se espera ${VERSION_SOPORTADA}).`,
      [{ campo: 'version', motivo: `debe ser ${VERSION_SOPORTADA}` }],
    );
  }

  const erroresDatos = validarObjeto(sobre.datos, ESQUEMAS_V1[sobre.tipo], 'datos');
  if (erroresDatos.length > 0) {
    throw new EventoInvalido(`Los datos de ${sobre.tipo} no cumplen el contrato.`, erroresDatos);
  }
  return { estado: 'valido', sobre, tipo: sobre.tipo, datos: sobre.datos };
}

const MS_POR_DIA = 86_400_000;

/**
 * Documentos listos para guardar. `creada_en` es el momento del hecho (`ocurrido_en`), no el de la
 * recepción: un evento que llega tarde por el outbox se ordena según cuándo ocurrió.
 */
export function construirAvisos(
  sobre: Sobre,
  tipo: TipoEvento,
  datos: Record<string, unknown>,
  diasRetencion: number,
): DocAviso[] {
  const creadaEn = new Date(sobre.ocurrido_en);
  const expiraEn = new Date(creadaEn.getTime() + diasRetencion * MS_POR_DIA);
  return avisosDe(tipo, datos).map((aviso) => ({
    evento_id: sobre.id.toLowerCase(),
    empresa_id: sobre.empresa_id.toLowerCase(),
    local_id: sobre.local_id.toLowerCase(),
    destinatario: aviso.destinatario.usuario_id
      ? { ...aviso.destinatario, usuario_id: aviso.destinatario.usuario_id.toLowerCase() }
      : aviso.destinatario,
    tipo,
    severidad: aviso.severidad,
    titulo: aviso.titulo,
    mensaje: aviso.mensaje,
    datos: aviso.datos,
    leida_por: [],
    creada_en: creadaEn,
    expira_en: expiraEn,
  }));
}
