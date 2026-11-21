import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { LineaReposicionDTO } from '@/types/prediccion';
import { IndicadorNivel } from './IndicadorNivel';
import { TarjetaInsumo } from './TarjetaInsumo';

function linea(cambios: Partial<LineaReposicionDTO> = {}): LineaReposicionDTO {
  return {
    id: 'l1', insumo_id: 'i1', insumo: 'Pescado fresco', unidad_medida: 'kg', prioridad: 'urgente', motivo: 'consumo',
    alcanza_dias: 0, consumo_previsto: 45.6, margen_seguridad: 18.4, stock_al_calcular: 15, stock_minimo: 5,
    cantidad_sugerida: 49, estado: 'pendiente', cantidad_final: null, decidido_en: null, costo_estimado: 1372,
    proveedor: { id: 'p1', nombre: 'Mercado Mayorista', precio: 28, ultima_compra: null },
    ...cambios,
  };
}

describe('IndicadorNivel', () => {
  it('nivel 0: espera las primeras ventas', () => {
    render(<IndicadorNivel nivel={0} progreso={{ dias_con_ventas: 0, faltan_para_siguiente: 1 }} confianza={null} />);

    expect(screen.getByText('Esperando tus primeras ventas')).toBeInTheDocument();
    expect(screen.getByText('Aún no registras ventas.')).toBeInTheDocument();
    expect(screen.getByText('Nivel 1 de 4')).toBeInTheDocument();
  });

  it('nivel 1: dice cuántos días faltan para el siguiente nivel', () => {
    render(<IndicadorNivel nivel={1} progreso={{ dias_con_ventas: 12, faltan_para_siguiente: 16 }} confianza={null} />);

    expect(screen.getByText('En preparación')).toBeInTheDocument();
    expect(screen.getByText('Llevas 12 días de ventas. Faltan 16 días para el siguiente nivel.')).toBeInTheDocument();
  });

  it('nivel 2: no promete cuándo llegará el modelo', () => {
    render(<IndicadorNivel nivel={2} progreso={{ dias_con_ventas: 40, faltan_para_siguiente: null }} confianza={null} />);

    expect(screen.getByText('Casi a punto')).toBeInTheDocument();
    expect(screen.getByText(/modelo de tu local/)).toBeInTheDocument();
  });

  it('nivel 3: muestra la precisión y no un avance', () => {
    render(<IndicadorNivel nivel={3} progreso={null} confianza={{ error_promedio: 4.9, mejora_pct: 24 }} />);

    expect(screen.getByText('Al punto')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('24 % mejor')).toBeInTheDocument();
    expect(screen.queryByText(/Faltan/)).not.toBeInTheDocument();
  });

  it('en los niveles bajos no presume de una precisión que no tiene', () => {
    render(<IndicadorNivel nivel={1} progreso={{ dias_con_ventas: 3, faltan_para_siguiente: 25 }} confianza={null} />);

    expect(screen.queryByText(/% mejor/)).not.toBeInTheDocument();
    expect(screen.queryByText(/se equivoca/i)).not.toBeInTheDocument();
  });
});

describe('TarjetaInsumo', () => {
  const montar = (l: LineaReposicionDTO, props: Partial<React.ComponentProps<typeof TarjetaInsumo>> = {}) =>
    render(
      <MemoryRouter>
        <TarjetaInsumo linea={l} cobertura={3} {...props} />
      </MemoryRouter>
    );

  it('muestra qué comprar, cuánto cuesta y a quién', () => {
    montar(linea());

    expect(screen.getByText('Pescado fresco')).toBeInTheDocument();
    expect(screen.getByText('49 kg')).toBeInTheDocument();
    expect(screen.getByText('≈ S/ 1,372.00')).toBeInTheDocument();
    expect(screen.getByText(/Mercado Mayorista/)).toBeInTheDocument();
    expect(screen.getByText('No alcanza para el primer día')).toBeInTheDocument();
  });

  it('aceptar y descartar avisan a la pantalla con la línea', async () => {
    const onAceptar = vi.fn();
    const onDescartar = vi.fn();
    const l = linea();
    montar(l, { onAceptar, onDescartar });

    await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(onAceptar).toHaveBeenCalledWith(l);
    expect(onDescartar).toHaveBeenCalledWith(l);
  });

  it('una línea ya decidida muestra su estado y no deja decidir otra vez', () => {
    montar(linea({ estado: 'ajustada', cantidad_final: 40 }));

    expect(screen.getByText('Ajustada')).toBeInTheDocument();
    expect(screen.getByText(/40 kg/, { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });

  it('un insumo bajo su mínimo, sin consumo previsto, explica el mínimo en vez de una barra', () => {
    montar(linea({ motivo: 'bajo_minimo', alcanza_dias: null, consumo_previsto: 0, margen_seguridad: 0, stock_al_calcular: 2, stock_minimo: 5, cantidad_sugerida: 3 }));

    expect(screen.getByText('Ya está por debajo del mínimo')).toBeInTheDocument();
    expect(screen.getByText(/el mínimo que dejaste es 5 kg/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('un insumo con stock de sobra dice que no hace falta comprar', () => {
    montar(linea({ prioridad: 'cubierto', alcanza_dias: 7, cantidad_sugerida: 0, costo_estimado: 0 }));

    expect(screen.getByText('Nada')).toBeInTheDocument();
    expect(screen.getByText('Te alcanza')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });
});
