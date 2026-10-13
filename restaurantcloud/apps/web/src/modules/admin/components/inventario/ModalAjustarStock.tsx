import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  InsumoAdminDTO,
  MotivoAjusteStock,
  AjustarStockInsumoRequest,
  AjusteStockResultDTO,
} from '@/types/admin';

interface ModalAjustarStockProps {
  abierto: boolean;
  onCerrar: () => void;
  insumo: InsumoAdminDTO | null;
  onAplicarAjuste: (
    id: string,
    req: AjustarStockInsumoRequest
  ) => Promise<AjusteStockResultDTO | null>;
}

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

  useEffect(() => {
    if (abierto && insumo) {
      setStockFisico(insumo.stock_actual.toString());
      setMotivo(insumo.stock_actual === 0 ? 'ingreso_manual' : 'conteo_fisico_inventario');
      setNotas('');
      setErrorLocal(null);
      setEnviando(false);
    }
  }, [abierto, insumo]);

  if (!abierto || !insumo) return null;

  const stockAnterior = insumo.stock_actual;
  const stockNuevoNum = parseFloat(stockFisico);
  const esNumeroValido = !isNaN(stockNuevoNum) && stockNuevoNum >= 0;
  const diferencia = esNumeroValido
    ? Math.round((stockNuevoNum - stockAnterior) * 1000) / 1000
    : 0;

  const dejaEnCero = esNumeroValido && stockNuevoNum === 0;

  const motivosList: Array<{ id: MotivoAjusteStock; label: string; desc: string }> = [
    {
      id: 'conteo_fisico_inventario',
      label: 'Conteo Físico Rutinario',
      desc: 'Cuadre periódico de almacén o cierre de turno',
    },
    {
      id: 'merma_desperdicio',
      label: 'Merma / Desperdicio / Deterioro',
      desc: 'Pérdida por humedad, calor o manipulación',
    },
    {
      id: 'ingreso_manual',
      label: 'Ingreso Manual / Corrección',
      desc: 'Ajuste positivo por recepción sin orden previa',
    },
    {
      id: 'vencimiento_caducidad',
      label: 'Vencimiento o Caducidad',
      desc: 'Producto caducado retirado de inventario',
    },
    {
      id: 'rotura_accidente',
      label: 'Rotura o Accidente',
      desc: 'Caída de frasco, rotura de empaque o derrame',
    },
    {
      id: 'inconsistencia_cocina',
      label: 'Inconsistencia de Cocina',
      desc: 'Diferencia reportada por brigada en despacho',
    },
  ];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-aurea-copper/30 w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4.5 border-b border-aurea-champagne/40 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-xl font-serif font-bold text-aurea-navy flex items-center gap-2">
              <Scale className="w-5 h-5 text-aurea-copper" />
              <span>Ajuste Físico de Stock & Auditoría</span>
            </h2>
            <p className="text-xs text-aurea-navy/60 mt-0.5">
              Insumo: <strong>{insumo.nombre}</strong> | Unidad: <strong>{insumo.unidad_medida}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="p-1.5 rounded-lg text-aurea-navy/50 hover:text-aurea-navy hover:bg-aurea-champagne/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Actual y Recetas Vinculadas */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-aurea-champagne/20 border border-aurea-champagne/40 text-xs">
            <div>
              <span className="text-aurea-navy/60 block">Stock Registrado en Sistema:</span>
              <span className="text-base font-mono font-bold text-aurea-navy">
                {stockAnterior.toFixed(3)} {insumo.unidad_medida}
              </span>
            </div>
            <div>
              <span className="text-aurea-navy/60 block">Platos Dependientes en Carta:</span>
              <div className="flex items-center gap-1 font-semibold text-aurea-navy mt-0.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
                <span>
                  {insumo.platos_afectados_si_quiebra}{' '}
                  {insumo.platos_afectados_si_quiebra === 1 ? 'plato' : 'platos'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorLocal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorLocal}</span>
              </div>
            )}

            {/* 1. Nuevo Stock Físico Real Contado y Discrepancia */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                1. Nuevo Stock Físico Real Contado ({insumo.unidad_medida}) *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    autoFocus
                    value={stockFisico}
                    onChange={(e) => setStockFisico(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/70 bg-white font-mono text-base font-bold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
                  />
                </div>

                {/* Badge de Discrepancia Calculada en Vivo */}
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    diferencia === 0
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      : diferencia > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {diferencia > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : diferencia < 0 ? (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    )}
                    <span>Diferencia:</span>
                  </div>
                  <span className="font-mono font-bold">
                    {diferencia > 0 ? `+${diferencia.toFixed(3)}` : diferencia.toFixed(3)}{' '}
                    {insumo.unidad_medida}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerta si deja en 0 (Quiebre Operativo) */}
            {dejaEnCero && (
              <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-900 text-xs space-y-1 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>QUIEBRE INMEDIATO: Insumo pasará a estado AGOTADO</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Al ajustar las existencias a 0, el sistema bloqueará automáticamente la venta de los {insumo.platos_afectados_si_quiebra} plato(s) vinculados en la carta y notificará a la pantalla de cocina (KDS).
                </p>
              </div>
            )}

            {/* 2. Motivo Obligatorio del Ajuste */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-2">
                2. Motivo Obligatorio del Ajuste (Auditoría de Control) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {motivosList.map((m) => {
                  const sel = motivo === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMotivo(m.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        sel
                          ? 'bg-aurea-navy text-white border-aurea-navy shadow-sm ring-1 ring-aurea-navy'
                          : 'bg-white text-aurea-navy/80 border-aurea-champagne/60 hover:bg-aurea-champagne/15'
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                      <div className={`text-[10px] mt-0.5 ${sel ? 'text-white/70' : 'text-aurea-navy/55'}`}>
                        {m.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Notas / Observaciones del Auditor */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                3. Notas / Observaciones del Auditor (Opcional)
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Sacos dañados por humedad tras filtración. Descarte total verificado."
                className="w-full px-3.5 py-2 rounded-xl border border-aurea-champagne/70 bg-white text-xs text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
              />
            </div>

            {/* Banner de Sincronización con Cocina y Mozo */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-aurea-navy">
                <ShieldCheck className="w-3.5 h-3.5 text-aurea-copper" />
                <span>Auditoría & Trazabilidad Activa</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-600">
                Esta acción quedará registrada en <code>auditoria_stock_ajuste</code> con tu usuario, fecha y diferencia calculada para el arqueo mensual del local.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-aurea-champagne/40">
              <button
                type="button"
                onClick={onCerrar}
                disabled={enviando}
                className="px-4 py-2.5 rounded-xl border border-aurea-champagne/70 text-sm font-medium text-aurea-navy/80 hover:bg-aurea-champagne/20 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 min-h-[44px] ${
                  dejaEnCero
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-aurea-navy hover:bg-aurea-navy/90'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>{enviando ? 'Aplicando...' : 'Aplicar Ajuste Físico'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
