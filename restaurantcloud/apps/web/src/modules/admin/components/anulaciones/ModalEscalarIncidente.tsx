import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';
import {
  PedidoAnulacionItemDTO,
  EscalarIncidenteAnulacionRequest,
  CategoriaIncidente,
  GravedadIncidente,
} from '@/types/admin';

interface ModalEscalarIncidenteProps {
  isOpen: boolean;
  onClose: () => void;
  anulacion: PedidoAnulacionItemDTO | null;
  onEscalar: (
    anulacionId: string,
    req: EscalarIncidenteAnulacionRequest
  ) => Promise<boolean>;
}

export const ModalEscalarIncidente: React.FC<ModalEscalarIncidenteProps> = ({
  isOpen,
  onClose,
  anulacion,
  onEscalar,
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaIncidente>('rotura_merma');
  const [gravedad, setGravedad] = useState<GravedadIncidente>('media');
  const [medidasAdoptadas, setMedidasAdoptadas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Precargar datos al abrir modal con la anulación seleccionada
  useEffect(() => {
    if (anulacion) {
      if (anulacion.es_merma) {
        setCategoria('rotura_merma');
        setTitulo(`Pérdida por merma culinaria en ${anulacion.mesa_numero}: ${anulacion.producto_nombre}`);
      } else if (anulacion.motivo_categoria === 'queja_calidad') {
        setCategoria('servicio_cliente');
        setTitulo(`Disconformidad y queja de comensal en ${anulacion.mesa_numero}`);
      } else if (anulacion.motivo_categoria === 'demora_cliente') {
        setCategoria('servicio_cliente');
        setTitulo(`Demora crítica en pase de cocina en ${anulacion.mesa_numero} (${anulacion.minutos_espera} min)`);
      } else {
        setCategoria('servicio_cliente');
        setTitulo(`Anulación de pedido en ${anulacion.mesa_numero} - ${anulacion.producto_nombre}`);
      }

      setGravedad(anulacion.es_merma || anulacion.minutos_espera >= 25 ? 'media' : 'baja');
      setMedidasAdoptadas(
        `Se audita comanda ${anulacion.codigo}. Se coordina con mozo ${anulacion.mozo_nombre} y jefe de cocina para evitar recurrencia.`
      );
      setErrorValidacion(null);
    }
  }, [anulacion]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !guardando) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, guardando]);

  if (!isOpen || !anulacion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!titulo.trim() || titulo.trim().length < 5) {
      setErrorValidacion('El título del expediente debe tener al menos 5 caracteres.');
      return;
    }

    if (!medidasAdoptadas.trim() || medidasAdoptadas.trim().length < 10) {
      setErrorValidacion('Debe describir las medidas inmediatas adoptadas (mínimo 10 caracteres).');
      return;
    }

    setGuardando(true);
    try {
      const exito = await onEscalar(anulacion.id, {
        titulo: titulo.trim(),
        categoria,
        gravedad,
        medidas_adoptadas: medidasAdoptadas.trim(),
      });
      if (exito) {
        onClose();
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto transition-all transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-amber-600 px-5 py-4 flex items-center justify-between text-white border-b border-amber-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight">
                Escalar a Incidente Operativo
              </h3>
              <p className="text-[11px] text-amber-100 mt-0.5">
                Vincular anulación {anulacion.codigo} con CU-ADMIN-11
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar diálogo"
            className="text-amber-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm text-slate-700">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Resumen congelado de la anulación */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
                {anulacion.cantidad}x {anulacion.producto_nombre}
              </span>
              <span>S/ {anulacion.monto_total.toFixed(2)}</span>
            </div>
            <div className="text-amber-800 text-[11px] flex flex-wrap gap-x-3 gap-y-0.5">
              <span><strong>Mesa:</strong> {anulacion.mesa_numero}</span>
              <span><strong>Mozo:</strong> {anulacion.mozo_nombre}</span>
              <span><strong>Espera:</strong> {anulacion.minutos_espera} min</span>
              {anulacion.es_merma && (
                <span className="text-rose-700 font-bold">
                  • Merma: S/ {(anulacion.costo_merma || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Título del expediente */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título del Expediente *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Pérdida por merma culinaria en Mesa 04..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
              required
            />
          </div>

          {/* Fila de Categoría y Gravedad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaIncidente)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
              >
                <option value="rotura_merma">Rotura / Merma Culinaria</option>
                <option value="servicio_cliente">Servicio al Cliente / Salón</option>
                <option value="seguridad_higiene">Seguridad e Higiene</option>
                <option value="caja_dinero">Discrepancia en Caja / Cuenta</option>
                <option value="disciplinario">Falta Disciplinaria</option>
                <option value="otro">Otro Asunto Operativo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nivel de Gravedad *
              </label>
              <select
                value={gravedad}
                onChange={(e) => setGravedad(e.target.value as GravedadIncidente)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
              >
                <option value="baja">Baja (Registro Interno)</option>
                <option value="media">Media (Investigación Interna)</option>
                <option value="alta">Alta (Alerta Propietario CU-PROP-09)</option>
              </select>
            </div>
          </div>

          {gravedad === 'alta' && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-tight flex items-start gap-1.5">
              <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Aviso de Escalamiento Corporativo:</strong> Los incidentes con gravedad <strong>Alta</strong> notifican automáticamente al propietario de la cadena en su bandeja corporativa.
              </span>
            </div>
          )}

          {/* Medidas inmediatas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Medidas Inmediatas Adoptadas / Plan de Acción *
            </label>
            <textarea
              value={medidasAdoptadas}
              onChange={(e) => setMedidasAdoptadas(e.target.value)}
              rows={3}
              placeholder="Describa qué se coordinó con cocina o salón para corregir la causa..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
              required
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              {guardando ? 'Generando INC...' : 'Confirmar y Abrir INC-2026'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
