import React, { useMemo, useState } from 'react';
import { ArrowDownUp, Puzzle, TrendingDown, TrendingUp, Trophy, type LucideIcon } from 'lucide-react';
import { ListaResponsive, Paginacion, Pestanas, type ColumnaTabla, type OpcionPestana } from '@/components/ui';
import { reportesService } from '@/services/serviceAdapter';
import type { ClasificacionMenu, PlatoRankingDTO, RangoDTO, RankingProductosDTO } from '@/types/reportes';
import { COLORES_CATEGORIA, tenue } from './colores';
import { CargandoReporte, ErrorReporte, SinPlanReportes, SinVentasReporte, type OtroPeriodo } from './EstadosReporte';
import { GraficoMatriz } from './GraficoMatriz';
import { Estrellas, LoMasImportante, NotaInformativa } from './piezas';
import {
  GRUPOS,
  MINIMO_PLATOS_PARA_ESTRELLAS,
  ORDEN_GRUPOS,
  calcularEstrellas,
  entero,
  frasePrincipalPlatos,
  ingresoPorGrupo,
  notaDeCategorias,
  porcentaje,
  reglaDeGrupo,
  soles,
} from './utilidades';
import { useReporte } from './useReporte';

const ICONO_GRUPO: Record<ClasificacionMenu, LucideIcon> = { estrella: Trophy, caballito: TrendingUp, puzle: Puzzle, rezagado: TrendingDown };
/** Clases literales (Tailwind no ve las que se arman con texto) */
const PUNTO_GRUPO: Record<ClasificacionMenu, string> = { estrella: 'bg-[#C98F12]', caballito: 'bg-[#2563A8]', puzle: 'bg-[#0E9488]', rezagado: 'bg-[#C24A35]' };

type Orden = 'ingreso' | 'unidades' | 'margen' | 'ganancia';
const ETIQUETA_ORDEN: Record<Orden, string> = { ingreso: 'ingresos', unidades: 'unidades vendidas', margen: 'margen por unidad', ganancia: 'rentabilidad' };

interface Fila extends PlatoRankingDTO {
  estrellas: number | null;
}

const valorDeOrden: Record<Orden, (f: Fila) => number> = {
  ingreso: (f) => f.ingreso,
  unidades: (f) => f.unidades,
  margen: (f) => f.margen_unitario ?? Number.NEGATIVE_INFINITY,
  ganancia: (f) => f.margen ?? Number.NEGATIVE_INFINITY,
};

interface Props {
  rango: RangoDTO;
  /** El plan no incluye los reportes avanzados: no se consulta */
  incluido: boolean;
  otroPeriodo: OtroPeriodo | null;
}

const TARJETA = 'bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm p-4 sm:p-5 min-w-0';

/** Pestaña «Platos»: grupos del menú, mapa de la carta, categorías y ranking con estrellas de rentabilidad. */
export const VistaPlatos: React.FC<Props> = ({ rango, incluido, otroPeriodo }) => {
  const ranking = useReporte(() => reportesService.ranking(rango), [rango.desde, rango.hasta], {
    habilitado: incluido,
    estaVacio: (d) => d.productos.length === 0,
  });

  if (!incluido || ranking.estado === 'sin_plan') {
    return (
      <SinPlanReportes
        titulo="Descubre qué platos te hacen ganar"
        beneficios={['Qué platos se piden mucho y dejan buen margen, y cuáles conviene revisar.', 'Cuánto deja cada plato, calificado de 1 a 5 estrellas.', 'Los ingresos de cada categoría de tu carta.']}
      />
    );
  }
  if (ranking.estado === 'cargando') return <CargandoReporte variante="platos" />;
  if (ranking.estado === 'error' || !ranking.datos) return <ErrorReporte mensaje={ranking.error ?? 'No se pudieron cargar los reportes.'} onReintentar={() => void ranking.recargar()} />;
  if (ranking.estado === 'vacio') return <SinVentasReporte otroPeriodo={otroPeriodo} titulo="Todavía no se vendieron platos en este periodo" descripcion="Cuando cobres cuentas, aquí verás qué platos se piden más y cuáles dejan más." />;

  return <ContenidoPlatos datos={ranking.datos} />;
};

const ContenidoPlatos: React.FC<{ datos: RankingProductosDTO }> = ({ datos }) => {
  const [filtro, setFiltro] = useState<'todos' | ClasificacionMenu>('todos');
  const [orden, setOrden] = useState<Orden>('ingreso');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);

  const estrellas = useMemo(() => calcularEstrellas(datos.productos), [datos.productos]);
  const filas = useMemo<Fila[]>(() => datos.productos.map((p) => ({ ...p, estrellas: estrellas.get(p.producto_id) ?? null })), [datos.productos, estrellas]);
  const grupos = useMemo(() => ingresoPorGrupo(datos.productos), [datos.productos]);
  const ingresoClasificado = ORDEN_GRUPOS.reduce((s, g) => s + grupos[g].ingreso, 0);
  const frase = frasePrincipalPlatos(datos);
  const notaCategorias = notaDeCategorias(datos.por_categoria);

  const visibles = useMemo(
    () => filas.filter((f) => filtro === 'todos' || f.clasificacion === filtro).sort((a, b) => valorDeOrden[orden](b) - valorDeOrden[orden](a) || a.nombre.localeCompare(b.nombre, 'es')),
    [filas, filtro, orden]
  );
  const totalPaginas = Math.max(1, Math.ceil(visibles.length / limite));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pagina_ = visibles.slice((paginaActual - 1) * limite, paginaActual * limite);
  const inicio = (paginaActual - 1) * limite;

  const opcionesFiltro: OpcionPestana<'todos' | ClasificacionMenu>[] = [
    { valor: 'todos', etiqueta: 'Todos', conteo: filas.length },
    ...ORDEN_GRUPOS.map((g) => ({ valor: g, etiqueta: GRUPOS[g].nombre, conteo: grupos[g].platos, punto: PUNTO_GRUPO[g] })),
  ];

  const ordenable = (clave: Orden, texto: string) => (
    <button
      type="button"
      onClick={() => {
        setOrden(clave);
        setPagina(1);
      }}
      aria-label={`Ordenar por ${ETIQUETA_ORDEN[clave]}`}
      className="inline-flex items-center gap-1 uppercase tracking-wider font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper rounded"
    >
      {texto}
      {orden === clave && <ArrowDownUp className="w-3 h-3" aria-hidden="true" />}
    </button>
  );

  const insignia = (f: Fila) => {
    if (!f.clasificacion) return <span className="text-sm text-aurea-navy/60">Sin costo</span>;
    const g = GRUPOS[f.clasificacion];
    const Icono = ICONO_GRUPO[f.clasificacion];
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ background: tenue(g.color, 0.12), color: g.colorTexto }}>
        <Icono className="w-3.5 h-3.5" aria-hidden="true" />
        {g.singular}
      </span>
    );
  };

  const columnas: ColumnaTabla<Fila>[] = [
    { id: 'pos', cabecera: '#', celda: (f) => <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-aurea-ivory text-sm font-bold text-aurea-navy/70 tabular-nums">{inicio + pagina_.indexOf(f) + 1}</span>, className: 'w-14' },
    {
      id: 'plato',
      cabecera: 'Plato',
      celda: (f) => (
        <span className="block">
          <span className="block font-semibold text-aurea-navy">{f.nombre}</span>
          <span className="block text-xs text-aurea-navy/60">{f.categoria_nombre ?? 'Sin categoría'}</span>
          {/* En tablet no hay lugar para la columna del grupo: va bajo el nombre */}
          <span className="mt-1.5 block lg:hidden">{insignia(f)}</span>
        </span>
      ),
      className: 'min-w-40',
    },
    { id: 'unidades', cabecera: ordenable('unidades', 'Unidades'), alinear: 'derecha', celda: (f) => <span className="tabular-nums">{entero(f.unidades)}</span> },
    { id: 'ingreso', cabecera: ordenable('ingreso', 'Ingresos'), alinear: 'derecha', celda: (f) => <span className="font-semibold tabular-nums">{soles(f.ingreso)}</span> },
    { id: 'margen', cabecera: ordenable('margen', 'Margen por unidad'), alinear: 'derecha', celda: (f) => <span className="tabular-nums">{f.margen_unitario === null ? '—' : soles(f.margen_unitario, 2)}</span> },
    { id: 'estrellas', cabecera: ordenable('ganancia', 'Rentabilidad'), alinear: 'derecha', celda: (f) => <span className="inline-flex justify-end"><Estrellas valor={f.estrellas} /></span> },
    { id: 'grupo', cabecera: 'Grupo', celda: insignia, className: 'hidden lg:table-cell' },
  ];

  return (
    <div className="space-y-4">
      {frase && <LoMasImportante>{frase}</LoMasImportante>}

      {datos.umbrales ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ORDEN_GRUPOS.map((g) => {
            const grupo = GRUPOS[g];
            const Icono = ICONO_GRUPO[g];
            return (
              <article key={g} className="rounded-2xl border p-4 flex flex-col gap-2 min-w-0" style={{ background: `linear-gradient(160deg, ${tenue(grupo.color, 0.13)} 0%, #fff 70%)`, borderColor: tenue(grupo.color, 0.3) }}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-aurea-navy">{grupo.nombre}</h3>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: grupo.color }} aria-hidden="true"><Icono className="w-5 h-5" /></span>
                </div>
                <p className="font-serif font-bold text-3xl leading-none text-aurea-navy tabular-nums">
                  {grupos[g].platos}
                  <span className="ml-1.5 font-sans text-sm font-medium text-aurea-navy/65">{grupos[g].platos === 1 ? 'plato' : 'platos'}</span>
                </p>
                <p className="self-start rounded-lg border border-aurea-champagne/60 bg-white/75 px-2 py-1 text-xs font-semibold text-aurea-navy tabular-nums">{reglaDeGrupo(g, datos.umbrales!)}</p>
                <p className="text-sm text-aurea-navy/70">{grupo.consejo}</p>
                <p className="mt-auto text-sm font-semibold text-aurea-navy tabular-nums">
                  {porcentaje(ingresoClasificado > 0 ? (grupos[g].ingreso / ingresoClasificado) * 100 : 0)} de los ingresos de platos
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <NotaInformativa>Ningún plato tiene costo completo en este periodo, así que todavía no se pueden clasificar ni calificar. Completa las recetas de tu carta para verlos.</NotaInformativa>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {datos.umbrales && (
          <section className={TARJETA} aria-labelledby="t-mapa">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <h3 id="t-mapa" className="text-base font-bold text-aurea-navy">Mapa de la carta</h3>
                <p className="text-sm text-aurea-navy/65">Cuánto se pide cada plato frente a cuánto deja por unidad</p>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-aurea-navy/75">
                {ORDEN_GRUPOS.map((g) => (
                  <li key={g} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: GRUPOS[g].color }} />{GRUPOS[g].singular}</li>
                ))}
              </ul>
            </div>
            <GraficoMatriz platos={datos.productos} umbrales={datos.umbrales} />
          </section>
        )}

        <section className={`${TARJETA} ${datos.umbrales ? '' : 'lg:col-span-2'}`} aria-labelledby="t-categorias">
          <h3 id="t-categorias" className="text-base font-bold text-aurea-navy">Ingresos por categoría</h3>
          <p className="text-sm text-aurea-navy/65 mb-4">Parte de los ingresos de platos</p>
          <div className="flex h-4 gap-0.5 rounded-full overflow-hidden mb-5" role="img" aria-label={datos.por_categoria.map((c) => `${c.categoria_nombre} ${porcentaje(c.participacion_pct ?? 0)}`).join(', ')}>
            {datos.por_categoria.map((c, i) => (
              <span key={c.categoria_nombre} style={{ width: `${c.participacion_pct ?? 0}%`, background: COLORES_CATEGORIA[i % COLORES_CATEGORIA.length] }} />
            ))}
          </div>
          <ul className="space-y-4">
            {datos.por_categoria.map((c, i) => {
              const maximo = datos.por_categoria[0]?.participacion_pct || 1;
              return (
                <li key={c.categoria_nombre} className="space-y-1.5">
                  <p className="flex items-center justify-between gap-3 text-sm text-aurea-navy">
                    <span className="inline-flex items-center gap-2 min-w-0"><i className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: COLORES_CATEGORIA[i % COLORES_CATEGORIA.length] }} /><strong className="truncate">{c.categoria_nombre}</strong></span>
                    <span className="font-semibold tabular-nums">{c.participacion_pct === null ? '—' : porcentaje(c.participacion_pct)}</span>
                  </p>
                  <span className="block h-2.5 rounded-full bg-aurea-navy/[0.06] overflow-hidden" aria-hidden="true">
                    <span className="block h-full rounded-full" style={{ width: `${((c.participacion_pct ?? 0) / maximo) * 100}%`, background: COLORES_CATEGORIA[i % COLORES_CATEGORIA.length] }} />
                  </span>
                  <p className="text-xs text-aurea-navy/65 tabular-nums">{soles(c.ingreso)} · {entero(c.unidades)} unidades</p>
                </li>
              );
            })}
          </ul>
          {notaCategorias && <NotaInformativa className="mt-5">{notaCategorias}</NotaInformativa>}
        </section>
      </div>

      <section aria-labelledby="t-ranking" className="space-y-3">
        <div>
          <h3 id="t-ranking" className="text-base font-bold text-aurea-navy">Ranking de platos</h3>
          <p className="text-sm text-aurea-navy/65">Ordenado por {ETIQUETA_ORDEN[orden]}</p>
        </div>
        {estrellas.size > 0 ? (
          <NotaInformativa>
            <strong>Rentabilidad:</strong> compara cuánto deja cada plato en total (unidades × margen por unidad). El 20 % que más deja tiene 5 estrellas, el siguiente 20 % tiene 4, y así hasta 1 estrella.
          </NotaInformativa>
        ) : (
          <NotaInformativa>Las estrellas aparecen cuando hay al menos {MINIMO_PLATOS_PARA_ESTRELLAS} platos con costo para compararlos.</NotaInformativa>
        )}
        {datos.sin_costo > 0 && (
          <NotaInformativa>
            {datos.sin_costo === 1 ? '1 plato no tiene' : `${datos.sin_costo} platos no tienen`} costo completo en alguna venta del periodo: no se clasifica ni se califica. Completa su receta para incluirlo.
          </NotaInformativa>
        )}
        <ListaResponsive
          filas={pagina_}
          columnas={columnas}
          claveFila={(f) => f.producto_id}
          etiqueta="Ranking de platos"
          cabecera={
            <Pestanas
              opciones={opcionesFiltro}
              valor={filtro}
              onCambiar={(v) => {
                setFiltro(v);
                setPagina(1);
              }}
              etiqueta="Filtrar por grupo"
              className="shadow-none"
            />
          }
          tarjeta={(f) => (
            <div className="flex items-start gap-3">
              <span className="inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-lg bg-aurea-ivory text-sm font-bold text-aurea-navy/70 tabular-nums">{inicio + pagina_.indexOf(f) + 1}</span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-semibold text-aurea-navy">{f.nombre}</p>
                <p className="text-xs text-aurea-navy/65 tabular-nums">
                  {entero(f.unidades)} u · {f.margen_unitario === null ? 'sin costo' : `${soles(f.margen_unitario, 2)} por unidad`}
                </p>
                <div className="flex flex-wrap items-center gap-2"><Estrellas valor={f.estrellas} />{insignia(f)}</div>
              </div>
              <p className="font-bold text-aurea-navy tabular-nums">{soles(f.ingreso)}</p>
            </div>
          )}
          vacio={visibles.length === 0 ? <p className="py-10 text-center text-sm text-aurea-navy/65">No hay platos en este grupo en el periodo.</p> : undefined}
          pie={
            <Paginacion
              pagina={paginaActual}
              totalPaginas={totalPaginas}
              totalRegistros={visibles.length}
              limite={limite}
              onCambiarPagina={setPagina}
              onCambiarLimite={(n) => {
                setLimite(n);
                setPagina(1);
              }}
              unidad="platos"
              opcionesLimite={[5, 10, 20, 50]}
            />
          }
        />
      </section>
    </div>
  );
};
