import React, { useState, useEffect, useMemo } from 'react';
import {
  PlanoCompletoMozoDTO,
  MesaCardDTO,
  MesaDetalleMozoDTO,
  AlertaCocinaModalDTO,
  ItemDetalleComandaDTO,
} from '@/types/mozo';
import { mockMozoService } from '../services/mockMozoService';
import { SalonHeaderMozo, FiltroMesaTipo } from '../components/SalonHeaderMozo';
import { PlanoMesasGrid } from '../components/PlanoMesasGrid';
import { SidebarDespachoVivo } from '../components/SidebarDespachoVivo';
import { MesaInspeccionDrawer } from '../components/MesaInspeccionDrawer';
import { AlertaCocinaModal } from '../components/AlertaCocinaModal';
import { DemoMozoWidget } from '../components/DemoMozoWidget';
import { Bell, ChevronRight } from 'lucide-react';

export const MozoMesasPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [planoData, setPlanoData] = useState<PlanoCompletoMozoDTO | null>(null);
  const [pisoActivoId, setPisoActivoId] = useState('piso-01-salon');
  const [filtroActivo, setFiltroActivo] = useState<FiltroMesaTipo>('todas');
  const [esTurnoVacio, setEsTurnoVacio] = useState(false);

  // Estado para el Quick-Drawer
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaCardDTO | null>(null);
  const [detalleMesa, setDetalleMesa] = useState<MesaDetalleMozoDTO | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Estado para el Modal de Alerta de Cocina
  const [alertaModalAbierta, setAlertaModalAbierta] = useState(false);
  const [alertaData, setAlertaData] = useState<AlertaCocinaModalDTO | null>(null);

  // Estado para Drawer de Despacho en Móvil (< 1024px)
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);

  // Carga inicial
  useEffect(() => {
    cargarPlano(pisoActivoId);
  }, [pisoActivoId]);

  const cargarPlano = async (pisoId: string) => {
    setCargando(true);
    try {
      const res = await mockMozoService.obtenerPlanoCompleto(pisoId);
      if (res.exito) {
        setPlanoData(res.datos);
      }
    } finally {
      setCargando(false);
    }
  };

  // Filtrado reactivo de mesas
  const mesasFiltradas = useMemo(() => {
    if (!planoData) return [];
    let lista = planoData.mesas.filter((m) => m.piso_id === pisoActivoId);

    if (filtroActivo === 'mis_mesas') {
      lista = lista.filter((m) => m.es_mi_mesa);
    } else if (filtroActivo === 'libres') {
      lista = lista.filter((m) => m.estado === 'libre');
    } else if (filtroActivo === 'ocupadas') {
      lista = lista.filter((m) => m.estado === 'ocupada' || m.estado === 'cuenta_pedida');
    }

    return lista;
  }, [planoData, pisoActivoId, filtroActivo]);

  // Contadores para las píldoras de filtro
  const conteos = useMemo(() => {
    if (!planoData) return { misMesas: 0, total: 0, libres: 0, ocupadas: 0 };
    const mesasPiso = planoData.mesas.filter((m) => m.piso_id === pisoActivoId);
    return {
      misMesas: mesasPiso.filter((m) => m.es_mi_mesa).length,
      total: mesasPiso.length,
      libres: mesasPiso.filter((m) => m.estado === 'libre').length,
      ocupadas: mesasPiso.filter((m) => m.estado === 'ocupada' || m.estado === 'cuenta_pedida')
        .length,
    };
  }, [planoData, pisoActivoId]);

  // Selección de mesa
  const handleSeleccionarMesa = async (mesa: MesaCardDTO) => {
    setMesaSeleccionada(mesa);

    if (mesa.estado === 'libre') {
      // Sentar comensales y abrir comanda
      handleAbrirMesa(mesa);
      return;
    }

    // Abrir Quick-Drawer de inspección
    setDrawerAbierto(true);
    setCargandoDetalle(true);
    try {
      const res = await mockMozoService.obtenerDetalleMesa(mesa.id);
      if (res.exito) {
        setDetalleMesa(res.datos);
      }
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Sentar comensales y abrir comanda
  const handleAbrirMesa = async (mesa: MesaCardDTO) => {
    const comensales = mesa.capacidad || 2;
    const res = await mockMozoService.abrirMesa(mesa.id, comensales);
    if (res.exito) {
      // Actualizamos estado local
      setPlanoData((prev) => {
        if (!prev) return prev;
        const actualizadas = prev.mesas.map((m) =>
          m.id === mesa.id
            ? {
                ...m,
                estado: 'ocupada' as const,
                pedido_id: res.datos.pedidoId,
                comensales_sentados: comensales,
                minutos_ocupada: 1,
                total_consumo: 0,
                mozo_nombre: prev.mozo_actual.nombre,
                es_mi_mesa: true,
              }
            : m
        );
        return {
          ...prev,
          mesas: actualizadas,
          mesas_libres: Math.max(0, prev.mesas_libres - 1),
          mesas_ocupadas: prev.mesas_ocupadas + 1,
        };
      });
    }
  };

  // Marcar ítem servido
  const handleMarcarServido = async (itemId: string) => {
    await mockMozoService.marcarItemServido(itemId);

    // Actualizamos lista de despacho en vivo
    setPlanoData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items_despacho: prev.items_despacho.filter((i) => i.item_id !== itemId),
      };
    });

    // Si el drawer está abierto y contiene este ítem, actualizar su estado
    if (detalleMesa) {
      setDetalleMesa((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === itemId || i.producto_nombre === 'Inca Kola 500ml' // Simulación vinculada
              ? { ...i, estado: 'entregado' as const }
              : i
          ),
        };
      });
    }
  };

  // Solicitar cuenta a caja
  const handleSolicitarCuenta = async (mesaId: string) => {
    await mockMozoService.solicitarCuentaMesa(mesaId);

    // Actualizamos mesa en el plano
    setPlanoData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mesas: prev.mesas.map((m) =>
          m.id === mesaId ? { ...m, estado: 'cuenta_pedida' as const } : m
        ),
      };
    });

    // Actualizamos el drawer
    if (detalleMesa && detalleMesa.mesa_id === mesaId) {
      setDetalleMesa({ ...detalleMesa, estado: 'cuenta_pedida' });
    }
  };

  // Handlers para el widget de simulación
  const simularPlatoListo = () => {
    const nuevo = mockMozoService.simularPlatoListoCocina();
    setPlanoData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items_despacho: [nuevo, ...prev.items_despacho],
      };
    });
  };

  const simularBebida = () => {
    const nuevo = mockMozoService.simularProductoDespachoDirecto();
    setPlanoData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items_despacho: [nuevo, ...prev.items_despacho],
      };
    });
  };

  const simularAlertaModal = () => {
    const alerta = mockMozoService.obtenerAlertaModalDemo();
    setAlertaData(alerta);
    setAlertaModalAbierta(true);
  };

  const alternarTurnoVacio = () => {
    if (esTurnoVacio) {
      setEsTurnoVacio(false);
      cargarPlano(pisoActivoId);
    } else {
      setEsTurnoVacio(true);
      const vacio = mockMozoService.obtenerPlanoTurnoVacio();
      setPlanoData(vacio);
    }
  };

  const totalListos = planoData?.items_despacho.length || 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-100">
      {/* 1. Header con Ambientes, Disponibilidad de Mesas y Filtros */}
      <SalonHeaderMozo
        pisos={planoData?.pisos_disponibles || []}
        pisoActivoId={pisoActivoId}
        onSeleccionarPiso={setPisoActivoId}
        filtroActivo={filtroActivo}
        onCambiarFiltro={setFiltroActivo}
        misMesasCount={conteos.misMesas}
        totalMesasCount={conteos.total}
        libresCount={conteos.libres}
        ocupadasCount={conteos.ocupadas}
        mozoNombre={planoData?.mozo_actual.nombre || 'Carlos Mendoza'}
      />

      {/* Botón flotante móvil para acceder al despacho (< 1024px) */}
      <div className="lg:hidden p-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-xs">
        <span className="text-slate-300 font-medium flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-aurea-copper" />
          Despacho en Sala:
        </span>
        <button
          onClick={() => setSidebarMovilAbierto(true)}
          className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <span>{totalListos} Listos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Cuerpo Principal: Layout 70% Plano + 30% Sidebar de Despacho */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Skeleton o Grilla de Mesas (Área 70%) */}
        {cargando ? (
          <div className="flex-1 p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <PlanoMesasGrid
            mesas={mesasFiltradas}
            onSeleccionarMesa={handleSeleccionarMesa}
            onAbrirMesaRapido={handleAbrirMesa}
            mesaSeleccionadaId={mesaSeleccionada?.id}
            esTurnoVacio={esTurnoVacio}
          />
        )}

        {/* Sidebar persistente en Desktop (Área 30%, ~390px) */}
        <div className="hidden lg:flex">
          <SidebarDespachoVivo
            itemsDespacho={planoData?.items_despacho || []}
            comandasPreparacion={planoData?.comandas_preparacion || []}
            alertas={planoData?.alertas_operativas || []}
            onMarcarServido={handleMarcarServido}
            misMesasActivas={planoData?.mis_mesas_activas || conteos.misMesas}
            totalVentaTurno={planoData?.total_venta_turno || 0}
            onVerAlertaModal={simularAlertaModal}
          />
        </div>
      </div>

      {/* Drawer Móvil de Despacho en Vivo (< 1024px) */}
      {sidebarMovilAbierto && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setSidebarMovilAbierto(false)}
          />
          <div className="relative w-full max-w-sm bg-slate-900 h-full shadow-2xl flex flex-col z-10">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white">Despacho en Vivo</span>
              <button
                onClick={() => setSidebarMovilAbierto(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Cerrar ✕
              </button>
            </div>
            <SidebarDespachoVivo
              itemsDespacho={planoData?.items_despacho || []}
              comandasPreparacion={planoData?.comandas_preparacion || []}
              alertas={planoData?.alertas_operativas || []}
              onMarcarServido={handleMarcarServido}
              misMesasActivas={planoData?.mis_mesas_activas || conteos.misMesas}
              totalVentaTurno={planoData?.total_venta_turno || 0}
              onVerAlertaModal={simularAlertaModal}
            />
          </div>
        </div>
      )}

      {/* 3. Quick-Drawer de Inspección Lateral (440px) */}
      <MesaInspeccionDrawer
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        detalle={detalleMesa}
        cargando={cargandoDetalle}
        onSolicitarCuenta={handleSolicitarCuenta}
        onMarcarItemServido={handleMarcarServido}
        onAbrirModalUnir={(mesaId) => {
          alert(`Unión de mesas CU-MOZO-04 para Mesa ${mesaId}: Abre modal con candidatas del piso.`);
        }}
        onAbrirModalAnular={(item: ItemDetalleComandaDTO) => {
          alert(
            `Anulación de ítem CU-MOZO-06: Anular "${item.producto_nombre}" con calificación de merma y motivo.`
          );
        }}
      />

      {/* 4. Modal de Alerta Prioritaria de Cocina (560px) */}
      <AlertaCocinaModal
        abierto={alertaModalAbierta}
        onCerrar={() => setAlertaModalAbierta(false)}
        alerta={alertaData}
        onAceptar={() => setAlertaModalAbierta(false)}
      />

      {/* 5. Widget Flotante de Simulación / Demostración */}
      <DemoMozoWidget
        onSimularPlatoListo={simularPlatoListo}
        onSimularBebida={simularBebida}
        onSimularAlertaModal={simularAlertaModal}
        onAlternarTurnoVacio={alternarTurnoVacio}
        esTurnoVacio={esTurnoVacio}
        onAlternarMisMesas={() =>
          setFiltroActivo(filtroActivo === 'mis_mesas' ? 'todas' : 'mis_mesas')
        }
        filtroActivo={filtroActivo}
      />
    </div>
  );
};
