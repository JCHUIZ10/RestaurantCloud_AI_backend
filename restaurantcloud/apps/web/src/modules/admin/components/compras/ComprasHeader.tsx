import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, Truck } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { Button, PageHeader } from '@/components/ui';

interface ComprasHeaderProps {
  onNuevaCompra: () => void;
}

export const ComprasHeader: React.FC<ComprasHeaderProps> = ({ onNuevaCompra }) => {
  const navigate = useNavigate();

  return (
    <PageHeader
      icono={Receipt}
      titulo="Compras"
      descripcion="Cada compra ingresa los insumos al inventario y actualiza su costo al instante."
      acciones={
        <>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.ADMIN_PROVEEDORES)}
            leftIcon={<Truck className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
          >
            Proveedores
          </Button>
          <Button onClick={onNuevaCompra} leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}>
            Registrar compra
          </Button>
        </>
      }
    />
  );
};
