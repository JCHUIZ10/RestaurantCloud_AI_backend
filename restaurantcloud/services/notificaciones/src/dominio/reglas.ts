/**
 * Qué aviso crea cada evento y a quién va (ficha del servicio, sección 4).
 *
 * Funciones puras, sin base de datos ni reloj: reciben los datos ya validados y devuelven los avisos.
 * Un evento puede crear varios (uno por destinatario) o ninguno (un cierre de caja sin diferencia).
 * Los mensajes nombran solo al personal, nunca al cliente.
 */

import type { ROLES_CON_BANDEJA, SEVERIDADES } from '../datos/esquema.js';
import type {
  CajaCerrada,
  CajaTurnoPrevioPendiente,
  ComprobanteAnulado,
  PedidoAnulado,
  PedidoItemSustituido,
  PlatoListo,
  ProductoAgotado,
  TipoEvento,
} from './eventos.js';

export type Rol = (typeof ROLES_CON_BANDEJA)[number];
export type Severidad = (typeof SEVERIDADES)[number];

export type Destinatario =
  | { tipo: 'rol'; rol: Rol; usuario_id: null }
  | { tipo: 'usuario'; rol: null; usuario_id: string };

export interface AvisoNuevo {
  destinatario: Destinatario;
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  datos: Record<string, unknown>;
}

/** Faltante de caja (en soles) a partir del cual el aviso es crítico. */
export const FALTANTE_CRITICO = 100;
/** Platos que se nombran en un aviso de plato listo antes de resumir con «y N más». */
export const MAX_PLATOS_EN_MENSAJE = 5;

const LIMITE_TITULO = 120;
const LIMITE_MENSAJE = 1000;

export const aRol = (rol: Rol): Destinatario => ({ tipo: 'rol', rol, usuario_id: null });
export const aUsuario = (usuarioId: string): Destinatario => ({ tipo: 'usuario', rol: null, usuario_id: usuarioId });

/** Recorta sin pasar del límite del validador, con «…» al final si hace falta. */
export function recortar(texto: string, limite: number): string {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  return limpio.length <= limite ? limpio : `${limpio.slice(0, limite - 1).trimEnd()}…`;
}

/** Monto en soles con dos decimales, como en el resto del sistema: `S/ 75.00`. */
export function soles(monto: number): string {
  return `S/ ${Math.abs(monto).toFixed(2)}`;
}

const turno = (correlativo: number) => String(correlativo).padStart(3, '0');

function aviso(
  destinatario: Destinatario,
  severidad: Severidad,
  titulo: string,
  mensaje: string,
  datos: Record<string, unknown>,
): AvisoNuevo {
  return {
    destinatario,
    severidad,
    titulo: recortar(titulo, LIMITE_TITULO),
    mensaje: recortar(mensaje, LIMITE_MENSAJE),
    datos,
  };
}

function comprobanteAnulado(d: ComprobanteAnulado): AvisoNuevo[] {
  const quien = d.anulado_por_nombre ?? 'Alguien del personal';
  return [
    aviso(
      aRol('admin_local'),
      'alerta',
      'Comprobante anulado',
      `${quien} anuló un comprobante por ${soles(d.total)}.`,
      {
        comprobante_id: d.comprobante_id,
        nota_credito_id: d.nota_credito_id,
        total: d.total,
        motivo_codigo: d.motivo_codigo,
        anulado_por_nombre: d.anulado_por_nombre,
        fecha: d.fecha,
      },
    ),
  ];
}

function pedidoAnulado(d: PedidoAnulado): AvisoNuevo[] {
  const quien = d.anulado_por_nombre ?? 'Alguien del personal';
  const deMozo = d.mozo_nombre ? ` de la comanda de ${d.mozo_nombre}` : '';
  const plato = `${d.cantidad} × ${d.producto_nombre ?? 'plato sin nombre'}`;
  const esComanda = d.tipo_anulacion === 'comanda_completa';

  const datos = {
    anulacion_id: d.anulacion_id,
    pedido_id: d.pedido_id,
    pedido_item_id: d.pedido_item_id,
    producto_nombre: d.producto_nombre,
    cantidad: d.cantidad,
    monto_total: d.monto_total,
    tipo_anulacion: d.tipo_anulacion,
    motivo_categoria: d.motivo_categoria,
    es_merma: d.es_merma,
    mozo_nombre: d.mozo_nombre,
    anulado_por_nombre: d.anulado_por_nombre,
    anulado_en: d.anulado_en,
  };

  const avisos = [
    aviso(
      aRol('admin_local'),
      'alerta',
      esComanda ? 'Comanda anulada' : 'Plato anulado antes del cobro',
      esComanda
        ? `${quien} anuló la comanda${d.mozo_nombre ? ` de ${d.mozo_nombre}` : ''} (${soles(d.monto_total)}).`
        : `${quien} anuló ${plato} (${soles(d.monto_total)})${deMozo}.`,
      datos,
    ),
  ];

  // Si el plato ya estaba preparado, cocina debe enterarse en el momento.
  if (d.es_merma) {
    avisos.push(
      aviso(
        aRol('cocina'),
        'critica',
        'Plato anulado ya preparado',
        `Se anuló ${plato} que ya estaba preparado. Detener o descartar.`,
        datos,
      ),
    );
  }
  return avisos;
}

function pedidoItemSustituido(d: PedidoItemSustituido): AvisoNuevo[] {
  return [
    aviso(
      aRol('cocina'),
      'critica',
      `Sustitución urgente: Mesa ${d.mesa_numero}`,
      `${d.producto_original_nombre} fue sustituido por ${d.producto_nuevo_nombre} (${d.cantidad} ×). Prioridad en cocina.`,
      {
        pedido_id: d.pedido_id,
        mesa_numero: d.mesa_numero,
        pedido_item_nuevo_id: d.pedido_item_nuevo_id,
        producto_original_nombre: d.producto_original_nombre,
        producto_nuevo_nombre: d.producto_nuevo_nombre,
        cantidad: d.cantidad,
        sustituido_por_nombre: d.sustituido_por_nombre,
        fecha: d.fecha,
      },
    ),
  ];
}

function productoAgotado(d: ProductoAgotado): AvisoNuevo[] {
  const quien = d.marcado_por_nombre ?? 'Cocina';
  const motivo = d.causa === 'resolucion_fuego' && d.motivo ? ` Motivo: ${d.motivo}.` : '';
  const titulo = `Plato agotado: ${d.producto_nombre}`;
  const mensaje = `${quien} marcó el plato como agotado en cocina. No ofrecerlo.${motivo}`;
  const datos = {
    producto_id: d.producto_id,
    producto_nombre: d.producto_nombre,
    causa: d.causa,
    motivo: d.motivo,
    marcado_por_nombre: d.marcado_por_nombre,
    fecha: d.fecha,
  };
  return [
    aviso(aRol('admin_local'), 'alerta', titulo, mensaje, datos),
    aviso(aRol('mozo'), 'alerta', titulo, mensaje, datos),
  ];
}

function platoListo(d: PlatoListo): AvisoNuevo[] {
  const nombrados = d.items.slice(0, MAX_PLATOS_EN_MENSAJE).map((i) => `${i.cantidad} × ${i.producto_nombre}`);
  const resto = d.items.length - nombrados.length;
  const lista = resto > 0 ? `${nombrados.join(', ')} y ${resto} más` : nombrados.join(', ');
  return [
    aviso(aUsuario(d.mozo_id), 'info', `Pedido listo: Mesa ${d.mesa_numero}`, `Listo para llevar: ${lista}.`, {
      pedido_id: d.pedido_id,
      mesa_numero: d.mesa_numero,
      items: d.items,
      fecha: d.fecha,
    }),
  ];
}

function cajaTurnoPrevioPendiente(d: CajaTurnoPrevioPendiente): AvisoNuevo[] {
  const numero = turno(d.turno_correlativo);
  const solicitante = d.solicitante_nombre ?? 'Un cajero';
  const deCajero = d.cajero_pendiente_nombre ? ` de ${d.cajero_pendiente_nombre}` : '';
  return [
    aviso(
      // Sin administrador en la sede, el aviso escala al propietario (como hacía el núcleo).
      aRol(d.hay_admin_local ? 'admin_local' : 'propietario'),
      'alerta',
      `Turno #${numero} pendiente de cierre`,
      `${solicitante} no puede abrir turno: el Turno #${numero}${deCajero} sigue abierto. ` +
        'Resuélvelo desde Administración de caja.',
      {
        caja_id: d.caja_id,
        turno_correlativo: d.turno_correlativo,
        cajero_pendiente_nombre: d.cajero_pendiente_nombre,
        solicitante_nombre: d.solicitante_nombre,
        fecha: d.fecha,
      },
    ),
  ];
}

function cajaCerrada(d: CajaCerrada): AvisoNuevo[] {
  // Un cierre cuadrado no avisa. Se compara en céntimos para no depender de decimales binarios.
  const centimos = Math.round(d.discrepancia * 100);
  if (centimos === 0) return [];

  const faltante = centimos < 0;
  const severidad: Severidad = faltante && -centimos > FALTANTE_CRITICO * 100 ? 'critica' : 'alerta';
  const deCajero = d.cajero_nombre ? ` de ${d.cajero_nombre}` : '';
  const forzado = d.cierre_forzado
    ? ` Cierre forzado por ${d.cerrado_por_nombre ?? 'la administración'}.`
    : '';
  const mensaje =
    `Turno #${turno(d.turno_correlativo)}${deCajero}: esperado ${soles(d.efectivo_esperado)}, ` +
    `contado ${soles(d.efectivo_contado)} (${faltante ? 'faltante' : 'sobrante'} de ${soles(d.discrepancia)}).${forzado}`;
  const datos = {
    caja_id: d.caja_id,
    turno_correlativo: d.turno_correlativo,
    cajero_nombre: d.cajero_nombre,
    efectivo_esperado: d.efectivo_esperado,
    efectivo_contado: d.efectivo_contado,
    discrepancia: d.discrepancia,
    cierre_forzado: d.cierre_forzado,
    cerrado_por_nombre: d.cerrado_por_nombre,
    fecha: d.fecha,
  };
  return [
    aviso(aRol('admin_local'), severidad, 'Cierre de caja con diferencia', mensaje, datos),
    aviso(aRol('propietario'), severidad, 'Cierre de caja con diferencia', mensaje, datos),
  ];
}

// Cada regla recibe los datos ya validados con el esquema de su tipo (dominio/eventos.ts).
const REGLAS: { [T in TipoEvento]: (datos: never) => AvisoNuevo[] } = {
  'comprobante.anulado': comprobanteAnulado,
  'pedido.anulado': pedidoAnulado,
  'pedido.item_sustituido': pedidoItemSustituido,
  'producto.agotado': productoAgotado,
  'plato.listo': platoListo,
  'caja.turno_previo_pendiente': cajaTurnoPrevioPendiente,
  'caja.cerrada': cajaCerrada,
};

export function avisosDe(tipo: TipoEvento, datos: Record<string, unknown>): AvisoNuevo[] {
  return (REGLAS[tipo] as (d: Record<string, unknown>) => AvisoNuevo[])(datos);
}
