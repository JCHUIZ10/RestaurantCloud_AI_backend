import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Plus, FolderTree } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { Button, PageHeader } from '@/components/ui';

interface ProductosHeaderProps {
  onAbrirNuevoProducto: () => void;
}

export const ProductosHeader: React.FC<ProductosHeaderProps> = ({ onAbrirNuevoProducto }) => {
  const navigate = useNavigate();

  return (
    <PageHeader
      icono={UtensilsCrossed}
      titulo="Productos de la carta"
      descripcion="Platos y bebidas con su precio, receta de insumos y margen; la disponibilidad se actualiza sola según el stock de bodega."
      acciones={
        <>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.ADMIN_CATEGORIAS)}
            leftIcon={<FolderTree className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
          >
            Categorías
          </Button>
          <Button
            onClick={onAbrirNuevoProducto}
            leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
          >
            Nuevo plato
          </Button>
        </>
      }
    />
  );
};
