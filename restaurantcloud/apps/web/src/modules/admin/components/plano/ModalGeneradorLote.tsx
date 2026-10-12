import React, { useState } from 'react';
import { PisoAdminDTO, CuotaMesasPlanDTO, FormaMesa, CrearMesaLoteRequest } from '@/types/admin';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  if (!isOpen || !pisoActivo) return null;

  const totalMesasNuevas = columnas * filas;
  const excedeCuota = totalMesasNuevas > cuota.mesas_disponibles;
  const cuotaRestante = cuota.mesas_disponibles - totalMesasNuevas;
  const numeroFin = numeroInicio + totalMesasNuevas - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (excedeCuota) return;

    try {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-aurea-copper/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="p-6 bg-aurea-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">Generador Rápido de Mesas (En Lote)</h3>
              <p className="text-xs text-white/70">
                {pisoActivo.nombre} · Configura la distribución geométrica de tu salón por columnas y filas en segundos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Banner de Ambiente Activo */}
          <div className="p-3.5 rounded-2xl bg-aurea-champagne/20 border border-aurea-copper/30 flex items-center justify-between text-xs text-aurea-navy">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-aurea-navy/70 uppercase tracking-wider text-[11px]">
                Ambiente Destino:
              </span>
              <span className="font-bold text-aurea-navy text-sm">{pisoActivo.nombre}</span>
            </div>
            <span className="text-[11px] text-aurea-navy/60 font-medium">
              {pisoActivo.mesas.filter((m) => m.estado === 'activa').length} mesas activas
            </span>
          </div>

          {/* Banner Didáctico */}
          <div className="p-3.5 rounded-2xl bg-aurea-ivory border border-aurea-copper/25 text-xs text-aurea-navy flex items-start gap-3">
            <span className="text-base leading-none">💡</span>
            <div>
              <span className="font-bold">Generación para salón vacío:</span> El sistema calculará y
              acomodará automáticamente las mesas en orden. Posteriormente podrás mover o modificar
              cada mesa en el plano visual.
            </div>
          </div>

          {/* 1. Distribución y Sliders */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
              1. Distribución del Salón
            </label>
            <div className="p-4 rounded-2xl bg-aurea-ivory border border-aurea-copper/25 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-aurea-navy/70">Columnas (ancho):</span>
                    <span className="font-bold text-aurea-navy">{columnas} col</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={columnas}
                    onChange={(e) => setColumnas(parseInt(e.target.value))}
                    className="w-full accent-aurea-copper cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-aurea-navy/70">Filas (profundidad):</span>
                    <span className="font-bold text-aurea-navy">{filas} filas</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={filas}
                    onChange={(e) => setFilas(parseInt(e.target.value))}
                    className="w-full accent-aurea-copper cursor-pointer"
                  />
                </div>
              </div>

              {/* Caja de Cálculo Automático */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                <span>Cálculo: {columnas} col × {filas} filas =</span>
                <span className="font-bold text-sm">{totalMesasNuevas} MESAS TOTALES</span>
              </div>
            </div>
          </div>

          {/* 2. Numeración Correlativa */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
              2. Numeración Correlativa de las Mesas
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-aurea-navy/70 block mb-1">Prefijo:</span>
                <input
                  type="text"
                  value={prefijo}
                  onChange={(e) => setPrefijo(e.target.value)}
                  placeholder="Mesa "
                  className="w-full px-3 py-2 rounded-xl border border-aurea-copper/40 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper"
                />
              </div>
              <div>
                <span className="text-[11px] text-aurea-navy/70 block mb-1">Desde el número:</span>
                <input
                  type="number"
                  min="1"
                  value={numeroInicio}
                  onChange={(e) => setNumeroInicio(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-aurea-copper/40 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper"
                />
              </div>
              <div>
                <span className="text-[11px] text-aurea-navy/70 block mb-1">Hasta el número:</span>
                <div className="px-3 py-2 rounded-xl bg-aurea-ivory border border-aurea-copper/25 text-sm font-semibold text-aurea-navy truncate">
                  {numeroFin} ({prefijo}{numeroInicio} ... {prefijo}{numeroFin})
                </div>
              </div>
            </div>
          </div>

          {/* 3. Capacidad Estándar */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              3. Capacidad Estándar por Mesa
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[2, 4, 6, 8].map((cap) => (
                <button
                  type="button"
                  key={cap}
                  onClick={() => setCapacidad(cap)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    capacidad === cap
                      ? 'bg-aurea-navy text-white border-aurea-navy shadow-sm'
                      : 'bg-white border-aurea-copper/30 text-aurea-navy hover:bg-aurea-champagne/20'
                  }`}
                >
                  {cap} personas
                </button>
              ))}
            </div>
          </div>

          {/* 4. Forma Visual y 5. Permite Unión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                4. Forma Visual
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cuadrada', 'redonda', 'rectangular'] as FormaMesa[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setForma(f)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      forma === f
                        ? 'bg-aurea-copper text-aurea-navy font-bold border-aurea-copper shadow-sm'
                        : 'bg-white border-aurea-copper/30 text-aurea-navy hover:bg-aurea-champagne/20'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                5. Unión para Grupos
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-aurea-copper/30 bg-aurea-ivory cursor-pointer text-xs text-aurea-navy">
                <input
                  type="checkbox"
                  checked={permiteUnion}
                  onChange={(e) => setPermiteUnion(e.target.checked)}
                  className="rounded text-aurea-copper focus:ring-aurea-copper w-4 h-4"
                />
                <span className="font-semibold">Permitir juntar mesas para pedidos grupales</span>
              </label>
            </div>
          </div>

          {/* Auditoría de Cuota de Plan */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
              excedeCuota
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {excedeCuota ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
            )}
            <div>
              <span className="font-bold">
                {excedeCuota ? 'Cuota del Plan Excedida:' : 'Impacto en tu Plan Pro:'}
              </span>{' '}
              {excedeCuota
                ? `Esta acción crearía ${totalMesasNuevas} mesas, pero solo tienes ${cuota.mesas_disponibles} disponibles de tu cupo contratado (${cuota.max_mesas_plan} mesas). Reduce las columnas/filas o solicita una ampliación de plan.`
                : `Creará ${totalMesasNuevas} mesas. Te quedarán ${cuotaRestante} disponibles de ${cuota.max_mesas_plan} para otros salones.`}
            </div>
          </div>

          {/* Botones del Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-aurea-copper/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/20 text-xs sm:text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || excedeCuota}
              className="px-5 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs sm:text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting
                ? 'Generando...'
                : `Generar ${totalMesasNuevas} Mesas en el Salón`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
