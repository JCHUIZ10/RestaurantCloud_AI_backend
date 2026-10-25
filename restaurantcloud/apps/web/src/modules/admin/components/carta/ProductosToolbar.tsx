import React, { useState } from 'react';
import { CategoriaAdminDTO } from '@/types/admin';
import { Button, CampoBusqueda, Pestanas } from '@/components/ui';

type Disponibilidad = 'todos' | 'disponible' | 'agotado';

interface ProductosToolbarProps {
  categorias: CategoriaAdminDTO[];
  categoriaSeleccionada: string; // 'todas' o id de categoría
  onSeleccionarCategoria: (id: string) => void;
  disponibilidadSeleccionada: Disponibilidad;
  onSeleccionarDisponibilidad: (disp: Disponibilidad) => void;
  busquedaActiva: string;
  onBuscar: (termino: string) => void;
  totalProductos: number;
  disponibles?: number;
  agotados?: number;
}

/** Filtros de la tabla de productos; va dentro de la tarjeta de la tabla. */
export const ProductosToolbar: React.FC<ProductosToolbarProps> = ({
  categorias,
  categoriaSeleccionada,
  onSeleccionarCategoria,
  disponibilidadSeleccionada,
  onSeleccionarDisponibilidad,
  busquedaActiva,
  onBuscar,
  totalProductos,
  disponibles,
  agotados,
}) => {
  const [terminoLocal, setTerminoLocal] = useState(busquedaActiva);

  // La búsqueda se envía al confirmar (Enter o botón) para no consultar en cada tecla
  const handleEjecutarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    onBuscar(terminoLocal.trim());
  };

  const handleCambiarTermino = (texto: string) => {
    setTerminoLocal(texto);
    if (texto === '' && busquedaActiva) onBuscar('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <form onSubmit={handleEjecutarBusqueda} role="search" className="flex items-center gap-2 flex-1 min-w-0">
          <CampoBusqueda
            valor={terminoLocal}
            onCambiar={handleCambiarTermino}
            placeholder="Buscar plato, ingrediente o descripción"
            etiqueta="Buscar productos"
          />
          <Button type="submit" variant="outline" className="shrink-0">
            Buscar
          </Button>
        </form>
        <Pestanas
          etiqueta="Filtrar por disponibilidad"
          valor={disponibilidadSeleccionada}
          onCambiar={onSeleccionarDisponibilidad}
          opciones={[
            { valor: 'todos', etiqueta: 'Todos' },
            { valor: 'disponible', etiqueta: 'Disponibles', conteo: disponibles },
            {
              valor: 'agotado',
              etiqueta: 'Agotados',
              conteo: agotados,
              alerta: agotados ? `${agotados} agotados` : undefined,
            },
          ]}
          className="shrink-0 self-start lg:self-auto"
        />
      </div>

      <Pestanas
        etiqueta="Filtrar por categoría"
        valor={categoriaSeleccionada}
        onCambiar={onSeleccionarCategoria}
        opciones={[
          { valor: 'todas', etiqueta: 'Todas las categorías', conteo: totalProductos },
          ...categorias.map((cat) => ({ valor: cat.id, etiqueta: cat.nombre, conteo: cat.total_productos })),
        ]}
        className="w-full"
      />
    </div>
  );
};
