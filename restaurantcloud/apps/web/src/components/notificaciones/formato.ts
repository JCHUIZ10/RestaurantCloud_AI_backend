import { formatPEN } from '@/shared/utils';
import type { AvisoDTO } from '@/types/notificaciones';

/** «Ahora», «Hace 5 min», «Hace 2 h», «Hace 3 d». `ahoraMs` se inyecta en las pruebas. */
export function haceCuanto(creadaEn: string, ahoraMs: number = Date.now()): string {
  const instante = Date.parse(creadaEn);
  if (Number.isNaN(instante)) return '';
  const minutos = Math.max(0, Math.floor((ahoraMs - instante) / 60_000));
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
}

/** Hora del texto ISO tal como la escribe el servidor (zona del local), sin pasar por la zona del dispositivo. */
export function horaDeIso(iso: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const m = /T(\d{2}:\d{2})/.exec(iso);
  return m ? m[1]! : null;
}

export type FilaDetalle = [etiqueta: string, valor: string];

const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const MOTIVOS: Record<string, string> = {
  demora_cliente: 'Demora para el cliente',
  error_mozo: 'Error del mozo',
  cambio_cliente: 'Cambio del cliente',
  producto_agotado: 'Producto agotado',
  error_cocina: 'Error de cocina',
};

const motivoLegible = (v: unknown): string | null => {
  const t = texto(v);
  return t ? (MOTIVOS[t] ?? t.replaceAll('_', ' ')) : null;
};

/**
 * Filas del detalle desplegable de un aviso, a partir de los identificadores y montos que trae `datos`.
 * Solo se muestran los campos presentes; un tipo desconocido no tiene detalle (el mensaje ya lo dice todo).
 */
export function detalleDeAviso(aviso: Pick<AvisoDTO, 'tipo' | 'datos'>): FilaDetalle[] {
  const d = aviso.datos;
  const filas: [string, string | null][] = [];
  const dinero = (v: unknown) => (numero(v) === null ? null : formatPEN(Math.abs(numero(v)!)));

  switch (aviso.tipo) {
    case 'comprobante.anulado':
      filas.push(
        ['Anulado por', texto(d.anulado_por_nombre)],
        ['Total', dinero(d.total)],
        ['Hora', horaDeIso(d.fecha)],
      );
      break;
    case 'pedido.anulado':
      filas.push(
        ['Plato', texto(d.producto_nombre) && numero(d.cantidad) !== null ? `${numero(d.cantidad)} × ${texto(d.producto_nombre)}` : texto(d.producto_nombre)],
        ['Alcance', d.tipo_anulacion === 'comanda_completa' ? 'Comanda completa' : d.tipo_anulacion === 'item_individual' ? 'Un plato' : null],
        ['Monto', dinero(d.monto_total)],
        ['Motivo', motivoLegible(d.motivo_categoria)],
        ['Ya preparado', d.es_merma === true ? 'Sí, se descarta' : null],
        ['Mozo', texto(d.mozo_nombre)],
        ['Anulado por', texto(d.anulado_por_nombre)],
        ['Hora', horaDeIso(d.anulado_en)],
      );
      break;
    case 'pedido.item_sustituido':
      filas.push(
        ['Mesa', texto(d.mesa_numero)],
        ['Antes', texto(d.producto_original_nombre)],
        ['Ahora', texto(d.producto_nuevo_nombre) && numero(d.cantidad) !== null ? `${numero(d.cantidad)} × ${texto(d.producto_nuevo_nombre)}` : texto(d.producto_nuevo_nombre)],
        ['Sustituido por', texto(d.sustituido_por_nombre)],
        ['Hora', horaDeIso(d.fecha)],
      );
      break;
    case 'producto.agotado':
      filas.push(
        ['Plato', texto(d.producto_nombre)],
        ['Marcado por', texto(d.marcado_por_nombre)],
        ['Motivo', texto(d.motivo)],
        ['Hora', horaDeIso(d.fecha)],
      );
      break;
    case 'plato.listo': {
      const items = Array.isArray(d.items) ? d.items : [];
      const platos = items
        .map((i) => {
          const it = i as Record<string, unknown>;
          const nombre = texto(it.producto_nombre);
          return nombre ? `${numero(it.cantidad) ?? 1} × ${nombre}` : null;
        })
        .filter((x): x is string => x !== null);
      filas.push(['Mesa', texto(d.mesa_numero)], ['Platos', platos.length ? platos.join(' · ') : null], ['Listo a las', horaDeIso(d.fecha)]);
      break;
    }
    case 'caja.turno_previo_pendiente':
      filas.push(
        ['Turno', numero(d.turno_correlativo) === null ? null : `#${String(numero(d.turno_correlativo)).padStart(3, '0')}`],
        ['Cajero pendiente', texto(d.cajero_pendiente_nombre)],
        ['Quién intentó abrir', texto(d.solicitante_nombre)],
        ['Hora', horaDeIso(d.fecha)],
      );
      break;
    case 'caja.cerrada': {
      const diferencia = numero(d.discrepancia);
      filas.push(
        ['Turno', numero(d.turno_correlativo) === null ? null : `#${String(numero(d.turno_correlativo)).padStart(3, '0')}`],
        ['Cajero', texto(d.cajero_nombre)],
        ['Esperado', dinero(d.efectivo_esperado)],
        ['Contado', dinero(d.efectivo_contado)],
        ['Diferencia', diferencia === null || diferencia === 0 ? null : `${diferencia < 0 ? 'Faltante' : 'Sobrante'} de ${dinero(diferencia)}`],
        ['Cierre', d.cierre_forzado === true ? `Forzado por ${texto(d.cerrado_por_nombre) ?? 'la administración'}` : null],
        ['Hora', horaDeIso(d.fecha)],
      );
      break;
    }
  }
  return filas.filter((f): f is FilaDetalle => f[1] !== null);
}

export const ETIQUETA_SEVERIDAD = { critica: 'Crítica', alerta: 'Alerta', info: 'Info' } as const;
