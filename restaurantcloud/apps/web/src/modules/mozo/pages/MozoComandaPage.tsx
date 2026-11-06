import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronUp, Check, AlertTriangle } from 'lucide-react';
import {
  CatalogoProductosMozoDTO,
  HistorialMesaComandaDTO,
  ItemPedidoBorrador,
  ProductoCatalogoMozoDTO,
  ConflictoStockDTO,
  CodigoConflictoStock,
} from '@/types/mozo';
import type { AppError } from '@/types/api';
import { mozoService } from '@/services/serviceAdapter';
import { ComandaHeader } from '../components/comanda/ComandaHeader';
import { CatalogoCartaGrid } from '../components/comanda/CatalogoCartaGrid';
import { TicketComandaPanel } from '../components/comanda/TicketComandaPanel';
import { ModalNotaCocina } from '../components/comanda/ModalNotaCocina';
import { ModalConflictoStock } from '../components/comanda/ModalConflictoStock';
import { ROUTES } from '@/router/routes.constants';

const CODIGOS_CONFLICTO_STOCK: CodigoConflictoStock[] = [
  'ERR_PRODUCTO_AGOTADO',
  'ERR_STOCK_INSUFICIENTE',
];

/** Error 409 del backend con los campos extra del producto en conflicto. */
type ErrorEnvioPedido = AppError & {
  producto_id?: string;
  producto_nombre?: string;
  insumo_limitante?: string;
  cantidad_solicitada?: number;
  raciones_disponibles?: number;
};

export const MozoComandaPage: React.FC = () => {
  const { mesaId = 'mesa-04' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();

  // Estados de carga y datos principales
  const [cargando, setCargando] = useState<boolean>(true);
  const [catalogo, setCatalogo] = useState<CatalogoProductosMozoDTO | null>(null);
  const [historial, setHistorial] = useState<HistorialMesaComandaDTO | null>(null);

  // Estado del borrador de la comanda
  const [itemsBorrador, setItemsBorrador] = useState<ItemPedidoBorrador[]>([]);
  const [rondaActual, setRondaActual] = useState<number>(1);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Estados de Modales
  const [itemParaNota, setItemParaNota] = useState<ItemPedidoBorrador | null>(null);
  const [modalNotaAbierto, setModalNotaAbierto] = useState<boolean>(false);

  const [conflictoStock, setConflictoStock] = useState<ConflictoStockDTO | null>(null);
  const [modalConflictoAbierto, setModalConflictoAbierto] = useState<boolean>(false);

  // Estados interactivos
  const [ticketMovilAbierto, setTicketMovilAbierto] = useState<boolean>(false);
  const [toastExito, setToastExito] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const mostrarToastError = (mensaje: string) => {
    setToastError(mensaje);
    setTimeout(() => setToastError(null), 4500);
  };

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resCat, resHist] = await Promise.all([
        mozoService.obtenerCatalogoCarta(mesaId),
        mozoService.obtenerHistorialMesa(mesaId),
      ]);

      if (resCat.exito) setCatalogo(resCat.datos);
      if (resHist.exito) {
        setHistorial(resHist.datos);
        setRondaActual(resHist.datos.ronda_actual);
      }
    } finally {
      setCargando(false);
    }
  }, [mesaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const esCuentaPedida = Boolean(
    (historial as any)?.cuenta_pedida || (historial as any)?.estado_mesa === 'cuenta_pedida'
  );

  // 1. Agregar producto al borrador táctil
  const handleAgregarProducto = (producto: ProductoCatalogoMozoDTO) => {
    if (esCuentaPedida) return;
    if (producto.disponibilidad === 'agotado') return;

    setItemsBorrador((prev) => {
      const index = prev.findIndex((it) => it.producto_id === producto.id);
      if (index >= 0) {
        // Incrementa cantidad existente
        const copia = [...prev];
        copia[index] = { ...copia[index], cantidad: copia[index].cantidad + 1 };
        return copia;
      }

      // Nuevo ítem en borrador
      const nuevo: ItemPedidoBorrador = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio,
        cantidad: 1,
        nota_cocina: null,
        requiere_preparacion: producto.requiere_preparacion,
      };
      return [...prev, nuevo];
    });
  };

  // 2. Modificadores de Stepper
  const handleIncrementarCantidad = (itemId: string) => {
    setItemsBorrador((prev) =>
      prev.map((it) =>
        it.id === itemId && it.cantidad < 99 ? { ...it, cantidad: it.cantidad + 1 } : it
      )
    );
  };

  const handleDecrementarCantidad = (itemId: string) => {
    setItemsBorrador((prev) =>
      prev
        .map((it) => (it.id === itemId ? { ...it, cantidad: it.cantidad - 1 } : it))
        .filter((it) => it.cantidad > 0)
    );
  };

  const handleEliminarItem = (itemId: string) => {
    setItemsBorrador((prev) => prev.filter((it) => it.id !== itemId));
  };

  // 3. Gestión de Notas a Cocina
  const handleAbrirModalNota = (item: ItemPedidoBorrador) => {
    setItemParaNota(item);
    setModalNotaAbierto(true);
  };

  const handleGuardarNota = (itemId: string, nota: string | null) => {
    setItemsBorrador((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, nota_cocina: nota } : it))
    );
  };

  // 4. Confirmación y Envío a Cocina KDS
  const enviarBorrador = async (items: ItemPedidoBorrador[], mensajeExito: string) => {
    if (items.length === 0) return;

    setEnviando(true);
    try {
      const res = await mozoService.enviarPedidoCocina({
        mesa_id: mesaId,
        comensales: historial?.comensales || 4,
        numero_ronda: rondaActual,
        items: items.map((it) => ({
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          nota_cocina: it.nota_cocina,
        })),
      });

      if (!res.exito) {
        const error = res.errores?.[0] as ErrorEnvioPedido | undefined;

        if (error?.codigo === 'ERR_CAJA_NO_ABIERTA') {
          navigate(ROUTES.MOZO_MESAS);
          return;
        }

        // Error 409 de stock: el modal se arma con el producto real que reportó el servidor
        if (
          error?.producto_id &&
          CODIGOS_CONFLICTO_STOCK.includes(error.codigo as CodigoConflictoStock)
        ) {
          setConflictoStock({
            codigo: error.codigo as CodigoConflictoStock,
            producto_id: error.producto_id,
            producto_nombre: error.producto_nombre || 'Producto',
            insumo_critico: error.insumo_limitante,
            mensaje: error.mensaje,
            cantidad_solicitada: error.cantidad_solicitada,
            raciones_disponibles: error.raciones_disponibles,
          });
          setModalConflictoAbierto(true);
          return;
        }

        mostrarToastError(error?.mensaje || 'No se pudo enviar la comanda. Intenta nuevamente.');
        return;
      }

      // Éxito: retroalimentación multisensorial y redirección al plano
      setToastExito(mensajeExito);
      setTimeout(() => {
        navigate(ROUTES.MOZO_MESAS);
      }, 1200);
    } finally {
      setEnviando(false);
    }
  };

  const handleConfirmarEnvio = async () => {
    if (esCuentaPedida) return;
    await enviarBorrador(itemsBorrador, '¡Comanda despachada a cocina y salón exitosamente!');
  };

  // 5. Resolución de Conflicto 409
  const handleQuitarYEnviarRestantes = async (productoIdAgotado: string) => {
    setModalConflictoAbierto(false);

    // Quitamos el producto en conflicto del borrador
    const itemsLimpios = itemsBorrador.filter((it) => it.producto_id !== productoIdAgotado);
    setItemsBorrador(itemsLimpios);

    await enviarBorrador(itemsLimpios, 'Platos restantes enviados a cocina exitosamente.');
  };

  const handleAjustarYEnviar = async (productoId: string, cantidadMaxima: number) => {
    setModalConflictoAbierto(false);

    // Limitamos el producto al stock real; si no queda ninguna unidad, sale del borrador
    const itemsAjustados = itemsBorrador
      .map((it) =>
        it.producto_id === productoId
          ? { ...it, cantidad: Math.min(it.cantidad, cantidadMaxima) }
          : it
      )
      .filter((it) => it.cantidad > 0);
    setItemsBorrador(itemsAjustados);

    await enviarBorrador(itemsAjustados, 'Comanda ajustada al stock disponible y enviada.');
  };

  // 6. Descartar borrador
  const handleDescartarBorrador = () => {
    if (window.confirm('¿Seguro que deseas vaciar todos los platos de este borrador?')) {
      setItemsBorrador([]);
    }
  };

  // Cálculos para la barra móvil inferior
  const totalBorrador = itemsBorrador.reduce(
    (acc, it) => acc + it.precio_unitario * it.cantidad,
    0
  );
  const totalItemsCount = itemsBorrador.reduce((acc, it) => acc + it.cantidad, 0);

  if (cargando) {
    return (
      <div className="flex-1 flex flex-col h-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-aurea-navy border-t-aurea-copper rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Cargando carta de productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {toastError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl bg-rose-700 text-white shadow-2xl flex items-center gap-2 border border-rose-500">
          <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastError}</span>
        </div>
      )}

      {/* Toast de confirmación háptica */}
      {toastExito && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-emerald-700 text-white shadow-2xl flex items-center gap-2 border border-emerald-500 animate-bounce-slow">
          <Check className="w-4 h-4 text-emerald-200" />
          <span className="text-xs sm:text-sm font-bold">{toastExito}</span>
        </div>
      )}

      {/* 1. Header Superior de Comanda */}
      <ComandaHeader
        mesaId={mesaId}
        mesaNumero={historial?.mesa_numero || '04'}
        ambiente={historial?.ambiente || 'Salón Principal'}
        comensales={historial?.comensales || 4}
        minutosEnMesa={historial?.minutos_en_mesa}
        mozoNombre={historial?.mozo_nombre || 'Carlos Mendoza'}
        rondaActual={rondaActual}
      />

      {/* Banner de Bloqueo Poka-Yoke: Mesa con Cuenta Pedida */}
      {esCuentaPedida && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-950 text-xs shrink-0 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded text-[10px] border border-amber-300">
              🔒 CUENTA PEDIDA
            </span>
            <span className="font-medium text-amber-900">
              La comanda se encuentra cerrada temporalmente para liquidación en Caja POS. No se pueden agregar nuevos platos o bebidas.
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.MOZO_MESAS)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all"
          >
            ← Volver al Salón
          </button>
        </div>
      )}

      {/* 2. Cuerpo Principal: Layout 65% Catálogo + 35% Ticket de Comanda */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Catálogo Gastronómico */}
        <CatalogoCartaGrid
          categorias={catalogo?.categorias || []}
          productos={catalogo?.productos || []}
          onAgregarItem={handleAgregarProducto}
        />

        {/* Ticket Interactivo Desktop / Tablet (>= 1024px) */}
        <div className="hidden lg:flex">
          <TicketComandaPanel
            mesaNumero={historial?.mesa_numero || '04'}
            rondaActual={rondaActual}
            itemsBorrador={itemsBorrador}
            rondaPreviaItems={historial?.ronda_previa_items}
            totalPrevio={historial?.total_previo}
            onIncrementarCantidad={handleIncrementarCantidad}
            onDecrementarCantidad={handleDecrementarCantidad}
            onEliminarItem={handleEliminarItem}
            onAbrirModalNota={handleAbrirModalNota}
            onConfirmarEnvio={handleConfirmarEnvio}
            onDescartarBorrador={handleDescartarBorrador}
            enviando={enviando}
          />
        </div>

        {/* Drawer Deslizable del Ticket en Smartphone (< 1024px) */}
        {ticketMovilAbierto && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end">
            <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-4">
                <span className="text-xs font-bold text-slate-700">Comanda en curso</span>
                <button
                  onClick={() => setTicketMovilAbierto(false)}
                  className="text-xs font-semibold text-slate-500 p-1"
                >
                  Cerrar ✕
                </button>
              </div>
              <TicketComandaPanel
                mesaNumero={historial?.mesa_numero || '04'}
                rondaActual={rondaActual}
                itemsBorrador={itemsBorrador}
                rondaPreviaItems={historial?.ronda_previa_items}
                totalPrevio={historial?.total_previo}
                onIncrementarCantidad={handleIncrementarCantidad}
                onDecrementarCantidad={handleDecrementarCantidad}
                onEliminarItem={handleEliminarItem}
                onAbrirModalNota={handleAbrirModalNota}
                onConfirmarEnvio={handleConfirmarEnvio}
                onDescartarBorrador={handleDescartarBorrador}
                enviando={enviando}
              />
            </div>
          </div>
        )}
      </div>

      {/* Barra Flotante Inferior en Móviles (< 1024px) */}
      <div className="lg:hidden p-3 bg-aurea-navy text-white flex items-center justify-between border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-aurea-copper" />
          <span className="text-xs font-bold font-mono">
            {totalItemsCount} plato{totalItemsCount !== 1 ? 's' : ''} · S/ {totalBorrador.toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => setTicketMovilAbierto(true)}
          className="px-4 py-1.5 rounded-lg bg-aurea-copper text-aurea-navy text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
        >
          <span>Ver Ticket</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Modal de Nota para Cocina (Vista 2) */}
      <ModalNotaCocina
        item={itemParaNota}
        abierto={modalNotaAbierto}
        onCerrar={() => setModalNotaAbierto(false)}
        onGuardarNota={handleGuardarNota}
      />

      {/* 4. Modal Asistido de Conflicto de Stock 409 (Vista 4) */}
      <ModalConflictoStock
        abierto={modalConflictoAbierto}
        conflicto={conflictoStock}
        onCerrar={() => setModalConflictoAbierto(false)}
        onQuitarYEnviarRestantes={handleQuitarYEnviarRestantes}
        onAjustarYEnviar={handleAjustarYEnviar}
        onVolverACatalogo={() => setModalConflictoAbierto(false)}
      />
    </div>
  );
};
