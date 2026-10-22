import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlatoDisponibilidadDTO, ItemEnFuegoResolucionDTO } from '@/types/cocina';
import { cocinaService } from '@/services/serviceAdapter';
import { ModalDisponibilidadPlatos } from '../components/kds/ModalDisponibilidadPlatos';
import { DialogoResolucionFuego } from '../components/kds/DialogoResolucionFuego';
import { ArrowLeft, UtensilsCrossed, RefreshCw } from 'lucide-react';

export const CocinaStockRapidoPage: React.FC = () => {
  const navigate = useNavigate();

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
        alert(res.errores[0].mensaje);
      }
    } catch {
      alert('Error de comunicación con el servidor al actualizar disponibilidad.');
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
        alert(res.errores[0].mensaje);
      }
    } catch {
      alert('Error al confirmar resolución de fuego.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra superior de terminal táctil */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-aurea-champagne">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-black text-lg text-white tracking-wide flex items-center gap-2">
              <span>GESTIÓN DE QUIEBRES Y DISPONIBILIDAD</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-aurea-champagne border border-slate-700 font-bold">
                CU-COCINA-04
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Terminal táctil de fogones • Apagado inmediato en carta digital y POS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarCatalogo}
            disabled={cargando}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 text-xs font-mono flex items-center gap-1.5"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <button
            onClick={() => navigate('/cocina/kds')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono transition-colors flex items-center gap-2 shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Pantalla KDS</span>
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        {cargando && catalogo.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-aurea-champagne" />
            <p className="text-sm font-mono">Cargando catálogo de platos y estado de bodega...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-400 gap-3">
            <p className="text-sm font-mono">{error}</p>
            <button
              onClick={cargarCatalogo}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono"
            >
              Reintentar
            </button>
          </div>
        ) : (
          /* Modal montado a pantalla completa en la ruta dedicada */
          <ModalDisponibilidadPlatos
            abierto={true}
            onCerrar={() => navigate('/cocina/kds')}
            catalogo={catalogo}
            onConmutarDisponibilidad={handleConmutarDisponibilidad}
          />
        )}

        {/* Diálogo de Resolución de Órdenes en Fuego Activo */}
        <DialogoResolucionFuego
          abierto={dialogoFuegoAbierto}
          onCerrar={() => setDialogoFuegoAbierto(false)}
          plato={platoEnResolucion}
          itemsEnFuego={itemsEnFuegoResolucion}
          onConfirmar={handleConfirmarResolucionFuego}
        />
      </main>
    </div>
  );
};
