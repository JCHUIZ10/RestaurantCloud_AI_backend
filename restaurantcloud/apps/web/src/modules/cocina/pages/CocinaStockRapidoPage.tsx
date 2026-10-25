import React, { useState, useEffect, useCallback } from 'react';
import { PlatoDisponibilidadDTO, ItemEnFuegoResolucionDTO } from '@/types/cocina';
import { cocinaService } from '@/services/serviceAdapter';
import { PanelDisponibilidadPlatos } from '../components/kds/PanelDisponibilidadPlatos';
import { DialogoResolucionFuego } from '../components/kds/DialogoResolucionFuego';
import { RefreshCw } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { EstadoBadge, EstadoError, IconButton, PageHeader, Skeleton, useToast } from '@/components/ui';

export const CocinaStockRapidoPage: React.FC = () => {
  const { mostrar } = useToast();

  const [catalogo, setCatalogo] = useState<PlatoDisponibilidadDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Diálogo de Resolución de Fuegos
  const [dialogoFuegoAbierto, setDialogoFuegoAbierto] = useState(false);
  const [platoEnResolucion, setPlatoEnResolucion] = useState<PlatoDisponibilidadDTO | null>(null);
  const [itemsEnFuegoResolucion, setItemsEnFuegoResolucion] = useState<ItemEnFuegoResolucionDTO[]>([]);

  // Cargar catálogo de disponibilidad desde la base de datos real
  const cargarCatalogo = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await cocinaService.obtenerCatalogoDisponibilidad();
      if (res.exito) {
        setCatalogo(res.datos || []);
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo cargar el catálogo de disponibilidad.');
      }
    } catch {
      setError('Error de conexión al cargar la disponibilidad de platos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // Manejador: Conmutar disponibilidad (disponible / agotado)
  const handleConmutarDisponibilidad = async (
    productoId: string,
    nuevoEstado: 'disponible' | 'agotado'
  ) => {
    try {
      const res = await cocinaService.conmutarDisponibilidadPlatoDirecto(productoId, nuevoEstado);
      if (res.exito) {
        if (res.datos?.requiere_resolucion) {
          // Si tiene raciones activas en fuego, abrir diálogo de resolución FIFO
          const targetPlato = catalogo.find((p) => p.producto_id === productoId) || null;
          const resItems = await cocinaService.obtenerItemsEnFuegoDeProducto(productoId);
          if (resItems.exito) {
            setItemsEnFuegoResolucion(resItems.datos || []);
            setPlatoEnResolucion(targetPlato);
            setDialogoFuegoAbierto(true);
          }
        } else {
          // Conmutación directa sin fuego activo: refrescar catálogo
          await cargarCatalogo();
        }
      } else if (res.errores && res.errores.length > 0) {
        mostrar(res.errores[0].mensaje, 'error');
      }
    } catch {
      mostrar('Error de comunicación con el servidor al actualizar disponibilidad.', 'error');
    }
  };

  // Manejador: Confirmar resolución de fuego activo ($K$ de $N$ porciones)
  const handleConfirmarResolucionFuego = async (
    productoId: string,
    itemsEnFuegoNoAlcanzadosIds: string[],
    motivo: string
  ) => {
    try {
      const res = await cocinaService.confirmarResolucionFuego(
        productoId,
        itemsEnFuegoNoAlcanzadosIds,
        motivo
      );
      if (res.exito) {
        setDialogoFuegoAbierto(false);
        setPlatoEnResolucion(null);
        await cargarCatalogo();
      } else if (res.errores && res.errores.length > 0) {
        mostrar(res.errores[0].mensaje, 'error');
      }
    } catch {
      mostrar('Error al confirmar resolución de fuego.', 'error');
    }
  };

  const agotados = catalogo.filter((p) => p.disponibilidad === 'agotado').length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        tema="oscuro"
        compacto
        titulo="Disponibilidad de platos"
        volver={{ etiqueta: 'Volver al KDS', to: ROUTES.COCINA_KDS }}
        descripcion="Lo que marques como agotado desaparece al instante de la carta QR y de la comanda."
        meta={
          catalogo.length > 0 && (
            <EstadoBadge tema="oscuro" tono={agotados > 0 ? 'error' : 'ok'}>
              {agotados > 0 ? `${agotados} agotados` : 'Todo disponible'}
            </EstadoBadge>
          )
        }
        acciones={
          <IconButton
            tema="oscuro"
            variant="outline"
            etiqueta="Actualizar"
            icono={RefreshCw}
            onClick={cargarCatalogo}
            disabled={cargando}
            className={cargando ? '[&>svg]:motion-safe:animate-spin' : undefined}
          />
        }
      />

      {cargando && catalogo.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3" aria-busy="true" aria-label="Cargando platos">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} tema="oscuro" className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <EstadoError tema="oscuro" mensaje={error} onReintentar={cargarCatalogo} />
      ) : (
        <PanelDisponibilidadPlatos catalogo={catalogo} onConmutarDisponibilidad={handleConmutarDisponibilidad} />
      )}

      <DialogoResolucionFuego
        abierto={dialogoFuegoAbierto}
        onCerrar={() => setDialogoFuegoAbierto(false)}
        plato={platoEnResolucion}
        itemsEnFuego={itemsEnFuegoResolucion}
        onConfirmar={handleConfirmarResolucionFuego}
      />
    </div>
  );
};
