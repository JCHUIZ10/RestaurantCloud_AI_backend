import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GastoOperativoDTO } from '@/types/admin';
import { GastosOperativosTableView } from './GastosOperativosTableView';

function gasto(extra: Partial<GastoOperativoDTO> = {}): GastoOperativoDTO {
  return {
    id: 'g-1',
    local_id: 'l-1',
    categoria: 'limpieza_aseo',
    monto: 100,
    origen_fondos: 'transferencia_bancaria',
    proveedor_nombre: 'Bodega El Sol',
    tipo_comprobante: 'boleta',
    descripcion: 'Compra de insumos de limpieza',
    fecha: '2026-11-14',
    registrado_por: 'u-1',
    registrado_por_nombre: 'Administrador',
    created_at: '2026-11-14T10:00:00-05:00',
    estado: 'registrado',
    puede_anularse: true,
    ...extra,
  };
}

const renderizar = (gastos: GastoOperativoDTO[], onAnularGasto = vi.fn().mockResolvedValue(true)) =>
  render(<GastosOperativosTableView gastos={gastos} onAbrirModalGasto={vi.fn()} onAnularGasto={onAnularGasto} />);

describe('GastosOperativosTableView', () => {
  it('no suma los gastos anulados en el total', () => {
    renderizar([gasto({ id: 'a', monto: 100 }), gasto({ id: 'b', monto: 40, estado: 'anulado', puede_anularse: false })]);
    expect(screen.getAllByText('S/ 100.00').length).toBeGreaterThan(0);
    expect(screen.queryByText('S/ 140.00')).not.toBeInTheDocument();
  });

  it('muestra la etiqueta del tipo de comprobante, no su código', () => {
    renderizar([gasto({ tipo_comprobante: 'recibo_honorarios' })]);
    expect(screen.getByText('Recibo por honorarios')).toBeInTheDocument();
  });

  it('deshabilita "Anular" si el gasto salió de un turno ya cerrado', () => {
    renderizar([gasto({ puede_anularse: false })]);
    expect(screen.getByRole('button', { name: /anular/i })).toBeDisabled();
  });

  it('exige un motivo de al menos 10 caracteres antes de anular', async () => {
    const usuario = userEvent.setup();
    const onAnularGasto = vi.fn().mockResolvedValue(true);
    renderizar([gasto()], onAnularGasto);

    await usuario.click(screen.getByRole('button', { name: /^anular$/i }));
    const dialogo = await screen.findByRole('dialog');
    const confirmar = within(dialogo).getByRole('button', { name: /anular gasto/i });
    expect(confirmar).toBeDisabled();

    await usuario.type(within(dialogo).getByRole('textbox'), 'corto');
    expect(confirmar).toBeDisabled();

    await usuario.type(within(dialogo).getByRole('textbox'), ' y ahora sí es largo');
    expect(confirmar).toBeEnabled();
    await usuario.click(confirmar);
    expect(onAnularGasto).toHaveBeenCalledWith(expect.objectContaining({ id: 'g-1' }), 'corto y ahora sí es largo');
  });
});
