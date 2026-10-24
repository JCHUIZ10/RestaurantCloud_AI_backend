import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Star,
  Package,
  Check,
  X,
  Loader2,
  Layers,
  PackageSearch,
  ArrowRight,
} from 'lucide-react';
import { InsumoAdminDTO, InsumoHabitualDTO } from '@/types/admin';

export interface InsumoSeleccionable {
  id: string;
  nombre: string;
  unidad_medida: string;
  costo_unitario: number;
}

interface SelectorInsumoSearchableProps {
  insumosHabituales: InsumoHabitualDTO[];
  insumoIdSeleccionado: string;
  insumoNombreSeleccionado?: string;
  unidadMedidaSeleccionada?: string;
  onSeleccionar: (insumo: InsumoSeleccionable, esHabitual: boolean) => void;
  onBuscarCatalogoRemoto?: (termino: string) => Promise<InsumoAdminDTO[]>;
  insumosCatalogoInicial?: InsumoAdminDTO[];
  disabled?: boolean;
  placeholder?: string;
}

export const SelectorInsumoSearchable: React.FC<SelectorInsumoSearchableProps> = ({
  insumosHabituales = [],
  insumoIdSeleccionado,
  insumoNombreSeleccionado,
  unidadMedidaSeleccionada,
  onSeleccionar,
  onBuscarCatalogoRemoto,
  insumosCatalogoInicial = [],
  disabled = false,
  placeholder = 'Seleccionar insumo...',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Orden de pestañas solicitado: habituales -> catalogo -> todos
  // Inicialización adaptativa: si el proveedor no tiene habituales, abrir directo en catalogo
  const tabInicial = insumosHabituales.length > 0 ? 'habituales' : 'catalogo';
  const [tabActivo, setTabActivo] = useState<'habituales' | 'catalogo' | 'todos'>(tabInicial);

  const [resultadosRemotos, setResultadosRemotos] = useState<InsumoAdminDTO[]>([]);
  const [buscandoRemoto, setBuscandoRemoto] = useState(false);
  const [cacheRemoto, setCacheRemoto] = useState<Record<string, InsumoAdminDTO[]>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  const setHabitualesIds = useMemo(
    () => new Set(insumosHabituales.map((h) => h.insumo_id)),
    [insumosHabituales]
  );

  // Adaptación si cambia la lista de habituales del proveedor seleccionado
  useEffect(() => {
    if (insumosHabituales.length === 0 && tabActivo === 'habituales') {
      setTabActivo('catalogo');
    }
  }, [insumosHabituales.length, tabActivo]);

  // Determinar datos del insumo actualmente seleccionado
  const habitualActual = useMemo(
    () => insumosHabituales.find((h) => h.insumo_id === insumoIdSeleccionado),
    [insumosHabituales, insumoIdSeleccionado]
  );

  const catalogoActual = useMemo(
    () =>
      resultadosRemotos.find((i) => i.id === insumoIdSeleccionado) ||
      insumosCatalogoInicial.find((i) => i.id === insumoIdSeleccionado),
    [resultadosRemotos, insumosCatalogoInicial, insumoIdSeleccionado]
  );

  const esHabitualActual = Boolean(habitualActual);
  const nombreActual =
    habitualActual?.nombre ||
    catalogoActual?.nombre ||
    insumoNombreSeleccionado ||
    null;
  const unidadActual =
    habitualActual?.unidad_medida ||
    catalogoActual?.unidad_medida ||
    unidadMedidaSeleccionada ||
    null;

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };

    if (abierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [abierto]);

  // Autofoco al abrir el popover
  useEffect(() => {
    if (abierto) {
      setBusqueda('');
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
      }, 50);
    }
  }, [abierto]);

  // Búsqueda remota dinámica con debounce de 300 ms
  useEffect(() => {
    const termino = busqueda.trim();
    if (termino.length < 2) {
      setResultadosRemotos([]);
      setBuscandoRemoto(false);
      return;
    }

    const key = termino.toLowerCase();
    if (cacheRemoto[key]) {
      setResultadosRemotos(cacheRemoto[key]);
      setBuscandoRemoto(false);
      return;
    }

    if (!onBuscarCatalogoRemoto) {
      return;
    }

    setBuscandoRemoto(true);
    const timer = setTimeout(async () => {
      try {
        const items = await onBuscarCatalogoRemoto(termino);
        setResultadosRemotos(items);
        setCacheRemoto((prev) => ({ ...prev, [key]: items }));
      } catch {
        // En caso de fallo de red, mantener lista previa o vacía
      } finally {
        setBuscandoRemoto(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, onBuscarCatalogoRemoto, cacheRemoto]);

  // Filtrado de habituales locales (instantáneo en memoria, 0ms)
  const habitualesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return insumosHabituales;
    return insumosHabituales.filter(
      (h) =>
        h.nombre.toLowerCase().includes(q) ||
        h.unidad_medida.toLowerCase().includes(q)
    );
  }, [insumosHabituales, busqueda]);

  // Insumos del catálogo general (de búsqueda remota o catálogo inicial en memoria)
  const catalogoFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const fuentes = resultadosRemotos.length > 0 ? resultadosRemotos : insumosCatalogoInicial;

    return fuentes
      .filter((i) => !setHabitualesIds.has(i.id))
      .filter((i) => {
        if (!q) return true;
        return (
          i.nombre.toLowerCase().includes(q) ||
          i.unidad_medida.toLowerCase().includes(q)
        );
      });
  }, [resultadosRemotos, insumosCatalogoInicial, setHabitualesIds, busqueda]);

  const handleElegirHabitual = (hab: InsumoHabitualDTO) => {
    onSeleccionar(
      {
        id: hab.insumo_id,
        nombre: hab.nombre,
        unidad_medida: hab.unidad_medida,
        costo_unitario: hab.ultimo_precio,
      },
      true
    );
    setAbierto(false);
  };

  const handleElegirCatalogo = (insumo: InsumoAdminDTO) => {
    onSeleccionar(
      {
        id: insumo.id,
        nombre: insumo.nombre,
        unidad_medida: insumo.unidad_medida,
        costo_unitario: insumo.costo_unitario,
      },
      false
    );
    setAbierto(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${abierto ? 'z-50' : 'z-10'}`}>
      {/* Botón Disparador (Trigger) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-left text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-aurea-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
      >
        {esHabitualActual ? (
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
        ) : (
          <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        )}

        <span className="truncate flex-1 font-medium">
          {nombreActual || placeholder}
        </span>

        {unidadActual && (
          <span className="text-[10px] text-gray-400 font-mono shrink-0">
            ({unidadActual})
          </span>
        )}

        {esHabitualActual ? (
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
            Habitual
          </span>
        ) : nombreActual ? (
          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded shrink-0">
            Catálogo
          </span>
        ) : null}

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
            abierto ? 'rotate-180 text-aurea-navy' : ''
          }`}
        />
      </button>

      {/* Popover Desplegable con Z-Index elevado y flotante sobre la tabla */}
      {abierto && (
        <div className="absolute left-0 top-full mt-1 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header con Buscador */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar insumo (escribe 2 o más letras)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-aurea-navy text-gray-900 placeholder:text-gray-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {buscandoRemoto ? (
                  <Loader2 className="w-3.5 h-3.5 text-aurea-navy animate-spin" />
                ) : busqueda ? (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Pestañas de Navegación en Orden: Habituales -> Catálogo -> Todas */}
            <div className="flex items-center gap-1">
              {/* 1. Habituales */}
              <button
                type="button"
                onClick={() => setTabActivo('habituales')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  tabActivo === 'habituales'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100/60'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Habituales ({habitualesFiltrados.length})</span>
              </button>

              {/* 2. Catálogo */}
              <button
                type="button"
                onClick={() => setTabActivo('catalogo')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  tabActivo === 'catalogo'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-200/60'
                }`}
              >
                <Package className="w-3 h-3" />
                <span>Catálogo ({catalogoFiltrados.length})</span>
              </button>

              {/* 3. Todas */}
              <button
                type="button"
                onClick={() => setTabActivo('todos')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  tabActivo === 'todos'
                    ? 'bg-aurea-navy text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-200/60'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Todas ({habitualesFiltrados.length + catalogoFiltrados.length})</span>
              </button>
            </div>
          </div>

          {/* Lista de Resultados Scrolleable con Estados Informativos Ricos */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 text-xs">
            {/* PESTAÑA 1: HABITUALES */}
            {tabActivo === 'habituales' && (
              <div>
                {habitualesFiltrados.length > 0 ? (
                  habitualesFiltrados.map((hab) => {
                    const seleccionado = hab.insumo_id === insumoIdSeleccionado;
                    return (
                      <button
                        key={hab.insumo_id}
                        type="button"
                        onClick={() => handleElegirHabitual(hab)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-50/50 transition-colors ${
                          seleccionado ? 'bg-amber-50 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          <div className="truncate">
                            <span className="text-gray-900">{hab.nombre}</span>
                            <span className="text-[11px] text-gray-500 font-mono ml-1.5">
                              ({hab.unidad_medida})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                            Habitual
                          </span>
                          {seleccionado && <Check className="w-3.5 h-3.5 text-aurea-navy ml-1" />}
                        </div>
                      </button>
                    );
                  })
                ) : insumosHabituales.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800">Sin insumos habituales</p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                      Este proveedor no tiene historial previo. Busca en el catálogo para registrar su primer insumo.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTabActivo('catalogo')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-aurea-navy text-white text-[11px] font-semibold rounded-lg hover:bg-aurea-navy/90 transition-all shadow-2xs"
                    >
                      <span>Ir a Catálogo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-gray-600">
                      No hay insumos habituales para &quot;<strong className="text-gray-800">{busqueda}</strong>&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTabActivo('catalogo')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-white text-[11px] font-semibold rounded-lg hover:bg-slate-800 transition-all shadow-2xs"
                    >
                      <span>Buscar en Catálogo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: CATÁLOGO */}
            {tabActivo === 'catalogo' && (
              <div>
                {buscandoRemoto ? (
                  <div className="p-6 text-center space-y-2">
                    <Loader2 className="w-5 h-5 text-aurea-navy animate-spin mx-auto" />
                    <p className="text-xs font-medium text-gray-600">Consultando catálogo maestro...</p>
                  </div>
                ) : catalogoFiltrados.length > 0 ? (
                  catalogoFiltrados.map((ins) => {
                    const seleccionado = ins.id === insumoIdSeleccionado;
                    return (
                      <button
                        key={ins.id}
                        type="button"
                        onClick={() => handleElegirCatalogo(ins)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          seleccionado ? 'bg-gray-50 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-gray-800">{ins.nombre}</span>
                            <span className="text-[11px] text-gray-500 font-mono ml-1.5">
                              ({ins.unidad_medida})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Catálogo
                          </span>
                          {seleccionado && <Check className="w-3.5 h-3.5 text-aurea-navy ml-1" />}
                        </div>
                      </button>
                    );
                  })
                ) : busqueda.trim().length < 2 ? (
                  <div className="p-5 text-center space-y-1.5">
                    <div className="w-8 h-8 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                      <PackageSearch className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800">Buscar en el Catálogo Maestro</p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                      Escribe al menos 2 letras en el buscador superior para consultar en tiempo real todos los insumos registrados.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 text-center space-y-1">
                    <p className="text-xs text-gray-600">
                      No se encontraron insumos para &quot;<strong className="text-gray-800">{busqueda}</strong>&quot; en el catálogo.
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Verifica la ortografía o intenta con otro término.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: TODAS */}
            {tabActivo === 'todos' && (
              <div>
                {buscandoRemoto && (
                  <div className="p-2 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5 bg-gray-50">
                    <Loader2 className="w-3.5 h-3.5 text-aurea-navy animate-spin" />
                    <span>Buscando en catálogo...</span>
                  </div>
                )}

                {/* Subsección Habituales */}
                {habitualesFiltrados.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50/70 border-b border-amber-100 text-[10px] font-bold text-amber-900 uppercase tracking-wider sticky top-0">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Habituales ({habitualesFiltrados.length})</span>
                    </div>
                    {habitualesFiltrados.map((hab) => {
                      const seleccionado = hab.insumo_id === insumoIdSeleccionado;
                      return (
                        <button
                          key={hab.insumo_id}
                          type="button"
                          onClick={() => handleElegirHabitual(hab)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-50/50 transition-colors ${
                            seleccionado ? 'bg-amber-50 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            <div className="truncate">
                              <span className="text-gray-900">{hab.nombre}</span>
                              <span className="text-[11px] text-gray-500 font-mono ml-1.5">
                                ({hab.unidad_medida})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                              Habitual
                            </span>
                            {seleccionado && <Check className="w-3.5 h-3.5 text-aurea-navy ml-1" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Subsección Catálogo */}
                {catalogoFiltrados.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-wider sticky top-0">
                      <Package className="w-3 h-3 text-gray-400" />
                      <span>Catálogo General ({catalogoFiltrados.length})</span>
                    </div>
                    {catalogoFiltrados.map((ins) => {
                      const seleccionado = ins.id === insumoIdSeleccionado;
                      return (
                        <button
                          key={ins.id}
                          type="button"
                          onClick={() => handleElegirCatalogo(ins)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                            seleccionado ? 'bg-gray-50 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <div className="truncate">
                              <span className="text-gray-800">{ins.nombre}</span>
                              <span className="text-[11px] text-gray-500 font-mono ml-1.5">
                                ({ins.unidad_medida})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              Catálogo
                            </span>
                            {seleccionado && <Check className="w-3.5 h-3.5 text-aurea-navy ml-1" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Guía o Estado Vacío en Todas */}
                {habitualesFiltrados.length === 0 && catalogoFiltrados.length === 0 && !buscandoRemoto && (
                  <div className="p-5 text-center space-y-1.5">
                    {busqueda.trim().length < 2 ? (
                      <>
                        <div className="w-8 h-8 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                          <PackageSearch className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800">Escribe para buscar insumos</p>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                          Ingresa 2 o más letras en el buscador para buscar en habituales y catálogo general simultáneamente.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600">
                          No se encontraron insumos que coincidan con &quot;<strong className="text-gray-800">{busqueda}</strong>&quot;.
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Verifica la ortografía o intenta buscar por otro nombre.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
