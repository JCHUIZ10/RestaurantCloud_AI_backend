import React, { useState, useEffect, useId } from 'react';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  InsumoAdminDTO,
  MotivoAjusteStock,
  AjustarStockInsumoRequest,
  AjusteStockResultDTO,
} from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalAjustarStockProps {
  abierto: boolean;
  onCerrar: () => void;
  insumo: InsumoAdminDTO | null;
  onAplicarAjuste: (
    id: string,
    req: AjustarStockInsumoRequest
  ) => Promise<AjusteStockResultDTO | null>;
}

const MOTIVOS: Array<{ id: MotivoAjusteStock; label: string; desc: string }> = [
  { id: 'conteo_fisico_inventario', label: 'Conteo físico', desc: 'Cuadre de almacén o cierre de turno' },
  { id: 'merma_desperdicio', label: 'Merma o deterioro', desc: 'Humedad, calor o manipulación' },
  { id: 'ingreso_manual', label: 'Ingreso o corrección', desc: 'Recepción sin orden de compra' },
  { id: 'vencimiento_caducidad', label: 'Vencimiento', desc: 'Producto caducado retirado' },
  { id: 'rotura_accidente', label: 'Rotura o accidente', desc: 'Envase roto o derrame' },
  { id: 'inconsistencia_cocina', label: 'Diferencia en cocina', desc: 'Reportada al despachar' },
];

export const ModalAjustarStock: React.FC<ModalAjustarStockProps> = ({
  abierto,
  onCerrar,
  insumo,
  onAplicarAjuste,
}) => {
  const [stockFisico, setStockFisico] = useState('');
  const [motivo, setMotivo] = useState<MotivoAjusteStock>('conteo_fisico_inventario');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const idForm = useId();

  useEffect(() => {
    if (abierto && insumo) {
      setStockFisico(insumo.stock_actual.toString());
      setMotivo(insumo.stock_actual === 0 ? 'ingreso_manual' : 'conteo_fisico_inventario');
      setNotas('');
      setErrorLocal(null);
      setEnviando(false);
    }
  }, [abierto, insumo]);

  if (!insumo) return null;

  const stockAnterior = insumo.stock_actual;
  const stockNuevoNum = parseFloat(stockFisico);
  const esNumeroValido = !isNaN(stockNuevoNum) && stockNuevoNum >= 0;
  const diferencia = esNumeroValido
    ? Math.round((stockNuevoNum - stockAnterior) * 1000) / 1000
    : 0;

  const dejaEnCero = esNumeroValido && stockNuevoNum === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!esNumeroValido) {
      setErrorLocal('Ingresa una cantidad de stock físico válida mayor o igual a 0.');
      return;
    }

    if (!motivo) {
      setErrorLocal('El motivo del ajuste es obligatorio para fines de auditoría.');
      return;
    }

    setEnviando(true);
    try {
      const res = await onAplicarAjuste(insumo.id, {
        stock_fisico: stockNuevoNum,
        motivo,
        notas: notas.trim() || undefined,
      });

      if (res) {
        onCerrar();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorLocal(err.message);
      } else {
        setErrorLocal('Error al aplicar el ajuste físico de stock.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const IconoDiferencia = diferencia > 0 ? TrendingUp : diferencia < 0 ? TrendingDown : CheckCircle2;
  const n = insumo.platos_afectados_si_quiebra;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!enviando}
      tamano="lg"
      icono={Scale}
      etiqueta={insumo.nombre}
      titulo="Ajustar stock"
      descripcion="El ajuste queda registrado con tu usuario, la fecha y la diferencia."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            variant={dejaEnCero ? 'danger' : 'primary'}
            loading={enviando}
            leftIcon={<Scale className="w-4 h-4" aria-hidden="true" />}
          >
            Aplicar ajuste
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <p className="text-xs text-aurea-navy/60">En sistema</p>
            <p className="font-mono font-bold text-lg text-aurea-navy">
              {stockAnterior.toFixed(3)} <span className="font-sans text-sm font-normal text-aurea-navy/60">{insumo.unidad_medida}</span>
            </p>
          </div>
          <div>
            <label htmlFor={`${idForm}-fisico`} className="block text-xs text-aurea-navy/60 mb-1">
              Contado ahora ({insumo.unidad_medida})
            </label>
            <input
              id={`${idForm}-fisico`}
              type="number"
              step="0.001"
              min="0"
              inputMode="decimal"
              required
              autoFocus
              value={stockFisico}
              onChange={(e) => setStockFisico(e.target.value)}
              placeholder="0.000"
              className="w-full min-h-tactil px-3.5 rounded-xl border-2 border-aurea-copper/60 bg-white font-mono text-lg font-bold text-aurea-navy focus:outline-none focus:border-aurea-copper shadow-sm"
            />
          </div>
          <div
            className={cn(
              'p-3 rounded-xl border',
              diferencia === 0
                ? 'bg-tinta-50 border-tinta-200 text-tinta-700'
                : diferencia > 0
                  ? 'bg-estado-ok-50 border-estado-ok-200 text-estado-ok-800'
                  : 'bg-estado-error-50 border-estado-error-200 text-estado-error-800'
            )}
            aria-live="polite"
          >
            <p className="flex items-center gap-1.5 text-xs">
              <IconoDiferencia className="w-3.5 h-3.5" aria-hidden="true" />
              Diferencia
            </p>
            <p className="font-mono font-bold text-lg">
              {diferencia > 0 ? `+${diferencia.toFixed(3)}` : diferencia.toFixed(3)}
            </p>
          </div>
        </div>

        {n > 0 && !dejaEnCero && (
          <p className="flex items-center gap-1.5 text-sm text-aurea-navy/70">
            <UtensilsCrossed className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            {n} {n === 1 ? 'plato usa' : 'platos usan'} este insumo.
          </p>
        )}

        {dejaEnCero && (
          <div role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-300 text-estado-error-800 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold">El insumo quedará agotado.</strong>{' '}
              {n > 0
                ? `Se pausarán ${n} ${n === 1 ? 'plato' : 'platos'} en la carta y se avisará a cocina.`
                : 'Se avisará a cocina.'}
            </span>
          </div>
        )}

        <fieldset>
          <legend className="block text-sm font-semibold text-aurea-navy mb-2">Motivo</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MOTIVOS.map((m) => {
              const sel = motivo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => setMotivo(m.id)}
                  className={cn(
                    'min-h-tactil px-3 py-2 rounded-xl text-left border transition-colors',
                    sel
                      ? 'bg-aurea-navy text-white border-aurea-navy shadow-sm'
                      : 'bg-white text-aurea-navy/80 border-aurea-champagne/60 hover:border-aurea-copper/50 hover:bg-aurea-champagne/15'
                  )}
                >
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className={cn('block text-xs', sel ? 'text-white/70' : 'text-aurea-navy/55')}>{m.desc}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${idForm}-notas`} className="block text-sm font-semibold text-aurea-navy mb-1.5">
            Notas <span className="font-normal text-aurea-navy/50">(opcional)</span>
          </label>
          <textarea
            id={`${idForm}-notas`}
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. Sacos dañados por humedad; descarte verificado."
            className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/70 bg-white text-base md:text-sm text-aurea-navy resize-none focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
          />
        </div>
      </form>
    </Modal>
  );
};
