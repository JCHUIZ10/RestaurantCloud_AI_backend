import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getCartaPublicaPorSlug } from '../services/mockCartaService';
import { CartaHeader } from '../components/CartaHeader';
import { PromoBanner } from '../components/PromoBanner';
import { CategoryTabs } from '../components/CategoryTabs';
import { PlatoCard } from '../components/PlatoCard';
import { PlatoModal } from '../components/PlatoModal';
import { BusquedaVacia } from '../components/BusquedaVacia';
import type { CatalogoCartaPublicoDTO, ProductoPublicoDTO } from '@/types/carta';

export const CartaDigitalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [catalogo, setCatalogo] = useState<CatalogoCartaPublicoDTO | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Estados de Interacción del Comensal
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [platoSeleccionado, setPlatoSeleccionado] = useState<ProductoPublicoDTO | null>(null);

  // Carga de Datos desde el Servicio de Mocks con ApiResponse
  useEffect(() => {
    let isMounted = true;
    setCargando(true);
    setErrorMensaje(null);

    getCartaPublicaPorSlug(slug || 'aurea-miraflores')
      .then((res) => {
        if (!isMounted) return;
        if (res.exito && res.datos) {
          setCatalogo(res.datos);
        } else {
          setErrorMensaje(
            res.errores?.[0]?.mensaje || 'No pudimos encontrar la carta de este restaurante.'
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMensaje('Ocurrió un error al cargar la carta del restaurante.');
        }
      })
      .finally(() => {
        if (isMounted) setCargando(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Lista plana de todos los platos para cálculo de totales y filtros
  const todosLosPlatos = useMemo(() => {
    if (!catalogo) return [];
    return catalogo.categorias.flatMap((cat) => cat.platos);
  }, [catalogo]);

  // Filtro reactivo en memoria (0ms latencia)
  const platosFiltrados = useMemo(() => {
    if (!catalogo) return [];

    let resultado = todosLosPlatos;

    // 1. Filtro por categoría seleccionada
    if (categoriaActiva !== 'todas') {
      const cat = catalogo.categorias.find((c) => c.id === categoriaActiva);
      resultado = cat ? cat.platos : [];
    }

    // 2. Filtro por búsqueda (nombre o descripción)
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termino) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(termino))
      );
    }

    return resultado;
  }, [catalogo, todosLosPlatos, categoriaActiva, busqueda]);

  // =========================================================================
  // ESTADO DE CARGA (SKELETON UX)
  // =========================================================================
  if (cargando) {
    return (
      <div className="py-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-44 bg-white/70 rounded-2xl border border-aurea-copper/20" />
            <div className="h-40 bg-white/50 rounded-2xl border border-aurea-copper/20 hidden lg:block" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-20 bg-white/60 rounded-2xl" />
            <div className="h-11 bg-white/60 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="h-56 bg-white/70 rounded-2xl" />
              <div className="h-56 bg-white/70 rounded-2xl" />
              <div className="h-56 bg-white/70 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ESTADO DE ERROR 404 (SEDE NO ENCONTRADA)
  // =========================================================================
  if (errorMensaje || !catalogo) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-2 border-rose-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-serif text-2xl text-aurea-navy font-bold">
            Restaurante No Disponible
          </h2>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 leading-relaxed">
            {errorMensaje || 'La dirección de la carta no existe o la sede fue desactivada temporalmente.'}
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/sede/aurea-miraflores/carta"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy text-white text-xs font-semibold hover:bg-opacity-90 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-aurea-copper" />
            <span>Ver Carta Demo ÁUREA Miraflores</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL DE CONSULTA CULINARIA RESPONSIVA (MOBILE + DESKTOP GRID)
  // =========================================================================
  return (
    <div className="pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ===================================================================
            COLUMNA IZQUIERDA: SIDEBAR EN DESKTOP (lg:col-span-4 / sticky)
           =================================================================== */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* 1. Cabecera e Información de la Sede */}
          <CartaHeader sede={catalogo.sede} />

          {/* 2. Menú Vertical de Categorías (Visible solo en Desktop) */}
          <div className="hidden lg:block bg-white rounded-2xl p-4 border-2 border-aurea-copper/25 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-aurea-copper/15">
              <span className="text-xs font-bold uppercase tracking-wider text-aurea-navy font-serif">
                Categorías de la Carta
              </span>
              <span className="text-[11px] text-aurea-copper font-medium">
                {todosLosPlatos.length} platos
              </span>
            </div>

            <CategoryTabs
              categorias={catalogo.categorias}
              categoriaSeleccionada={categoriaActiva}
              onSelectCategoria={(id) => setCategoriaActiva(id)}
              totalPlatos={todosLosPlatos.length}
              layout="vertical"
            />
          </div>
        </aside>

        {/* ===================================================================
            COLUMNA DERECHA: PROMOS, FILTROS Y GRILLA DE PLATOS (lg:col-span-8)
           =================================================================== */}
        <section className="lg:col-span-8 space-y-4">
          {/* 3. Banner de Promociones Vigentes */}
          <PromoBanner promociones={catalogo.promociones} />

          {/* 4. Buscador Reactivo Instantáneo */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-aurea-copper">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar platos, ingredientes, cortes..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border-2 border-aurea-copper/25 text-xs sm:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 shadow-sm transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="absolute inset-y-0 right-3 flex items-center text-aurea-navy/50 hover:text-aurea-navy"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 5. Tabs Horizontales Deslizables (Solo en Mobile / Tablet) */}
          <div className="block lg:hidden">
            <CategoryTabs
              categorias={catalogo.categorias}
              categoriaSeleccionada={categoriaActiva}
              onSelectCategoria={(id) => setCategoriaActiva(id)}
              totalPlatos={todosLosPlatos.length}
              layout="horizontal"
            />
          </div>

          {/* 6. Contador de resultados y estado del filtro */}
          <div className="flex items-center justify-between text-xs text-aurea-navy/70 px-1 pt-1">
            <p>
              Mostrando{' '}
              <span className="font-bold text-aurea-navy">{platosFiltrados.length}</span>{' '}
              {platosFiltrados.length === 1 ? 'opción gastronómica' : 'opciones gastronómicas'}
              {categoriaActiva !== 'todas' && (
                <span className="ml-1 text-aurea-copper font-medium">
                  • {catalogo.categorias.find((c) => c.id === categoriaActiva)?.nombre}
                </span>
              )}
            </p>
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="text-aurea-copper hover:underline text-[11px]"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {/* 7. Catálogo de Platos: Lista vertical en Mobile, Grilla 2 o 3 columnas en Desktop */}
          <div className="pt-1">
            {platosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platosFiltrados.map((plato) => (
                  <PlatoCard
                    key={plato.id}
                    plato={plato}
                    onOpenModal={(p) => setPlatoSeleccionado(p)}
                  />
                ))}
              </div>
            ) : (
              <BusquedaVacia
                busqueda={busqueda}
                onReset={() => {
                  setBusqueda('');
                  setCategoriaActiva('todas');
                }}
                telefonoSede={catalogo.sede.telefono}
                nombreSede={catalogo.sede.nombre}
              />
            )}
          </div>
        </section>
      </div>

      {/* 8. Modal / Bottom Sheet de Inspección del Plato */}
      <PlatoModal
        plato={platoSeleccionado}
        onClose={() => setPlatoSeleccionado(null)}
        telefonoSede={catalogo.sede.telefono}
      />
    </div>
  );
};
