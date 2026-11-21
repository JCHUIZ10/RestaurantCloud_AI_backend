import { describe, expect, it } from 'vitest';
import type { LineaReposicionDTO, PronosticoDTO } from '@/types/prediccion';
import {
  NIVELES,
  agruparPorProveedor,
  cantidadAComprar,
  diaCorto,
  esDiaFuerte,
  formatoCantidad,
  rangoDeSemana,
  textoPrioridad,
  textoProgreso,
  totalesPorDia,
} from './utilidades';

function linea(cambios: Partial<LineaReposicionDTO> = {}): LineaReposicionDTO {
  return {
    id: 'l1', insumo_id: 'i1', insumo: 'Pescado fresco', unidad_medida: 'kg', prioridad: 'urgente', motivo: 'consumo',
    alcanza_dias: 0, consumo_previsto: 45, margen_seguridad: 18, stock_al_calcular: 15, stock_minimo: 5,
    cantidad_sugerida: 49, estado: 'pendiente', cantidad_final: null, decidido_en: null, costo_estimado: 1372,
    proveedor: { id: 'p1', nombre: 'Mercado', precio: 28, ultima_compra: null },
    ...cambios,
  };
}

describe('nombres de los niveles', () => {
  it('usa los nombres culinarios de la decisión N-1', () => {
    expect([0, 1, 2, 3].map((n) => NIVELES[n as 0 | 1 | 2 | 3].nombre)).toEqual([
      'Esperando tus primeras ventas', 'En preparación', 'Casi a punto', 'Al punto',
    ]);
  });
});

describe('textoProgreso', () => {
  it('dice cuántos días faltan en el nivel 1', () => {
    expect(textoProgreso(1, { dias_con_ventas: 12, faltan_para_siguiente: 16 })).toBe(
      'Llevas 12 días de ventas. Faltan 16 días para el siguiente nivel.',
    );
  });

  it('usa el singular con un solo día', () => {
    expect(textoProgreso(1, { dias_con_ventas: 1, faltan_para_siguiente: 1 })).toBe(
      'Llevas 1 día de ventas. Faltan 1 día para el siguiente nivel.',
    );
  });

  it('en el nivel 2 no promete una fecha: depende de preparar el modelo', () => {
    expect(textoProgreso(2, { dias_con_ventas: 40, faltan_para_siguiente: null })).toContain('modelo de tu local');
  });

  it('no dice nada en el nivel 3', () => {
    expect(textoProgreso(3, null)).toBeNull();
  });
});

describe('formatoCantidad', () => {
  it('muestra un decimal en kilos y enteros en unidades contables', () => {
    expect(formatoCantidad(64.3, 'kg')).toBe('64.3 kg');
    expect(formatoCantidad(103, 'botella')).toBe('103 botellas');
    expect(formatoCantidad(1, 'botella')).toBe('1 botella');
  });
});

describe('fechas', () => {
  it('no corre el día por la zona horaria', () => {
    expect(diaCorto('2026-11-21')).toEqual({ dia: 'Sáb', numero: '21' });
  });

  it('arma el rango de la semana', () => {
    expect(rangoDeSemana(['2026-11-21', '2026-11-22', '2026-11-27'])).toBe('del sábado 21 al viernes 27 de noviembre');
  });
});

describe('totalesPorDia', () => {
  const pronostico = {
    predicciones: [
      { producto_id: 'a', nombre: 'A', dias: [{ fecha: '2026-11-22', p50: 5, p90: 8 }, { fecha: '2026-11-21', p50: 10, p90: 14 }] },
      { producto_id: 'b', nombre: 'B', dias: [{ fecha: '2026-11-21', p50: 20, p90: 25 }, { fecha: '2026-11-22', p50: 1, p90: 2 }] },
    ],
  } as unknown as PronosticoDTO;

  it('suma todos los platos por día y los ordena por fecha', () => {
    expect(totalesPorDia(pronostico)).toEqual([
      { fecha: '2026-11-21', p50: 30, p90: 39 },
      { fecha: '2026-11-22', p50: 6, p90: 10 },
    ]);
  });

  it('marca como fuerte el día cerca del mejor de la semana', () => {
    expect(esDiaFuerte(510, 600)).toBe(true);
    expect(esDiaFuerte(400, 600)).toBe(false);
    expect(esDiaFuerte(0, 0)).toBe(false);
  });
});

describe('agruparPorProveedor', () => {
  it('agrupa por proveedor, deja al final los insumos sin proveedor y calcula el subtotal con lo decidido', () => {
    const grupos = agruparPorProveedor([
      linea({ id: '1', insumo: 'Pescado', cantidad_sugerida: 10 }),
      linea({ id: '2', insumo: 'Mariscos', cantidad_sugerida: 4, cantidad_final: 2, estado: 'ajustada', proveedor: { id: 'p1', nombre: 'Mercado', precio: 45, ultima_compra: null } }),
      linea({ id: '3', insumo: 'Sal', proveedor: null, cantidad_sugerida: 1 }),
      linea({ id: '4', insumo: 'Bebida', proveedor: { id: 'p2', nombre: 'Bebidas', precio: 3, ultima_compra: null }, cantidad_sugerida: 12 }),
    ]);

    expect(grupos.map((g) => g.nombre)).toEqual(['Bebidas', 'Mercado', 'Sin proveedor registrado']);
    expect(grupos[1].lineas.map((l) => l.id)).toEqual(['1', '2']);
    // 10 kg × 28 + 2 kg decididos × 45
    expect(grupos[1].subtotal).toBe(370);
  });

  it('ignora lo descartado y lo que no hay que comprar', () => {
    const grupos = agruparPorProveedor([
      linea({ id: '1', estado: 'descartada' }),
      linea({ id: '2', cantidad_sugerida: 0 }),
      linea({ id: '3', cantidad_sugerida: 0, cantidad_final: 3, estado: 'ajustada' }),
    ]);

    expect(grupos[0].lineas.map((l) => l.id)).toEqual(['3']);
  });

  it('la cantidad a comprar es la decidida o, si no, la sugerida', () => {
    expect(cantidadAComprar(linea({ cantidad_final: 7 }))).toBe(7);
    expect(cantidadAComprar(linea())).toBe(49);
  });
});

describe('textoPrioridad', () => {
  it('explica por qué está donde está', () => {
    expect(textoPrioridad(linea({ motivo: 'bajo_minimo', alcanza_dias: null }), 3)).toBe('Ya está por debajo del mínimo');
    expect(textoPrioridad(linea({ stock_al_calcular: 2, stock_minimo: 5 }), 3)).toBe('Ya está por debajo del mínimo');
    expect(textoPrioridad(linea({ alcanza_dias: 0 }), 3)).toBe('No alcanza para el primer día');
    expect(textoPrioridad(linea({ alcanza_dias: 2 }), 5)).toBe('Alcanza solo 2 días');
    expect(textoPrioridad(linea({ alcanza_dias: 7, cantidad_sugerida: 0 }), 3)).toBe('Tienes suficiente');
  });
});
