import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import type {
  EstadoHistorialComprobantes,
  FiltrosHistorialComprobantesDTO,
  MedioPagoCodigo,
} from '@/types/caja';
import { ICONOS_MEDIO_PAGO } from './comprobanteFormato';

type TipoFiltro = Exclude<FiltrosHistorialComprobantesDTO['tipo'], 'nota_credito'>;

interface FiltrosHistorialComprobantesProps {
  estado: EstadoHistorialComprobantes;
  tipo: TipoFiltro;
  medio: 'todos' | MedioPagoCodigo;
  /** Medios de pago de la sede, con el nombre que ella les dio */
  medios: { codigo: MedioPagoCodigo; nombre: string }[];
  busqueda: string;
  conteos: { vigentes: number; anulados: number; notasCredito: number };
  onCambiarEstado: (estado: EstadoHistorialComprobantes) => void;
  onCambiarTipo: (tipo: TipoFiltro) => void;
  onCambiarMedio: (medio: 'todos' | MedioPagoCodigo) => void;
  onBuscar: (busqueda: string) => void;
}

const PESTANAS_ESTADO: { id: EstadoHistorialComprobantes; etiqueta: string; activo: string }[] = [
  { id: 'vigente', etiqueta: 'Vigentes', activo: 'text-emerald-700' },
  { id: 'anulado', etiqueta: 'Anulados', activo: 'text-rose-700' },
  { id: 'nota_credito', etiqueta: 'Notas de crédito', activo: 'text-amber-700' },
  { id: 'todos', etiqueta: 'Todos', activo: 'text-slate-900' },
];

const OPCIONES_TIPO: { id: TipoFiltro; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'boleta', etiqueta: 'Boletas' },
  { id: 'factura', etiqueta: 'Facturas' },
  { id: 'nota_venta', etiqueta: 'Notas de venta' },
];

interface BuscadorProps {
  inicial: string;
  onBuscar: (busqueda: string) => void;
}

/** La búsqueda no es dinámica: se ejecuta con el botón o con Enter. */
const Buscador: React.FC<BuscadorProps> = ({ inicial, onBuscar }) => {
  const [valor, setValor] = useState(inicial);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar(valor.trim());
      }}
      className="flex items-center gap-2 w-full lg:w-auto"
    >
      <div className="relative flex-1 lg:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Serie, cliente o documento..."
          aria-label="Buscar por serie, cliente o documento"
          className="w-full min-h-tactil pl-9 pr-9 text-sm rounded-xl bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
        />
        {valor && (
          <button
            type="button"
            onClick={() => {
              setValor('');
              onBuscar('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="min-h-tactil px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors shadow-2xs flex items-center gap-1.5 shrink-0"
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span>Buscar</span>
      </button>
    </form>
  );
};

export const FiltrosHistorialComprobantes: React.FC<FiltrosHistorialComprobantesProps> = ({
  estado,
  tipo,
  medio,
  medios,
  busqueda,
  conteos,
  onCambiarEstado,
  onCambiarTipo,
  onCambiarMedio,
  onBuscar,
}) => {
  const conteoPorEstado: Partial<Record<EstadoHistorialComprobantes, number>> = {
    vigente: conteos.vigentes,
    anulado: conteos.anulados,
    nota_credito: conteos.notasCredito,
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 min-w-0">
        <div
          role="group"
          aria-label="Estado del comprobante"
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold overflow-x-auto"
        >
          {PESTANAS_ESTADO.map((pestana) => {
            const seleccionada = estado === pestana.id;
            const conteo = conteoPorEstado[pestana.id];

            return (
              <button
                key={pestana.id}
                type="button"
                aria-pressed={seleccionada}
                onClick={() => onCambiarEstado(pestana.id)}
                className={cn(
                  'min-h-10 px-3 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5',
                  seleccionada ? `bg-white shadow-xs ${pestana.activo}` : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {pestana.etiqueta}
                {conteo !== undefined && (
                  <span className={cn('text-xs font-mono', seleccionada ? 'opacity-80' : 'text-slate-400')}>{conteo}</span>
                )}
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label="Tipo de comprobante"
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium overflow-x-auto"
        >
          {OPCIONES_TIPO.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={tipo === opcion.id}
              onClick={() => onCambiarTipo(opcion.id)}
              className={cn(
                'min-h-10 px-3 rounded-lg whitespace-nowrap transition-all',
                tipo === opcion.id ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Medio de pago"
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium overflow-x-auto"
        >
          <button
            type="button"
            aria-pressed={medio === 'todos'}
            onClick={() => onCambiarMedio('todos')}
            className={cn(
              'min-h-10 px-3 rounded-lg whitespace-nowrap transition-all',
              medio === 'todos' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Todos los pagos
          </button>
          {medios.map((opcion) => {
            const Icono = ICONOS_MEDIO_PAGO[opcion.codigo];
            const seleccionado = medio === opcion.codigo;

            return (
              <button
                key={opcion.codigo}
                type="button"
                aria-pressed={seleccionado}
                onClick={() => onCambiarMedio(seleccionado ? 'todos' : opcion.codigo)}
                className={cn(
                  'min-h-10 px-3 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5',
                  seleccionado ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Icono className="w-4 h-4 text-amber-600" aria-hidden="true" />
                {opcion.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Se remonta cuando la búsqueda cambia desde fuera (por ejemplo, al limpiar filtros) */}
      <Buscador key={busqueda} inicial={busqueda} onBuscar={onBuscar} />
    </div>
  );
};
