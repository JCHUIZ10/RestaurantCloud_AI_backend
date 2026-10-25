import React, { useState, useEffect } from 'react';
import { Button, CampoBusqueda, Pestanas } from '@/components/ui';

type EstadoFiltro = 'activos' | 'inactivos' | 'todos';

interface ProveedoresToolbarProps {
  busqueda: string;
  onBuscar: (texto: string) => void;
  estadoFiltro: EstadoFiltro;
  onChangeEstadoFiltro: (estado: EstadoFiltro) => void;
  conteos: {
    activos: number;
    inactivos: number;
    todos: number;
  };
}

/** Estado y búsqueda; va dentro de la tarjeta de la tabla. */
export const ProveedoresToolbar: React.FC<ProveedoresToolbarProps> = ({
  busqueda,
  onBuscar,
  estadoFiltro,
  onChangeEstadoFiltro,
  conteos,
}) => {
  const [inputLocal, setInputLocal] = useState(busqueda);

  useEffect(() => {
    setInputLocal(busqueda);
  }, [busqueda]);

  // La búsqueda se envía al confirmar (Enter o botón) para no consultar en cada tecla
  const handleEjecutarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    onBuscar(inputLocal);
  };

  const handleCambiar = (texto: string) => {
    setInputLocal(texto);
    if (texto === '' && busqueda) onBuscar('');
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <Pestanas
        etiqueta="Filtrar por estado"
        valor={estadoFiltro}
        onCambiar={onChangeEstadoFiltro}
        opciones={[
          { valor: 'activos', etiqueta: 'Activos', conteo: conteos.activos, punto: 'bg-estado-ok-500' },
          { valor: 'inactivos', etiqueta: 'Inactivos', conteo: conteos.inactivos, punto: 'bg-tinta-400' },
          { valor: 'todos', etiqueta: 'Todos', conteo: conteos.todos },
        ]}
        className="self-start lg:self-auto"
      />
      <form onSubmit={handleEjecutarBusqueda} role="search" className="flex items-center gap-2 w-full lg:w-auto lg:min-w-[24rem]">
        <CampoBusqueda
          valor={inputLocal}
          onCambiar={handleCambiar}
          placeholder="Buscar proveedor o insumo que vende"
          etiqueta="Buscar proveedores"
        />
        <Button type="submit" variant="outline" className="shrink-0">
          Buscar
        </Button>
      </form>
    </div>
  );
};
