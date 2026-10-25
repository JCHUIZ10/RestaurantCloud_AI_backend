import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, Save, Check, Package } from 'lucide-react';
import {
  InsumoAdminDTO,
  UnidadInsumo,
  CrearInsumoRequest,
  ActualizarInsumoRequest,
} from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalCrearEditarInsumoProps {
  abierto: boolean;
  onCerrar: () => void;
  insumoEditar?: InsumoAdminDTO | null;
  onGuardarCrear: (req: CrearInsumoRequest) => Promise<boolean>;
  onGuardarEditar: (id: string, req: ActualizarInsumoRequest) => Promise<boolean>;
}

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 rounded-xl border border-aurea-champagne/70 bg-white text-base md:text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';

// Catálogo cerrado de 10 unidades: 3 base y 7 empaques comerciales
const UNIDADES_BASE: Array<{ id: UnidadInsumo; label: string; desc: string }> = [
  { id: 'kg', label: 'kg', desc: 'A granel' },
  { id: 'L', label: 'Litro', desc: 'Líquidos' },
  { id: 'und', label: 'Unidad', desc: 'Piezas' },
];

const EMPAQUES: Array<{ id: UnidadInsumo; label: string; desc: string }> = [
  { id: 'saco', label: 'Saco', desc: 'Arroz, papa' },
  { id: 'botella', label: 'Botella', desc: 'Bebidas' },
  { id: 'lata', label: 'Lata', desc: 'Conservas' },
  { id: 'caja', label: 'Caja', desc: 'Abarrotes' },
  { id: 'paquete', label: 'Paquete', desc: 'Especias' },
  { id: 'bidon', label: 'Bidón', desc: 'Aceite 20 L' },
  { id: 'jaba', label: 'Jaba', desc: 'Huevos, fruta' },
];

interface OpcionUnidadProps {
  opcion: { id: UnidadInsumo; label: string; desc: string };
  seleccionada: boolean;
  /** Las unidades base se marcan en navy y los empaques en cobre */
  base: boolean;
  onElegir: (id: UnidadInsumo) => void;
}

const OpcionUnidad: React.FC<OpcionUnidadProps> = ({ opcion, seleccionada, base, onElegir }) => (
  <button
    type="button"
    aria-pressed={seleccionada}
    onClick={() => onElegir(opcion.id)}
    className={cn(
      'min-h-tactil px-3 py-2 rounded-xl text-left border transition-colors',
      seleccionada
        ? base
          ? 'bg-aurea-navy text-white border-aurea-navy shadow-sm'
          : 'bg-aurea-copper text-aurea-navy border-aurea-copper shadow-sm'
        : 'bg-white text-aurea-navy/80 border-aurea-champagne/60 hover:border-aurea-copper/50 hover:bg-aurea-champagne/15'
    )}
  >
    <span className="flex items-center justify-between gap-1 text-sm font-bold">
      {opcion.label}
      {seleccionada && <Check className="w-4 h-4" aria-hidden="true" />}
    </span>
    <span className={cn('block text-xs truncate', seleccionada ? 'opacity-80' : 'text-aurea-navy/50')}>{opcion.desc}</span>
  </button>
);

export const ModalCrearEditarInsumo: React.FC<ModalCrearEditarInsumoProps> = ({
  abierto,
  onCerrar,
  insumoEditar,
  onGuardarCrear,
  onGuardarEditar,
}) => {
  const esEdicion = Boolean(insumoEditar);
  const idForm = useId();

  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState<UnidadInsumo>('kg');
  const [stockActual, setStockActual] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('1');
  const [costoUnitario, setCostoUnitario] = useState('0.00');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      if (insumoEditar) {
        setNombre(insumoEditar.nombre);
        setUnidad(insumoEditar.unidad_medida);
        setStockActual(insumoEditar.stock_actual.toString());
        setStockMinimo(insumoEditar.stock_minimo.toString());
        setCostoUnitario(insumoEditar.costo_unitario.toString());
      } else {
        setNombre('');
        setUnidad('kg');
        setStockActual('0');
        setStockMinimo('2');
        setCostoUnitario('0.00');
      }
      setErrorLocal(null);
      setEnviando(false);
    }
  }, [abierto, insumoEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setErrorLocal('Ingresa el nombre comercial del insumo.');
      return;
    }

    const actualNum = parseFloat(stockActual);
    const minNum = parseFloat(stockMinimo);
    const costoNum = parseFloat(costoUnitario);

    if (isNaN(actualNum) || actualNum < 0) {
      setErrorLocal('El stock inicial debe ser un número mayor o igual a 0.');
      return;
    }
    if (isNaN(minNum) || minNum < 0) {
      setErrorLocal('El stock mínimo debe ser un número mayor o igual a 0.');
      return;
    }
    if (isNaN(costoNum) || costoNum < 0) {
      setErrorLocal('El costo unitario debe ser un valor monetario válido.');
      return;
    }

    setEnviando(true);
    try {
      let exito = false;
      if (esEdicion && insumoEditar) {
        exito = await onGuardarEditar(insumoEditar.id, {
          nombre: nombreLimpio,
          unidad_medida: unidad,
          stock_minimo: minNum,
          costo_unitario: costoNum,
        });
      } else {
        exito = await onGuardarCrear({
          nombre: nombreLimpio,
          unidad_medida: unidad,
          stock_actual: actualNum,
          stock_minimo: minNum,
          costo_unitario: costoNum,
          estado: 'activo',
        });
      }

      if (exito) {
        onCerrar();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorLocal(err.message);
      } else {
        setErrorLocal('Ocurrió un error inesperado al guardar el insumo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!enviando}
      tamano="lg"
      icono={Package}
      titulo={esEdicion ? `Editar «${insumoEditar?.nombre ?? ''}»` : 'Nuevo insumo'}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form={idForm} loading={enviando} leftIcon={<Save className="w-4 h-4" aria-hidden="true" />}>
            {esEdicion ? 'Guardar cambios' : 'Guardar insumo'}
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-5">
        {errorLocal && (
          <p
            role="alert"
            className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errorLocal}
          </p>
        )}

        <div>
          <label htmlFor={`${idForm}-nombre`} className={CLASE_ROTULO}>
            Nombre
          </label>
          <input
            id={`${idForm}-nombre`}
            type="text"
            required
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Papa Yungay, Lomo fino, Aceite 20 L"
            className={CLASE_CONTROL}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className={CLASE_ROTULO}>Unidad de almacén</legend>
          <div className="grid grid-cols-3 gap-2">
            {UNIDADES_BASE.map((u) => (
              <OpcionUnidad key={u.id} opcion={u} base seleccionada={unidad === u.id} onElegir={setUnidad} />
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-aurea-copper pt-1">Empaques</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EMPAQUES.map((u) => (
              <OpcionUnidad key={u.id} opcion={u} base={false} seleccionada={unidad === u.id} onElegir={setUnidad} />
            ))}
          </div>
          <p className="text-xs text-aurea-navy/60">
            En cada receta podrás indicar cuántos platos rinde 1 {unidad} o cuánto se descuenta por plato.
          </p>
        </fieldset>

        <div className={cn('grid grid-cols-1 gap-4', esEdicion ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
          {!esEdicion && (
            <div>
              <label htmlFor={`${idForm}-actual`} className={CLASE_ROTULO}>
                Stock inicial <span className="font-normal text-aurea-navy/50">({unidad})</span>
              </label>
              <input
                id={`${idForm}-actual`}
                type="number"
                step="0.001"
                min="0"
                inputMode="decimal"
                required
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                className={cn(CLASE_CONTROL, 'font-mono')}
              />
            </div>
          )}
          <div>
            <label htmlFor={`${idForm}-min`} className={CLASE_ROTULO}>
              Stock mínimo <span className="font-normal text-aurea-navy/50">({unidad})</span>
            </label>
            <input
              id={`${idForm}-min`}
              type="number"
              step="0.001"
              min="0"
              inputMode="decimal"
              required
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              aria-describedby={`${idForm}-min-ayuda`}
              className={cn(CLASE_CONTROL, 'font-mono')}
            />
            <p id={`${idForm}-min-ayuda`} className="text-xs text-aurea-navy/60 mt-1">
              Por debajo, avisa para reponer.
            </p>
          </div>
          <div>
            <label htmlFor={`${idForm}-costo`} className={CLASE_ROTULO}>
              Costo por {unidad}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-aurea-copper" aria-hidden="true">
                S/
              </span>
              <input
                id={`${idForm}-costo`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                required
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(e.target.value)}
                className={cn(CLASE_CONTROL, 'pl-9 font-mono')}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
