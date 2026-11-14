import React, { useEffect, useState } from 'react';
import { Receipt, X, Save, Info } from 'lucide-react';
import { CategoriaGastoManual, OrigenFondosGasto, RegistrarGastoRequestDTO } from '@/types/admin';
import { hoyServidorStr } from '@/shared/utils';
import { CATEGORIAS_GASTO, TIPOS_COMPROBANTE_GASTO } from '@/shared/constants/categoriasGasto';

interface ModalRegistroGastoManualProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardarGasto: (req: RegistrarGastoRequestDTO) => Promise<void>;
  isSubmitting?: boolean;
}

const MIN_CARACTERES_DESCRIPCION = 10;

const CLASE_CAMPO =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Registro de un gasto operativo de la sede. El formulario nace vacío cada vez que se abre:
 * nada viene precargado, para que no se guarde un gasto que nadie escribió.
 */
export const ModalRegistroGastoManual: React.FC<ModalRegistroGastoManualProps> = ({
  isOpen,
  onClose,
  onGuardarGasto,
  isSubmitting = false,
}) => {
  const hoy = hoyServidorStr();

  const [categoria, setCategoria] = useState<CategoriaGastoManual | ''>('');
  const [monto, setMonto] = useState<string>('');
  const [origenFondos, setOrigenFondos] = useState<OrigenFondosGasto>('transferencia_bancaria');
  const [proveedorNombre, setProveedorNombre] = useState<string>('');
  const [tipoComprobante, setTipoComprobante] = useState<string>('recibo_interno');
  const [numeroDocumento, setNumeroDocumento] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [fechaElegida, setFechaElegida] = useState<string>(hoy);

  // Escape cierra el formulario, salvo mientras se guarda
  useEffect(() => {
    if (!isOpen) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // El efectivo sale de la gaveta en este momento: el gasto siempre lleva la fecha de hoy
  const pagoEnEfectivo = origenFondos === 'efectivo_caja';
  const fecha = pagoEnEfectivo ? hoy : fechaElegida;

  const montoNumero = parseFloat(monto);
  const montoValido = Number.isFinite(montoNumero) && montoNumero > 0;
  const descripcionTexto = descripcion.trim();
  const descripcionValida = descripcionTexto.length >= MIN_CARACTERES_DESCRIPCION;
  const caracteresFaltantes = Math.max(0, MIN_CARACTERES_DESCRIPCION - descripcionTexto.length);
  const formularioValido = categoria !== '' && montoValido && descripcionValida && proveedorNombre.trim() !== '' && fecha !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoria === '' || !formularioValido || isSubmitting) return;

    await onGuardarGasto({
      categoria,
      monto: montoNumero,
      origen_fondos: origenFondos,
      proveedor_nombre: proveedorNombre.trim(),
      tipo_comprobante: tipoComprobante,
      numero_documento: numeroDocumento.trim() || undefined,
      descripcion: descripcionTexto,
      fecha,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-registro-gasto"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-aurea-navy via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-aurea-copper font-bold">Egresos de sede</span>
              <h2 id="titulo-registro-gasto" className="text-lg font-bold font-serif text-white tracking-tight mt-0.5">
                Registrar gasto operativo de sede
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar sin guardar el gasto"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-500 text-xs">
            Registra los egresos corrientes de la sede para reflejarlos con exactitud en el balance neto y el flujo de caja.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="gasto-categoria" className="font-semibold text-slate-700 dark:text-slate-300">
                Categoría del gasto <span className="text-rose-500">*</span>
              </label>
              <select
                id="gasto-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGastoManual | '')}
                className={CLASE_CAMPO}
                required
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="gasto-fecha" className="font-semibold text-slate-700 dark:text-slate-300">
                Fecha del gasto <span className="text-rose-500">*</span>
              </label>
              <input
                id="gasto-fecha"
                type="date"
                value={fecha}
                max={hoy}
                onChange={(e) => setFechaElegida(e.target.value)}
                disabled={pagoEnEfectivo}
                className={CLASE_CAMPO}
                required
              />
              {pagoEnEfectivo && <p className="text-[10px] text-slate-500">El efectivo sale de la gaveta ahora, por eso la fecha es la de hoy.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="gasto-monto" className="font-semibold text-slate-700 dark:text-slate-300">
                Monto total del egreso (S/) <span className="text-rose-500">*</span>
              </label>
              <input
                id="gasto-monto"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className={`${CLASE_CAMPO} font-mono font-bold`}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="gasto-origen" className="font-semibold text-slate-700 dark:text-slate-300">
                Origen de fondos <span className="text-rose-500">*</span>
              </label>
              <select
                id="gasto-origen"
                value={origenFondos}
                onChange={(e) => setOrigenFondos(e.target.value as OrigenFondosGasto)}
                className={CLASE_CAMPO}
              >
                <option value="transferencia_bancaria">Transferencia bancaria (cuenta de la empresa)</option>
                <option value="efectivo_caja">Efectivo de la gaveta del turno activo</option>
              </select>
            </div>
          </div>

          {pagoEnEfectivo && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cuadratura automática de gaveta:</strong> el gasto se descuenta del efectivo esperado del turno abierto, así el cajero no
                tendrá un falso faltante al cerrar caja. Requiere un turno abierto y que el monto no supere el efectivo de la gaveta.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="gasto-proveedor" className="font-semibold text-slate-700 dark:text-slate-300">
                Proveedor / beneficiario <span className="text-rose-500">*</span>
              </label>
              <input
                id="gasto-proveedor"
                type="text"
                value={proveedorNombre}
                onChange={(e) => setProveedorNombre(e.target.value)}
                maxLength={120}
                placeholder="Ej. Enel, Sedapal, inmobiliaria..."
                className={CLASE_CAMPO}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="gasto-tipo-comprobante" className="font-semibold text-slate-700 dark:text-slate-300">
                Tipo de comprobante
              </label>
              <select id="gasto-tipo-comprobante" value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)} className={CLASE_CAMPO}>
                {TIPOS_COMPROBANTE_GASTO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="gasto-numero-documento" className="font-semibold text-slate-700 dark:text-slate-300">
              Número de comprobante o recibo (opcional)
            </label>
            <input
              id="gasto-numero-documento"
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              maxLength={80}
              placeholder="Ej. S001-0982312, F001-0021489..."
              className={`${CLASE_CAMPO} font-mono`}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="gasto-descripcion" className="font-semibold text-slate-700 dark:text-slate-300">
                Descripción / justificación <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${descripcionValida ? 'text-emerald-600 font-bold' : 'text-rose-500'}`}>
                {descripcionValida ? '✓ Válido' : `Mínimo ${MIN_CARACTERES_DESCRIPCION} caracteres (faltan ${caracteresFaltantes})`}
              </span>
            </div>
            <textarea
              id="gasto-descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={1000}
              placeholder="Detalla el motivo del desembolso..."
              className={`${CLASE_CAMPO} resize-none`}
              required
            />
          </div>

          {/* Acciones */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formularioValido}
              className="px-6 py-2.5 rounded-xl bg-aurea-navy hover:bg-slate-800 active:scale-95 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 border border-aurea-copper/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-aurea-champagne" />
              )}
              <span>Guardar gasto y actualizar flujo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
