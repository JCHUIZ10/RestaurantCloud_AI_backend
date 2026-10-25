import React, { useState, useMemo, useEffect } from 'react';
import { Flame, AlertOctagon, CheckCircle2, Info, Timer } from 'lucide-react';
import { ItemEnFuegoResolucionDTO, PlatoDisponibilidadDTO } from '@/types/cocina';
import { Button, EstadoBadge, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

const MOTIVOS = [
  'Falta de insumo fresco en partida culinaria',
  'Merma imprevista en proceso de cocción',
  'Falla mecánica en wok / equipamiento de cocina',
];

interface DialogoResolucionFuegoProps {
  abierto: boolean;
  onCerrar: () => void;
  plato: PlatoDisponibilidadDTO | null;
  itemsEnFuego: ItemEnFuegoResolucionDTO[];
  onConfirmar: (
    productoId: string,
    itemsEnFuegoNoAlcanzadosIds: string[],
    motivo: string
  ) => void;
}

export const DialogoResolucionFuego: React.FC<DialogoResolucionFuegoProps> = ({
  abierto,
  onCerrar,
  plato,
  itemsEnFuego,
  onConfirmar,
}) => {
  const [porcionesCubiertas, setPorcionesCubiertas] = useState<number>(0);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>(
    'Falta de insumo fresco en partida culinaria'
  );

  const totalRacionesEnFuego = useMemo(() => {
    return (itemsEnFuego || []).reduce((acc, it) => acc + (it.cantidad || 0), 0);
  }, [itemsEnFuego]);

  // Sincronizar porciones cubiertas cuando se abre el diálogo o cambia el total en fuego
  useEffect(() => {
    if (abierto && plato) {
      setPorcionesCubiertas(Math.max(0, totalRacionesEnFuego - 1));
    }
  }, [abierto, plato, totalRacionesEnFuego]);

  // Determinar cuáles ítems quedan cubiertos (FIFO) y cuáles pasan a no_disponible
  const evaluacionItems = useMemo(() => {
    let saldo = porcionesCubiertas;
    const safeItems = itemsEnFuego || [];
    const resultado = safeItems.map((it) => {
      const cubierto = saldo >= it.cantidad;
      if (cubierto) {
        saldo -= it.cantidad;
      }
      return {
        ...it,
        cubierto,
      };
    });
    return resultado;
  }, [itemsEnFuego, porcionesCubiertas]);

  const noAlcanzados = useMemo(() => {
    return evaluacionItems.filter((i) => !i.cubierto);
  }, [evaluacionItems]);

  const handleConfirmarResolucion = () => {
    if (!plato) return;
    const idsNoAlcanzados = noAlcanzados.map((i) => i.item_id);
    onConfirmar(plato.producto_id, idsNoAlcanzados, motivoSeleccionado);
    onCerrar();
  };

  if (!plato) return null;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      tema="oscuro"
      tamano="lg"
      tono="error"
      icono={Flame}
      etiqueta="Platos en preparación"
      titulo={`¿Para cuántas porciones de «${plato.nombre}» alcanza?`}
      descripcion={`${totalRacionesEnFuego} raciones en fuego. Las que están en cola se cancelan automáticamente.`}
      pie={
        <>
          <Button tema="oscuro" variant="ghost" onClick={onCerrar}>
            Mantener en fuego
          </Button>
          <Button
            tema="oscuro"
            variant="danger"
            onClick={handleConfirmarResolucion}
            leftIcon={<AlertOctagon className="w-4 h-4" aria-hidden="true" />}
          >
            Confirmar y avisar a mozos ({noAlcanzados.length})
          </Button>
        </>
      }
    >
      <div className="space-y-6 text-sm">
        <fieldset className="space-y-2">
          <legend className="font-semibold text-tinta-100">Porciones que se pueden terminar</legend>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: totalRacionesEnFuego + 1 }, (_, i) => i).map((num) => {
              const seleccionado = porcionesCubiertas === num;
              return (
                <button
                  key={num}
                  type="button"
                  aria-pressed={seleccionado}
                  onClick={() => setPorcionesCubiertas(num)}
                  className={cn(
                    'min-h-12 min-w-14 px-3 rounded-xl font-semibold tabular-nums transition-colors',
                    seleccionado
                      ? 'bg-aurea-copper text-aurea-navy'
                      : 'bg-tinta-800 text-tinta-200 border border-tinta-700 hover:bg-tinta-700'
                  )}
                >
                  {num === 0 ? 'Ninguna' : num === totalRacionesEnFuego ? `${num} (todas)` : num}
                </button>
              );
            })}
          </div>
          <p className="flex items-start gap-2 text-tinta-400">
            <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Se completan primero las comandas que llevan más tiempo esperando.</span>
          </p>
        </fieldset>

        <section className="space-y-2" aria-label="Reparto por comanda">
          <h3 className="font-semibold text-tinta-100">Reparto por comanda</h3>
          <ul className="space-y-2">
            {evaluacionItems.map((item) => (
              <li
                key={item.item_id}
                className={cn(
                  'p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
                  item.cubierto
                    ? 'bg-estado-ok-950/30 border-estado-ok-900'
                    : 'bg-estado-error-950/30 border-estado-error-900'
                )}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 text-white">
                    <span className="font-semibold">Comanda #{item.numero_comanda}</span>
                    <span className="text-tinta-300">Mesa {item.mesa_codigo}</span>
                    <span className="flex items-center gap-1 text-estado-alerta-300">
                      <Timer className="w-4 h-4" aria-hidden="true" />
                      <span className="tabular-nums">{item.minutos_espera} min</span>
                    </span>
                  </p>
                  <p className="text-tinta-400">
                    {item.mozo_nombre} · {item.cantidad} ración(es)
                  </p>
                </div>
                <EstadoBadge
                  tema="oscuro"
                  tono={item.cubierto ? 'ok' : 'error'}
                  icono={item.cubierto ? CheckCircle2 : AlertOctagon}
                  className="self-start sm:self-auto"
                >
                  {item.cubierto ? 'Se prepara' : 'No alcanza'}
                </EstadoBadge>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-1.5">
          <label htmlFor="motivo-quiebre" className="font-semibold text-tinta-100 block">
            Motivo
          </label>
          <select
            id="motivo-quiebre"
            value={motivoSeleccionado}
            onChange={(e) => setMotivoSeleccionado(e.target.value)}
            className="w-full min-h-tactil bg-tinta-950 border border-tinta-700 rounded-xl px-3 text-base md:text-sm text-tinta-100 focus:outline-none focus:border-aurea-copper"
          >
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};
