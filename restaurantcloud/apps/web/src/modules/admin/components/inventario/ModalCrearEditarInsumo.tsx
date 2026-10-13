import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';
import {
  InsumoAdminDTO,
  UnidadInsumo,
  CrearInsumoRequest,
  ActualizarInsumoRequest,
} from '@/types/admin';

interface ModalCrearEditarInsumoProps {
  abierto: boolean;
  onCerrar: () => void;
  insumoEditar?: InsumoAdminDTO | null;
  onGuardarCrear: (req: CrearInsumoRequest) => Promise<boolean>;
  onGuardarEditar: (id: string, req: ActualizarInsumoRequest) => Promise<boolean>;
}

export const ModalCrearEditarInsumo: React.FC<ModalCrearEditarInsumoProps> = ({
  abierto,
  onCerrar,
  insumoEditar,
  onGuardarCrear,
  onGuardarEditar,
}) => {
  const esEdicion = Boolean(insumoEditar);

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

  if (!abierto) return null;

  // Catálogo de 10 unidades universales agrupadas
  const unidadesBase: Array<{ id: UnidadInsumo; label: string; desc: string }> = [
    { id: 'kg', label: 'kg (Kilo)', desc: 'Materia prima a granel' },
    { id: 'L', label: 'L (Litro)', desc: 'Líquidos y aceites' },
    { id: 'und', label: 'und (Unidad)', desc: 'Piezas individuales' },
  ];

  const empaquesComerciales: Array<{ id: UnidadInsumo; label: string; desc: string }> = [
    { id: 'saco', label: 'Saco', desc: 'Tubérculos, arroz, granos' },
    { id: 'botella', label: 'Botella', desc: 'Bebidas, vinagres' },
    { id: 'lata', label: 'Lata', desc: 'Conservas, leche, mariscos' },
    { id: 'caja', label: 'Caja', desc: 'Bebidas, abarrotes' },
    { id: 'paquete', label: 'Paquete', desc: 'Especias, sal, fideos' },
    { id: 'bidon', label: 'Bidón', desc: 'Aceites 20L, salsas' },
    { id: 'jaba', label: 'Jaba', desc: 'Huevos, frutas, verduras' },
  ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-aurea-copper/30 w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4.5 border-b border-aurea-champagne/40 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-xl font-serif font-bold text-aurea-navy">
              {esEdicion ? 'Editar Insumo de Almacén' : 'Registrar Nuevo Insumo'}
            </h2>
            <p className="text-xs text-aurea-navy/60 mt-0.5">
              Alta ágil (&lt; 8s) con catálogo estándar de 10 unidades de bodega
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorLocal && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* 1. Nombre Comercial */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
              1. Nombre Comercial del Insumo *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Papa Yungay, Lomo Fino, Aceite 20L"
              className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/70 bg-white text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
            />
            <p className="text-[11px] text-aurea-navy/55 mt-1">
              Identificador único para recetas y sugerencias de compra en esta sede.
            </p>
          </div>

          {/* 2. Selector de 10 Unidades Universales */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              2. Unidad de Almacén (Catálogo Estándar de 10 Unidades) *
            </label>

            {/* Unidades Base */}
            <div className="mb-2">
              <span className="text-[11px] font-semibold text-aurea-navy/60 block mb-1">
                Unidades Base:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {unidadesBase.map((u) => {
                  const sel = unidad === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUnidad(u.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        sel
                          ? 'bg-aurea-navy text-white border-aurea-navy shadow-sm ring-1 ring-aurea-navy'
                          : 'bg-white text-aurea-navy/80 border-aurea-champagne/60 hover:border-aurea-copper/50 hover:bg-aurea-champagne/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{u.label}</span>
                        {sel && <Check className="w-3.5 h-3.5 text-aurea-champagne" />}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${sel ? 'text-white/70' : 'text-aurea-navy/50'}`}>
                        {u.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empaques Comerciales */}
            <div>
              <span className="text-[11px] font-semibold text-aurea-navy/60 block mb-1">
                Empaques Comerciales:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {empaquesComerciales.map((u) => {
                  const sel = unidad === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUnidad(u.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        sel
                          ? 'bg-aurea-copper text-white border-aurea-copper shadow-sm ring-1 ring-aurea-copper'
                          : 'bg-white text-aurea-navy/80 border-aurea-champagne/60 hover:border-aurea-copper/50 hover:bg-aurea-champagne/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{u.label}</span>
                        {sel && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className={`text-[10px] mt-0.5 truncate ${sel ? 'text-white/80' : 'text-aurea-navy/50'}`}>
                        {u.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 y 4. Stock Inicial y Stock Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!esEdicion && (
              <div>
                <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                  3. Stock Inicial Actual ({unidad}) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/70 bg-white font-mono text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
                />
                <span className="text-[11px] text-aurea-navy/55 mt-1 block">
                  Existencias reales hoy en bodega
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                {esEdicion ? 'Stock Mínimo (Umbral)' : '4. Stock Mínimo'} ({unidad}) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/70 bg-white font-mono text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
              />
              <span className="text-[11px] text-aurea-navy/55 mt-1 block">
                Dispara alerta de reposición si baja de este valor
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                {esEdicion ? 'Costo Unitario (S/)' : '5. Costo Unitario Referencial (S/)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-aurea-navy/50">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-aurea-champagne/70 bg-white font-mono text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper shadow-sm"
                />
              </div>
              <span className="text-[11px] text-aurea-navy/55 mt-1 block">
                Para cálculo de valorización de almacén
              </span>
            </div>
          </div>

          {/* Banner de Flexibilidad en Recetas (CU-ADMIN-04) */}
          <div className="p-3.5 rounded-xl bg-aurea-champagne/25 border border-aurea-copper/25 text-xs text-aurea-navy/80 space-y-1">
            <div className="font-semibold text-aurea-navy flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Máxima Flexibilidad en Fichas Técnicas (CU-ADMIN-04)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              No necesitas definir conversiones complejas aquí. Al vincular este insumo a cada plato podrás elegir si 1 <strong>{unidad}</strong> rinde porciones fijas (rendimiento) o descuenta cantidades exactas.
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{enviando ? 'Guardando...' : esEdicion ? 'Actualizar Insumo' : 'Guardar Insumo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
