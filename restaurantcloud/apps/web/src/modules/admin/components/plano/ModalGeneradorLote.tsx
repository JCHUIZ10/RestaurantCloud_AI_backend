import React, { useState, useId } from 'react';
import { PisoAdminDTO, CuotaMesasPlanDTO, FormaMesa, CrearMesaLoteRequest } from '@/types/admin';
import { Sparkles } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import {
  AvisoFormulario,
  Campo,
  CampoTexto,
  ContadorCapacidad,
  InterruptorUnion,
  SelectorForma,
} from './CamposPlano';

interface ModalGeneradorLoteProps {
  pisos: PisoAdminDTO[];
  pisoSeleccionadoId: string;
  cuota: CuotaMesasPlanDTO;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pisoId: string, payload: CrearMesaLoteRequest) => Promise<void>;
}

export const ModalGeneradorLote: React.FC<ModalGeneradorLoteProps> = ({
  pisos,
  pisoSeleccionadoId,
  cuota,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const pisoActivo = pisos.find((p) => p.id === pisoSeleccionadoId) || pisos[0];
  const pisoId = pisoActivo?.id || pisoSeleccionadoId;

  const [columnas, setColumnas] = useState(5);
  const [filas, setFilas] = useState(2);
  const [prefijo, setPrefijo] = useState('Mesa ');
  const [numeroInicio, setNumeroInicio] = useState(1);
  const [capacidad, setCapacidad] = useState(4);
  const [forma, setForma] = useState<FormaMesa>('cuadrada');
  const [permiteUnion, setPermiteUnion] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const idForm = useId();

  if (!pisoActivo) return null;

  const totalMesasNuevas = columnas * filas;
  const excedeCuota = totalMesasNuevas > cuota.mesas_disponibles
    || pisoActivo.mesas.some((m) => m.estado !== 'inactiva');
  const cuotaRestante = cuota.mesas_disponibles - totalMesasNuevas;
  const numeroFin = numeroInicio + totalMesasNuevas - 1;
  const codigoInvalido = `${prefijo}${String(numeroFin).padStart(2, '0')}`.trim().length > 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (excedeCuota || codigoInvalido) return;

    try {
      setErrorLocal(null);
      setIsSubmitting(true);
      await onSubmit(pisoId, {
        columnas,
        filas,
        prefijo,
        numero_inicio: numeroInicio,
        capacidad,
        forma,
        permite_union: permiteUnion,
      });
      onClose();
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudo generar el lote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!isSubmitting}
      tamano="lg"
      icono={Sparkles}
      etiqueta={pisoActivo.nombre}
      titulo="Generar mesas en lote"
      descripcion="Se crean numeradas y ordenadas en la cuadrícula; luego puedes mover o editar cada una."
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            loading={isSubmitting}
            disabled={excedeCuota || codigoInvalido}
            leftIcon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
          >
            Generar {totalMesasNuevas} mesas
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} className="space-y-6">
        {errorLocal && <AvisoFormulario tono="error">{errorLocal}</AvisoFormulario>}

        <section className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo etiqueta={`Columnas: ${columnas}`}>
              {(id) => (
                <input
                  id={id}
                  type="range"
                  min="1"
                  max="8"
                  value={columnas}
                  onChange={(e) => setColumnas(parseInt(e.target.value))}
                  className="w-full min-h-tactil accent-aurea-copper cursor-pointer"
                />
              )}
            </Campo>
            <Campo etiqueta={`Filas: ${filas}`}>
              {(id) => (
                <input
                  id={id}
                  type="range"
                  min="1"
                  max="6"
                  value={filas}
                  onChange={(e) => setFilas(parseInt(e.target.value))}
                  className="w-full min-h-tactil accent-aurea-copper cursor-pointer"
                />
              )}
            </Campo>
          </div>
          <p className="flex items-baseline justify-between gap-3 pt-3 border-t border-aurea-champagne/60 text-sm text-aurea-navy/70">
            {columnas} × {filas}
            <span>
              <span className="font-serif text-2xl font-bold text-aurea-navy tabular-nums">{totalMesasNuevas}</span> mesas
            </span>
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo etiqueta="Prefijo">
            {(id) => (
              <CampoTexto id={id} type="text" value={prefijo} onChange={(e) => setPrefijo(e.target.value)} placeholder="Mesa " />
            )}
          </Campo>
          <Campo etiqueta="Empieza en" ayuda={`Quedarán de «${prefijo}${numeroInicio}» a «${prefijo}${numeroFin}».`}>
            {(id) => (
              <CampoTexto
                id={id}
                type="number"
                min="1"
                value={numeroInicio}
                onChange={(e) => setNumeroInicio(parseInt(e.target.value) || 1)}
              />
            )}
          </Campo>
        </div>
        {codigoInvalido && (
          <AvisoFormulario tono="error">El prefijo y el número deben sumar como máximo 10 caracteres.</AvisoFormulario>
        )}

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-aurea-navy">Capacidad por mesa</p>
          <ContadorCapacidad valor={capacidad} onCambiar={setCapacidad} />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-aurea-navy">Forma</p>
          <SelectorForma valor={forma} onCambiar={setForma} />
        </div>

        <InterruptorUnion activo={permiteUnion} onCambiar={setPermiteUnion} />

        <AvisoFormulario tono={excedeCuota ? 'error' : 'ok'}>
          {excedeCuota
            ? `No hay espacio: crearías ${totalMesasNuevas} mesas y quedan ${cuota.mesas_disponibles} en tu plan, o el ambiente ya tiene mesas. Reduce columnas o filas.`
            : `Te quedarán ${cuotaRestante} de ${cuota.max_mesas_plan} mesas disponibles en tu plan ${cuota.plan_nombre || 'actual'}.`}
        </AvisoFormulario>
      </form>
    </Modal>
  );
};
