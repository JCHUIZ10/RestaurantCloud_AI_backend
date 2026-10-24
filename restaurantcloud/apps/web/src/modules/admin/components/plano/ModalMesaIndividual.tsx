import React, { useState, useEffect, useRef } from 'react';
import { PisoAdminDTO, CuotaMesasPlanDTO, FormaMesa, CrearMesaIndividualRequest } from '@/types/admin';
import { X, Plus, Minus, Grid, Check } from 'lucide-react';

interface ModalMesaIndividualProps {
  pisos: PisoAdminDTO[];
  pisoSeleccionadoId: string;
  cuota: CuotaMesasPlanDTO;
  posicionInicial?: { x: number; y: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pisoId: string, payload: CrearMesaIndividualRequest) => Promise<void>;
  onModificarDimensiones: (pisoId: string, deltaCol: number, deltaFila: number) => Promise<void>;
}

export const ModalMesaIndividual: React.FC<ModalMesaIndividualProps> = ({
  pisos,
  pisoSeleccionadoId,
  cuota,
  posicionInicial,
  isOpen,
  onClose,
  onSubmit,
  onModificarDimensiones,
}) => {
  const pisoActivo = pisos.find((p) => p.id === pisoSeleccionadoId) || pisos[0];
  const pisoId = pisoActivo?.id || pisoSeleccionadoId;
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);
  const [forma, setForma] = useState<FormaMesa>('cuadrada');
  const [permiteUnion, setPermiteUnion] = useState(true);
  const [posX, setPosX] = useState(posicionInicial?.x ?? 0);
  const [posY, setPosY] = useState(posicionInicial?.y ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const aperturaInicializada = useRef('');


  // Sugerir correlativo automático al abrir o cambiar de piso
  useEffect(() => {
    if (!isOpen) {
      aperturaInicializada.current = '';
      return;
    }
    const clave = `${pisoActivo?.id}:${posicionInicial?.x}:${posicionInicial?.y}`;
    if (aperturaInicializada.current === clave) return;
    aperturaInicializada.current = clave;
    if (pisoActivo) {
      setErrorLocal(null);
      const mesasActivas = pisoActivo.mesas.filter((m) => m.estado !== 'inactiva');
      const numerosNum = mesasActivas
        .map((m) => parseInt(m.numero.replace(/\D/g, '')))
        .filter((n) => !isNaN(n));
      const maxNum = numerosNum.length > 0 ? Math.max(...numerosNum) : 0;
      const sugerido = maxNum + 1;
      setNumero(sugerido < 10 ? `0${sugerido}` : `${sugerido}`);

      // Si se proporcionó una posición inicial
      if (posicionInicial) {
        setPosX(posicionInicial.x);
        setPosY(posicionInicial.y);
      } else {
        // Encontrar primer slot libre
        const mapa = new Set(mesasActivas.map((m) => `${m.posicion_x}-${m.posicion_y}`));
        let found = false;
        for (let f = 0; f < pisoActivo.filas && !found; f++) {
          for (let c = 0; c < pisoActivo.columnas && !found; c++) {
            if (!mapa.has(`${c}-${f}`)) {
              setPosX(c);
              setPosY(f);
              found = true;
            }
          }
        }
      }
    }
  }, [pisoActivo, posicionInicial, isOpen]);

  if (!isOpen || !pisoActivo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || cuota.mesas_disponibles <= 0 || mapaMesas.has(`${posX}-${posY}`)
      || posX >= pisoActivo.columnas || posY >= pisoActivo.filas) return;
    try {
      setErrorLocal(null);
      setIsSubmitting(true);
      await onSubmit(pisoId, {
        numero: numero.trim(),
        capacidad,
        forma,
        posicion_x: posX,
        posicion_y: posY,
        permite_union: permiteUnion,
      });
      onClose();
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudo guardar la mesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Matriz de mini-mapa
  const mapaMesas = new Map<string, string>();
  pisoActivo.mesas
    .filter((m) => m.estado !== 'inactiva')
    .forEach((m) => {
      mapaMesas.set(`${m.posicion_x}-${m.posicion_y}`, m.numero);
    });

  const celdasMiniMapa = [];
  for (let f = 0; f < pisoActivo.filas; f++) {
    for (let c = 0; c < pisoActivo.columnas; c++) {
      const numExistente = mapaMesas.get(`${c}-${f}`);
      const esSeleccionada = posX === c && posY === f;
      celdasMiniMapa.push({
        c,
        f,
        numExistente,
        esSeleccionada,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-aurea-copper/30 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="p-6 bg-aurea-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center">
              <Plus className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">Agregar Nueva Mesa Individual</h3>
              <p className="text-xs text-white/70">
                {pisoActivo.nombre} · Configura y elige la ubicación exacta en el salón
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

        {/* Cuerpo Dual: Formulario Izquierda + Mini-Mapa Derecha */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Lado Izquierdo: Formulario */}
          <form id="crear-mesa-form" onSubmit={handleSubmit} className="lg:col-span-6 space-y-4">
            {errorLocal && <p role="alert" className="text-sm text-rose-700">{errorLocal}</p>}
            {/* Banner de Ambiente Activo */}
            <div className="p-3 rounded-2xl bg-aurea-champagne/20 border border-aurea-copper/30 flex items-center justify-between text-xs text-aurea-navy">
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

            {/* 1. Número de Mesa */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                1. Número o Código de Mesa
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej. 11"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-copper/40 text-base font-bold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-aurea-copper">
                  Sugerido aut.
                </span>
              </div>
            </div>

            {/* 2. Capacidad de Comensales */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                2. Capacidad de Comensales (Sillas)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCapacidad(Math.max(1, capacidad - 1))}
                  className="w-10 h-10 rounded-xl bg-aurea-ivory border border-aurea-copper/40 font-bold text-aurea-navy hover:bg-aurea-champagne/40 active:scale-95 transition-all"
                >
                  -
                </button>
                <div className="flex-1 py-2 rounded-xl bg-white border border-aurea-copper/30 text-center font-bold text-aurea-navy">
                  {capacidad} personas
                </div>
                <button
                  type="button"
                  onClick={() => setCapacidad(Math.min(20, capacidad + 1))}
                  className="w-10 h-10 rounded-xl bg-aurea-ivory border border-aurea-copper/40 font-bold text-aurea-navy hover:bg-aurea-champagne/40 active:scale-95 transition-all"
                >
                  +
                </button>
                <div className="flex gap-1 ml-1">
                  {[2, 4, 6, 8].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCapacidad(c)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold ${
                        capacidad === c
                          ? 'bg-aurea-navy text-white'
                          : 'bg-aurea-ivory text-aurea-navy/70 border border-aurea-copper/20'
                      }`}
                    >
                      {c}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Forma Visual */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                3. Forma Visual en el Salón
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

            {/* 4. Unión para Grupos */}
            <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-copper/25">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-aurea-navy">
                <input
                  type="checkbox"
                  checked={permiteUnion}
                  onChange={(e) => setPermiteUnion(e.target.checked)}
                  className="rounded text-aurea-copper focus:ring-aurea-copper w-4 h-4"
                />
                <span className="font-semibold">Permitir juntar con otra mesa vecina</span>
              </label>
            </div>
          </form>


          {/* Lado Derecho: Mini-Mapa Espacial Interactivo */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-aurea-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-aurea-copper" />
                  <span>Ubicación en el Plano (Mini-Mapa)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {/* Ajuste de Columnas */}
                  <div className="flex items-center gap-1 bg-aurea-champagne/30 px-2 py-0.5 rounded-lg border border-aurea-copper/30">
                    <span className="text-[10px] text-aurea-navy/60 font-semibold">Col:</span>
                    <button
                      type="button"
                      onClick={() => onModificarDimensiones(pisoId, -1, 0)}
                      disabled={pisoActivo.columnas <= 1}
                      title="Quitar columna del borde derecho"
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-rose-50 text-aurea-navy hover:text-rose-700 font-bold border border-aurea-copper/20 disabled:opacity-40 transition-colors flex items-center gap-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                      <span>Col</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onModificarDimensiones(pisoId, 1, 0)}
                      disabled={pisoActivo.columnas >= 12}
                      title="Añadir columna al ancho"
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-emerald-50 text-aurea-navy hover:text-emerald-700 font-bold border border-aurea-copper/20 disabled:opacity-40 transition-colors flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Col</span>
                    </button>
                  </div>

                  {/* Ajuste de Filas */}
                  <div className="flex items-center gap-1 bg-aurea-champagne/30 px-2 py-0.5 rounded-lg border border-aurea-copper/30">
                    <span className="text-[10px] text-aurea-navy/60 font-semibold">Fila:</span>
                    <button
                      type="button"
                      onClick={() => onModificarDimensiones(pisoId, 0, -1)}
                      disabled={pisoActivo.filas <= 1}
                      title="Quitar fila del fondo"
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-rose-50 text-aurea-navy hover:text-rose-700 font-bold border border-aurea-copper/20 disabled:opacity-40 transition-colors flex items-center gap-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                      <span>Fila</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onModificarDimensiones(pisoId, 0, 1)}
                      disabled={pisoActivo.filas >= 10}
                      title="Añadir fila al fondo"
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-emerald-50 text-aurea-navy hover:text-emerald-700 font-bold border border-aurea-copper/20 disabled:opacity-40 transition-colors flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Fila</span>
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-aurea-navy/60 mb-3">
                Toca cualquier casilla libre <strong className="text-aurea-copper">[ + ]</strong> para
                ubicar la nueva mesa sin teclear coordenadas.
              </p>

              {/* Grid del Mini-Mapa */}
              <div className="p-3.5 rounded-2xl bg-aurea-ivory border border-aurea-copper/30">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${pisoActivo.columnas}, minmax(42px, 1fr))`,
                  }}
                >
                  {celdasMiniMapa.map(({ c, f, numExistente, esSeleccionada }) => {
                    const key = `mini-${c}-${f}`;
                    if (numExistente) {
                      return (
                        <div
                          key={key}
                          title={`Mesa ${numExistente} ocupando Col ${c + 1}, Fila ${f + 1}`}
                          className="h-11 rounded-xl bg-slate-200/80 border border-slate-300 text-[11px] font-bold text-slate-500 flex items-center justify-center select-none"
                        >
                          M{numExistente}
                        </div>
                      );
                    }

                    if (esSeleccionada) {
                      return (
                        <div
                          key={key}
                          className="h-11 rounded-xl bg-aurea-navy text-white border-2 border-aurea-copper text-[11px] font-bold flex flex-col items-center justify-center shadow-md animate-pulse select-none"
                        >
                          <span>{numero || 'NUEVA'}</span>
                          <span className="text-[9px] text-aurea-champagne">AQUÍ</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => {
                          setPosX(c);
                          setPosY(f);
                        }}
                        title={`Seleccionar Columna ${c + 1}, Fila ${f + 1}`}
                        className="h-11 rounded-xl bg-white border border-dashed border-aurea-copper/50 hover:bg-aurea-champagne/40 text-aurea-copper hover:text-aurea-navy flex items-center justify-center font-bold text-sm transition-all"
                      >
                        +
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botones de extensión y recorte de salón (Pie del Mini-Mapa) */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onModificarDimensiones(pisoId, 0, 1)}
                    disabled={pisoActivo.filas >= 10}
                    className="px-2.5 py-1 rounded-lg bg-aurea-champagne/40 border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/70 text-[11px] font-semibold transition-colors disabled:opacity-40"
                  >
                    + Fila Fondo
                  </button>
                  <button
                    type="button"
                    onClick={() => onModificarDimensiones(pisoId, 0, -1)}
                    disabled={pisoActivo.filas <= 1}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors disabled:opacity-40"
                  >
                    - Quitar Fila Vacía
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onModificarDimensiones(pisoId, 1, 0)}
                    disabled={pisoActivo.columnas >= 12}
                    className="px-2.5 py-1 rounded-lg bg-aurea-champagne/40 border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/70 text-[11px] font-semibold transition-colors disabled:opacity-40"
                  >
                    + Columna
                  </button>
                  <button
                    type="button"
                    onClick={() => onModificarDimensiones(pisoId, -1, 0)}
                    disabled={pisoActivo.columnas <= 1}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors disabled:opacity-40"
                  >
                    - Quitar Col Vacía
                  </button>
                </div>
              </div>

              {/* Badge de Posición Seleccionada */}
              <div className="mt-3 p-2.5 rounded-xl bg-white border border-aurea-copper/30 text-xs text-aurea-navy flex items-center justify-between">
                <span>Casilla Seleccionada:</span>
                <span className="font-bold text-aurea-navy font-mono">
                  Columna {posX + 1}, Fila {posY + 1} ({posX}, {posY})
                </span>
              </div>
            </div>

            {/* Aviso de impacto en cupo */}
            <div className="p-3 rounded-xl bg-aurea-champagne/20 border border-aurea-copper/25 text-xs text-aurea-navy/80">
              <span className="font-bold">Cupo del plan {cuota.plan_nombre || 'actual'}:</span> Quedarán{' '}
              {Math.max(0, cuota.mesas_disponibles - 1)} mesas disponibles de {cuota.max_mesas_plan}.
            </div>
          </div>
        </div>

        {/* Footer */}
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
            form="crear-mesa-form"
            disabled={isSubmitting || !numero.trim() || cuota.mesas_disponibles <= 0
              || mapaMesas.has(`${posX}-${posY}`) || posX >= pisoActivo.columnas || posY >= pisoActivo.filas}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-aurea-champagne" />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Mesa en Salón'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
