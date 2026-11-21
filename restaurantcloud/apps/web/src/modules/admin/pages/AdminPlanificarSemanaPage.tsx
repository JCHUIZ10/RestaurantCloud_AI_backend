import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, ShieldCheck, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { Button, EstadoError, EstadoVacio, PageHeader, Skeleton, useToast } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { prediccionService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import type { CoberturaDias, LineaReposicionDTO, PrioridadReposicion } from '@/types/prediccion';
import {
  AvisosPrediccion,
  CalculandoPrediccion,
  CintaSemana,
  ComoSeCalcula,
  GrupoPrioridad,
  IndicadorNivel,
  PrimeraVezPrediccion,
  ResumenPrediccion,
  SelectorCobertura,
  SinPlanPrediccion,
  agruparPorProveedor,
  formatoSolesEntero,
  useUltimaPrediccion,
} from '../components/prediccion';

const PRIORIDADES: PrioridadReposicion[] = ['urgente', 'pronto', 'cubierto'];

/** Planificar la semana: cuánto se va a vender y qué conviene comprar para no quedarse sin nada. */
export const AdminPlanificarSemanaPage: React.FC = () => {
  const { estado, datos, error, calculando, calcular, recargar } = useUltimaPrediccion();
  const { mostrar } = useToast();
  // Lo que el usuario acaba de elegir, mientras se calcula; después manda lo que trae la semana calculada
  const [elegida, setElegida] = useState<CoberturaDias | null>(null);
  const cobertura = elegida ?? datos?.cobertura_dias ?? 3;
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  const calcularSemana = async (n: CoberturaDias) => {
    setElegida(n);
    const r = await calcular(n);
    setElegida(null);
    if (!r.exito) mostrar(r.mensaje ?? 'No se pudo calcular la semana.', 'error');
  };

  const decidir = async (linea: LineaReposicionDTO, decision: 'aceptada' | 'descartada') => {
    setGuardandoId(linea.id);
    try {
      const res = await prediccionService.decidir(linea.id, decision);
      if (res.exito) {
        await recargar(true);
        mostrar(decision === 'aceptada' ? `${linea.insumo}: aceptado` : `${linea.insumo}: descartado`, 'ok');
      } else {
        mostrar(res.errores?.[0]?.mensaje ?? 'No se pudo guardar tu decisión.', 'error');
        await recargar(true);
      }
    } catch (e) {
      mostrar(mensajeDeErrorApi(e, 'No se pudo guardar tu decisión. Intenta de nuevo.'), 'error');
    } finally {
      setGuardandoId(null);
    }
  };

  const porPrioridad = useMemo(() => {
    const grupos: Record<PrioridadReposicion, LineaReposicionDTO[]> = { urgente: [], pronto: [], cubierto: [] };
    for (const l of datos?.reposicion ?? []) grupos[l.prioridad].push(l);
    return grupos;
  }, [datos]);

  const proveedores = useMemo(() => agruparPorProveedor(datos?.reposicion ?? []), [datos]);
  const porComprar = proveedores.reduce((n, g) => n + g.lineas.length, 0);

  const cabecera = (
    <PageHeader
      titulo="Planificar la semana"
      icono={TrendingUp}
      descripcion="Cuánto vas a vender y qué te conviene comprar para no quedarte sin nada."
      acciones={
        estado === 'ok' ? (
          <>
            <Link
              to={ROUTES.ADMIN_PLATOS_SEMANA}
              className="inline-flex items-center justify-center gap-2 min-h-tactil px-4 rounded-xl border border-aurea-copper/50 bg-white text-sm font-semibold text-aurea-navy hover:bg-aurea-champagne/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2"
            >
              <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
              Ver platos de la semana
            </Link>
            <Button variant="outline" onClick={() => calcularSemana(cobertura)} loading={calculando} leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}>
              Recalcular
            </Button>
          </>
        ) : undefined
      }
    />
  );

  if (estado === 'cargando') {
    return (
      <div className="space-y-6">
        {cabecera}
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (estado === 'sin_plan') {
    return (
      <div className="space-y-6">
        {cabecera}
        <SinPlanPrediccion />
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="space-y-6">
        {cabecera}
        <EstadoError
          titulo="La predicción no está disponible ahora"
          mensaje={error ?? 'No se pudo cargar la predicción.'}
          onReintentar={() => recargar()}
        />
      </div>
    );
  }

  if (estado === 'vacio' || datos === null) {
    return (
      <div className="space-y-6">
        {cabecera}
        {calculando ? <CalculandoPrediccion /> : <PrimeraVezPrediccion onCalcular={() => calcularSemana(3)} calculando={calculando} />}
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-busy={calculando}>
      {cabecera}

      <IndicadorNivel nivel={datos.nivel} progreso={datos.progreso} confianza={datos.confianza} />

      {calculando ? (
        <CalculandoPrediccion />
      ) : (
        <>
          <AvisosPrediccion datos={datos} onReintentar={() => calcularSemana(cobertura)} reintentando={calculando} />

          {datos.pronostico && <CintaSemana pronostico={datos.pronostico} cobertura={cobertura} />}

          {datos.pronostico && (
            <SelectorCobertura valor={cobertura} onChange={calcularSemana} fechaInicio={datos.pronostico.fecha_inicio} deshabilitado={calculando} />
          )}

          {datos.reposicion.length === 0 ? (
            <EstadoVacio
              icono={ShieldCheck}
              titulo="No hay nada que reponer por ahora"
              descripcion="Cuando vendas y registres recetas, aquí verás qué insumos conviene comprar. Los que estén por debajo de tu mínimo aparecerán primero."
            />
          ) : (
            <>
              <ResumenPrediccion totales={datos.totales} />
              {PRIORIDADES.map((p) => (
                <GrupoPrioridad
                  key={p}
                  prioridad={p}
                  lineas={porPrioridad[p]}
                  cobertura={cobertura}
                  guardandoId={guardandoId}
                  onAceptar={(l) => decidir(l, 'aceptada')}
                  onDescartar={(l) => decidir(l, 'descartada')}
                />
              ))}

              <section
                aria-labelledby="titulo-compra"
                className="bg-white border border-aurea-copper/40 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <h2 id="titulo-compra" className="font-serif text-2xl text-aurea-navy">
                    {porComprar > 0 ? 'Tu compra está casi lista' : 'Por ahora no hay nada que comprar'}
                  </h2>
                  {porComprar > 0 && (
                    <p className="text-base text-tinta-600">
                      {porComprar} {porComprar === 1 ? 'insumo' : 'insumos'} para {cobertura} días, unos {formatoSolesEntero(datos.totales.costo)} en{' '}
                      {proveedores.length} {proveedores.length === 1 ? 'proveedor' : 'proveedores'}.
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-sm text-aurea-navy/60">
                    <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Nada se compra solo: tú revisas y registras la compra.
                  </p>
                </div>
                {porComprar > 0 && (
                  <Link
                    to={ROUTES.ADMIN_PREPARAR_COMPRA}
                    className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-aurea-navy text-aurea-ivory font-semibold hover:bg-tinta-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2"
                  >
                    Preparar compra
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </section>
            </>
          )}

          <ComoSeCalcula />
        </>
      )}
    </div>
  );
};
