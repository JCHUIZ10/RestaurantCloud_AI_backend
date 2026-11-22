import { describe, expect, it } from 'vitest';
import { detalleDeAviso, haceCuanto, horaDeIso } from './formato';

describe('haceCuanto', () => {
  const ahora = Date.parse('2026-11-22T12:00:00-05:00');

  it.each([
    ['2026-11-22T11:59:40-05:00', 'Ahora'],
    ['2026-11-22T11:59:00-05:00', 'Hace 1 min'],
    ['2026-11-22T11:15:00-05:00', 'Hace 45 min'],
    ['2026-11-22T10:00:00-05:00', 'Hace 2 h'],
    ['2026-11-21T09:00:00-05:00', 'Hace 1 d'],
  ])('%s → %s', (creada, esperado) => {
    expect(haceCuanto(creada, ahora)).toBe(esperado);
  });

  it('un aviso con la hora del servidor un poco adelantada no da un tiempo negativo', () => {
    expect(haceCuanto('2026-11-22T12:00:30-05:00', ahora)).toBe('Ahora');
  });

  it('una fecha ilegible no rompe el panel', () => {
    expect(haceCuanto('no es una fecha', ahora)).toBe('');
  });
});

describe('horaDeIso', () => {
  it('toma la hora tal como la escribió el servidor, sin pasar por la zona del dispositivo', () => {
    expect(horaDeIso('2026-11-22T21:40:11-05:00')).toBe('21:40');
    expect(horaDeIso('2026-11-22T02:05:00+09:00')).toBe('02:05');
  });

  it('devuelve null si no hay hora', () => {
    expect(horaDeIso(undefined)).toBeNull();
    expect(horaDeIso('2026-11-22')).toBeNull();
    expect(horaDeIso(42)).toBeNull();
  });
});

const filas = (tipo: string, datos: Record<string, unknown>) => Object.fromEntries(detalleDeAviso({ tipo, datos }));

describe('detalleDeAviso', () => {
  it('cierre de caja con faltante: turno, montos, diferencia y cierre forzado', () => {
    const f = filas('caja.cerrada', {
      turno_correlativo: 14,
      cajero_nombre: 'Ana Torres',
      efectivo_esperado: 1250,
      efectivo_contado: 1120,
      discrepancia: -130,
      cierre_forzado: true,
      cerrado_por_nombre: 'Marcos López',
      fecha: '2026-11-22T21:40:11-05:00',
    });
    expect(f['Turno']).toBe('#014');
    expect(f['Cajero']).toBe('Ana Torres');
    expect(f['Esperado']).toMatch(/1,?250\.00/);
    expect(f['Diferencia']).toMatch(/^Faltante de .*130\.00/);
    expect(f['Cierre']).toBe('Forzado por Marcos López');
    expect(f['Hora']).toBe('21:40');
  });

  it('un sobrante se llama sobrante y un cierre normal no dice «forzado»', () => {
    const f = filas('caja.cerrada', { turno_correlativo: 3, discrepancia: 12.5, cierre_forzado: false });
    expect(f['Diferencia']).toMatch(/^Sobrante de .*12\.50/);
    expect(f['Cierre']).toBeUndefined();
  });

  it('plato anulado: plato con cantidad, alcance, monto y motivo legible', () => {
    const f = filas('pedido.anulado', {
      producto_nombre: 'Lomo saltado',
      cantidad: 1,
      monto_total: 38,
      tipo_anulacion: 'item_individual',
      motivo_categoria: 'demora_cliente',
      es_merma: true,
      mozo_nombre: 'Lucía Paredes',
      anulado_por_nombre: 'Carlos Ríos',
      anulado_en: '2026-11-22T13:05:00-05:00',
    });
    expect(f['Plato']).toBe('1 × Lomo saltado');
    expect(f['Alcance']).toBe('Un plato');
    expect(f['Motivo']).toBe('Demora para el cliente');
    expect(f['Ya preparado']).toBe('Sí, se descarta');
    expect(f['Hora']).toBe('13:05');
  });

  it('un motivo que no está en la lista se muestra legible, no con guiones bajos', () => {
    expect(filas('pedido.anulado', { motivo_categoria: 'retiro_sin_consumo' })['Motivo']).toBe('retiro sin consumo');
  });

  it('plato listo: junta los platos de la comanda', () => {
    const f = filas('plato.listo', {
      mesa_numero: '4',
      items: [
        { producto_nombre: 'Lomo saltado', cantidad: 2 },
        { producto_nombre: 'Ají de gallina', cantidad: 1 },
      ],
      fecha: '2026-11-22T13:42:00-05:00',
    });
    expect(f['Platos']).toBe('2 × Lomo saltado · 1 × Ají de gallina');
    expect(f['Listo a las']).toBe('13:42');
  });

  it('sustitución: antes y ahora', () => {
    const f = filas('pedido.item_sustituido', {
      mesa_numero: '4',
      producto_original_nombre: 'Ceviche clásico',
      producto_nuevo_nombre: 'Tiradito de pescado',
      cantidad: 1,
    });
    expect(f).toMatchObject({ Mesa: '4', Antes: 'Ceviche clásico', Ahora: '1 × Tiradito de pescado' });
  });

  it('solo muestra los campos presentes', () => {
    expect(detalleDeAviso({ tipo: 'producto.agotado', datos: { producto_nombre: 'Ceviche clásico', motivo: null } })).toEqual([
      ['Plato', 'Ceviche clásico'],
    ]);
  });

  it('un tipo desconocido, o datos vacíos, no tienen detalle: el mensaje ya lo dice todo', () => {
    expect(detalleDeAviso({ tipo: 'algo.nuevo', datos: { x: 1 } })).toEqual([]);
    expect(detalleDeAviso({ tipo: 'plato.listo', datos: {} })).toEqual([]);
  });

  it('datos con tipos inesperados no rompen el panel', () => {
    expect(() => detalleDeAviso({ tipo: 'plato.listo', datos: { items: 'x', mesa_numero: 4 } })).not.toThrow();
    expect(() => detalleDeAviso({ tipo: 'caja.cerrada', datos: { discrepancia: 'mucho' } })).not.toThrow();
  });
});
