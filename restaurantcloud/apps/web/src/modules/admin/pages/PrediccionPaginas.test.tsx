import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { LineaReposicionDTO, PrediccionDTO } from '@/types/prediccion';

const servicio = vi.hoisted(() => ({
  ultimo: vi.fn(),
  generar: vi.fn(),
  decidir: vi.fn(),
  decidirLote: vi.fn(),
  exportar: vi.fn(),
}));

vi.mock('@/services/serviceAdapter', () => ({ prediccionService: servicio }));

import { ToastProvider } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { AdminPlanificarSemanaPage } from './AdminPlanificarSemanaPage';
import { AdminPrepararCompraPage } from './AdminPrepararCompraPage';

function linea(cambios: Partial<LineaReposicionDTO>): LineaReposicionDTO {
  return {
    id: 'x', insumo_id: 'ix', insumo: 'Insumo', unidad_medida: 'kg', prioridad: 'urgente', motivo: 'consumo', alcanza_dias: 0,
    consumo_previsto: 40, margen_seguridad: 10, stock_al_calcular: 10, stock_minimo: 5, cantidad_sugerida: 40, estado: 'pendiente',
    cantidad_final: null, decidido_en: null, costo_estimado: 0,
    proveedor: { id: 'p1', nombre: 'Mercado Mayorista', precio: 28, ultima_compra: null },
    ...cambios,
  };
}

function prediccion(cambios: Partial<PrediccionDTO> = {}): PrediccionDTO {
  return {
    nivel: 3, cobertura_dias: 3, creada_en: '2026-11-21T10:00:00-05:00', confianza: { error_promedio: 4.9, mejora_pct: 24 }, progreso: null,
    pronostico: null,
    reposicion: [
      linea({ id: 'a', insumo_id: 'ia', insumo: 'Pescado fresco', cantidad_sugerida: 40, costo_estimado: 1120 }),
      linea({ id: 'b', insumo_id: 'ib', insumo: 'Limón', prioridad: 'pronto', alcanza_dias: 2, cantidad_sugerida: 10, costo_estimado: 280 }),
      linea({ id: 'c', insumo_id: 'ic', insumo: 'Cerveza', unidad_medida: 'botella', cantidad_sugerida: 24, costo_estimado: 72, proveedor: { id: 'p2', nombre: 'Bebidas del Pacífico', precio: 3, ultima_compra: null } }),
    ],
    totales: { por_prioridad: { urgente: 2, pronto: 1, cubierto: 0 }, costo: 1472, proveedores: 2, decisiones: { pendientes: 3, aceptadas: 0, ajustadas: 0, descartadas: 0 } },
    ...cambios,
  };
}

function UbicacionActual() {
  const ubicacion = useLocation();
  return <pre data-testid="ubicacion">{JSON.stringify({ ruta: ubicacion.pathname, estado: ubicacion.state })}</pre>;
}

function montar(pagina: React.ReactElement) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[ROUTES.ADMIN_PREPARAR_COMPRA]}>
        <Routes>
          <Route path={ROUTES.ADMIN_PREPARAR_COMPRA} element={pagina} />
          <Route path={ROUTES.ADMIN_PLANIFICAR_SEMANA} element={pagina} />
          <Route path={ROUTES.ADMIN_COMPRAS} element={<UbicacionActual />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  servicio.ultimo.mockResolvedValue({ exito: true, datos: prediccion() });
  servicio.decidirLote.mockResolvedValue({ exito: true, datos: [] });
});

describe('Preparar la compra', () => {
  it('agrupa por proveedor y suma lo que se va a pagar', async () => {
    montar(<AdminPrepararCompraPage />);

    const mercado = await screen.findByRole('region', { name: 'Mercado Mayorista' });
    expect(within(mercado).getByText('Pescado fresco')).toBeInTheDocument();
    expect(within(mercado).getByText('Limón')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Bebidas del Pacífico' })).toBeInTheDocument();
    // 40 kg × 28 + 10 kg × 28 = 1,400 del mercado y 24 × 3 = 72 de bebidas
    expect(within(mercado).getByText('S/ 1,400.00')).toBeInTheDocument();
    expect(screen.getByText('S/ 1,472.00')).toBeInTheDocument();
  });

  it('al cambiar una cantidad avisa y recalcula el subtotal', async () => {
    montar(<AdminPrepararCompraPage />);
    const campo = await screen.findByLabelText('Cantidad de Pescado fresco');

    await userEvent.clear(campo);
    await userEvent.type(campo, '30');

    expect(screen.getByText(/Cambiaste 1 cantidad/)).toBeInTheDocument();
    expect(screen.getByText('Cambiada por ti · sugerimos 40 kg')).toBeInTheDocument();
    // 30 × 28 + 10 × 28
    expect(within(screen.getByRole('region', { name: 'Mercado Mayorista' })).getByText('S/ 1,120.00')).toBeInTheDocument();
  });

  it('registrar la compra guarda lo cambiado como ajustado y lo demás como aceptado, y abre Compras ya cargado', async () => {
    montar(<AdminPrepararCompraPage />);
    const campo = await screen.findByLabelText('Cantidad de Pescado fresco');
    await userEvent.clear(campo);
    await userEvent.type(campo, '30');

    await userEvent.click(within(screen.getByRole('region', { name: 'Mercado Mayorista' })).getByRole('button', { name: 'Registrar compra' }));

    await waitFor(() => expect(servicio.decidirLote).toHaveBeenCalledTimes(1));
    expect(servicio.decidirLote).toHaveBeenCalledWith([
      { id: 'a', estado: 'ajustada', cantidad_final: 30 },
      { id: 'b', estado: 'aceptada' },
    ]);

    const ubicacion = JSON.parse((await screen.findByTestId('ubicacion')).textContent ?? '{}');
    expect(ubicacion.ruta).toBe(ROUTES.ADMIN_COMPRAS);
    expect(ubicacion.estado.compraSugerida).toEqual({
      proveedorId: 'p1',
      lineas: [
        { insumo_id: 'ia', insumo_nombre: 'Pescado fresco', unidad_medida: 'kg', cantidad: 30, precio_unitario: 28 },
        { insumo_id: 'ib', insumo_nombre: 'Limón', unidad_medida: 'kg', cantidad: 10, precio_unitario: 28 },
      ],
    });
  });

  it('si no se pueden guardar las decisiones no abre Compras', async () => {
    servicio.decidirLote.mockResolvedValue({ exito: false, datos: null, errores: [{ codigo: 'ERR_REPOSICION_YA_DECIDIDA', mensaje: 'Esta recomendación ya fue aceptada.' }] });
    montar(<AdminPrepararCompraPage />);

    await userEvent.click(within(await screen.findByRole('region', { name: 'Mercado Mayorista' })).getByRole('button', { name: 'Registrar compra' }));

    expect(await screen.findByText('Esta recomendación ya fue aceptada.')).toBeInTheDocument();
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument();
  });

  it('una línea ya decidida no se puede editar', async () => {
    servicio.ultimo.mockResolvedValue({
      exito: true,
      datos: prediccion({ reposicion: [linea({ id: 'a', insumo: 'Pescado fresco', estado: 'aceptada', cantidad_final: 40, costo_estimado: 1120 })] }),
    });
    montar(<AdminPrepararCompraPage />);

    expect(await screen.findByLabelText('Cantidad de Pescado fresco')).toBeDisabled();
  });

  it('sin nada que comprar lo dice', async () => {
    servicio.ultimo.mockResolvedValue({ exito: true, datos: prediccion({ reposicion: [linea({ estado: 'descartada' })] }) });
    montar(<AdminPrepararCompraPage />);

    expect(await screen.findByText('No hay nada que comprar')).toBeInTheDocument();
  });
});

describe('Planificar la semana', () => {
  it('un plan sin predicción ve una invitación, no un error', async () => {
    servicio.ultimo.mockResolvedValue({ exito: false, datos: null, errores: [{ codigo: 'ERR_MODULO_PREDICCION_NO_CONTRATADO', mensaje: 'x' }] });
    render(
      <ToastProvider>
        <MemoryRouter><AdminPlanificarSemanaPage /></MemoryRouter>
      </ToastProvider>
    );

    expect(await screen.findByText('Anticípate a tu semana')).toBeInTheDocument();
    expect(screen.getByText('Incluida en los planes Pro y Enterprise.')).toBeInTheDocument();
  });

  it('la primera vez invita a calcular la semana', async () => {
    servicio.ultimo.mockResolvedValue({ exito: false, datos: null, errores: [{ codigo: 'ERR_SIN_PRONOSTICO', mensaje: 'x' }] });
    servicio.generar.mockResolvedValue({ exito: true, datos: prediccion() });
    render(
      <ToastProvider>
        <MemoryRouter><AdminPlanificarSemanaPage /></MemoryRouter>
      </ToastProvider>
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Calcular mi semana' }));

    expect(servicio.generar).toHaveBeenCalledWith(3);
    expect(await screen.findByText('Comprar cuanto antes', { selector: 'h2' })).toBeInTheDocument();
  });

  it('aceptar una recomendación la guarda y vuelve a pedir lo que quedó', async () => {
    servicio.decidir.mockResolvedValue({ exito: true, datos: linea({ id: 'a', estado: 'aceptada' }) });
    render(
      <ToastProvider>
        <MemoryRouter><AdminPlanificarSemanaPage /></MemoryRouter>
      </ToastProvider>
    );

    const tarjeta = (await screen.findByText('Pescado fresco')).closest('article')!;
    await userEvent.click(within(tarjeta).getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => expect(servicio.decidir).toHaveBeenCalledWith('a', 'aceptada'));
    await waitFor(() => expect(servicio.ultimo).toHaveBeenCalledTimes(2));
  });

  it('si el servicio no responde al abrir, ofrece reintentar sin romper la pantalla', async () => {
    servicio.ultimo.mockRejectedValue(new Error('red'));
    render(
      <ToastProvider>
        <MemoryRouter><AdminPlanificarSemanaPage /></MemoryRouter>
      </ToastProvider>
    );

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByText('La predicción no está disponible ahora')).toBeInTheDocument();
  });
});
