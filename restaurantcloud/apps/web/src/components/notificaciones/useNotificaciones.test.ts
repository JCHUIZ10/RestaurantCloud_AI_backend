import { describe, expect, it } from 'vitest';
import type { AvisoDTO } from '@/types/notificaciones';
import { estadoInicial, MS_FLOTANTE_CRITICO, MS_FLOTANTE_DISCRETO, reducir, type EstadoNotificaciones } from './useNotificaciones';

let n = 0;
const aviso = (cambios: Partial<AvisoDTO> = {}): AvisoDTO => ({
  id: `a${++n}`,
  tipo: 'plato.listo',
  severidad: 'info',
  titulo: 'Pedido listo: Mesa 4',
  mensaje: 'Listo para llevar.',
  datos: {},
  local_id: 'sede',
  leida: false,
  leida_en: null,
  creada_en: '2026-11-22T12:00:00-05:00',
  ...cambios,
});

/** Estado con las dos pestañas ya cargadas. */
function conListas(noLeidas: AvisoDTO[], todas: AvisoDTO[], contador = { total: noLeidas.length, criticas: noLeidas.filter((a) => a.severidad === 'critica').length }): EstadoNotificaciones {
  let e = estadoInicial();
  e = reducir(e, { tipo: 'contador', contador });
  e = reducir(e, { tipo: 'cargada', pestana: 'no-leidas', avisos: noLeidas, total: noLeidas.length, pagina: 1 });
  e = reducir(e, { tipo: 'cargada', pestana: 'todas', avisos: todas, total: todas.length, pagina: 1 });
  return e;
}

describe('aviso nuevo por el canal', () => {
  it('suma al contador y cuenta las críticas aparte', () => {
    let e = estadoInicial();
    e = reducir(e, { tipo: 'aviso', aviso: aviso() });
    e = reducir(e, { tipo: 'aviso', aviso: aviso({ severidad: 'critica' }) });
    expect(e.contador).toEqual({ total: 2, criticas: 1 });
  });

  it('no cuenta dos veces un aviso que ya estaba en una lista cargada', () => {
    const a = aviso();
    let e = conListas([a], [a]);
    e = reducir(e, { tipo: 'aviso', aviso: a });
    expect(e.contador.total).toBe(1);
    expect(e.listas.todas.avisos).toHaveLength(1);
  });

  it('entra al principio de las listas ya cargadas y sube su total', () => {
    const viejo = aviso({ leida: true });
    let e = conListas([], [viejo]);
    const nuevo = aviso();
    e = reducir(e, { tipo: 'aviso', aviso: nuevo });
    expect(e.listas.todas.avisos.map((a) => a.id)).toEqual([nuevo.id, viejo.id]);
    expect(e.listas.todas.total).toBe(2);
    expect(e.listas['no-leidas'].avisos.map((a) => a.id)).toEqual([nuevo.id]);
  });

  it('una lista que todavía no se cargó queda como estaba: se pedirá completa al abrir el panel', () => {
    const e = reducir(estadoInicial(), { tipo: 'aviso', aviso: aviso() });
    expect(e.listas.todas.total).toBeNull();
    expect(e.listas.todas.avisos).toEqual([]);
  });

  it('un crítico dura 6 s y uno normal 4 s', () => {
    let e = estadoInicial();
    e = reducir(e, { tipo: 'aviso', aviso: aviso({ severidad: 'info' }) });
    e = reducir(e, { tipo: 'aviso', aviso: aviso({ severidad: 'critica' }) });
    expect(e.flotantes.map((f) => f.ms)).toEqual([MS_FLOTANTE_CRITICO, MS_FLOTANTE_DISCRETO]);
  });

  it('con el panel abierto solo se anuncian los críticos: los demás ya se ven en la lista', () => {
    let e = reducir(estadoInicial(), { tipo: 'abrir', abierto: true });
    e = reducir(e, { tipo: 'aviso', aviso: aviso({ severidad: 'alerta' }) });
    expect(e.flotantes).toHaveLength(0);
    e = reducir(e, { tipo: 'aviso', aviso: aviso({ severidad: 'critica' }) });
    expect(e.flotantes).toHaveLength(1);
  });

  it('no apila más de tres avisos flotantes: se van los más antiguos', () => {
    let e = estadoInicial();
    const avisos = [1, 2, 3, 4].map(() => aviso());
    for (const a of avisos) e = reducir(e, { tipo: 'aviso', aviso: a });
    expect(e.flotantes.map((f) => f.aviso.id)).toEqual([avisos[3]!.id, avisos[2]!.id, avisos[1]!.id]);
  });

  it('cerrar un flotante quita solo ese', () => {
    let e = estadoInicial();
    const [a, b] = [aviso(), aviso()];
    e = reducir(e, { tipo: 'aviso', aviso: a });
    e = reducir(e, { tipo: 'aviso', aviso: b });
    e = reducir(e, { tipo: 'cerrar-flotante', id: a.id });
    expect(e.flotantes.map((f) => f.aviso.id)).toEqual([b.id]);
  });
});

describe('marcar como leído', () => {
  it('«Marcar leída» saca el aviso de «No leídas», lo deja leído en «Todas» y baja el contador', () => {
    const a = aviso({ severidad: 'critica' });
    const b = aviso();
    let e = conListas([a, b], [a, b]);
    e = reducir(e, { tipo: 'leida', id: a.id, quitar: true });
    expect(e.contador).toEqual({ total: 1, criticas: 0 });
    expect(e.listas['no-leidas'].avisos.map((x) => x.id)).toEqual([b.id]);
    expect(e.listas['no-leidas'].total).toBe(1);
    expect(e.listas.todas.avisos.find((x) => x.id === a.id)?.leida).toBe(true);
  });

  it('abrir el detalle lo marca pero lo deja a la vista en «No leídas»', () => {
    const a = aviso();
    let e = conListas([a], [a]);
    e = reducir(e, { tipo: 'leida', id: a.id, quitar: false });
    expect(e.contador.total).toBe(0);
    expect(e.listas['no-leidas'].avisos).toHaveLength(1);
    expect(e.listas['no-leidas'].avisos[0]?.leida).toBe(true);
  });

  it('marcar dos veces el mismo aviso no baja el contador dos veces', () => {
    const a = aviso();
    const b = aviso();
    let e = conListas([a, b], [a, b]);
    e = reducir(e, { tipo: 'leida', id: a.id, quitar: true });
    e = reducir(e, { tipo: 'leida', id: a.id, quitar: true });
    expect(e.contador.total).toBe(1);
  });

  it('un aviso que ya estaba leído no cambia nada', () => {
    const a = aviso({ leida: true });
    const e = conListas([], [a], { total: 3, criticas: 0 });
    expect(reducir(e, { tipo: 'leida', id: a.id, quitar: true }).contador.total).toBe(3);
  });

  it('el contador no baja de cero', () => {
    const a = aviso();
    const e = conListas([a], [a], { total: 0, criticas: 0 });
    expect(reducir(e, { tipo: 'leida', id: a.id, quitar: true }).contador).toEqual({ total: 0, criticas: 0 });
  });

  it('«Marcar todas leídas» deja el contador en cero, vacía «No leídas» y marca todas', () => {
    const a = aviso();
    const b = aviso({ leida: true });
    let e = conListas([a], [a, b]);
    e = reducir(e, { tipo: 'todas-leidas' });
    expect(e.contador).toEqual({ total: 0, criticas: 0 });
    expect(e.listas['no-leidas'].avisos).toEqual([]);
    expect(e.listas['no-leidas'].total).toBe(0);
    expect(e.listas.todas.avisos.every((x) => x.leida)).toBe(true);
  });
});

describe('carga de la bandeja', () => {
  it('la primera página reemplaza la lista y las siguientes se agregan sin repetir', () => {
    const [a, b, c] = [aviso(), aviso(), aviso()];
    let e = reducir(estadoInicial(), { tipo: 'cargada', pestana: 'todas', avisos: [a, b], total: 3, pagina: 1 });
    e = reducir(e, { tipo: 'cargada', pestana: 'todas', avisos: [b, c], total: 3, pagina: 2 });
    expect(e.listas.todas.avisos.map((x) => x.id)).toEqual([a.id, b.id, c.id]);
    e = reducir(e, { tipo: 'cargada', pestana: 'todas', avisos: [c], total: 1, pagina: 1 });
    expect(e.listas.todas.avisos.map((x) => x.id)).toEqual([c.id]);
  });

  it('un error de carga con la lista vacía queda marcado, y cargar de nuevo lo limpia', () => {
    let e = reducir(estadoInicial(), { tipo: 'error-lista', pestana: 'todas' });
    expect(e.listas.todas.error).toBe(true);
    e = reducir(e, { tipo: 'cargando', pestana: 'todas' });
    expect(e.listas.todas.error).toBe(false);
    expect(e.listas.todas.cargando).toBe(true);
  });
});
