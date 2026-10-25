import React, { useState, useEffect } from 'react';
import { MesaAdminDTO, PisoAdminDTO, FormaMesa, ActualizarMesaRequest } from '@/types/admin';
import { X, Trash2, AlertTriangle, Check } from 'lucide-react';

interface DrawerEditarMesaProps {
  mesa: MesaAdminDTO | null;
  pisos: PisoAdminDTO[];
  pisoNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (mesaId: string, payload: ActualizarMesaRequest) => Promise<void>;
  onDesactivar: (mesaId: string) => Promise<void>;
}

export const DrawerEditarMesa: React.FC<DrawerEditarMesaProps> = ({
  mesa,
  pisos,
  pisoNombre,
  isOpen,
  onClose,
  onGuardar,
  onDesactivar,
}) => {
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);
  const [forma, setForma] = useState<FormaMesa>('cuadrada');
  const [permiteUnion, setPermiteUnion] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmandoDesactivar, setConfirmandoDesactivar] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [pisoId, setPisoId] = useState('');
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    if (mesa) {
      setNumero(mesa.numero);
      setCapacidad(mesa.capacidad);
      setForma(mesa.forma);
      setPermiteUnion(mesa.permite_union);
      setPisoId(mesa.piso_id);
      setPosX(mesa.posicion_x);
      setPosY(mesa.posicion_y);
      setConfirmandoDesactivar(false);
      setErrorLocal(null);
    }
  }, [mesa]);

  if (!isOpen || !mesa) return null;
  const pisoDestino = pisos.find((p) => p.id === pisoId);
  const casillaOcupada = pisoDestino?.mesas.some((m) => m.id !== mesa.id && m.estado !== 'inactiva'
    && m.posicion_x === posX && m.posicion_y === posY);
  const posicionValida = pisoDestino && posX < pisoDestino.columnas && posY < pisoDestino.filas && !casillaOcupada;
  const puedeMover = !mesa.tiene_pedido_activo && !mesa.mesa_principal_id
    && !pisos.some((p) => p.mesas.some((m) => m.mesa_principal_id === mesa.id));

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !posicionValida) return;
    try {
      setErrorLocal(null);
      setIsSubmitting(true);
      await onGuardar(mesa.id, {
        numero,
        capacidad,
        forma,
        piso_id: pisoId,
        posicion_x: posX,
        posicion_y: posY,
        permite_union: permiteUnion,
      });
      onClose();
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesactivar = async () => {
    try {
      setErrorLocal(null);
      setIsDeleting(true);
      await onDesactivar(mesa.id);
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudo desactivar la mesa.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      {/* Fondo oscuro traslúcido */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer deslizable (440px en PC/Tablet, completo en móvil) */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-aurea-copper/30 z-10 flex flex-col justify-between overflow-hidden">
        {/* Cabecera del Drawer */}
        <div className="p-6 bg-aurea-navy text-white flex items-center justify-between border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-aurea-copper uppercase tracking-wider font-semibold">
              <span>{pisoNombre}</span>
              <span>·</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  mesa.tiene_pedido_activo
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                {mesa.tiene_pedido_activo ? 'Ocupada' : 'Libre'}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold mt-0.5">
              Detalle y Edición de Mesa {mesa.numero}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar panel de edición"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form id="editar-mesa-form" onSubmit={handleGuardar} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorLocal && <p role="alert" className="text-sm text-rose-700">{errorLocal}</p>}
          <fieldset disabled={!puedeMover || isSubmitting} className="space-y-3">
            <legend className="text-xs font-bold text-aurea-navy">Ubicación de la mesa</legend>
            <label className="block text-xs">Ambiente
              <select aria-label="Ambiente destino" value={pisoId} onChange={(e) => {
                setPisoId(e.target.value); setPosX(0); setPosY(0);
              }} className="block w-full border rounded-lg p-2 mt-1">
                {pisos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
            {pisoDestino && <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">Columna
                <select aria-label="Columna destino" value={posX} onChange={(e) => setPosX(Number(e.target.value))} className="block w-full border rounded-lg p-2">
                  {Array.from({ length: pisoDestino.columnas }, (_, x) => <option key={x} value={x}>{x + 1}</option>)}
                </select>
              </label>
              <label className="text-xs">Fila
                <select aria-label="Fila destino" value={posY} onChange={(e) => setPosY(Number(e.target.value))} className="block w-full border rounded-lg p-2">
                  {Array.from({ length: pisoDestino.filas }, (_, y) => <option key={y} value={y}>{y + 1}</option>)}
                </select>
              </label>
            </div>}
          </fieldset>
          {!puedeMover && <p className="text-xs text-amber-800">Cierra la comanda y separa el grupo antes de reubicar.</p>}
          {casillaOcupada && <p role="alert" className="text-xs text-rose-700">La casilla seleccionada ya está ocupada.</p>}
          {/* Número / Código de Mesa */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Número o Código de Mesa
            </label>
            <p className="text-xs text-aurea-navy/60 mb-2">
              Identificador único visible en comandas, terminales de mozo y pre-cuentas.
            </p>
            <input
              type="text"
              required
              maxLength={10}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/40 text-base font-bold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper"
            />
          </div>

          {/* Capacidad de Comensales con Steppers Ergonómicos */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Capacidad de Comensales (Sillas)
            </label>
            <p className="text-xs text-aurea-navy/60 mb-2">
              Número estándar de personas que se sientan a comer en esta mesa.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCapacidad(Math.max(1, capacidad - 1))}
                className="w-12 h-12 rounded-xl bg-aurea-ivory border border-aurea-copper/40 flex items-center justify-center text-lg font-bold text-aurea-navy hover:bg-aurea-champagne/40 active:scale-95 transition-all"
              >
                - 1
              </button>

              <div className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-aurea-copper/30 text-center">
                <span className="font-serif text-xl font-bold text-aurea-navy">
                  {capacidad} comensales
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCapacidad(Math.min(20, capacidad + 1))}
                className="w-12 h-12 rounded-xl bg-aurea-ivory border border-aurea-copper/40 flex items-center justify-center text-lg font-bold text-aurea-navy hover:bg-aurea-champagne/40 active:scale-95 transition-all"
              >
                + 1
              </button>
            </div>
          </div>

          {/* Forma Visual */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Forma Visual de la Mesa
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['cuadrada', 'redonda', 'rectangular'] as FormaMesa[]).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setForma(f)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
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

          {/* Combinación para Grupos */}
          <div className="p-4 rounded-2xl bg-aurea-ivory border border-aurea-copper/30 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permiteUnion}
                onChange={(e) => setPermiteUnion(e.target.checked)}
                className="mt-0.5 rounded text-aurea-copper focus:ring-aurea-copper w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-aurea-navy block">
                  Permite juntar con otra mesa
                </span>
                <span className="text-[11px] text-aurea-navy/60 block mt-0.5">
                  Los mozos podrán combinarla con mesas contiguas para cuentas y pedidos grupales.
                </span>
              </div>
            </label>
          </div>

          {/* Zona de Peligro: Desactivación */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-rose-800 block">Zona de Control Operativo</span>
                <span className="text-[11px] text-rose-700/80 block mt-0.5">
                  Desactivar esta mesa la removerá del salón sin borrar su historial previo de
                  ventas o comandas (baja no destructiva).
                </span>
              </div>
            </div>

            {!confirmandoDesactivar ? (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmandoDesactivar(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-100/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Desactivar Mesa</span>
              </button>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2.5 animate-fadeIn">
                <p className="font-bold text-rose-800 text-xs text-center">
                  ¿Confirmas desactivar la Mesa {mesa.numero}?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setConfirmandoDesactivar(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDesactivar}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isDeleting ? 'Procesando...' : 'Sí, Desactivar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer del Drawer */}
        <div className="p-4 sm:p-6 bg-aurea-ivory border-t border-aurea-copper/20 flex items-center justify-end gap-3">
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
            form="editar-mesa-form"
            disabled={isSubmitting || isDeleting || !numero.trim() || !posicionValida}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-aurea-champagne" />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios de Mesa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
