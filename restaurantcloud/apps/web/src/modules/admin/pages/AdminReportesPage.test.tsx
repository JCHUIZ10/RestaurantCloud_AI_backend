import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type {
  ClasificacionMenu,
  DesempenoPersonalDTO,
  IndicadoresDTO,
  PlatoRankingDTO,
  RankingProductosDTO,
  ResumenVentasDTO,
  VentasPorHoraDTO,
} from '@/types/reportes';

const servicio = vi.hoisted(() => ({ resumen: vi.fn(), porHora: vi.fn(), ranking: vi.fn(), desempeno: vi.fn() }));
const jwt = vi.hoisted(() => ({ obtenerJwt: vi.fn(), modulosDelJwt: vi.fn() }));

vi.mock('@/services/serviceAdapter', () => ({ reportesService: servicio }));
vi.mock('@/services/api/jwtServicios', () => jwt);
vi.mock('@/shared/utils/fechaServidor', () => ({ hoyServidorStr: () => '2026-11-22', registrarMarcaServidor: () => undefined }));
// Sin tamaño real en jsdom, los gráficos se dibujan a un tamaño fijo para comprobar que no fallan
vi.mock('recharts', async (importOriginal) => {
  const real = await importOriginal<typeof import('recharts')>();
  return {
    ...real,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => React.cloneElement(children, { width: 800, height: 400 }),
  };
});

import { ROUTES } from '@/router/routes.constants';
import { AdminReportesPage } from './AdminReportesPage';

/* ---------------------------------------------------------------- Datos */

function indicadores(cambios: Partial<IndicadoresDTO> = {}): IndicadoresDTO {
  return {
    ventas_total: 257578, comprobantes: 1115, dias_con_ventas: 20, comprobantes_por_dia: 55.8, ticket_promedio: 231.01, comensales: 3510,
    ticket_por_comensal: 73.38, descuentos: 0, anulados: { comprobantes: 1, total: 76 },
    por_medio_pago: [
      { medio_pago: 'tarjeta', comprobantes: 470, total: 110829, porcentaje: 43 },
      { medio_pago: 'efectivo', comprobantes: 427, total: 97026, porcentaje: 37.7 },
      { medio_pago: 'billetera_digital', comprobantes: 218, total: 49723, porcentaje: 19.3 },
    ],
    por_tipo: [
      { tipo: 'boleta', comprobantes: 922, total: 212360 },
      { tipo: 'factura', comprobantes: 147, total: 34308 },
    ],
    ...cambios,
  };
}

function resumen(cambios: Partial<ResumenVentasDTO> = {}): ResumenVentasDTO {
  return {
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-22', actual: indicadores(),
    anterior: { ...indicadores({ ventas_total: 222618, comprobantes: 1045 }), desde: '2026-10-10', hasta: '2026-10-31' },
    variacion_pct: { ventas_total: 15.7, comprobantes: 6.7, ticket_promedio: 8.4, ticket_por_comensal: 4.2 },
    ultimo_evento_en: '2026-11-21T15:20:38-05:00',
    ...cambios,
  };
}

const sinVentas = (): ResumenVentasDTO => resumen({ actual: indicadores({ comprobantes: 0, ventas_total: 0, ticket_promedio: null, por_medio_pago: [], por_tipo: [] }), anterior: null, variacion_pct: null });

function horas(): VentasPorHoraDTO {
  const ventas: Record<number, number> = { 12: 22388, 13: 46918, 14: 47238, 19: 29496, 20: 33231 };
  return {
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-22', dias_con_ventas: 20,
    franjas: Array.from({ length: 24 }, (_, hora) => ({ hora, comprobantes: ventas[hora] ? 100 : 0, total: ventas[hora] ?? 0, promedio_por_dia: (ventas[hora] ?? 0) / 20 })),
    hora_punta: { hora: 14, total: 47238 },
  };
}

const GRUPOS_DE_PRUEBA: ClasificacionMenu[] = ['estrella', 'estrella', 'estrella', 'estrella', 'estrella', 'estrella', 'estrella', 'caballito', 'caballito', 'caballito', 'caballito', 'caballito', 'puzle', 'puzle', 'rezagado', 'rezagado', 'rezagado', 'rezagado', 'rezagado', 'rezagado'];

/** 20 platos: el 1 es el que más vende y el que más deja. */
function ranking(): RankingProductosDTO {
  const productos: PlatoRankingDTO[] = GRUPOS_DE_PRUEBA.map((clasificacion, i) => ({
    producto_id: `p${i + 1}`, nombre: `Plato ${i + 1}`, categoria_nombre: i % 2 ? 'Entradas' : 'Fondos', unidades: 800 - i * 30, ingreso: 30000 - i * 1200,
    participacion_pct: 8 - i * 0.3, costo: 10000, margen: 20000 - i * 900, margen_unitario: 30 - i, clasificacion,
  }));
  return {
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-22', productos, umbrales: { popularidad_pct: 3.5, margen_unitario: 17.38 }, sin_costo: 0,
    por_categoria: [
      { categoria_nombre: 'Fondos', unidades: 3154, ingreso: 139276, participacion_pct: 54.1 },
      { categoria_nombre: 'Bebidas', unidades: 3074, ingreso: 35586, participacion_pct: 13.8 },
    ],
  };
}

const sinAnulaciones = { cantidad: 0, monto: 0, mermas: 0, costo_merma: 0 };
function equipo(): DesempenoPersonalDTO {
  return {
    local_id: 'l1', desde: '2026-11-01', hasta: '2026-11-22',
    mozos: [
      { mozo_id: 'm1', mozo_nombre: 'Diego Salas', comprobantes: 391, ventas_total: 92138, ticket_promedio: 235.65, comensales: 1248, comprobantes_anulados: 0, anulaciones: sinAnulaciones },
      { mozo_id: 'm2', mozo_nombre: 'Carlos Huamán', comprobantes: 367, ventas_total: 83873, ticket_promedio: 228.54, comensales: 1151, comprobantes_anulados: 1, anulaciones: sinAnulaciones },
      { mozo_id: 'm3', mozo_nombre: 'Ana Ríos', comprobantes: 357, ventas_total: 81567, ticket_promedio: 228.48, comensales: 1111, comprobantes_anulados: 0, anulaciones: sinAnulaciones },
    ],
    totales: { comprobantes: 1115, ventas_total: 257578, anulaciones: sinAnulaciones },
  };
}

const ok = <T,>(datos: T) => ({ exito: true, datos });
const falla = (codigo: string, mensaje: string) => ({ exito: false, datos: null, errores: [{ codigo, mensaje }] });

/* ---------------------------------------------------------------- Montaje */

function Ubicacion() {
  return <pre data-testid="ubicacion">{useLocation().search}</pre>;
}

function montar(ruta = '/admin/reportes/ventas') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route
          path={ROUTES.ADMIN_REPORTES_VENTAS}
          element={
            <>
              <AdminReportesPage />
              <Ubicacion />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

const mes = { desde: '2026-11-01', hasta: '2026-11-22' };

beforeEach(() => {
  vi.clearAllMocks();
  servicio.resumen.mockResolvedValue(ok(resumen()));
  servicio.porHora.mockResolvedValue(ok(horas()));
  servicio.ranking.mockResolvedValue(ok(ranking()));
  servicio.desempeno.mockResolvedValue(ok(equipo()));
  jwt.obtenerJwt.mockResolvedValue('jwt');
  jwt.modulosDelJwt.mockReturnValue(['prediccion', 'reportes_avanzados']);
});

/* ---------------------------------------------------------------- Ventas */

describe('pestaña Ventas', () => {
  it('pide el mes en curso con comparación y muestra el resumen', async () => {
    montar();

    expect(await screen.findByText('Vendiste 15.7 % más que en los 22 días anteriores. Hubo 6.7 % más cuentas y el ticket promedio subió 8.4 %.')).toBeInTheDocument();
    expect(servicio.resumen).toHaveBeenCalledWith(mes, true);
    expect(servicio.porHora).toHaveBeenCalledWith(mes);
    expect(screen.getAllByText('257,578').length).toBeGreaterThan(0);
    expect(screen.getByText('Cuentas cobradas')).toBeInTheDocument();
    expect(screen.getByText('Cómo pagan tus clientes')).toBeInTheDocument();
    expect(screen.getByText('Última venta recibida el 21 nov a las 15:20')).toBeInTheDocument();
    expect(screen.getByText(/La hora punta es a las/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Ventas promedio por hora del día/ })).toBeInTheDocument();
  });

  it('el comparador muestra desde qué día hasta qué día se compara y cuántos días son', async () => {
    montar();
    await screen.findByText('Cuentas cobradas');

    const interruptor = screen.getByRole('switch', { name: 'Comparar con el periodo anterior' });
    expect(interruptor).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('10 oct 2026')).toBeInTheDocument();
    expect(screen.getByText('31 oct 2026')).toBeInTheDocument();
    expect(screen.getAllByText('22 días').length).toBeGreaterThan(0);
  });

  it('apagar la comparación esconde las fechas y pide el resumen sin comparar', async () => {
    montar();
    await screen.findByText('Cuentas cobradas');

    await userEvent.click(screen.getByRole('switch', { name: 'Comparar con el periodo anterior' }));

    expect(screen.queryByText('10 oct 2026')).not.toBeInTheDocument();
    await waitFor(() => expect(servicio.resumen).toHaveBeenLastCalledWith(mes, false));
    expect(await screen.findByText('Vendiste S/ 257,578 en 1,115 cuentas, con un ticket promedio de S/ 231.01.')).toBeInTheDocument();
  });

  it('al cambiar de periodo pide el nuevo rango y recalcula el periodo anterior', async () => {
    montar();
    await screen.findByText('Cuentas cobradas');

    await userEvent.click(screen.getByRole('button', { name: 'Últimos 7 días' }));

    await waitFor(() => expect(servicio.resumen).toHaveBeenLastCalledWith({ desde: '2026-11-16', hasta: '2026-11-22' }, true));
    expect(screen.getByText('9 nov 2026')).toBeInTheDocument();
    expect(screen.getByText('15 nov 2026')).toBeInTheDocument();
    expect(servicio.porHora).toHaveBeenLastCalledWith({ desde: '2026-11-16', hasta: '2026-11-22' });
  });

  it('un periodo personalizado inválido avisa y no consulta', async () => {
    montar();
    await screen.findByText('Cuentas cobradas');
    await userEvent.click(screen.getByRole('button', { name: 'Personalizado' }));
    const consultasAntes = servicio.resumen.mock.calls.length;

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-25' } });

    expect(await screen.findAllByText('La fecha de inicio no puede ser posterior a la de fin.')).not.toHaveLength(0);
    expect(screen.getByText('Elige un periodo válido', { selector: 'h3' })).toBeInTheDocument();
    expect(servicio.resumen).toHaveBeenCalledTimes(consultasAntes);
  });

  it('un periodo personalizado válido pide ese rango', async () => {
    montar();
    await screen.findByText('Cuentas cobradas');
    await userEvent.click(screen.getByRole('button', { name: 'Personalizado' }));

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-15' } });

    await waitFor(() => expect(servicio.resumen).toHaveBeenLastCalledWith({ desde: '2026-10-01', hasta: '2026-10-15' }, true));
    expect(screen.getByText('16 sep 2026')).toBeInTheDocument(); // el periodo anterior: 15 días que terminan el 30 de septiembre
    expect(screen.getByText('30 sep 2026')).toBeInTheDocument();
  });

  it('si no hubo ventas lo dice y ofrece un periodo más amplio', async () => {
    servicio.resumen.mockResolvedValue(ok(sinVentas()));
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }));

    expect(await screen.findByText('Todavía no hay ventas en este periodo')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver últimos 7 días' }));

    await waitFor(() => expect(servicio.resumen).toHaveBeenLastCalledWith({ desde: '2026-11-16', hasta: '2026-11-22' }, true));
  });

  it('si el servicio falla muestra el motivo y se puede reintentar', async () => {
    servicio.resumen.mockRejectedValueOnce(new Error('boom'));
    montar();

    expect(await screen.findByText('No pudimos cargar los reportes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(await screen.findByText('Cuentas cobradas')).toBeInTheDocument();
    expect(servicio.resumen).toHaveBeenCalledTimes(2);
  });

  it('muestra el error que devuelve el servicio', async () => {
    servicio.resumen.mockResolvedValueOnce(falla('ERR_SEDE_REQUERIDA', 'Elige una sede para ver sus reportes.'));
    montar();

    expect(await screen.findByText('Elige una sede para ver sus reportes.')).toBeInTheDocument();
  });

  it('no deja pasar una respuesta vieja: gana la del último periodo elegido', async () => {
    let soltarMes!: (valor: unknown) => void;
    servicio.resumen.mockImplementationOnce(() => new Promise((resolver) => (soltarMes = resolver)));
    montar();
    await userEvent.click(screen.getByRole('button', { name: 'Últimos 7 días' }));
    expect(await screen.findByText('Cuentas cobradas')).toBeInTheDocument();

    soltarMes(ok(sinVentas())); // llega tarde la del mes, que ya no se ve
    await new Promise((r) => setTimeout(r, 20));

    expect(screen.getByText('Cuentas cobradas')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no hay ventas en este periodo')).not.toBeInTheDocument();
  });
});

/* ---------------------------------------------------------------- Platos */

describe('pestaña Platos', () => {
  async function abrirPlatos() {
    montar();
    await screen.findByText('Cuentas cobradas');
    await userEvent.click(screen.getByRole('button', { name: /Platos/ }));
    await screen.findByText('Ranking de platos');
  }

  it('muestra los grupos con su nombre nuevo y la regla con los umbrales reales', async () => {
    await abrirPlatos();

    expect(servicio.ranking).toHaveBeenCalledWith(mes);
    for (const nombre of ['Imprescindibles', 'Populares', 'Por impulsar', 'Por revisar']) {
      expect(screen.getByRole('heading', { name: nombre })).toBeInTheDocument();
    }
    expect(screen.queryByRole('heading', { name: /Estrellas|Caballitos|Puzles|Rezagados/ })).not.toBeInTheDocument();
    expect(screen.getByText('3.5 % o más de las unidades y S/ 17.38 o más por plato')).toBeInTheDocument();
    expect(screen.getByText('Menos de 3.5 % de las unidades y menos de S/ 17.38 por plato')).toBeInTheDocument();
    expect(screen.getByText('Tus 7 platos imprescindibles', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Bebidas: 49 % de las unidades vendidas, pero solo 20 % de los ingresos.')).toBeInTheDocument();
  });

  it('califica la rentabilidad con estrellas y explica la regla', async () => {
    await abrirPlatos();
    const tabla = screen.getByRole('table', { name: 'Ranking de platos' });

    const filas = within(tabla).getAllByRole('row').slice(1);
    expect(within(filas[0]).getByRole('img', { name: '5 de 5 estrellas' })).toBeInTheDocument();
    expect(screen.getByText(/El 20 % que más deja tiene 5 estrellas/)).toBeInTheDocument();
  });

  it('pagina el ranking: 10 por página y se puede avanzar, retroceder y cambiar el tamaño', async () => {
    await abrirPlatos();
    const tabla = () => screen.getByRole('table', { name: 'Ranking de platos' });

    expect(screen.getByText('1–10 de 20 platos')).toBeInTheDocument();
    expect(within(tabla()).getByText('Plato 10')).toBeInTheDocument();
    expect(within(tabla()).queryByText('Plato 11')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByText('11–20 de 20 platos')).toBeInTheDocument();
    expect(within(tabla()).getByText('Plato 11')).toBeInTheDocument();
    expect(within(tabla()).queryByText('Plato 10')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    await userEvent.selectOptions(screen.getByRole('combobox'), '20');
    expect(screen.getByText('1–20 de 20 platos')).toBeInTheDocument();
  });

  it('filtra por grupo y vuelve a la primera página', async () => {
    await abrirPlatos();
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

    await userEvent.click(screen.getByRole('button', { name: /^Por revisar/ }));

    expect(screen.getByText('1–6 de 6 platos')).toBeInTheDocument();
    const tabla = screen.getByRole('table', { name: 'Ranking de platos' });
    expect(within(tabla).getByText('Plato 15')).toBeInTheDocument();
    expect(within(tabla).queryByText('Plato 1')).not.toBeInTheDocument();
  });

  it('ordena por la columna elegida', async () => {
    await abrirPlatos();

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por margen por unidad' }));

    const tabla = screen.getByRole('table', { name: 'Ranking de platos' });
    const primera = within(tabla).getAllByRole('row')[1];
    expect(within(primera).getByText('Plato 1')).toBeInTheDocument(); // margen unitario 30, el mayor
    expect(screen.getByText('Ordenado por margen por unidad')).toBeInTheDocument();
  });

  it('los platos sin costo no se clasifican y se avisa', async () => {
    const datos = ranking();
    datos.productos[3] = { ...datos.productos[3], costo: null, margen: null, margen_unitario: null, clasificacion: null };
    datos.sin_costo = 1;
    servicio.ranking.mockResolvedValue(ok(datos));
    await abrirPlatos();

    expect(screen.getByText(/1 plato no tiene costo completo/)).toBeInTheDocument();
    const tabla = screen.getByRole('table', { name: 'Ranking de platos' });
    const fila = within(tabla).getAllByRole('row').find((f) => within(f).queryByText('Plato 4'));
    expect(within(fila!).getByText('Sin calificar')).toBeInTheDocument();
    // Una vez bajo el nombre (tablet) y otra en la columna del grupo (escritorio); el ancho muestra solo una
    expect(within(fila!).getAllByText('Sin costo')).toHaveLength(2);
  });

  it('sin ningún plato con costo no hay grupos y explica por qué', async () => {
    const datos = ranking();
    datos.productos = datos.productos.map((p) => ({ ...p, costo: null, margen: null, margen_unitario: null, clasificacion: null }));
    datos.umbrales = null;
    datos.sin_costo = 20;
    servicio.ranking.mockResolvedValue(ok(datos));
    await abrirPlatos();

    expect(screen.getByText(/Ningún plato tiene costo completo/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Imprescindibles' })).not.toBeInTheDocument();
    expect(screen.queryByText('Mapa de la carta')).not.toBeInTheDocument();
    expect(screen.getByText(/Las estrellas aparecen cuando hay al menos 5 platos con costo/)).toBeInTheDocument();
  });

  it('deja la pestaña elegida en la dirección', async () => {
    await abrirPlatos();

    expect(screen.getByTestId('ubicacion')).toHaveTextContent('?pestana=platos');
  });
});

/* ---------------------------------------------------------------- Equipo */

describe('pestaña Equipo de salón', () => {
  it('se abre directo desde la dirección y compara a cada mozo con la sede', async () => {
    montar('/admin/reportes/ventas?pestana=equipo');

    expect(await screen.findByText('Diego Salas lidera con el 35.8 % de las ventas.', { exact: false })).toBeInTheDocument();
    expect(servicio.desempeno).toHaveBeenCalledWith(mes);
    expect(screen.getAllByText('Sin anulaciones en el periodo')).toHaveLength(2);
    expect(screen.getByText('1 comprobante anulado')).toBeInTheDocument();
    expect(screen.getByText('+S/ 4.64')).toBeInTheDocument();
    expect(screen.getByText(/Ningún mozo anuló platos en este periodo/)).toBeInTheDocument();
  });

  it('lista a quienes anularon platos antes del cobro', async () => {
    const datos = equipo();
    datos.mozos[1] = { ...datos.mozos[1], anulaciones: { cantidad: 4, monto: 96, mermas: 1, costo_merma: 8.5 } };
    datos.totales.anulaciones = { cantidad: 4, monto: 96, mermas: 1, costo_merma: 8.5 };
    servicio.desempeno.mockResolvedValue(ok(datos));
    montar('/admin/reportes/ventas?pestana=equipo');

    const tabla = await screen.findByRole('table', { name: 'Anulaciones por mozo' });
    expect(within(tabla).getByText('Carlos Huamán')).toBeInTheDocument();
    expect(within(tabla).getByText('S/ 96.00')).toBeInTheDocument();
    expect(screen.getByText('1 comprobante anulado y 4 anulaciones antes del cobro')).toBeInTheDocument();
  });

  it('sin mozos con ventas lo dice', async () => {
    servicio.desempeno.mockResolvedValue(ok({ ...equipo(), mozos: [] }));
    montar('/admin/reportes/ventas?pestana=equipo');

    expect(await screen.findByText('Todavía no hay ventas del equipo en este periodo')).toBeInTheDocument();
  });
});

/* ---------------------------------------------------------------- Plan */

describe('plan sin reportes avanzados', () => {
  it('marca las pestañas bloqueadas, ofrece mejorar el plan y no consulta al servicio', async () => {
    jwt.modulosDelJwt.mockReturnValue(['prediccion']);
    montar();
    await screen.findByText('Cuentas cobradas');
    await waitFor(() => expect(screen.getAllByText('No incluido en tu plan').length).toBeGreaterThan(0));

    await userEvent.click(screen.getByRole('button', { name: /Platos/ }));
    expect(await screen.findByText('Descubre qué platos te hacen ganar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Equipo de salón/ }));
    expect(await screen.findByText('Conoce cómo vende tu equipo')).toBeInTheDocument();

    expect(servicio.ranking).not.toHaveBeenCalled();
    expect(servicio.desempeno).not.toHaveBeenCalled();
    // Las ventas siguen disponibles en todos los planes
    await userEvent.click(screen.getByRole('button', { name: /^Ventas/ }));
    expect(await screen.findByText('Cuentas cobradas')).toBeInTheDocument();
  });

  it('si el JWT no lo anticipó, el 403 del servicio también muestra la invitación', async () => {
    jwt.modulosDelJwt.mockReturnValue(null);
    servicio.ranking.mockResolvedValue(falla('ERR_MODULO_NO_INCLUIDO', 'Tu plan no incluye este reporte.'));
    montar('/admin/reportes/ventas?pestana=platos');

    expect(await screen.findByText('Descubre qué platos te hacen ganar')).toBeInTheDocument();
    expect(screen.queryByText('Tu plan no incluye este reporte.')).not.toBeInTheDocument();
  });
});
