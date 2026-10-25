import React, { useState, useMemo } from 'react';
import { AlertTriangle, Ban, Clock, Flame, Lock, RotateCcw, Search } from 'lucide-react';
import { PlatoDisponibilidadDTO } from '@/types/cocina';
import { Button, CampoBusqueda, EstadoBadge, EstadoVacio, Pestanas } from '@/components/ui';
import { cn } from '@/shared/utils';

interface PanelDisponibilidadPlatosProps {
  catalogo: PlatoDisponibilidadDTO[];
  onConmutarDisponibilidad: (productoId: string, nuevoEstado: 'disponible' | 'agotado') => void;
  className?: string;
}

const TODAS = 'Todas';

/** Filtros y rejilla táctil de disponibilidad; lo usan la pantalla de stock rápido y el modal del KDS. */
export const PanelDisponibilidadPlatos: React.FC<PanelDisponibilidadPlatosProps> = ({
  catalogo,
  onConmutarDisponibilidad,
  className,
}) => {
  const [categoriaActiva, setCategoriaActiva] = useState<string>(TODAS);
  const [busqueda, setBusqueda] = useState<string>('');

  // Pestañas por categoría con total y aviso si alguna tiene platos agotados
  const categorias = useMemo(() => {
    const safeCatalogo = catalogo || [];
    const stats = new Map<string, { total: number; apagados: number }>();
    safeCatalogo.forEach((p) => {
      const cat = p.categoria_nombre || 'Sin categoría';
      const actual = stats.get(cat) ?? { total: 0, apagados: 0 };
      actual.total += 1;
      if (p.disponibilidad === 'agotado') actual.apagados += 1;
      stats.set(cat, actual);
    });
    const apagadosTotal = safeCatalogo.filter((p) => p.disponibilidad === 'agotado').length;
    return [
      {
        valor: TODAS,
        etiqueta: TODAS,
        conteo: safeCatalogo.length,
        punto: apagadosTotal ? 'bg-estado-error-500' : 'bg-estado-ok-500',
        alerta: apagadosTotal ? `${apagadosTotal} agotados` : undefined,
      },
      ...Array.from(stats, ([nombre, s]) => ({
        valor: nombre,
        etiqueta: nombre,
        conteo: s.total,
        punto: s.apagados ? 'bg-estado-error-500' : 'bg-estado-ok-500',
        alerta: s.apagados ? `${s.apagados} agotados` : undefined,
      })),
    ];
  }, [catalogo]);

  const platosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (catalogo || []).filter((p) => {
      const matchCat = categoriaActiva === TODAS || p.categoria_nombre === categoriaActiva;
      const matchBusqueda =
        q === '' ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.receta_resumen && p.receta_resumen.toLowerCase().includes(q));
      return matchCat && matchBusqueda;
    });
  }, [catalogo, categoriaActiva, busqueda]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-2.5 rounded-2xl bg-tinta-950 border border-tinta-800">
        <Pestanas
          tema="oscuro"
          etiqueta="Filtrar por categoría"
          opciones={categorias}
          valor={categoriaActiva}
          onCambiar={setCategoriaActiva}
          className="lg:flex-1 lg:min-w-0 !bg-tinta-900 !border-tinta-700"
        />
        <CampoBusqueda
          tema="oscuro"
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar plato o insumo"
          etiqueta="Buscar plato o insumo"
          className="lg:w-72 lg:shrink-0"
        />
      </div>

      {platosFiltrados.length === 0 ? (
        <EstadoVacio
          tema="oscuro"
          icono={Search}
          titulo="Sin platos que mostrar"
          descripcion="Ningún plato coincide con la categoría o la búsqueda."
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          {platosFiltrados.map((plato) => (
            <li key={plato.producto_id}>
              <TarjetaDisponibilidad plato={plato} onConmutar={onConmutarDisponibilidad} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TarjetaDisponibilidad: React.FC<{
  plato: PlatoDisponibilidadDTO;
  onConmutar: PanelDisponibilidadPlatosProps['onConmutarDisponibilidad'];
}> = ({ plato, onConmutar }) => {
  const esDisponible = plato.disponibilidad === 'disponible';
  const esQuiebreStock = plato.motivo_agotado === 'quiebre_stock_receta';
  const esApagadoManual = plato.motivo_agotado === 'apagado_manual_cocina';

  return (
    <article
      className={cn(
        'h-full rounded-2xl border border-l-4 p-4 flex flex-col gap-3 transition-colors',
        esDisponible
          ? 'bg-estado-ok-950/25 border-estado-ok-900/60 border-l-estado-ok-500'
          : esQuiebreStock
            ? 'bg-estado-error-950/50 border-estado-error-800 border-l-estado-error-500'
            : 'bg-estado-alerta-950/50 border-estado-alerta-800 border-l-estado-alerta-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-tinta-400 truncate">{plato.categoria_nombre}</span>
        <EstadoBadge tema="oscuro" tono={esDisponible ? 'ok' : 'error'}>
          {esDisponible ? 'Disponible' : 'Agotado'}
        </EstadoBadge>
      </div>

      <div className="flex-1 space-y-1">
        <h3 className={cn('text-base font-semibold leading-snug', esDisponible ? 'text-white' : 'text-tinta-300')}>
          {plato.nombre}
        </h3>
        {plato.receta_resumen && <p className="text-sm text-tinta-400 line-clamp-2">{plato.receta_resumen}</p>}
      </div>

      {esDisponible && (plato.ordenes_en_fuego > 0 || plato.ordenes_en_cola > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {plato.ordenes_en_fuego > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-estado-alerta-500/15 border border-estado-alerta-500/35 text-estado-alerta-300 text-sm">
              <Flame className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums font-semibold">{plato.ordenes_en_fuego}</span> en fuego
            </span>
          )}
          {plato.ordenes_en_cola > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-aurea-copper/15 border border-aurea-copper/35 text-aurea-champagne text-sm">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums font-semibold">{plato.ordenes_en_cola}</span> en cola
            </span>
          )}
        </div>
      )}

      {esQuiebreStock && (
        <p className="flex items-start gap-2 text-sm text-estado-error-200">
          <Ban className="w-4 h-4 mt-0.5 shrink-0 text-estado-error-300" aria-hidden="true" />
          <span>
            <span className="font-semibold">Sin stock:</span>{' '}
            {plato.insumo_bloqueante || 'un insumo de la receta está agotado en almacén'}
          </span>
        </p>
      )}

      {esApagadoManual && (
        <p className="flex items-start gap-2 text-sm text-estado-alerta-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-estado-alerta-300" aria-hidden="true" />
          <span>
            <span className="font-semibold">Apagado en cocina</span> por {plato.usuario_modifico_nombre || 'el chef de partida'}
          </span>
        </p>
      )}

      {esDisponible ? (
        <Button
          tema="oscuro"
          variant="outline"
          size="lg"
          className="w-full text-estado-error-200 border-estado-error-800 hover:bg-estado-error-950/60 hover:text-estado-error-100"
          onClick={() => onConmutar(plato.producto_id, 'agotado')}
          leftIcon={<Ban className="w-5 h-5" aria-hidden="true" />}
        >
          Marcar agotado
        </Button>
      ) : esQuiebreStock ? (
        <Button
          tema="oscuro"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled
          title="El insumo está en cero: se libera al registrar la compra en almacén."
          leftIcon={<Lock className="w-5 h-5" aria-hidden="true" />}
        >
          Bloqueado por stock
        </Button>
      ) : (
        <Button
          tema="oscuro"
          size="lg"
          className="w-full"
          onClick={() => onConmutar(plato.producto_id, 'disponible')}
          leftIcon={<RotateCcw className="w-5 h-5" aria-hidden="true" />}
        >
          Reactivar
        </Button>
      )}
    </article>
  );
};
