import React, { useState } from 'react';
import { Clock, Flame, Sliders } from 'lucide-react';
import { ConfiguracionKdsDTO } from '@/types/admin';
import { cn } from '@/shared/utils';

interface KdsSimuladorSemaforoProps {
  config: ConfiguracionKdsDTO;
}

const ESTADOS = {
  verde: {
    texto: 'A tiempo',
    badge: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
    tarjeta: 'border-emerald-500/40',
    cabecera: 'bg-emerald-950/40 text-emerald-200 border-emerald-500/20',
    punto: 'bg-emerald-400',
  },
  ambar: {
    texto: 'Retrasada',
    badge: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
    tarjeta: 'border-amber-500/40',
    cabecera: 'bg-amber-950/40 text-amber-200 border-amber-500/20',
    punto: 'bg-amber-400',
  },
  rojo: {
    texto: 'Crítica',
    badge: 'bg-red-950/80 border-red-500 text-red-300 animate-pulse',
    tarjeta: 'border-red-500/80 ring-1 ring-red-500/30',
    cabecera: 'bg-red-950/60 text-red-200 border-red-500/30',
    punto: 'bg-red-400',
  },
};

// Comandas de ejemplo con esperas fijas para ver cómo cambian al mover los umbrales
const EJEMPLOS = [
  { mesa: 'Mesa 4', segundos: 620, platos: ['2 × Lomo saltado', '1 × Causa de pollo'] },
  { mesa: 'Mesa 1', segundos: 1180, platos: ['1 × Ceviche mixto', '1 × Arroz con mariscos'] },
  { mesa: 'Mesa 7', segundos: 1695, platos: ['2 × Bife angosto'] },
];

const formatoEspera = (seg: number) => `${Math.floor(seg / 60)} min ${String(seg % 60).padStart(2, '0')} s`;

/** Vista previa de la pantalla de cocina con los umbrales del borrador. */
export const KdsSimuladorSemaforo: React.FC<KdsSimuladorSemaforoProps> = ({ config }) => {
  const [minutosPrueba, setMinutosPrueba] = useState(14);
  const verde = config.tiempo_optimo_verde_min;
  const ambar = config.tiempo_alerta_ambar_min;
  const maxPrueba = Math.max(45, ambar + 10);

  const estadoDe = (minutos: number) => (minutos <= verde ? ESTADOS.verde : minutos <= ambar ? ESTADOS.ambar : ESTADOS.rojo);
  const estadoPrueba = estadoDe(minutosPrueba);

  return (
    <section className="bg-tinta-900 rounded-2xl border border-tinta-700/80 shadow-xl p-4 sm:p-6 text-tinta-100 space-y-5">
      <header className="flex items-center gap-2.5 pb-3 border-b border-tinta-800">
        <span className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0" aria-hidden="true">
          <Flame className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-tinta-100">Vista previa de cocina</h2>
          <p className="text-xs text-tinta-400">Cambia al momento con cada ajuste del formulario.</p>
        </div>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
        <li className="px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">Verde · hasta {verde} min</li>
        <li className="px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
          Ámbar · {verde + 1}–{ambar} min
        </li>
        <li className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300">Rojo · desde {ambar + 1} min</li>
      </ul>

      <ul className="space-y-3" aria-label="Comandas de ejemplo">
        {EJEMPLOS.map(({ mesa, segundos, platos }) => {
          const e = estadoDe(segundos / 60);
          return (
            <li key={mesa} className={cn('rounded-xl border bg-tinta-800/90 overflow-hidden shadow-md transition-all duration-300', e.tarjeta)}>
              <div className={cn('px-4 py-2 flex items-center justify-between gap-2 border-b text-sm font-bold', e.cabecera)}>
                <span>{mesa}</span>
                <span className={cn('px-2 py-0.5 rounded border text-xs font-bold uppercase', e.badge)}>{e.texto}</span>
              </div>
              <div className="px-4 py-3 flex items-start justify-between gap-3 text-sm">
                <ul className="space-y-0.5 text-tinta-200 min-w-0">
                  {platos.map((p) => (
                    <li key={p} className="truncate">
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="flex items-center gap-1 font-mono text-xs font-semibold text-tinta-200 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-tinta-400" aria-hidden="true" />
                  {formatoEspera(segundos)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="p-4 rounded-xl bg-tinta-950/70 border border-tinta-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="kds-prueba" className="flex items-center gap-1.5 text-sm font-semibold text-tinta-300">
            <Sliders className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            Prueba una espera
          </label>
          <span className="inline-flex items-center gap-2 text-sm font-mono font-bold text-tinta-100" aria-live="polite">
            {minutosPrueba} min
            <span className={cn('px-2 py-0.5 rounded border text-xs uppercase', estadoPrueba.badge)}>{estadoPrueba.texto}</span>
          </span>
        </div>
        <input
          id="kds-prueba"
          type="range"
          min={0}
          max={maxPrueba}
          value={Math.min(minutosPrueba, maxPrueba)}
          onChange={(e) => setMinutosPrueba(parseInt(e.target.value, 10))}
          className="w-full h-11 cursor-pointer accent-aurea-copper"
        />
        <div className="flex justify-between text-xs font-mono text-tinta-500">
          <span>0 min</span>
          <span>{maxPrueba} min</span>
        </div>
      </div>
    </section>
  );
};
