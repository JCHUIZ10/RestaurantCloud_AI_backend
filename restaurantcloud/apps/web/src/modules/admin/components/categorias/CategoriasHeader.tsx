import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Eye, UtensilsCrossed, TrendingUp, Plus, FolderTree } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { ResumenCategoriasDTO } from '@/types/admin';
import { Button, PageHeader, TarjetaIndicador } from '@/components/ui';

interface CategoriasHeaderProps {
  resumen: ResumenCategoriasDTO;
  onAbrirNuevaCategoria: () => void;
}

export const CategoriasHeader: React.FC<CategoriasHeaderProps> = ({ resumen, onAbrirNuevaCategoria }) => {
  const navigate = useNavigate();
  const ocultas = resumen.categorias_ocultas;

  return (
    <div className="space-y-6">
      <PageHeader
        icono={FolderTree}
        titulo="Categorías de la carta"
        descripcion="Organiza las secciones del menú, su visibilidad en salón y carta QR, y el orden de las pestañas en la comanda de los mozos."
        acciones={
          <>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.ADMIN_CARTA)}
              leftIcon={<UtensilsCrossed className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
            >
              Productos
            </Button>
            <Button
              onClick={onAbrirNuevaCategoria}
              leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
            >
              Nueva categoría
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaIndicador
          icono={Layers}
          etiqueta="Secciones"
          valor={resumen.total_categorias}
          unidad="en carta"
          detalle="Pestañas de la comanda"
        />
        <TarjetaIndicador
          tono="ok"
          icono={Eye}
          etiqueta="Visibles en salón"
          valor={resumen.categorias_activas}
          unidad="activas"
          detalle={ocultas > 0 ? `${ocultas} oculta${ocultas > 1 ? 's' : ''} al comensal` : 'Ninguna oculta'}
        />
        <TarjetaIndicador
          tono="cobre"
          icono={UtensilsCrossed}
          etiqueta="Platos en carta"
          valor={resumen.total_productos_asociados}
          unidad="platos / beb."
          detalle="Asignados a una sección"
        />
        <TarjetaIndicador
          icono={TrendingUp}
          etiqueta="Mayor volumen"
          valor={resumen.categoria_con_mas_platos?.nombre ?? 'Sin datos'}
          detalle={
            resumen.categoria_con_mas_platos
              ? `${resumen.categoria_con_mas_platos.cantidad} plato(s) en la sección`
              : 'Aún no hay platos asignados'
          }
        />
      </div>
    </div>
  );
};
