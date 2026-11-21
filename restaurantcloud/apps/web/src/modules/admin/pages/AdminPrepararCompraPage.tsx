import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, FileSpreadsheet, FileText, ShoppingBasket, Store } from 'lucide-react';
import { Button, EstadoError, EstadoVacio, PageHeader, Skeleton, useToast } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { prediccionService } from '@/services/serviceAdapter';
import { guardarBlobComoArchivo } from '@/services/api/client';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import { cn } from '@/shared/utils';
import type { CompraSugerida, DecisionLoteDTO, LineaReposicionDTO } from '@/types/prediccion';
import {
  SinPlanPrediccion,
  agruparPorProveedor,
  cantidadAComprar,
  formatoCantidad,
  formatoSoles,
  nombreUnidad,
  textoEstado,
  useUltimaPrediccion,
} from '../components/prediccion';

/** Número escrito por el usuario (acepta coma o punto). `null` si no es un número válido. */
function leerCantidad(texto: string): number | null {
  const n = Number(texto.trim().replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n * 1000) / 1000 : null;
}

/** Preparar la compra: revisar las cantidades por proveedor y llevarlas al registro de compras. */
export const AdminPrepararCompraPage: React.FC = () => {
  const { estado, datos, error, recargar } = useUltimaPrediccion();
  const { mostrar } = useToast();
  const navigate = useNavigate();
  const [escritas, setEscritas] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<string | 'descarga' | null>(null);

  const cantidadEfectiva = (l: LineaReposicionDTO): number => {
    if (l.estado !== 'pendiente') return cantidadAComprar(l);
    const escrita = escritas[l.id];
    return escrita === undefined ? l.cantidad_sugerida : (leerCantidad(escrita) ?? l.cantidad_sugerida);
  };
  const fueEditada = (l: LineaReposicionDTO): boolean =>
    l.estado === 'pendiente' && escritas[l.id] !== undefined && leerCantidad(escritas[l.id]) !== null && leerCantidad(escritas[l.id]) !== l.cantidad_sugerida;

  const grupos = useMemo(
    () =>
      agruparPorProveedor(datos?.reposicion ?? []).map((g) => ({
        ...g,
        subtotal: g.lineas.reduce((n, l) => n + (l.proveedor?.precio ?? 0) * cantidadEfectiva(l), 0),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datos, escritas]
  );
  const total = grupos.reduce((n, g) => n + g.subtotal, 0);
  const editadas = grupos.flatMap((g) => g.lineas).filter(fueEditada).length;

  /** Guarda lo que el administrador decidió: lo cambiado se ajusta y, si se pide, el resto se acepta. */
  const guardarDecisiones = async (lineas: LineaReposicionDTO[], aceptarElResto: boolean): Promise<boolean> => {
    const decisiones: DecisionLoteDTO[] = [];
    for (const l of lineas) {
      if (l.estado !== 'pendiente') continue;
      const cantidad = cantidadEfectiva(l);
      if (cantidad <= 0) decisiones.push({ id: l.id, estado: 'descartada' });
      else if (fueEditada(l)) decisiones.push({ id: l.id, estado: 'ajustada', cantidad_final: cantidad });
      else if (aceptarElResto) decisiones.push({ id: l.id, estado: 'aceptada' });
    }
    if (decisiones.length === 0) return true;

    try {
      const res = await prediccionService.decidirLote(decisiones);
      if (!res.exito) {
        mostrar(res.errores?.[0]?.mensaje ?? 'No se pudieron guardar tus cantidades.', 'error');
        await recargar(true);
        return false;
      }
      setEscritas({});
      await recargar(true);
      return true;
    } catch (e) {
      mostrar(mensajeDeErrorApi(e, 'No se pudieron guardar tus cantidades. Intenta de nuevo.'), 'error');
      return false;
    }
  };

  const registrarCompra = async (clave: string) => {
    const grupo = grupos.find((g) => g.clave === clave);
    if (!grupo) return;
    setGuardando(clave);
    const compra: CompraSugerida = {
      proveedorId: grupo.proveedorId,
      lineas: grupo.lineas
        .map((l) => ({
          insumo_id: l.insumo_id,
          insumo_nombre: l.insumo,
          unidad_medida: l.unidad_medida,
          cantidad: cantidadEfectiva(l),
          precio_unitario: l.proveedor?.precio ?? 0,
        }))
        .filter((l) => l.cantidad > 0),
    };
    const guardado = await guardarDecisiones(grupo.lineas, true);
    setGuardando(null);
    if (guardado) navigate(ROUTES.ADMIN_COMPRAS, { state: { compraSugerida: compra } });
  };

  const descargar = async (formato: 'xlsx' | 'pdf') => {
    setGuardando('descarga');
    try {
      // Lo que cambiaste debe quedar guardado para que el archivo lo traiga
      if (!(await guardarDecisiones(grupos.flatMap((g) => g.lineas), false))) return;
      const res = await prediccionService.exportar(formato);
      if (res.exito) guardarBlobComoArchivo(res.archivo.blob, res.archivo.nombre);
      else mostrar(res.mensaje, 'error');
    } finally {
      setGuardando(null);
    }
  };

  const cabecera = (
    <PageHeader
      titulo="Preparar la compra"
      icono={ShoppingBasket}
      volver={{ etiqueta: 'Volver a Planificar la semana', to: ROUTES.ADMIN_PLANIFICAR_SEMANA }}
      descripcion={
        datos ? `Para ${datos.cobertura_dias} días. Revisa las cantidades; puedes cambiar cualquiera.` : 'Revisa las cantidades antes de registrar tu compra.'
      }
    />
  );

  if (estado === 'cargando') return <div className="space-y-6">{cabecera}<Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  if (estado === 'sin_plan') return <div className="space-y-6">{cabecera}<SinPlanPrediccion /></div>;
  if (estado === 'error') return <div className="space-y-6">{cabecera}<EstadoError mensaje={error ?? 'No se pudo cargar la predicción.'} onReintentar={() => recargar()} /></div>;
  if (estado === 'vacio' || datos === null || grupos.length === 0) {
    return (
      <div className="space-y-6">
        {cabecera}
        <EstadoVacio
          icono={ShoppingBasket}
          titulo="No hay nada que comprar"
          descripcion="Todo está cubierto o descartado. Si recalculas la semana, aquí aparecerá lo que haga falta."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cabecera}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex-[999_1_34rem] min-w-0 space-y-5">
          {grupos.map((g) => (
            <section key={g.clave} aria-label={g.nombre} className="bg-white border border-tinta-100 rounded-3xl overflow-hidden">
              <div className="bg-aurea-navy text-aurea-ivory px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-aurea-champagne/15 text-aurea-champagne flex items-center justify-center shrink-0" aria-hidden="true">
                    <Store className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold truncate">{g.nombre}</h2>
                    <p className="text-sm text-aurea-ivory/80">{g.lineas.length} {g.lineas.length === 1 ? 'insumo' : 'insumos'}</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-aurea-champagne tabular-nums">{formatoSoles(g.subtotal)}</p>
              </div>

              <ul className="divide-y divide-tinta-50">
                {g.lineas.map((l) => {
                  const editable = l.estado === 'pendiente';
                  const cambiada = fueEditada(l);
                  const precio = l.proveedor?.precio ?? 0;
                  return (
                    <li key={l.id} className={cn('px-5 py-3 grid gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1fr)] sm:items-center', cambiada && 'bg-estado-alerta-50')}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-aurea-navy">{l.insumo}</p>
                        <p className={cn('text-xs', cambiada ? 'font-semibold text-estado-alerta-800' : 'text-tinta-500')}>
                          {cambiada ? `Cambiada por ti · sugerimos ${formatoCantidad(l.cantidad_sugerida, l.unidad_medida)}` : editable ? 'Sugerido por la predicción' : textoEstado(l)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`cantidad-${l.id}`}>Cantidad de {l.insumo}</label>
                        <input
                          id={`cantidad-${l.id}`}
                          type="text"
                          inputMode="decimal"
                          disabled={!editable}
                          value={escritas[l.id] ?? String(cantidadEfectiva(l))}
                          onChange={(e) => setEscritas((prev) => ({ ...prev, [l.id]: e.target.value }))}
                          aria-invalid={escritas[l.id] !== undefined && leerCantidad(escritas[l.id]) === null}
                          className={cn(
                            'w-24 min-h-tactil px-3 rounded-xl border bg-white text-right text-base font-semibold text-aurea-navy tabular-nums focus:outline-none focus:ring-2 focus:ring-aurea-copper disabled:bg-tinta-50 disabled:text-tinta-500',
                            escritas[l.id] !== undefined && leerCantidad(escritas[l.id]) === null ? 'border-estado-error-500' : cambiada ? 'border-estado-alerta-500' : 'border-tinta-200'
                          )}
                        />
                        <span className="text-sm text-tinta-600">{nombreUnidad(l.unidad_medida, cantidadEfectiva(l))}</span>
                      </div>
                      <div className="flex sm:flex-col sm:items-end justify-between gap-1 text-sm">
                        <span className="text-tinta-500">{g.proveedorId ? `${formatoSoles(precio)} c/u` : 'Sin precio'}</span>
                        <span className="font-bold text-aurea-navy tabular-nums">{formatoSoles(precio * cantidadEfectiva(l))}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="px-5 py-4 border-t border-tinta-50 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => registrarCompra(g.clave)}
                  loading={guardando === g.clave}
                  disabled={guardando !== null && guardando !== g.clave}
                  leftIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                >
                  Registrar compra
                </Button>
              </div>
            </section>
          ))}
        </div>

        <aside aria-labelledby="titulo-resumen" className="flex-[1_1_18rem] lg:sticky lg:top-4 bg-white border border-aurea-copper/40 rounded-3xl p-5 space-y-4">
          <h2 id="titulo-resumen" className="font-serif text-2xl text-aurea-navy">Resumen</h2>
          <dl className="space-y-2 text-sm">
            {grupos.map((g) => (
              <div key={g.clave} className="flex justify-between gap-3">
                <dt className="text-tinta-600 truncate">{g.nombre}</dt>
                <dd className="font-semibold text-aurea-navy tabular-nums shrink-0">{formatoSoles(g.subtotal)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-tinta-100 pt-3">
              <dt className="font-bold text-aurea-navy">Total estimado</dt>
              <dd className="text-2xl font-bold text-aurea-navy tabular-nums">{formatoSoles(total)}</dd>
            </div>
          </dl>

          {editadas > 0 && (
            <p role="status" className="rounded-xl bg-estado-alerta-50 text-estado-alerta-900 text-sm p-3">
              Cambiaste {editadas} {editadas === 1 ? 'cantidad' : 'cantidades'}. Revisa que te alcance para los días que elegiste.
            </p>
          )}

          <div className="grid gap-2">
            <Button variant="outline" onClick={() => descargar('xlsx')} disabled={guardando !== null} leftIcon={<FileSpreadsheet className="w-4 h-4" aria-hidden="true" />}>
              Descargar en Excel
            </Button>
            <Button variant="outline" onClick={() => descargar('pdf')} disabled={guardando !== null} leftIcon={<FileText className="w-4 h-4" aria-hidden="true" />}>
              Descargar en PDF
            </Button>
          </div>
          <p className="flex gap-2 text-xs text-tinta-500">
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            Al registrar, se abre tu formulario de compras con todo cargado. Lo que aceptes o cambies nos ayuda a sugerir mejor la próxima vez.
          </p>
        </aside>
      </div>
    </div>
  );
};
