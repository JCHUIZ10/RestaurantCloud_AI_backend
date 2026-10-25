import React, { useState, useEffect, useRef, useId } from 'react';
import { PisoAdminDTO, CuotaMesasPlanDTO, FormaMesa, CrearMesaIndividualRequest } from '@/types/admin';
import { Plus, Minus, Check } from 'lucide-react';
import { Button, IconButton, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';
import {
  AvisoFormulario,
  Campo,
  CampoTexto,
  ContadorCapacidad,
  InterruptorUnion,
  SelectorForma,
} from './CamposPlano';

interface ModalMesaIndividualProps {
  pisos: PisoAdminDTO[];
  pisoSeleccionadoId: string;
  cuota: CuotaMesasPlanDTO;
  posicionInicial?: { x: number; y: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pisoId: string, payload: CrearMesaIndividualRequest) => Promise<void>;
  onModificarDimensiones: (pisoId: string, deltaCol: number, deltaFila: number) => Promise<void>;
}

export const ModalMesaIndividual: React.FC<ModalMesaIndividualProps> = ({
  pisos,
  pisoSeleccionadoId,
  cuota,
  posicionInicial,
  isOpen,
  onClose,
  onSubmit,
  onModificarDimensiones,
}) => {
  const pisoActivo = pisos.find((p) => p.id === pisoSeleccionadoId) || pisos[0];
  const pisoId = pisoActivo?.id || pisoSeleccionadoId;
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);
  const [forma, setForma] = useState<FormaMesa>('cuadrada');
  const [permiteUnion, setPermiteUnion] = useState(true);
  const [posX, setPosX] = useState(posicionInicial?.x ?? 0);
  const [posY, setPosY] = useState(posicionInicial?.y ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const aperturaInicializada = useRef('');
  const idForm = useId();


  // Sugerir correlativo automático al abrir o cambiar de piso
  useEffect(() => {
    if (!isOpen) {
      aperturaInicializada.current = '';
      return;
    }
    const clave = `${pisoActivo?.id}:${posicionInicial?.x}:${posicionInicial?.y}`;
    if (aperturaInicializada.current === clave) return;
    aperturaInicializada.current = clave;
    if (pisoActivo) {
      setErrorLocal(null);
      const mesasActivas = pisoActivo.mesas.filter((m) => m.estado !== 'inactiva');
      const numerosNum = mesasActivas
        .map((m) => parseInt(m.numero.replace(/\D/g, '')))
        .filter((n) => !isNaN(n));
      const maxNum = numerosNum.length > 0 ? Math.max(...numerosNum) : 0;
      const sugerido = maxNum + 1;
      setNumero(sugerido < 10 ? `0${sugerido}` : `${sugerido}`);

      // Si se proporcionó una posición inicial
      if (posicionInicial) {
        setPosX(posicionInicial.x);
        setPosY(posicionInicial.y);
      } else {
        // Encontrar primer slot libre
        const mapa = new Set(mesasActivas.map((m) => `${m.posicion_x}-${m.posicion_y}`));
        let found = false;
        for (let f = 0; f < pisoActivo.filas && !found; f++) {
          for (let c = 0; c < pisoActivo.columnas && !found; c++) {
            if (!mapa.has(`${c}-${f}`)) {
              setPosX(c);
              setPosY(f);
              found = true;
            }
          }
        }
      }
    }
  }, [pisoActivo, posicionInicial, isOpen]);

  if (!pisoActivo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || cuota.mesas_disponibles <= 0 || mapaMesas.has(`${posX}-${posY}`)
      || posX >= pisoActivo.columnas || posY >= pisoActivo.filas) return;
    try {
      setErrorLocal(null);
      setIsSubmitting(true);
      await onSubmit(pisoId, {
        numero: numero.trim(),
        capacidad,
        forma,
        posicion_x: posX,
        posicion_y: posY,
        permite_union: permiteUnion,
      });
      onClose();
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudo guardar la mesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Matriz de mini-mapa
  const mapaMesas = new Map<string, string>();
  pisoActivo.mesas
    .filter((m) => m.estado !== 'inactiva')
    .forEach((m) => {
      mapaMesas.set(`${m.posicion_x}-${m.posicion_y}`, m.numero);
    });

  const celdasMiniMapa = [];
  for (let f = 0; f < pisoActivo.filas; f++) {
    for (let c = 0; c < pisoActivo.columnas; c++) {
      const numExistente = mapaMesas.get(`${c}-${f}`);
      const esSeleccionada = posX === c && posY === f;
      celdasMiniMapa.push({
        c,
        f,
        numExistente,
        esSeleccionada,
      });
    }
  }

  const casillaInvalida = mapaMesas.has(`${posX}-${posY}`) || posX >= pisoActivo.columnas || posY >= pisoActivo.filas;

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!isSubmitting}
      tamano="xl"
      icono={Plus}
      etiqueta={pisoActivo.nombre}
      titulo="Nueva mesa"
      descripcion={`Quedarán ${Math.max(0, cuota.mesas_disponibles - 1)} de ${cuota.max_mesas_plan} mesas disponibles en tu plan.`}
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            loading={isSubmitting}
            disabled={!numero.trim() || cuota.mesas_disponibles <= 0 || casillaInvalida}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            Guardar mesa
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <form id={idForm} onSubmit={handleSubmit} className="space-y-5">
          {errorLocal && <AvisoFormulario tono="error">{errorLocal}</AvisoFormulario>}

          <Campo etiqueta="Número o código" ayuda="Te sugerimos el siguiente correlativo libre.">
            {(id) => (
              <CampoTexto
                id={id}
                type="text"
                required
                autoFocus
                maxLength={10}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej. 11"
                className="font-bold"
              />
            )}
          </Campo>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-aurea-navy">Capacidad</p>
            <ContadorCapacidad valor={capacidad} onCambiar={setCapacidad} />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-aurea-navy">Forma</p>
            <SelectorForma valor={forma} onCambiar={setForma} />
          </div>

          <InterruptorUnion activo={permiteUnion} onCambiar={setPermiteUnion} />
        </form>

        <section aria-label="Ubicación en el plano" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-aurea-navy">Ubicación</p>
            <div className="flex items-center gap-3 text-xs text-aurea-navy/60">
              <span className="flex items-center gap-1">
                <IconButton size="sm" variant="outline" icono={Minus} etiqueta="Quitar columna vacía"
                  onClick={() => onModificarDimensiones(pisoId, -1, 0)} disabled={pisoActivo.columnas <= 1} />
                <span className="tabular-nums">{pisoActivo.columnas} col.</span>
                <IconButton size="sm" variant="outline" icono={Plus} etiqueta="Añadir columna"
                  onClick={() => onModificarDimensiones(pisoId, 1, 0)} disabled={pisoActivo.columnas >= 12} />
              </span>
              <span className="flex items-center gap-1">
                <IconButton size="sm" variant="outline" icono={Minus} etiqueta="Quitar fila vacía"
                  onClick={() => onModificarDimensiones(pisoId, 0, -1)} disabled={pisoActivo.filas <= 1} />
                <span className="tabular-nums">{pisoActivo.filas} filas</span>
                <IconButton size="sm" variant="outline" icono={Plus} etiqueta="Añadir fila"
                  onClick={() => onModificarDimensiones(pisoId, 0, 1)} disabled={pisoActivo.filas >= 10} />
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 overflow-x-auto">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${pisoActivo.columnas}, minmax(44px, 1fr))` }}
            >
              {celdasMiniMapa.map(({ c, f, numExistente, esSeleccionada }) => {
                const key = `mini-${c}-${f}`;
                if (numExistente) {
                  return (
                    <div
                      key={key}
                      title={`Mesa ${numExistente}`}
                      className="h-11 rounded-lg bg-aurea-champagne/40 text-xs font-bold text-aurea-navy/50 flex items-center justify-center select-none truncate px-1"
                    >
                      {numExistente}
                    </div>
                  );
                }
                return (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={esSeleccionada}
                    aria-label={`Columna ${c + 1}, fila ${f + 1}`}
                    onClick={() => {
                      setPosX(c);
                      setPosY(f);
                    }}
                    className={cn(
                      'h-11 rounded-lg flex items-center justify-center text-xs font-bold transition-colors truncate px-1',
                      esSeleccionada
                        ? 'bg-aurea-navy text-aurea-champagne ring-2 ring-aurea-copper shadow-sm'
                        : 'bg-white border border-dashed border-aurea-copper/50 text-aurea-copper hover:bg-aurea-champagne/30'
                    )}
                  >
                    {esSeleccionada ? numero || 'Nueva' : <Plus className="w-3.5 h-3.5" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-aurea-navy/60">
            Toca una casilla libre para ubicarla. Elegida: columna {posX + 1}, fila {posY + 1}.
          </p>
        </section>
      </div>
    </Modal>
  );
};
