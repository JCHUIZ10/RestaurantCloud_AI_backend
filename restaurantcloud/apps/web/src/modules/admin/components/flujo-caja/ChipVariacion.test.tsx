import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChipVariacion } from './FlujoCajaDashboardView';

describe('ChipVariacion', () => {
  it('dice "Sin comparativo" en lugar de un 0 % inventado cuando no hay periodo anterior', () => {
    render(<ChipVariacion valor={null} subidaEsBuena />);
    expect(screen.getByText('Sin comparativo')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('muestra el signo positivo y el porcentaje', () => {
    render(<ChipVariacion valor={12.5} subidaEsBuena />);
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });

  it('muestra una baja con su signo negativo', () => {
    render(<ChipVariacion valor={-8} subidaEsBuena={false} />);
    expect(screen.getByText('-8%')).toBeInTheDocument();
  });
});
