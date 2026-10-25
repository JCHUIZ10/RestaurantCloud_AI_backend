import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Star, Package, Check, X, Loader2, PackageSearch, ArrowRight, type LucideIcon } from 'lucide-react';
import { InsumoAdminDTO, InsumoHabitualDTO } from '@/types/admin';
import { cn } from '@/shared/utils';

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

type Pestana = 'habituales' | 'catalogo' | 'todos';

/** Fila de resultado; los habituales llevan estrella cobre, los del catálogo una caja navy. */
const Opcion: React.FC<{
  nombre: string;
  unidad: string;
  habitual: boolean;
  seleccionado: boolean;
  onElegir: () => void;
}> = ({ nombre, unidad, habitual, seleccionado, onElegir }) => (
  <button
    type="button"
    onClick={onElegir}
    className={cn(
      'w-full min-h-10 flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
      seleccionado ? 'bg-aurea-champagne/40 font-semibold' : 'hover:bg-aurea-ivory'
    )}
  >
    {habitual ? (
      <Star className="w-4 h-4 text-aurea-copper fill-aurea-copper shrink-0" aria-hidden="true" />
    ) : (
      <Package className="w-4 h-4 text-aurea-navy/50 shrink-0" aria-hidden="true" />
    )}
    <span className="flex-1 min-w-0 truncate text-aurea-navy">{nombre}</span>
    <span className="text-xs font-mono text-aurea-navy/50 shrink-0">{unidad}</span>
    {seleccionado && <Check className="w-4 h-4 text-estado-ok-600 shrink-0" aria-hidden="true" />}
  </button>
);

const Rotulo: React.FC<{ icono: LucideIcon; children: React.ReactNode; habitual?: boolean }> = ({ icono: Icono, children, habitual }) => (
  <p
    className={cn(
      'sticky top-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b',
      habitual ? 'bg-aurea-champagne/40 text-aurea-copper border-aurea-champagne' : 'bg-aurea-ivory text-aurea-navy/60 border-aurea-champagne/50'
    )}
  >
    <Icono className={cn('w-3.5 h-3.5', habitual && 'fill-aurea-copper')} aria-hidden="true" />
    {children}
  </p>
);

const Aviso: React.FC<{ titulo: string; texto?: React.ReactNode; accion?: React.ReactNode }> = ({ titulo, texto, accion }) => (
  <div className="p-5 text-center space-y-2">
    <span className="w-9 h-9 mx-auto rounded-xl bg-aurea-champagne/40 text-aurea-navy flex items-center justify-center" aria-hidden="true">
      <PackageSearch className="w-5 h-5" />
    </span>
    <p className="text-sm font-semibold text-aurea-navy">{titulo}</p>
    {texto && <p className="text-xs text-aurea-navy/60 max-w-xs mx-auto">{texto}</p>}
    {accion}
  </div>
);

export const SelectorInsumoSearchable: React.FC<SelectorInsumoSearchableProps> = ({
  insumosHabituales = [],
  insumoIdSeleccionado,
  insumoNombreSeleccionado,
  unidadMedidaSeleccionada,
  onSeleccionar,
  onBuscarCatalogoRemoto,
  insumosCatalogoInicial = [],
  disabled = false,
  placeholder = 'Elegir insumo',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Si el proveedor no tiene habituales, se abre directo en el catálogo
  const [tabActivo, setTabActivo] = useState<Pestana>(insumosHabituales.length > 0 ? 'habituales' : 'catalogo');

  const [resultadosRemotos, setResultadosRemotos] = useState<InsumoAdminDTO[]>([]);
  const [buscandoRemoto, setBuscandoRemoto] = useState(false);
  const [cacheRemoto, setCacheRemoto] = useState<Record<string, InsumoAdminDTO[]>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  const setHabitualesIds = useMemo(() => new Set(insumosHabituales.map((h) => h.insumo_id)), [insumosHabituales]);

  // Adaptación si cambia la lista de habituales del proveedor seleccionado
  useEffect(() => {
    if (insumosHabituales.length === 0 && tabActivo === 'habituales') {
      setTabActivo('catalogo');
    }
  }, [insumosHabituales.length, tabActivo]);

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
  const nombreActual = habitualActual?.nombre || catalogoActual?.nombre || insumoNombreSeleccionado || null;
  const unidadActual = habitualActual?.unidad_medida || catalogoActual?.unidad_medida || unidadMedidaSeleccionada || null;

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

  // Autofoco al abrir el desplegable
  useEffect(() => {
    if (abierto) {
      setBusqueda('');
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
      }, 50);
    }
  }, [abierto]);

  // Búsqueda remota con debounce de 300 ms
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

  // Filtrado local de habituales (instantáneo)
  const habitualesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return insumosHabituales;
    return insumosHabituales.filter(
      (h) => h.nombre.toLowerCase().includes(q) || h.unidad_medida.toLowerCase().includes(q)
    );
  }, [insumosHabituales, busqueda]);

  // Catálogo general (búsqueda remota o catálogo inicial en memoria), sin repetir habituales
  const catalogoFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const fuentes = resultadosRemotos.length > 0 ? resultadosRemotos : insumosCatalogoInicial;

    return fuentes
      .filter((i) => !setHabitualesIds.has(i.id))
      .filter((i) => !q || i.nombre.toLowerCase().includes(q) || i.unidad_medida.toLowerCase().includes(q));
  }, [resultadosRemotos, insumosCatalogoInicial, setHabitualesIds, busqueda]);

  const handleElegirHabitual = (hab: InsumoHabitualDTO) => {
    onSeleccionar(
      { id: hab.insumo_id, nombre: hab.nombre, unidad_medida: hab.unidad_medida, costo_unitario: hab.ultimo_precio },
      true
    );
    setAbierto(false);
  };

  const handleElegirCatalogo = (insumo: InsumoAdminDTO) => {
    onSeleccionar(
      { id: insumo.id, nombre: insumo.nombre, unidad_medida: insumo.unidad_medida, costo_unitario: insumo.costo_unitario },
      false
    );
    setAbierto(false);
  };

  const listaHabituales = habitualesFiltrados.map((hab) => (
    <Opcion
      key={hab.insumo_id}
      nombre={hab.nombre}
      unidad={hab.unidad_medida}
      habitual
      seleccionado={hab.insumo_id === insumoIdSeleccionado}
      onElegir={() => handleElegirHabitual(hab)}
    />
  ));

  const listaCatalogo = catalogoFiltrados.map((ins) => (
    <Opcion
      key={ins.id}
      nombre={ins.nombre}
      unidad={ins.unidad_medida}
      habitual={false}
      seleccionado={ins.id === insumoIdSeleccionado}
      onElegir={() => handleElegirCatalogo(ins)}
    />
  ));

  const terminoCorto = busqueda.trim().length < 2;
  const irACatalogo = (
    <button
      type="button"
      onClick={() => setTabActivo('catalogo')}
      className="inline-flex items-center gap-1 min-h-9 px-3 rounded-lg bg-aurea-navy text-white text-xs font-semibold hover:bg-aurea-navy/90 transition-colors"
    >
      Buscar en el catálogo
      <ArrowRight className="w-3.5 h-3.5 text-aurea-champagne" aria-hidden="true" />
    </button>
  );

  const PESTANAS: Array<{ valor: Pestana; etiqueta: string; conteo: number }> = [
    { valor: 'habituales', etiqueta: 'Habituales', conteo: habitualesFiltrados.length },
    { valor: 'catalogo', etiqueta: 'Catálogo', conteo: catalogoFiltrados.length },
    { valor: 'todos', etiqueta: 'Todos', conteo: habitualesFiltrados.length + catalogoFiltrados.length },
  ];

  return (
    <div ref={containerRef} className={cn('relative w-full', abierto ? 'z-30' : 'z-0')}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className={cn(
          'w-full min-h-10 flex items-center gap-2 px-3 rounded-xl border bg-white text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          abierto ? 'border-aurea-copper' : 'border-aurea-champagne/70 hover:border-aurea-copper/60'
        )}
      >
        {esHabitualActual ? (
          <Star className="w-4 h-4 text-aurea-copper fill-aurea-copper shrink-0" aria-hidden="true" />
        ) : (
          <Package className={cn('w-4 h-4 shrink-0', nombreActual ? 'text-aurea-navy/50' : 'text-aurea-copper')} aria-hidden="true" />
        )}
        <span className={cn('truncate flex-1', nombreActual ? 'font-medium text-aurea-navy' : 'text-aurea-navy/50')}>
          {nombreActual || placeholder}
        </span>
        {nombreActual && unidadActual && <span className="text-xs font-mono text-aurea-navy/50 shrink-0">{unidadActual}</span>}
        <ChevronDown
          className={cn('w-4 h-4 text-aurea-navy/50 shrink-0 transition-transform', abierto && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full mt-1 w-[min(24rem,calc(100vw-3rem))] bg-white border border-aurea-champagne rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-aurea-champagne/50 bg-aurea-ivory/60 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-aurea-copper absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe 2 letras o más"
                aria-label="Buscar insumo"
                className="w-full min-h-10 pl-9 pr-9 rounded-lg border border-aurea-champagne/70 bg-white text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                {buscandoRemoto ? (
                  <Loader2 className="w-4 h-4 mr-2 text-aurea-copper animate-spin" aria-hidden="true" />
                ) : busqueda ? (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    aria-label="Limpiar búsqueda"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-aurea-navy/40 hover:text-aurea-navy"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : null}
              </span>
            </div>

            <div role="group" aria-label="Origen del insumo" className="flex items-center gap-1">
              {PESTANAS.map((p) => {
                const activa = tabActivo === p.valor;
                return (
                  <button
                    key={p.valor}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => setTabActivo(p.valor)}
                    className={cn(
                      'min-h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors',
                      activa ? 'bg-aurea-navy text-white' : 'text-aurea-navy/70 hover:bg-aurea-champagne/40'
                    )}
                  >
                    {p.valor === 'habituales' && (
                      <Star className={cn('w-3.5 h-3.5', activa ? 'text-aurea-champagne fill-aurea-champagne' : 'text-aurea-copper fill-aurea-copper')} aria-hidden="true" />
                    )}
                    {p.etiqueta}
                    <span className={cn('px-1.5 rounded-full tabular-nums', activa ? 'bg-white/20' : 'bg-aurea-champagne/40 text-aurea-navy')}>
                      {p.conteo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-aurea-champagne/30">
            {tabActivo === 'habituales' &&
              (listaHabituales.length > 0 ? (
                listaHabituales
              ) : insumosHabituales.length === 0 ? (
                <Aviso titulo="Sin insumos habituales" texto="Este proveedor aún no tiene compras previas." accion={irACatalogo} />
              ) : (
                <Aviso titulo={`Ningún habitual coincide con «${busqueda}»`} accion={irACatalogo} />
              ))}

            {tabActivo === 'catalogo' &&
              (buscandoRemoto ? (
                <div className="p-6 flex justify-center" aria-busy="true" aria-label="Buscando en el catálogo">
                  <Loader2 className="w-5 h-5 text-aurea-copper animate-spin" aria-hidden="true" />
                </div>
              ) : listaCatalogo.length > 0 ? (
                listaCatalogo
              ) : terminoCorto ? (
                <Aviso titulo="Busca en todo tu catálogo" texto="Escribe al menos 2 letras arriba." />
              ) : (
                <Aviso titulo={`Sin resultados para «${busqueda}»`} texto="Revisa la ortografía o prueba con otro nombre." />
              ))}

            {tabActivo === 'todos' && (
              <>
                {listaHabituales.length > 0 && (
                  <div>
                    <Rotulo icono={Star} habitual>
                      Habituales
                    </Rotulo>
                    {listaHabituales}
                  </div>
                )}
                {listaCatalogo.length > 0 && (
                  <div>
                    <Rotulo icono={Package}>Catálogo</Rotulo>
                    {listaCatalogo}
                  </div>
                )}
                {buscandoRemoto ? (
                  <div className="p-3 flex justify-center" aria-busy="true" aria-label="Buscando en el catálogo">
                    <Loader2 className="w-4 h-4 text-aurea-copper animate-spin" aria-hidden="true" />
                  </div>
                ) : (
                  listaHabituales.length === 0 &&
                  listaCatalogo.length === 0 &&
                  (terminoCorto ? (
                    <Aviso titulo="Escribe para buscar" texto="Busca entre habituales y catálogo a la vez." />
                  ) : (
                    <Aviso titulo={`Sin resultados para «${busqueda}»`} texto="Revisa la ortografía o prueba con otro nombre." />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
