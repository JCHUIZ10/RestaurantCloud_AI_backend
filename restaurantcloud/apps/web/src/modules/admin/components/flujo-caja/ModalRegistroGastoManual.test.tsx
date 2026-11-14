import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalRegistroGastoManual } from './ModalRegistroGastoManual';
import { registrarMarcaServidor, reiniciarMarcaServidor } from '@/shared/utils';

const renderizar = () =>
  render(<ModalRegistroGastoManual isOpen onClose={vi.fn()} onGuardarGasto={vi.fn().mockResolvedValue(undefined)} />);

describe('ModalRegistroGastoManual', () => {
  afterEach(() => reiniciarMarcaServidor());

  it('nace vacío: nada viene precargado', () => {
    renderizar();
    expect(screen.getByLabelText(/categoría del gasto/i)).toHaveValue('');
    expect(screen.getByLabelText(/proveedor/i)).toHaveValue('');
    // El botón de enviar (el único de tipo submit) no se habilita hasta completar el formulario
    const enviar = screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit');
    expect(enviar).toBeDisabled();
  });

  it('limita la fecha a hoy según el servidor y la fija con efectivo de la gaveta', async () => {
    registrarMarcaServidor('2026-11-14T22:00:00-05:00', Date.now());
    const usuario = userEvent.setup();
    renderizar();

    const fecha = screen.getByLabelText(/fecha/i);
    expect(fecha).toHaveAttribute('max', '2026-11-14');

    await usuario.selectOptions(screen.getByLabelText(/origen|medio|fondos/i), 'efectivo_caja');
    expect(fecha).toBeDisabled();
    expect(fecha).toHaveValue('2026-11-14');
  });
});
