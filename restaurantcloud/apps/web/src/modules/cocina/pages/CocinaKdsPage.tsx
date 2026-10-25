import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  KDSComandaDTO,
  ConfiguracionKDSDTO,
  ConsolidadoAllDayDTO,
  ItemAnuladoSSEEvent,
  KDSPedidoDespachadoDTO,
  MetricasDespachoDTO,
  PlatoDisponibilidadDTO,
  AlertaStockInsuficienteSSE,
  ItemEnFuegoResolucionDTO,
} from '@/types/cocina';
import { cocinaService } from '@/services/serviceAdapter';
import { mockCocinaService } from '../services/mockCocinaService';
import { MOCK_CONFIGURACION_KDS } from '../services/mockCocinaService';
import { KdsHeader } from '../components/kds/KdsHeader';
import { KdsTicketCard } from '../components/kds/KdsTicketCard';
import { ModalDetalleComanda } from '../components/kds/ModalDetalleComanda';
import { ModalAlertaParadaFogones } from '../components/kds/ModalAlertaParadaFogones';
import { ModalHistorialDespachados } from '../components/kds/ModalHistorialDespachados';
import { ModalDisponibilidadPlatos } from '../components/kds/ModalDisponibilidadPlatos';
import { DialogoResolucionFuego } from '../components/kds/DialogoResolucionFuego';
import { ToastAlertaStock } from '../components/kds/ToastAlertaStock';
import { ConsolidadoAllDayView } from '../components/kds/ConsolidadoAllDayView';
import { DemoKdsWidget } from '../components/kds/DemoKdsWidget';
import { WifiOff, AlertCircle } from 'lucide-react';

export const CocinaKdsPage: React.FC = () => {
  // Estados de datos principales
  const [comandas, setComandas] = useState<KDSComandaDTO[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionKDSDTO>(MOCK_CONFIGURACION_KDS);
  const [consolidado, setConsolidado] = useState<ConsolidadoAllDayDTO[]>([]);
  const [pedidosDespachados, setPedidosDespachados] = useState<KDSPedidoDespachadoDTO[]>([]);
  const [catalogoDisponibilidad, setCatalogoDisponibilidad] = useState<PlatoDisponibilidadDTO[]>([]);
  const [metricasDespacho, setMetricasDespacho] = useState<MetricasDespachoDTO>({
    despachadosUltimos30m: 3,
    tiempoPromedioCoccionMin: 11.6,
    tiempoPromedioPaseMin: 2.2,
    totalTurnoHoy: 45,
  });

  // Estados de interfaz y UX
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConectado, setSseConectado] = useState(true);
  const [modoSonido, setModoSonido] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'fifo' | 'all_day'>('fifo');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');

  // Modales
  const [comandaDetalle, setComandaDetalle] = useState<KDSComandaDTO | null>(null);
  const [alertaParada, setAlertaParada] = useState<ItemAnuladoSSEEvent | null>(null);
  const [modalDespachadosAbierto, setModalDespachadosAbierto] = useState(false);
  const [modalDisponibilidadAbierto, setModalDisponibilidadAbierto] = useState(false);
  const [dialogoFuegoAbierto, setDialogoFuegoAbierto] = useState(false);
  const [platoEnResolucion, setPlatoEnResolucion] = useState<PlatoDisponibilidadDTO | null>(null);
  const [itemsEnFuegoResolucion, setItemsEnFuegoResolucion] = useState<ItemEnFuegoResolucionDTO[]>([]);
  const [alertaStockToast, setAlertaStockToast] = useState<AlertaStockInsuficienteSSE | null>(null);

  // Reloj digital en vivo
  const [horaActual, setHoraActual] = useState(
    new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  /**
   * Reproductor de audio nativo con Web Audio API (Cero dependencias externas)
   */
  const reproducirChime = useCallback((tipo: 'nueva_comanda' | 'alerta_parada') => {
    if (!modoSonido) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (tipo === 'nueva_comanda') {
        // Chime suave ascendente (2 tonos: 587Hz -> 880Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        // Alerta descendente de parada de fogones
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Ignorar si el navegador bloquea AudioContext sin interacción previa
    }
  }, [modoSonido]);

  // Carga inicial de datos
  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [resConfig, resComandas, resConsolidado, resDespachados, resMetricas, resCatalogo] = await Promise.all([
        cocinaService.obtenerConfiguracion(),
        cocinaService.obtenerComandas(),
        cocinaService.obtenerConsolidadoAllDay(),
        cocinaService.obtenerPedidosDespachados(),
        cocinaService.obtenerMetricasDespacho(),
        cocinaService.obtenerCatalogoDisponibilidad(),
      ]);

      if (resConfig.exito) setConfiguracion(resConfig.datos);
      if (resComandas.exito) setComandas(resComandas.datos);
      if (resConsolidado.exito) setConsolidado(resConsolidado.datos);
      if (resDespachados.exito) setPedidosDespachados(resDespachados.datos);
      if (resMetricas.exito) setMetricasDespacho(resMetricas.datos);
      if (resCatalogo.exito) setCatalogoDisponibilidad(resCatalogo.datos);
    } catch {
      setError('No se pudo conectar con el servidor KDS de cocina.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();

    // Short polling cada 3 segundos para reflejar nuevas comandas desde salón
    const pollingKds = setInterval(() => {
      cocinaService.obtenerComandas().then((res: any) => {
        if (res?.exito && res.datos) {
          setComandas(res.datos);
        }
      }).catch(() => {});
    }, 3000);

    return () => clearInterval(pollingKds);
  }, [cargarDatos]);

  // Interval de 1 segundo: reloj digital y avance de semáforo
  useEffect(() => {
    const relojInterval = setInterval(() => {
      setHoraActual(
        new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      // Actualizar segundos transcurridos y semáforo dinámico de comandas
      setComandas((prevComandas) =>
        prevComandas.map((c) => {
          const nuevosSegundos = c.segundos_transcurridos + 1;
          const nuevosMinutos = Math.floor(nuevosSegundos / 60);

          let color: 'verde' | 'ambar' | 'rojo' = 'verde';
          if (nuevosMinutos > configuracion.tiempo_alerta_ambar_min) {
            color = 'rojo';
          } else if (nuevosMinutos > configuracion.tiempo_optimo_verde_min) {
            color = 'ambar';
          }

          return {
            ...c,
            segundos_transcurridos: nuevosSegundos,
            minutos_espera: nuevosMinutos,
            semaforo_color: color,
          };
        })
      );
    }, 1000);

    return () => clearInterval(relojInterval);
  }, [configuracion]);

  // Actualizar el consolidado cada vez que cambien las comandas
  const actualizarConsolidado = useCallback(async () => {
    const res = await cocinaService.obtenerConsolidadoAllDay();
    if (res.exito) {
      setConsolidado(res.datos);
    }
  }, []);

  // Manejador: Cambiar estado de plato (En Fuego o Listo)
  const handleCambiarEstadoItem = async (
    itemId: string,
    nuevoEstado: 'en_preparacion' | 'listo'
  ) => {
    const res = await cocinaService.cambiarEstadoItem(itemId, nuevoEstado);
    if (res.exito) {
      if (res.datos.alerta_stock) {
        setAlertaStockToast(res.datos.alerta_stock);
        reproducirChime('alerta_parada');
      }

      setComandas((prev) =>
        prev.map((comanda) => ({
          ...comanda,
          items: comanda.items.map((item) =>
            item.item_id === itemId
              ? {
                  ...item,
                  estado: nuevoEstado,
                  fecha_inicio_coccion:
                    nuevoEstado === 'en_preparacion' ? new Date().toISOString() : item.fecha_inicio_coccion,
                  fecha_listo_cocina:
                    nuevoEstado === 'listo' ? new Date().toISOString() : item.fecha_listo_cocina,
                  deshacer_hasta: nuevoEstado === 'listo' ? Date.now() + 30 * 1000 : null,
                }
              : item
          ),
        }))
      );
      actualizarConsolidado();

      // Refrescar catálogo por si cambió la disponibilidad por stock cero
      const resCat = await cocinaService.obtenerCatalogoDisponibilidad();
      if (resCat.exito) setCatalogoDisponibilidad(resCat.datos);
    }
  };

  // Manejador: Deshacer "Listo" dentro de los 30s
  const handleDeshacerListo = async (itemId: string) => {
    const res = await cocinaService.deshacerListoItem(itemId);
    if (res.exito) {
      setComandas((prev) =>
        prev.map((comanda) => ({
          ...comanda,
          items: comanda.items.map((item) =>
            item.item_id === itemId
              ? {
                  ...item,
                  estado: 'en_preparacion',
                  fecha_listo_cocina: null,
                  deshacer_hasta: null,
                }
              : item
          ),
        }))
      );
      actualizarConsolidado();

      // Refrescar catálogo tras rollback
      const resCat = await cocinaService.obtenerCatalogoDisponibilidad();
      if (resCat.exito) setCatalogoDisponibilidad(resCat.datos);
    }
  };

  // Manejador: Conmutar disponibilidad de plato en carta (CU-COCINA-04 Vista 1)
  const handleConmutarDisponibilidad = async (
    productoId: string,
    nuevoEstado: 'disponible' | 'agotado'
  ) => {
    const res = await cocinaService.conmutarDisponibilidadPlatoDirecto(productoId, nuevoEstado);
    if (res.exito) {
      if (res.datos.requiere_resolucion) {
        // Tiene órdenes en fuego: abrir Diálogo de Resolución (CU-COCINA-04 Vista 2)
        const targetPlato = catalogoDisponibilidad.find((p) => p.producto_id === productoId) || null;
        const resItems = await cocinaService.obtenerItemsEnFuegoDeProducto(productoId);
        if (resItems.exito) {
          setItemsEnFuegoResolucion(resItems.datos);
          setPlatoEnResolucion(targetPlato);
          setDialogoFuegoAbierto(true);
        }
      } else {
        const [resCat, resCom] = await Promise.all([
          cocinaService.obtenerCatalogoDisponibilidad(),
          cocinaService.obtenerComandas(),
        ]);
        if (resCat.exito) setCatalogoDisponibilidad(resCat.datos);
        if (resCom.exito) setComandas(resCom.datos);
        actualizarConsolidado();
      }
    } else if (res.errores && res.errores.length > 0) {
      alert(res.errores[0].mensaje);
    }
  };

  // Manejador: Confirmar resolución de fuego activo ante quiebre (CU-COCINA-04 Vista 2)
  const handleConfirmarResolucionFuego = async (
    productoId: string,
    itemsEnFuegoNoAlcanzadosIds: string[],
    motivo: string
  ) => {
    const res = await cocinaService.confirmarResolucionFuego(
      productoId,
      itemsEnFuegoNoAlcanzadosIds,
      motivo
    );
    if (res.exito) {
      const [resCat, resCom] = await Promise.all([
        cocinaService.obtenerCatalogoDisponibilidad(),
        cocinaService.obtenerComandas(),
      ]);
      if (resCat.exito) setCatalogoDisponibilidad(resCat.datos);
      if (resCom.exito) setComandas(resCom.datos);
      actualizarConsolidado();
      reproducirChime('alerta_parada');
    }
  };

  // Manejador: Simular consumo que agota stock de insumo (Demo CU-03)
  const handleSimularStockAgotado = async () => {
    const alerta = mockCocinaService.simularConsumoStockCritico();
    setAlertaStockToast(alerta);
    reproducirChime('alerta_parada');
    const resCat = await cocinaService.obtenerCatalogoDisponibilidad();
    if (resCat.exito) setCatalogoDisponibilidad(resCat.datos);
  };

  // Manejador: Despachar comanda completa (CU-COCINA-02)
  const handleDespacharTodo = async (pedidoId: string) => {
    const res = await cocinaService.despacharComandaCompleta(pedidoId);
    if (res.exito) {
      setComandas((prev) => prev.filter((c) => c.pedido_id !== pedidoId));
      actualizarConsolidado();

      // Refrescar lista de despachados recientes y métricas
      const [resDesp, resMet] = await Promise.all([
        cocinaService.obtenerPedidosDespachados(),
        cocinaService.obtenerMetricasDespacho(),
      ]);
      if (resDesp.exito) setPedidosDespachados(resDesp.datos);
      if (resMet.exito) setMetricasDespacho(resMet.datos);
    }
  };

  // Manejador: Poner en fuego por tanda acumulada en Consolidado All-Day (CU-COCINA-02 Vista 3)
  const handlePonerEnFuegoTanda = async (productoId: string) => {
    const res = await cocinaService.ponerEnFuegoPorTanda(productoId);
    if (res.exito) {
      const resCom = await cocinaService.obtenerComandas();
      if (resCom.exito) setComandas(resCom.datos);
      actualizarConsolidado();
    }
  };

  // Manejador: Marcar listos en pase por tanda acumulada (CU-COCINA-02 Vista 3)
  const handleMarcarListoTanda = async (productoId: string, cantidad: number) => {
    const res = await cocinaService.marcarListoPorTanda(productoId, cantidad);
    if (res.exito) {
      const resCom = await cocinaService.obtenerComandas();
      if (resCom.exito) setComandas(resCom.datos);
      actualizarConsolidado();
    }
  };

  // Métricas calculadas
  const metricas = useMemo(() => {
    const platosTotal = comandas.reduce((acc, c) => acc + c.items.length, 0);
    const enFuego = comandas.reduce(
      (acc, c) => acc + c.items.filter((i) => i.estado === 'en_preparacion').length,
      0
    );
    const enCola = comandas.reduce(
      (acc, c) => acc + c.items.filter((i) => i.estado === 'en_cola').length,
      0
    );
    const listos = comandas.reduce(
      (acc, c) => acc + c.items.filter((i) => i.estado === 'listo').length,
      0
    );

    return {
      comandasActivas: comandas.length,
      platosTotal,
      enFuego,
      enCola,
      listos,
    };
  }, [comandas]);

  // Categorías de la carta gastronómica disponibles
  const categoriasDisponibles = useMemo(() => {
    const mapa: Record<string, number> = {};
    let total = 0;

    comandas.forEach((c) => {
      c.items.forEach((i) => {
        total++;
        mapa[i.categoria_nombre] = (mapa[i.categoria_nombre] || 0) + 1;
      });
    });

    const lista = [{ nombre: 'Todas', total }];
    Object.entries(mapa).forEach(([nombre, count]) => {
      lista.push({ nombre, total: count });
    });

    return lista;
  }, [comandas]);

  // Filtrado de comandas por categoría seleccionada
  const comandasFiltradas = useMemo(() => {
    if (categoriaSeleccionada === 'Todas') return comandas;
    return comandas
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => i.categoria_nombre === categoriaSeleccionada),
      }))
      .filter((c) => c.items.length > 0);
  }, [comandas, categoriaSeleccionada]);

  // Acciones de demostración (Widget)
  const handleInyectarComanda = () => {
    const nueva = mockCocinaService.simularNuevaComandaMozo();
    setComandas((prev) => [nueva, ...prev]);
    reproducirChime('nueva_comanda');
    actualizarConsolidado();
  };

  const handleSimularParadaFogones = () => {
    const evento = mockCocinaService.simularAnulacionSSE();
    setAlertaParada(evento);
    reproducirChime('alerta_parada');

    // Tachar el plato en la comanda correspondiente
    setComandas((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.item_id === evento.item_id ? { ...i, estado: 'anulado' } : i
        ),
      }))
    );
    actualizarConsolidado();
  };

  const handleAcelerarTiempos = (minutosAdicionales: number) => {
    const segundosExtra = minutosAdicionales * 60;
    setComandas((prev) =>
      prev.map((c) => {
        const seg = c.segundos_transcurridos + segundosExtra;
        const min = Math.floor(seg / 60);
        let color: 'verde' | 'ambar' | 'rojo' = 'verde';
        if (min > configuracion.tiempo_alerta_ambar_min) color = 'rojo';
        else if (min > configuracion.tiempo_optimo_verde_min) color = 'ambar';

        return {
          ...c,
          segundos_transcurridos: seg,
          minutos_espera: min,
          semaforo_color: color,
        };
      })
    );
  };

  const handleAlternarVacio = () => {
    if (comandas.length > 0) {
      setComandas([]);
      setConsolidado([]);
    } else {
      mockCocinaService.restablecerComandasIniciales();
      cargarDatos();
    }
  };

  const handleAlternarSse = () => {
    setSseConectado(!sseConectado);
  };

  const handleRestablecer = () => {
    mockCocinaService.restablecerComandasIniciales();
    cargarDatos();
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-sans select-none">
      {/* Banner de Estado Offline / Reconectando */}
      {!sseConectado && (
        <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>⚠️ Sincronización interrumpida. Reintentando en 3s... (Modo local activo)</span>
          </div>
          <button
            onClick={() => setSseConectado(true)}
            className="px-2 py-0.5 rounded bg-amber-600 text-slate-950 font-bold hover:bg-amber-500"
          >
            Reconectar Ahora
          </button>
        </div>
      )}

      {/* Cabecera Principal KDS */}
      <KdsHeader
        horaActual={horaActual}
        sseConectado={sseConectado}
        modoSonido={modoSonido}
        onToggleSonido={() => setModoSonido(!modoSonido)}
        vistaActiva={vistaActiva}
        onCambiarVista={setVistaActiva}
        categoriaSeleccionada={categoriaSeleccionada}
        onSeleccionarCategoria={setCategoriaSeleccionada}
        categoriasDisponibles={categoriasDisponibles}
        metricas={metricas}
        configuracion={configuracion}
        despachadosCount={pedidosDespachados.length}
        onAbrirDespachados={() => setModalDespachadosAbierto(true)}
        platosAgotadosCount={catalogoDisponibilidad.filter((p) => p.disponibilidad === 'agotado').length}
        onAbrirDisponibilidad={() => setModalDisponibilidadAbierto(true)}
      />

      {/* Contenido Principal: Skeleton Loading / Error / Loaded State */}
      {cargando ? (
        // Estado 1: Loading State (4 tarjetas esqueleto pulsantes)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4 animate-pulse"
            >
              <div className="h-6 bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="space-y-2 pt-4">
                <div className="h-12 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded" />
              </div>
              <div className="h-10 bg-slate-800 rounded mt-6" />
            </div>
          ))}
        </div>
      ) : error ? (
        // Estado 4: Error State
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-rose-300">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
          <p className="font-bold text-base">{error}</p>
          <button
            onClick={cargarDatos}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Reintentar Conexión
          </button>
        </div>
      ) : vistaActiva === 'all_day' ? (
        // Vista 4: Consolidado All-Day Summary (con acciones por tandas de CU-COCINA-02)
        <ConsolidadoAllDayView
          consolidado={consolidado}
          onPonerEnFuegoTanda={handlePonerEnFuegoTanda}
          onMarcarListoTanda={handleMarcarListoTanda}
        />
      ) : comandasFiltradas.length === 0 ? (
        // Estado 2: Empty State ("¡Fogones al día!")
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl mb-4 shadow-inner">
            🛎️
          </div>
          <h3 className="font-serif font-black text-2xl text-white mb-2">
            ¡Fogones al día! No hay pedidos pendientes
          </h3>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Todas las comandas de cocina han sido completadas y despachadas al pase de salón. Las nuevas órdenes enviadas por los mozos aparecerán aquí en tiempo real.
          </p>
          <button
            onClick={handleInyectarComanda}
            className="mt-6 px-5 py-2.5 rounded-xl font-bold text-xs bg-aurea-copper text-slate-950 hover:bg-aurea-champagne transition-colors"
          >
            Simular Pedido de Prueba
          </button>
        </div>
      ) : (
        // Vista 1: Tablero KDS 4 Columnas FIFO
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 items-start">
          {comandasFiltradas.map((comanda) => (
            <KdsTicketCard
              key={comanda.pedido_id}
              comanda={comanda}
              onCambiarEstadoItem={handleCambiarEstadoItem}
              onDeshacerListo={handleDeshacerListo}
              onDespacharTodo={handleDespacharTodo}
              onVerDetalle={setComandaDetalle}
            />
          ))}
        </div>
      )}

      {/* Vista 2: Modal de Detalle Ampliado de Comanda (680px) */}
      <ModalDetalleComanda
        comanda={comandaDetalle}
        onClose={() => setComandaDetalle(null)}
        onCambiarEstadoItem={handleCambiarEstadoItem}
        onDespacharTodo={handleDespacharTodo}
      />

      {/* Vista 3: Modal de Alerta Reactiva Parada de Fogones (620px) */}
      <ModalAlertaParadaFogones
        evento={alertaParada}
        onConfirmarEntendido={() => setAlertaParada(null)}
      />

      {/* Vista 2 de CU-COCINA-02: Modal de Historial de Pedidos Despachados (Solo Lectura 30m - 1120px) */}
      <ModalHistorialDespachados
        abierto={modalDespachadosAbierto}
        onCerrar={() => setModalDespachadosAbierto(false)}
        pedidos={pedidosDespachados}
        metricas={metricasDespacho}
      />

      {/* Vista 1 de CU-COCINA-04: Modal Táctil de Disponibilidad de Platos (1120px) */}
      <ModalDisponibilidadPlatos
        abierto={modalDisponibilidadAbierto}
        onCerrar={() => setModalDisponibilidadAbierto(false)}
        catalogo={catalogoDisponibilidad}
        onConmutarDisponibilidad={handleConmutarDisponibilidad}
      />

      {/* Vista 2 de CU-COCINA-04: Diálogo Táctil de Resolución de Órdenes en Fuego (720px) */}
      <DialogoResolucionFuego
        abierto={dialogoFuegoAbierto}
        onCerrar={() => setDialogoFuegoAbierto(false)}
        plato={platoEnResolucion}
        itemsEnFuego={itemsEnFuegoResolucion}
        onConfirmar={handleConfirmarResolucionFuego}
      />

      {/* Alerta Flotante de Inconsistencia de Inventario Culinario (CU-COCINA-03 Alerta) */}
      <ToastAlertaStock
        alerta={alertaStockToast}
        onCerrar={() => setAlertaStockToast(null)}
        onAbrirDisponibilidad={() => setModalDisponibilidadAbierto(true)}
      />

      {/* Widget Flotante de Demostración */}
      <DemoKdsWidget
        onInyectarComanda={handleInyectarComanda}
        onSimularParadaFogones={handleSimularParadaFogones}
        onSimularStockAgotado={handleSimularStockAgotado}
        onAbrirDisponibilidad={() => setModalDisponibilidadAbierto(true)}
        onAcelerarTiempos={handleAcelerarTiempos}
        onAlternarVacio={handleAlternarVacio}
        onAlternarSse={handleAlternarSse}
        onRestablecer={handleRestablecer}
        esVacio={comandas.length === 0}
        sseConectado={sseConectado}
      />
    </div>
  );
};
