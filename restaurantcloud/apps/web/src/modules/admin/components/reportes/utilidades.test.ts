import { describe, expect, it } from 'vitest';
import type { DesempenoPersonalDTO, PlatoRankingDTO, RankingProductosDTO, ResumenVentasDTO } from '@/types/reportes';
import {
  GRUPOS,
  ORDEN_GRUPOS,
  calcularEstrellas,
  diasDelRango,
  entero,
  errorDeRango,
  etiquetaRango,
  etiquetaRangoCorta,
  frasePrincipalEquipo,
  frasePrincipalPlatos,
  frasePrincipalVentas,
  ingresoPorGrupo,
  nombreMedioPago,
  nombreTipoComprobante,
  notaDeCategorias,
  periodoAnterior,
  porcentaje,
  rangoDeHoras,
  rangoDePeriodo,
  reglaDeGrupo,
  soles,
  solesCompacto,
  textoDias,
  textoPeriodoAnterior,
  textoUltimaVenta,
} from './utilidades';

describe('periodos', () => {
  const hoy = '2026-11-22';

  it('cada opción toma su rango a partir de la fecha del servidor', () => {
    expect(rangoDePeriodo('hoy', hoy)).toEqual({ desde: '2026-11-22', hasta: '2026-11-22' });
    expect(rangoDePeriodo('ayer', hoy)).toEqual({ desde: '2026-11-21', hasta: '2026-11-21' });
    expect(rangoDePeriodo('siete_dias', hoy)).toEqual({ desde: '2026-11-16', hasta: '2026-11-22' });
    expect(rangoDePeriodo('mes', hoy)).toEqual({ desde: '2026-11-01', hasta: '2026-11-22' });
  });

  it('cruza el cambio de mes y de año sin pasar por UTC', () => {
    expect(rangoDePeriodo('ayer', '2026-12-01')).toEqual({ desde: '2026-11-30', hasta: '2026-11-30' });
    expect(rangoDePeriodo('siete_dias', '2026-03-03')).toEqual({ desde: '2026-02-25', hasta: '2026-03-03' });
    expect(rangoDePeriodo('ayer', '2027-01-01')).toEqual({ desde: '2026-12-31', hasta: '2026-12-31' });
  });

  it('el día 1 «Este mes» es un solo día', () => {
    expect(rangoDePeriodo('mes', '2026-12-01')).toEqual({ desde: '2026-12-01', hasta: '2026-12-01' });
  });

  it('el personalizado usa el rango elegido', () => {
    const elegido = { desde: '2026-09-05', hasta: '2026-09-18' };
    expect(rangoDePeriodo('personalizado', hoy, elegido)).toEqual(elegido);
  });

  it('cuenta los días incluyendo ambos extremos', () => {
    expect(diasDelRango({ desde: '2026-11-01', hasta: '2026-11-20' })).toBe(20);
    expect(diasDelRango({ desde: '2026-11-22', hasta: '2026-11-22' })).toBe(1);
    expect(diasDelRango({ desde: '2028-02-28', hasta: '2028-03-01' })).toBe(3); // año bisiesto
  });

  it('el periodo anterior dura lo mismo y termina el día antes (igual que ms-analítica)', () => {
    expect(periodoAnterior({ desde: '2026-11-01', hasta: '2026-11-20' })).toEqual({ desde: '2026-10-12', hasta: '2026-10-31' });
    expect(periodoAnterior({ desde: '2026-11-22', hasta: '2026-11-22' })).toEqual({ desde: '2026-11-21', hasta: '2026-11-21' });
    expect(periodoAnterior({ desde: '2026-03-01', hasta: '2026-03-07' })).toEqual({ desde: '2026-02-22', hasta: '2026-02-28' });
  });

  describe('errorDeRango', () => {
    it('acepta un rango válido, incluido el máximo de 366 días', () => {
      expect(errorDeRango({ desde: '2026-11-01', hasta: '2026-11-22' }, hoy)).toBeNull();
      expect(errorDeRango({ desde: '2025-11-22', hasta: '2026-11-22' }, hoy)).toBeNull();
    });

    it('rechaza lo que ms-analítica rechazaría, con un mensaje para el usuario', () => {
      expect(errorDeRango({ desde: '', hasta: '2026-11-22' }, hoy)).toBe('Elige la fecha de inicio y la de fin.');
      expect(errorDeRango({ desde: '2026-11-20', hasta: '2026-11-10' }, hoy)).toBe('La fecha de inicio no puede ser posterior a la de fin.');
      expect(errorDeRango({ desde: '2026-11-20', hasta: '2026-11-23' }, hoy)).toBe('La fecha de fin no puede ser futura.');
      expect(errorDeRango({ desde: '2025-11-21', hasta: '2026-11-22' }, hoy)).toBe('El periodo puede abarcar hasta 366 días.');
    });
  });

  it('escribe los rangos como se leen', () => {
    expect(etiquetaRango({ desde: '2026-11-20', hasta: '2026-11-20' })).toBe('20 nov 2026');
    expect(etiquetaRango({ desde: '2026-11-01', hasta: '2026-11-20' })).toBe('1 – 20 nov 2026');
    expect(etiquetaRango({ desde: '2026-10-28', hasta: '2026-11-03' })).toBe('28 oct – 3 nov 2026');
    expect(etiquetaRango({ desde: '2025-12-28', hasta: '2026-01-03' })).toBe('28 dic 2025 – 3 ene 2026');
    expect(etiquetaRangoCorta({ desde: '2026-11-01', hasta: '2026-11-20' })).toBe('1 – 20 nov');
  });

  it('concuerda en singular y plural', () => {
    expect(textoDias(1)).toBe('1 día');
    expect(textoDias(20)).toBe('20 días');
    expect(textoPeriodoAnterior(1)).toBe('el día anterior');
    expect(textoPeriodoAnterior(7)).toBe('los 7 días anteriores');
  });
});

describe('formatos', () => {
  it('usa el formato de Perú', () => {
    expect(entero(1115)).toBe('1,115');
    expect(soles(257578)).toBe('S/ 257,578');
    expect(soles(231.01, 2)).toBe('S/ 231.01');
    expect(porcentaje(15.7)).toBe('15.7 %');
    expect(solesCompacto(257578)).toBe('S/ 257.6 mil');
    expect(solesCompacto(950)).toBe('S/ 950');
  });

  it('da nombre legible a los medios de pago y comprobantes, incluso a los que no conoce', () => {
    expect(nombreMedioPago('billetera_digital')).toBe('Billetera digital');
    expect(nombreMedioPago('yape_plin')).toBe('Yape plin');
    expect(nombreTipoComprobante('nota_venta')).toBe('Nota de venta');
    expect(nombreTipoComprobante('ticket')).toBe('Ticket');
  });
});

describe('rangoDeHoras', () => {
  const franjas = (conVentas: number[]) => Array.from({ length: 24 }, (_, hora) => ({ hora, total: conVentas.includes(hora) ? 100 : 0 }));

  it('dibuja desde una hora antes de la primera venta hasta una después de la última', () => {
    expect(rangoDeHoras(franjas([12, 14, 22]))).toEqual([11, 23]);
    expect(rangoDeHoras(franjas([13, 14]))).toEqual([12, 15]);
  });

  it('no se sale del día', () => {
    expect(rangoDeHoras(franjas([0]))).toEqual([0, 1]);
    expect(rangoDeHoras(franjas([23]))).toEqual([22, 23]);
  });

  it('sin ventas muestra el día completo', () => {
    expect(rangoDeHoras(franjas([]))).toEqual([0, 23]);
  });
});

describe('grupos del menú', () => {
  const umbrales = { popularidad_pct: 3.5, margen_unitario: 17.38 };

  it('los nombres dicen qué hacer y no chocan con las estrellas', () => {
    expect(ORDEN_GRUPOS.map((g) => GRUPOS[g].nombre)).toEqual(['Imprescindibles', 'Populares', 'Por impulsar', 'Por revisar']);
    expect(Object.values(GRUPOS).some((g) => /estrella/i.test(g.nombre))).toBe(false);
  });

  it('cada regla usa los umbrales reales de la carta', () => {
    expect(reglaDeGrupo('estrella', umbrales)).toBe('3.5 % o más de las unidades y S/ 17.38 o más por plato');
    expect(reglaDeGrupo('caballito', umbrales)).toBe('3.5 % o más de las unidades y menos de S/ 17.38 por plato');
    expect(reglaDeGrupo('puzle', umbrales)).toBe('Menos de 3.5 % de las unidades y S/ 17.38 o más por plato');
    expect(reglaDeGrupo('rezagado', umbrales)).toBe('Menos de 3.5 % de las unidades y menos de S/ 17.38 por plato');
  });
});

function plato(n: number, cambios: Partial<PlatoRankingDTO> = {}): PlatoRankingDTO {
  return {
    producto_id: `p${n}`,
    nombre: `Plato ${String(n).padStart(2, '0')}`,
    categoria_nombre: 'Fondos',
    unidades: 100 - n,
    ingreso: 1000 - n * 10,
    participacion_pct: 5,
    costo: 400,
    margen: n,
    margen_unitario: 10,
    clasificacion: 'estrella',
    ...cambios,
  };
}

describe('calcularEstrellas', () => {
  it('reparte los platos en cinco tramos iguales por lo que dejan en total', () => {
    const platos = Array.from({ length: 20 }, (_, i) => plato(i + 1)); // el plato 20 es el que más deja
    const estrellas = calcularEstrellas(platos);

    expect(estrellas.get('p20')).toBe(5);
    expect(estrellas.get('p17')).toBe(5);
    expect(estrellas.get('p16')).toBe(4);
    expect(estrellas.get('p9')).toBe(3);
    expect(estrellas.get('p5')).toBe(2);
    expect(estrellas.get('p4')).toBe(1);
    expect(estrellas.get('p1')).toBe(1);
    for (let n = 1; n <= 5; n++) expect([...estrellas.values()].filter((v) => v === n)).toHaveLength(4);
  });

  it('los platos sin costo no se califican ni cuentan para repartir los tramos', () => {
    const conCosto = Array.from({ length: 20 }, (_, i) => plato(i + 1));
    const sinCosto = [plato(21, { margen: null, costo: null, margen_unitario: null, clasificacion: null })];
    const estrellas = calcularEstrellas([...conCosto, ...sinCosto]);

    expect(estrellas.has('p21')).toBe(false);
    expect(estrellas.size).toBe(20);
    for (let n = 1; n <= 5; n++) expect([...estrellas.values()].filter((v) => v === n)).toHaveLength(4);
  });

  it('con menos de 5 platos con costo no califica a ninguno', () => {
    expect(calcularEstrellas([plato(1), plato(2), plato(3), plato(4)]).size).toBe(0);
    expect(calcularEstrellas([plato(1)]).size).toBe(0);
  });

  it('con una cantidad que no se divide en cinco, el mejor tiene 5, el peor 1 y nunca sube al bajar', () => {
    const platos = Array.from({ length: 7 }, (_, i) => plato(i + 1));
    const estrellas = calcularEstrellas(platos);
    const porMargen = [...platos].sort((a, b) => (b.margen ?? 0) - (a.margen ?? 0)).map((p) => estrellas.get(p.producto_id)!);

    expect(porMargen[0]).toBe(5);
    expect(porMargen[6]).toBe(1);
    expect(porMargen.every((v, i) => i === 0 || v <= porMargen[i - 1])).toBe(true);
  });

  it('ante un empate decide por nombre, siempre igual', () => {
    const platos = ['e', 'c', 'a', 'd', 'b'].map((letra, i) => plato(i + 1, { nombre: `Plato ${letra}`, margen: 100 }));
    const estrellas = calcularEstrellas(platos);
    const porNombre = [...platos].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((p) => estrellas.get(p.producto_id));

    expect(porNombre).toEqual([5, 4, 3, 2, 1]);
  });
});

function resumen(cambios: Partial<ResumenVentasDTO> = {}, comprobantes = 1115): ResumenVentasDTO {
  const base = {
    ventas_total: 257578, comprobantes, dias_con_ventas: 20, comprobantes_por_dia: 55.8, ticket_promedio: 231.01, comensales: 3510,
    ticket_por_comensal: 73.38, descuentos: 0, anulados: { comprobantes: 1, total: 76 }, por_medio_pago: [], por_tipo: [],
  };
  return {
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-20', actual: base,
    anterior: { ...base, desde: '2026-10-12', hasta: '2026-10-31' },
    variacion_pct: { ventas_total: 15.7, comprobantes: 6.7, ticket_promedio: 8.4, ticket_por_comensal: 4.2 },
    ultimo_evento_en: '2026-11-21T15:20:38-05:00',
    ...cambios,
  };
}

describe('frasePrincipalVentas', () => {
  it('compara con el periodo anterior, diciendo cuántos días eran', () => {
    expect(frasePrincipalVentas(resumen(), true)).toBe('Vendiste 15.7 % más que en los 20 días anteriores. Hubo 6.7 % más cuentas y el ticket promedio subió 8.4 %.');
  });

  it('cuando baja, lo dice con las palabras contrarias', () => {
    const baja = resumen({ variacion_pct: { ventas_total: -3.2, comprobantes: -1, ticket_promedio: -2.2, ticket_por_comensal: null } });
    expect(frasePrincipalVentas(baja, true)).toBe('Vendiste 3.2 % menos que en los 20 días anteriores. Hubo 1.0 % menos cuentas y el ticket promedio bajó 2.2 %.');
  });

  it('si no cambió, dice que vendió lo mismo', () => {
    const igual = resumen({ variacion_pct: { ventas_total: 0, comprobantes: 0, ticket_promedio: 0, ticket_por_comensal: 0 } });
    expect(frasePrincipalVentas(igual, true)).toBe('Vendiste lo mismo que en los 20 días anteriores.');
  });

  it('sin comparar, o sin base para compararla, resume solo el periodo', () => {
    const sola = 'Vendiste S/ 257,578 en 1,115 cuentas, con un ticket promedio de S/ 231.01.';
    expect(frasePrincipalVentas(resumen(), false)).toBe(sola);
    expect(frasePrincipalVentas(resumen({ variacion_pct: { ventas_total: null, comprobantes: null, ticket_promedio: null, ticket_por_comensal: null } }), true)).toBe(sola);
    expect(frasePrincipalVentas(resumen({ anterior: null, variacion_pct: null }), true)).toBe(sola);
  });

  it('sin ventas lo dice', () => {
    expect(frasePrincipalVentas(resumen({}, 0), true)).toBe('No hubo ventas en este periodo.');
  });
});

describe('frasePrincipalPlatos', () => {
  const ranking = (productos: PlatoRankingDTO[]): RankingProductosDTO => ({
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-20', productos, umbrales: { popularidad_pct: 3.5, margen_unitario: 17.38 }, por_categoria: [], sin_costo: 0,
  });

  it('dice cuánto traen los imprescindibles y cuánto aportan los que hay que revisar', () => {
    const datos = ranking([
      plato(1, { ingreso: 100 }),
      plato(2, { ingreso: 100 }),
      plato(3, { ingreso: 100 }),
      plato(4, { ingreso: 100, clasificacion: 'rezagado' }),
      plato(5, { ingreso: 0, clasificacion: 'rezagado' }),
    ]);
    expect(frasePrincipalPlatos(datos)).toBe(
      'Tus 3 platos imprescindibles traen el 75 % de los ingresos. Los 2 platos por revisar solo aportan el 25 %: son candidatos a renovar en la carta.'
    );
  });

  it('concuerda cuando hay un solo plato en el grupo', () => {
    const datos = ranking([plato(1, { ingreso: 90 }), plato(2, { ingreso: 10, clasificacion: 'rezagado' })]);
    expect(frasePrincipalPlatos(datos)).toBe('Tu plato imprescindible trae el 90 % de los ingresos. El plato por revisar solo aporta el 10 %: es candidato a renovar en la carta.');
  });

  it('avisa si ningún plato se pide mucho y deja buen margen', () => {
    expect(frasePrincipalPlatos(ranking([plato(1, { clasificacion: 'caballito' })]))).toMatch(/Ningún plato se pide mucho y deja buen margen/);
  });

  it('sin platos clasificados no hay frase', () => {
    expect(frasePrincipalPlatos(ranking([plato(1, { clasificacion: null, margen: null })]))).toBeNull();
  });

  it('suma los platos y los ingresos de cada grupo', () => {
    const grupos = ingresoPorGrupo([plato(1, { ingreso: 50 }), plato(2, { ingreso: 30 }), plato(3, { ingreso: 20, clasificacion: 'puzle' })]);
    expect(grupos.estrella).toEqual({ platos: 2, ingreso: 80 });
    expect(grupos.puzle).toEqual({ platos: 1, ingreso: 20 });
    expect(grupos.rezagado).toEqual({ platos: 0, ingreso: 0 });
  });
});

describe('notaDeCategorias', () => {
  it('destaca la categoría que pesa más en unidades que en ingresos', () => {
    const nota = notaDeCategorias([
      { categoria_nombre: 'Fondos', unidades: 3154, ingreso: 139276, participacion_pct: 54.1 },
      { categoria_nombre: 'Entradas', unidades: 2151, ingreso: 71448, participacion_pct: 27.7 },
      { categoria_nombre: 'Bebidas', unidades: 3074, ingreso: 35586, participacion_pct: 13.8 },
      { categoria_nombre: 'Postres', unidades: 729, ingreso: 11268, participacion_pct: 4.4 },
    ]);
    expect(nota).toBe('Bebidas: 34 % de las unidades vendidas, pero solo 14 % de los ingresos.');
  });

  it('si ninguna se destaca, no dice nada', () => {
    expect(notaDeCategorias([{ categoria_nombre: 'A', unidades: 50, ingreso: 500, participacion_pct: 50 }, { categoria_nombre: 'B', unidades: 50, ingreso: 500, participacion_pct: 50 }])).toBeNull();
    expect(notaDeCategorias([])).toBeNull();
  });
});

describe('frasePrincipalEquipo', () => {
  const mozo = (nombre: string, ventas: number, ticket: number | null) => ({
    mozo_id: nombre, mozo_nombre: nombre, comprobantes: 100, ventas_total: ventas, ticket_promedio: ticket, comensales: 300, comprobantes_anulados: 0,
    anulaciones: { cantidad: 0, monto: 0, mermas: 0, costo_merma: 0 },
  });
  const equipo = (mozos: ReturnType<typeof mozo>[]): DesempenoPersonalDTO => ({
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-20', mozos,
    totales: { comprobantes: 300, ventas_total: mozos.reduce((s, m) => s + m.ventas_total, 0), anulaciones: { cantidad: 0, monto: 0, mermas: 0, costo_merma: 0 } },
  });

  it('dice quién lidera y que el equipo vende parejo si los tickets son parecidos', () => {
    const datos = equipo([mozo('Diego Salas', 92138, 235.65), mozo('Carlos Huamán', 83873, 228.54), mozo('Ana Ríos', 81567, 228.48)]);
    expect(frasePrincipalEquipo(datos, 231.01)).toBe('Diego Salas lidera con el 35.8 % de las ventas. Todos están a menos del 3 % del ticket promedio de la sede, así que el equipo vende parejo.');
  });

  it('si los tickets se separan, dice cuánto', () => {
    const datos = equipo([mozo('Diego', 600, 300), mozo('Ana', 400, 200)]);
    expect(frasePrincipalEquipo(datos, 250)).toBe('Diego lidera con el 60.0 % de las ventas. Sus tickets se separan hasta un 20 % del promedio de la sede.');
  });

  it('con un solo mozo, o sin ticket de la sede, no inventa comparaciones', () => {
    expect(frasePrincipalEquipo(equipo([mozo('Diego', 600, 300)]), 250)).toBe('Diego atendió todas las ventas del periodo.');
    expect(frasePrincipalEquipo(equipo([mozo('Diego', 600, 300), mozo('Ana', 400, 200)]), null)).toBe('Diego lidera con el 60.0 % de las ventas.');
  });

  it('sin mozos o sin ventas no hay frase', () => {
    expect(frasePrincipalEquipo(equipo([]), 250)).toBeNull();
    expect(frasePrincipalEquipo(equipo([mozo('Diego', 0, null)]), 250)).toBeNull();
  });
});

describe('textoUltimaVenta', () => {
  it('dice cuándo llegó la última venta', () => {
    expect(textoUltimaVenta('2026-11-22T09:05:00-05:00', '2026-11-22')).toBe('Última venta recibida hoy a las 09:05');
    expect(textoUltimaVenta('2026-11-21T15:20:38-05:00', '2026-11-22')).toBe('Última venta recibida el 21 nov a las 15:20');
    expect(textoUltimaVenta('2025-12-05T22:10:00-05:00', '2026-11-22')).toBe('Última venta recibida el 5 dic 2025 a las 22:10');
  });

  it('si nunca llegó una venta, lo dice', () => {
    expect(textoUltimaVenta(null, '2026-11-22')).toBe('Aún no llegan ventas de esta sede');
  });
});
