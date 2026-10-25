import React from 'react';
import { Users, Plus, ShieldAlert } from 'lucide-react';
import { MetricasPersonalDTO } from '@/types/admin';
import { Button, EstadoBadge, PageHeader } from '@/components/ui';

interface PersonalHeaderProps {
  metricas?: MetricasPersonalDTO;
  onAbrirNuevoEmpleado: () => void;
}

export const PersonalHeader: React.FC<PersonalHeaderProps> = ({ metricas, onAbrirNuevoEmpleado }) => {
  const cuotaLlena = metricas ? metricas.cupos_disponibles <= 0 : false;

  return (
    <PageHeader
      icono={Users}
      titulo="Personal"
      descripcion="Mozos, cocina y caja de tu local: accesos, contraseñas y quién está operando ahora."
      meta={cuotaLlena && <EstadoBadge tono="alerta" icono={ShieldAlert}>Cupo del plan lleno</EstadoBadge>}
      acciones={
        <Button
          onClick={onAbrirNuevoEmpleado}
          disabled={cuotaLlena}
          title={cuotaLlena ? 'Desactiva a alguien o amplía tu plan para registrar más personal' : undefined}
          leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
        >
          Nuevo colaborador
        </Button>
      }
    />
  );
};
