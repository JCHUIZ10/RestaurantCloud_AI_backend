import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Package } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { Button, PageHeader } from '@/components/ui';

interface ProveedoresHeaderProps {
  onAbrirNuevoProveedor: () => void;
}

export const ProveedoresHeader: React.FC<ProveedoresHeaderProps> = ({ onAbrirNuevoProveedor }) => {
  const navigate = useNavigate();

  return (
    <PageHeader
      icono={Truck}
      titulo="Proveedores"
      descripcion="Contactos de compra con su WhatsApp, los insumos que te venden y el historial de precios."
      acciones={
        <>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.ADMIN_INVENTARIO)}
            leftIcon={<Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
          >
            Insumos
          </Button>
          <Button
            onClick={onAbrirNuevoProveedor}
            leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
          >
            Nuevo proveedor
          </Button>
        </>
      }
    />
  );
};
