import React, { useState } from 'react';
import {
  Receipt,
  X,
  Save,
  Info,
} from 'lucide-react';
import {
  CategoriaGastoManual,
  OrigenFondosGasto,
  RegistrarGastoRequestDTO,
} from '@/types/admin';

interface ModalRegistroGastoManualProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardarGasto: (req: RegistrarGastoRequestDTO) => Promise<void>;
  isSubmitting?: boolean;
}

export const ModalRegistroGastoManual: React.FC<ModalRegistroGastoManualProps> = ({
  isOpen,
  onClose,
  onGuardarGasto,
  isSubmitting = false,
}) => {
  const [categoria, setCategoria] = useState<CategoriaGastoManual>('servicios_basicos');
  const [monto, setMonto] = useState<string>('1420.00');
  const [origenFondos, setOrigenFondos] = useState<OrigenFondosGasto>('transferencia_bancaria');
  const [proveedorNombre, setProveedorNombre] = useState<string>('Enel Distribución Perú S.A.A.');
  const [tipoComprobante, setTipoComprobante] = useState<string>('Recibo Servicios Públicos');
  const [numeroDocumento, setNumeroDocumento] = useState<string>('S001-0982312');
  const [descripcion, setDescripcion] = useState<string>(
    'Pago del suministro eléctrico del salón y cocina correspondiente al ciclo de octubre.'
  );
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const montoNumero = parseFloat(monto) || 0;
  const descripcionValida = descripcion.trim().length >= 10;
  const caracteresFaltantes = Math.max(0, 10 - descripcion.trim().length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoNumero <= 0 || !descripcionValida || !proveedorNombre.trim()) return;

    await onGuardarGasto({
      categoria,
      monto: montoNumero,
      origen_fondos: origenFondos,
      proveedor_nombre: proveedorNombre.trim(),
      tipo_comprobante: tipoComprobante,
      numero_documento: numeroDocumento.trim() || undefined,
      descripcion: descripcion.trim(),
      fecha,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-aurea-navy via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-aurea-copper font-bold">
                Egresos de Sede • CU-ADMIN-14
              </span>
              <h2 className="text-lg font-bold font-serif text-white tracking-tight mt-0.5">
                Registrar Nuevo Gasto Operativo de Sede
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-500 text-xs">
            Ingresa los egresos corrientes de la sede para reflejarlos con exactitud en el balance neto y flujo de caja mensual.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoría */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Categoría del Gasto <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGastoManual)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs"
              >
                <option value="servicios_basicos">Servicios Básicos (Luz/Gas/Agua)</option>
                <option value="alquiler">Alquiler de Local Comercial</option>
                <option value="limpieza_aseo">Limpieza, Aseo y Menaje Interno</option>
                <option value="mantenimiento">Mantenimiento & Equipamiento</option>
                <option value="caja_chica">Caja Chica / Compras Emergencia</option>
                <option value="otros">Otros Egresos Administrativos</option>
              </select>
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Fecha del Gasto <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Monto Total del Egreso (PEN S/) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-aurea-copper text-xs"
                required
              />
            </div>

            {/* Origen Fondos */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Origen de Fondos / Canal de Pago <span className="text-rose-500">*</span>
              </label>
              <select
                value={origenFondos}
                onChange={(e) => setOrigenFondos(e.target.value as OrigenFondosGasto)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs"
              >
                <option value="transferencia_bancaria">🏦 Transferencia Bancaria (Cuenta Empresa)</option>
                <option value="efectivo_caja">💵 Efectivo de Caja Chica / Gaveta Activa</option>
              </select>
            </div>
          </div>

          {/* Callout de Cuadratura Automática */}
          {origenFondos === 'efectivo_caja' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cuadratura Automática de Gaveta:</strong> Al seleccionar <em>Efectivo de Caja Chica / Gaveta</em>, el sistema registrará un movimiento de egreso vinculado al turno activo, descontándolo del efectivo esperado del cajero para no causarle falsos faltantes al cerrar caja en CU-CAJA-05.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Proveedor */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Proveedor / Beneficiario <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={proveedorNombre}
                onChange={(e) => setProveedorNombre(e.target.value)}
                placeholder="Ej. Enel, Sedapal, Inmobiliaria..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs"
                required
              />
            </div>

            {/* Tipo Comprobante */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tipo de Comprobante
              </label>
              <select
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs"
              >
                <option value="Recibo Servicios Públicos">Recibo Servicios Públicos</option>
                <option value="Factura Electrónica">Factura Electrónica</option>
                <option value="Boleta de Venta">Boleta de Venta</option>
                <option value="Recibo por Honorarios">Recibo por Honorarios</option>
                <option value="Recibo Interno">Recibo Interno / Declaración Jurada</option>
              </select>
            </div>
          </div>

          {/* Número Documento */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Número de Comprobante / Recibo (Opcional)
            </label>
            <input
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ej. S001-0982312, F001-0021489..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper text-xs font-mono"
            />
          </div>

          {/* Justificación */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Descripción / Justificación del Gasto <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  descripcionValida ? 'text-emerald-600 font-bold' : 'text-rose-500'
                }`}
              >
                {descripcionValida ? '✓ Válido' : `Mínimo 10 caracteres (faltan ${caracteresFaltantes})`}
              </span>
            </div>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle el motivo del desembolso..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper resize-none"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !descripcionValida || montoNumero <= 0}
              className="px-6 py-2.5 rounded-xl bg-aurea-navy hover:bg-slate-800 active:scale-95 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 border border-aurea-copper/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-aurea-champagne" />
              )}
              <span>Guardar Gasto y Actualizar Flujo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
