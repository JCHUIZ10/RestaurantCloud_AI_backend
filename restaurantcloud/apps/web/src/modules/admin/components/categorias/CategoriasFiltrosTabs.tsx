import React from 'react';
import { CampoBusqueda, Pestanas } from '@/components/ui';

export type FiltroEstadoCategoria = 'todas' | 'activas' | 'ocultas';

interface CategoriasFiltrosTabsProps {
  filtroEstado: FiltroEstadoCategoria;
  onCambiarFiltroEstado: (estado: FiltroEstadoCategoria) => void;
  busqueda: string;
  onCambiarBusqueda: (texto: string) => void;
  conteos: {
    todas: number;
    activas: number;
    ocultas: number;
  };
}

/** Barra de filtros que se monta en la cabecera de la tabla de categorías. */
export const CategoriasFiltrosTabs: React.FC<CategoriasFiltrosTabsProps> = ({
  filtroEstado,
  onCambiarFiltroEstado,
  busqueda,
  onCambiarBusqueda,
  conteos,
}) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <Pestanas
      etiqueta="Filtrar categorías por visibilidad"
      valor={filtroEstado}
      onCambiar={onCambiarFiltroEstado}
      opciones={[
        { valor: 'todas', etiqueta: 'Todas', conteo: conteos.todas },
        { valor: 'activas', etiqueta: 'Visibles', conteo: conteos.activas },
        { valor: 'ocultas', etiqueta: 'Ocultas', conteo: conteos.ocultas },
      ]}
    />
    <CampoBusqueda
      valor={busqueda}
      onCambiar={onCambiarBusqueda}
      placeholder="Buscar categoría"
      etiqueta="Buscar categoría"
      className="md:w-72"
    />
  </div>
);
