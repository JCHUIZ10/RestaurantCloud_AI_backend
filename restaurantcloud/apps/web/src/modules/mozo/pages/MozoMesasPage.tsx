import React, { useState, useEffect, useMemo } from 'react';
import {
  PlanoCompletoMozoDTO,
  MesaCardDTO,
  MesaDetalleMozoDTO,
  AlertaCocinaModalDTO,
  ItemDetalleComandaDTO,
  ValidacionSeparacionMesaDTO,
  DividirCuentaResponseDTO,
  AnularItemRequestDTO,
  AnularPedidoCompletoRequestDTO,
  ReservaCardDTO,
  AnularPorQuiebreRequestDTO,
} from '@/types/mozo';
import { mozoService as mockMozoService } from '@/services/serviceAdapter';
import { SalonHeaderMozo, FiltroMesaTipo } from '../components/SalonHeaderMozo';
import { PlanoMesasGrid } from '../components/PlanoMesasGrid';
import { SidebarDespachoVivo } from '../components/SidebarDespachoVivo';
import { MesaInspeccionDrawer } from '../components/MesaInspeccionDrawer';
import { AlertaCocinaModal } from '../components/AlertaCocinaModal';
import { DemoMozoWidget } from '../components/DemoMozoWidget';
import { ModalPrecuentaCompleta } from '../components/precuenta/ModalPrecuentaCompleta';
import { ModalUnirMesas } from '../components/salon/ModalUnirMesas';
import { ModalSepararMesas } from '../components/salon/ModalSepararMesas';
import { ModalBloqueoSeparacion } from '../components/salon/ModalBloqueoSeparacion';
import { ModalDividirCuenta } from '../components/split/ModalDividirCuenta';
import { ModalAnularItem } from '../components/anulacion/ModalAnularItem';
import { ModalAnularComandaTotal } from '../components/anulacion/ModalAnularComandaTotal';
import { ModalFichaReserva } from '../components/reservas/ModalFichaReserva';
import { BannerIncidenciaCocina } from '../components/quiebre/BannerIncidenciaCocina';
import { ModalResolucionIncidencia } from '../components/quiebre/ModalResolucionIncidencia';
import { ModalSustitucionCarta } from '../components/quiebre/ModalSustitucionCarta';
import { ModalAnulacionQuiebre } from '../components/quiebre/ModalAnulacionQuiebre';
import { Bell, ChevronRight, Check } from 'lucide-react';

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

  // Estado para el Modal Completo de Precuenta Digital en Salón (CU-MOZO-08)
  const [modalPrecuentaAbierto, setModalPrecuentaAbierto] = useState(false);
  const [mesaPrecuentaId, setMesaPrecuentaId] = useState<string | null>(null);

  // Estados para Unión y Desvinculación de Mesas (CU-MOZO-04)
  const [modalUnirAbierto, setModalUnirAbierto] = useState(false);
  const [mesaParaUnirId, setMesaParaUnirId] = useState<string | null>(null);

  const [modalSepararAbierto, setModalSepararAbierto] = useState(false);
  const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false);
  const [mesaParaSepararId, setMesaParaSepararId] = useState<string | null>(null);
  const [validacionSeparacion, setValidacionSeparacion] = useState<ValidacionSeparacionMesaDTO | null>(null);

  // Estados para División de Cuenta (CU-MOZO-09)
  const [modalDividirAbierto, setModalDividirAbierto] = useState(false);
  const [mesaParaDividirId, setMesaParaDividirId] = useState<string | null>(null);

  // Estados para Anulación de Ítems y Comanda (CU-MOZO-06)
  const [modalAnularItemAbierto, setModalAnularItemAbierto] = useState(false);
  const [itemParaAnular, setItemParaAnular] = useState<ItemDetalleComandaDTO | null>(null);
  const [modalAnularComandaAbierto, setModalAnularComandaAbierto] = useState(false);
  const [mesaParaAnularComandaId, setMesaParaAnularComandaId] = useState<string | null>(null);

  // Estados para Ficha de Reserva (CU-MOZO-05)
  const [modalFichaReservaAbierto, setModalFichaReservaAbierto] = useState(false);
  const [reservaFichaSeleccionada, setReservaFichaSeleccionada] = useState<ReservaCardDTO | null>(null);

  // Estado para el Modal de Alerta de Cocina
  const [alertaModalAbierta, setAlertaModalAbierta] = useState(false);
  const [alertaData, setAlertaData] = useState<AlertaCocinaModalDTO | null>(null);

  // Estado para Drawer de Despacho en Móvil (< 1024px)
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState(false);

  // Estados para Incidencia de Plato No Disponible en Cocina (CU-MOZO-07)
  const [bannerQuiebreOculto, setBannerQuiebreOculto] = useState(false);
  const [modalResolucionQuiebreAbierto, setModalResolucionQuiebreAbierto] = useState(false);
  const [modalSustitucionCartaAbierto, setModalSustitucionCartaAbierto] = useState(false);
  const [modalAnulacionQuiebreAbierto, setModalAnulacionQuiebreAbierto] = useState(false);
  const [toastNotificacion, setToastNotificacion] = useState<string | null>(null);

  const mostrarToast = (mensaje: string) => {
    setToastNotificacion(mensaje);
    setTimeout(() => setToastNotificacion(null), 3500);
  };

  // Carga inicial y Short Polling en segundo plano (cada 3.5 segundos)
  useEffect(() => {
    cargarPlano(pisoActivoId);

    const polling = setInterval(() => {
      mockMozoService.obtenerPlanoCompleto(pisoActivoId).then((res: any) => {
        if (res?.exito && res.datos) {
          setPlanoData(res.datos);
        }
      }).catch(() => {});
    }, 3500);

    return () => clearInterval(polling);
  }, [pisoActivoId]);

  const cargarPlano = async (pisoId: string) => {
    setCargando(true);
    try {
      const res = await mockMozoService.obtenerPlanoCompleto(pisoId);
      if (res.exito && res.datos) {
        setPlanoData(res.datos);
        if (
          res.datos.piso_activo?.id &&
          res.datos.piso_activo.id !== pisoId &&
          (pisoId === 'piso-01-salon' || !res.datos.pisos_disponibles.some((p: any) => p.id === pisoId))
        ) {
          setPisoActivoId(res.datos.piso_activo.id);
        }
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

    if (mesa.estado === 'bloqueada') {
      // Abrir Ficha de Reserva (CU-MOZO-05)
      handleAbrirFichaReserva(mesa);
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

  // Abrir Ficha de Reserva para mesa bloqueada (CU-MOZO-05)
  const handleAbrirFichaReserva = async (mesa: MesaCardDTO) => {
    const res = await mockMozoService.obtenerReservas();
    let encontrada: ReservaCardDTO | undefined;
    if (res.exito) {
      encontrada = (res.datos as any[]).find((r: any) => r.mesa_ids.includes(mesa.id));
    }

    if (!encontrada) {
      encontrada = {
        id: 'res-005',
        cliente_nombre: mesa.reserva_cliente || 'Familia Gómez',
        cliente_telefono: '+51 987 654 321',
        fecha_hora: '2026-10-09T14:00:00Z',
        hora_texto: mesa.reserva_hora || '14:00',
        minutos_restantes: mesa.minutos_para_reserva || 20,
        num_personas: mesa.capacidad || 4,
        mesas_etiqueta: `Mesa ${mesa.numero}`,
        mesa_ids: [mesa.id],
        estado: 'bloqueada',
        notas: 'Viene con niño pequeño, requiere silla alta',
        en_tolerancia: true,
        tolerancia_expiro: false,
        created_at: new Date().toISOString(),
      };
    }

    setReservaFichaSeleccionada(encontrada);
    setModalFichaReservaAbierto(true);
  };

  const handleSentarDesdeFicha = async (reserva: ReservaCardDTO) => {
    const res = await mockMozoService.sentarReserva(reserva.id);
    if (res.exito) {
      setPlanoData((prev) => {
        if (!prev) return prev;
        const actualizadas = prev.mesas.map((m) =>
          reserva.mesa_ids.includes(m.id)
            ? {
                ...m,
                estado: 'ocupada' as const,
                pedido_id: res.datos.pedido_id,
                comensales_sentados: reserva.num_personas,
                minutos_ocupada: 1,
                total_consumo: 0,
                reserva_cliente: null,
                reserva_hora: null,
                minutos_para_reserva: null,
                mozo_nombre: prev.mozo_actual.nombre,
                es_mi_mesa: true,
              }
            : m
        );
        return {
          ...prev,
          mesas: actualizadas,
          mesas_ocupadas: prev.mesas_ocupadas + 1,
        };
      });
    }
  };

  const handleNoShowDesdeFicha = async (reservaId: string, motivo: string) => {
    const res = await mockMozoService.registrarNoShow(reservaId, motivo);
    if (res.exito) {
      setPlanoData((prev) => {
        if (!prev) return prev;
        const actualizadas = prev.mesas.map((m) =>
          m.id === 'mesa-08'
            ? {
                ...m,
                estado: 'libre' as const,
                reserva_cliente: null,
                reserva_hora: null,
                minutos_para_reserva: null,
              }
            : m
        );
        return {
          ...prev,
          mesas: actualizadas,
          mesas_libres: prev.mesas_libres + 1,
        };
      });
    }
  };

  const handleCancelarReservaDesdeFicha = async (reservaId: string, motivo: string) => {
    await mockMozoService.cancelarReserva(reservaId, motivo);
    setPlanoData((prev) => {
      if (!prev) return prev;
      const actualizadas = prev.mesas.map((m) =>
        m.id === 'mesa-08'
          ? {
              ...m,
              estado: 'libre' as const,
              reserva_cliente: null,
              reserva_hora: null,
              minutos_para_reserva: null,
            }
          : m
      );
      return {
        ...prev,
        mesas: actualizadas,
        mesas_libres: prev.mesas_libres + 1,
      };
    });
  };

  // Sentar comensales y abrir comanda
  const handleAbrirMesa = async (mesa: MesaCardDTO) => {
    const comensales = mesa.capacidad || 2;
    const res = await mockMozoService.abrirMesa(mesa.id, comensales);
    if (res.exito) {
      await cargarPlano(pisoActivoId);
      setMesaSeleccionada({ ...mesa, estado: 'ocupada' });
      setDrawerAbierto(true);
      setCargandoDetalle(true);
      try {
        const detRes = await mockMozoService.obtenerDetalleMesa(mesa.id);
        if (detRes.exito) {
          setDetalleMesa(detRes.datos);
        }
      } finally {
        setCargandoDetalle(false);
      }
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

  // Solicitar o Ver Cuenta (Abre el modal de precuenta completa para revisión)
  const handleSolicitarOVerCuenta = (mesaId: string) => {
    setMesaPrecuentaId(mesaId);
    setModalPrecuentaAbierto(true);
  };

  // Se ejecuta ÚNICAMENTE cuando el mozo pulsa "Confirmar y Notificar a Caja" dentro del modal
  const handleCuentaNotificadaDesdeModal = (mesaId: string, totalNeto: number) => {
    setPlanoData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mesas: prev.mesas.map((m) =>
          m.id === mesaId
            ? { ...m, estado: 'cuenta_pedida' as const, total_consumo: totalNeto }
            : m
        ),
      };
    });

    if (detalleMesa && detalleMesa.mesa_id === mesaId) {
      setDetalleMesa((prev) =>
        prev ? { ...prev, estado: 'cuenta_pedida', total_subtotal: totalNeto } : null
      );
    }
  };

  // Handlers para CU-MOZO-04: Unir o Dividir Mesas en Salón
  const handleAbrirModalUnir = (mesaId: string) => {
    setMesaParaUnirId(mesaId);
    setModalUnirAbierto(true);
  };

  const handleConfirmarUnion = async (titularId: string, secundariasIds: string[]) => {
    const res = await mockMozoService.unirMesas({
      mesa_titular_id: titularId,
      mesas_secundarias_ids: secundariasIds,
    });

    if (res.exito) {
      await cargarPlano(pisoActivoId);
      if (
        detalleMesa &&
        (detalleMesa.mesa_id === titularId || secundariasIds.includes(detalleMesa.mesa_id))
      ) {
        const detRes = await mockMozoService.obtenerDetalleMesa(titularId);
        if (detRes.exito) {
          setDetalleMesa(detRes.datos);
        }
      }
    }
  };

  const handleAbrirModalSeparar = async (mesaId: string) => {
    setMesaParaSepararId(mesaId);
    const res = await mockMozoService.validarSeparacionMesa(mesaId);
    if (res.exito && res.datos) {
      setValidacionSeparacion(res.datos);
      if (res.datos.puede_separar) {
        setModalSepararAbierto(true);
      } else {
        setModalBloqueoAbierto(true);
      }
    }
  };

  const handleConfirmarSeparacion = async (mesaId: string) => {
    const res = await mockMozoService.dividirMesas(mesaId, true);
    if (res.exito) {
      await cargarPlano(pisoActivoId);
      setDrawerAbierto(false);
      setDetalleMesa(null);
    }
  };

  const handleSolicitarCuentaDesdeBloqueo = (mesaId: string) => {
    setModalBloqueoAbierto(false);
    handleSolicitarOVerCuenta(mesaId);
  };

  // Handlers para CU-MOZO-09: Dividir Cuenta en Mesa (Split de Comprobantes)
  const handleAbrirModalDividir = (mesaId: string) => {
    setMesaParaDividirId(mesaId);
    setModalDividirAbierto(true);
  };

  const handleDivisionConfirmada = async (resultado: DividirCuentaResponseDTO) => {
    // 1. Recargar datos del plano para reflejar estado cuenta_pedida dividida
    await cargarPlano(pisoActivoId);

    // 2. Si el drawer está abierto para esta mesa, refrescar su detalle
    if (detalleMesa && detalleMesa.mesa_id === resultado.mesa_id) {
      const resDetalle = await mockMozoService.obtenerDetalleMesa(resultado.mesa_id);
      if (resDetalle.exito) {
        setDetalleMesa(resDetalle.datos);
      }
    }
  };

  // Handlers para CU-MOZO-06: Anular ítem o comanda completa con motivo y merma
  const handleAbrirModalAnularItem = (item: ItemDetalleComandaDTO) => {
    setItemParaAnular(item);
    setModalAnularItemAbierto(true);
  };

  const handleConfirmarAnulacionItem = async (request: AnularItemRequestDTO) => {
    if (!itemParaAnular || !detalleMesa) return;

    const res = await mockMozoService.anularItemComanda(
      detalleMesa.mesa_id,
      itemParaAnular.id,
      request
    );

    if (res.exito) {
      await cargarPlano(pisoActivoId);
      const detRes = await mockMozoService.obtenerDetalleMesa(detalleMesa.mesa_id);
      if (detRes.exito) {
        setDetalleMesa(detRes.datos);
      }
    }
  };

  const handleAbrirModalAnularComanda = (mesaId: string) => {
    setMesaParaAnularComandaId(mesaId);
    setModalAnularComandaAbierto(true);
  };

  const handleConfirmarAnulacionComanda = async (request: AnularPedidoCompletoRequestDTO) => {
    if (!mesaParaAnularComandaId) return;

    const res = await mockMozoService.anularComandaCompleta(
      mesaParaAnularComandaId,
      request
    );

    if (res.exito) {
      await cargarPlano(pisoActivoId);
      setDrawerAbierto(false);
      setDetalleMesa(null);
    }
  };

  const handleLiberarMesaSinConsumo = async (mesaId: string) => {
    const res = await mockMozoService.liberarMesaSinConsumo(mesaId);
    if (res.exito) {
      await cargarPlano(pisoActivoId);
      setDrawerAbierto(false);
      setDetalleMesa(null);
      mostrarToast('✓ Mesa liberada con éxito (cliente se retiró sin consumo).');
    } else {
      mostrarToast(`⚠️ No se pudo liberar la mesa: ${res.mensaje || 'Error desconocido'}`);
    }
  };

  // Detección reactiva de Mesa con Quiebre en Cocina (CU-MOZO-07)
  const mesaConQuiebre = useMemo(() => {
    return planoData?.mesas.find((m) => m.tiene_quiebre_cocina) || null;
  }, [planoData]);

  // Handlers para CU-MOZO-07: Quiebre de Plato en Cocina
  const handleAtenderQuiebre = () => {
    setModalResolucionQuiebreAbierto(true);
  };

  const handleElegirSustitucionQuiebre = () => {
    setModalResolucionQuiebreAbierto(false);
    setModalSustitucionCartaAbierto(true);
  };

  const handleElegirAnulacionQuiebre = () => {
    setModalResolucionQuiebreAbierto(false);
    setModalAnulacionQuiebreAbierto(true);
  };

  const handleConfirmarSustitucionPlato = async (nuevoProductoId: string, notasCocina: string) => {
    const mesaId = mesaConQuiebre?.id || detalleMesa?.mesa_id || 'mesa-04';
    const itemId = mesaConQuiebre?.quiebre_item_id || 'it-01';

    const res = await mockMozoService.sustituirPlato(mesaId, itemId, {
      item_anulado_id: itemId,
      nuevo_producto_id: nuevoProductoId,
      cantidad: 1,
      notas_cocina: notasCocina,
    });

    if (res.exito) {
      setModalSustitucionCartaAbierto(false);
      setPlanoData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mesas: prev.mesas.map((m) =>
            m.id === mesaId
              ? {
                  ...m,
                  tiene_quiebre_cocina: false,
                  quiebre_producto_nombre: undefined,
                  quiebre_item_id: undefined,
                  total_consumo: res.datos.nuevo_subtotal,
                }
              : m
          ),
        };
      });

      if (drawerAbierto && detalleMesa?.mesa_id === mesaId) {
        const detRes = await mockMozoService.obtenerDetalleMesa(mesaId);
        if (detRes.exito) setDetalleMesa(detRes.datos);
      }

      mostrarToast(`✓ Sustituido por "${res.datos.nuevo_producto}". Enviado a Cocina con prioridad.`);
    }
  };

  const handleConfirmarAnulacionQuiebre = async (payload: AnularPorQuiebreRequestDTO) => {
    const mesaId = mesaConQuiebre?.id || detalleMesa?.mesa_id || 'mesa-04';
    const itemId = mesaConQuiebre?.quiebre_item_id || 'it-01';

    const res = await mockMozoService.anularPorQuiebreCocina(mesaId, itemId, payload);
    if (res.exito) {
      setModalAnulacionQuiebreAbierto(false);
      setPlanoData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mesas: prev.mesas.map((m) =>
            m.id === mesaId
              ? {
                  ...m,
                  tiene_quiebre_cocina: false,
                  quiebre_producto_nombre: undefined,
                  quiebre_item_id: undefined,
                  total_consumo: res.datos.nuevo_subtotal,
                }
              : m
          ),
        };
      });

      if (drawerAbierto && detalleMesa?.mesa_id === mesaId) {
        const detRes = await mockMozoService.obtenerDetalleMesa(mesaId);
        if (detRes.exito) setDetalleMesa(detRes.datos);
      }

      mostrarToast(`✓ Plato anulado (S/ ${res.datos.monto_anulado.toFixed(2)} descontados). Sin merma imputada.`);
    }
  };

  const handleSimularQuiebreCocina = async () => {
    const nuevoEstado = !mesaConQuiebre;
    const res = await mockMozoService.simularQuiebreCocinaMesa04(nuevoEstado);
    if (res.exito) {
      setBannerQuiebreOculto(false);
      setPlanoData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mesas: prev.mesas.map((m) => (m.id === 'mesa-04' ? { ...res.datos.mesa } : m)),
        };
      });
      if (drawerAbierto && (detalleMesa?.mesa_id === 'mesa-04' || mesaSeleccionada?.id === 'mesa-04')) {
        const detRes = await mockMozoService.obtenerDetalleMesa('mesa-04');
        if (detRes.exito) setDetalleMesa(detRes.datos);
      }
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

      {/* Toast reactivo flotante de confirmación */}
      {toastNotificacion && (
        <div className="fixed top-16 right-6 z-50 rounded-xl bg-slate-900 border border-emerald-500/50 p-3 shadow-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastNotificacion}</span>
        </div>
      )}

      {/* Banner Superior de Incidencia en Cocina (CU-MOZO-07 Vista 1) */}
      {mesaConQuiebre && !bannerQuiebreOculto && (
        <div className="pt-3">
          <BannerIncidenciaCocina
            mesaNumero={mesaConQuiebre.numero}
            productoNombre={mesaConQuiebre.quiebre_producto_nombre || 'Lomo Saltado Criollo'}
            minutosDesdeAlerta={2}
            onAtender={handleAtenderQuiebre}
            onCerrar={() => setBannerQuiebreOculto(true)}
          />
        </div>
      )}

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
        onSolicitarOVerCuenta={handleSolicitarOVerCuenta}
        onMarcarItemServido={handleMarcarServido}
        onLiberarMesaSinConsumo={handleLiberarMesaSinConsumo}
        onAbrirModalUnir={handleAbrirModalUnir}
        onAbrirModalSeparar={handleAbrirModalSeparar}
        onAbrirModalDividir={handleAbrirModalDividir}
        onAbrirModalAnular={handleAbrirModalAnularItem}
        onAbrirModalAnularComanda={handleAbrirModalAnularComanda}
        onAtenderQuiebre={handleAtenderQuiebre}
        onSustituirPlato={() => {
          setDrawerAbierto(false);
          setModalSustitucionCartaAbierto(true);
        }}
        onAnularPorQuiebre={() => {
          setDrawerAbierto(false);
          setModalAnulacionQuiebreAbierto(true);
        }}
      />

      {/* 4. Modal Completo de Precuenta Digital en Salón (CU-MOZO-08) */}
      {modalPrecuentaAbierto && mesaPrecuentaId && (
        <ModalPrecuentaCompleta
          isOpen={modalPrecuentaAbierto}
          onClose={() => setModalPrecuentaAbierto(false)}
          mesaId={mesaPrecuentaId}
          mesaEstadoActual={
            planoData?.mesas.find((m) => m.id === mesaPrecuentaId)?.estado || detalleMesa?.estado
          }
          onCuentaNotificada={handleCuentaNotificadaDesdeModal}
          actor="mozo"
        />
      )}

      {/* 5. Modal de Unión de Mesas con Mini-Mapa Espacial 5x2 (CU-MOZO-04) */}
      {modalUnirAbierto && mesaParaUnirId && (
        <ModalUnirMesas
          isOpen={modalUnirAbierto}
          onClose={() => setModalUnirAbierto(false)}
          mesaTitularId={mesaParaUnirId}
          onConfirmarUnion={handleConfirmarUnion}
        />
      )}

      {/* 6. Modal de Separación / Desvinculación de Mesas (CU-MOZO-04) */}
      {modalSepararAbierto && mesaParaSepararId && (
        <ModalSepararMesas
          isOpen={modalSepararAbierto}
          onClose={() => setModalSepararAbierto(false)}
          mesaId={mesaParaSepararId}
          validacion={validacionSeparacion}
          onConfirmarSeparacion={handleConfirmarSeparacion}
        />
      )}

      {/* 7. Modal de Bloqueo Asistido 409 Conflict por Consumo Activo (CU-MOZO-04) */}
      {modalBloqueoAbierto && mesaParaSepararId && (
        <ModalBloqueoSeparacion
          isOpen={modalBloqueoAbierto}
          onClose={() => setModalBloqueoAbierto(false)}
          mesaId={mesaParaSepararId}
          validacion={validacionSeparacion}
          onSolicitarCuenta={handleSolicitarCuentaDesdeBloqueo}
        />
      )}

      {/* 8. Modal Wizard de División de Cuenta CU-MOZO-09 (Split Comprobantes) */}
      {modalDividirAbierto && mesaParaDividirId && (
        <ModalDividirCuenta
          isOpen={modalDividirAbierto}
          onClose={() => setModalDividirAbierto(false)}
          mesaId={mesaParaDividirId}
          onDivisionConfirmada={handleDivisionConfirmada}
        />
      )}

      {/* 9. Modal Anular Ítem con Control de Merma (CU-MOZO-06 Vistas 2 y 4) */}
      {modalAnularItemAbierto && itemParaAnular && (
        <ModalAnularItem
          isOpen={modalAnularItemAbierto}
          onClose={() => {
            setModalAnularItemAbierto(false);
            setItemParaAnular(null);
          }}
          item={itemParaAnular}
          mesaNumero={detalleMesa?.numero || '04'}
          onConfirmarAnulacion={handleConfirmarAnulacionItem}
        />
      )}

      {/* 10. Modal Anular Comanda Completa y Liberar Mesa (CU-MOZO-06 Vista 3) */}
      {modalAnularComandaAbierto && (
        <ModalAnularComandaTotal
          isOpen={modalAnularComandaAbierto}
          onClose={() => {
            setModalAnularComandaAbierto(false);
            setMesaParaAnularComandaId(null);
          }}
          mesaId={mesaParaAnularComandaId || detalleMesa?.mesa_id || 'mesa-04'}
          mesaNumero={detalleMesa?.numero || '04'}
          totalConsumo={detalleMesa?.total_subtotal || 140.0}
          totalItems={detalleMesa?.items.length || 4}
          onConfirmarAnulacionTotal={handleConfirmarAnulacionComanda}
        />
      )}

      {/* 11. Modal de Alerta Prioritaria de Cocina (560px) */}
      <AlertaCocinaModal
        abierto={alertaModalAbierta}
        onCerrar={() => setAlertaModalAbierta(false)}
        alerta={alertaData}
        onAceptar={() => setAlertaModalAbierta(false)}
      />

      {/* 12. Widget Flotante de Simulación / Demostración */}
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
        onAbrirUnionMesaDemo={() => handleAbrirModalUnir('mesa-02')}
        onAbrirSepararMesaDemo={() => handleAbrirModalSeparar('mesa-02')}
        onAbrirDividirCuentaDemo={() => handleAbrirModalDividir('mesa-04')}
        onAbrirAnularComandaDemo={() => handleAbrirModalAnularComanda('mesa-04')}
        onAbrirFichaReservaDemo={() => {
          const m08 = planoData?.mesas.find((m) => m.id === 'mesa-08') || {
            id: 'mesa-08',
            piso_id: 'piso-01-salon',
            numero: '08',
            capacidad: 4,
            forma: 'cuadrada' as const,
            posicion_x: 3,
            posicion_y: 1,
            permite_union: true,
            estado: 'bloqueada' as const,
            reserva_cliente: 'Familia Gómez',
            reserva_hora: '14:00',
            minutos_para_reserva: 20,
            es_mi_mesa: false,
            platos_listos: 0,
            platos_en_cocina: 0,
            despacho_directo_pendiente: 0,
          };
          handleAbrirFichaReserva(m08);
        }}
        onSimularQuiebreCocina={handleSimularQuiebreCocina}
        quiebreActivo={Boolean(mesaConQuiebre)}
      />

      {/* 13. Modal Ficha de Reserva y Recepción en Salón (CU-MOZO-05 Vista 3) */}
      <ModalFichaReserva
        abierto={modalFichaReservaAbierto}
        reserva={reservaFichaSeleccionada}
        onCerrar={() => {
          setModalFichaReservaAbierto(false);
          setReservaFichaSeleccionada(null);
        }}
        onSentarComensales={handleSentarDesdeFicha}
        onRegistrarNoShow={handleNoShowDesdeFicha}
        onCancelarReserva={handleCancelarReservaDesdeFicha}
        onEnviarWhatsApp={(res) => {
          const tel = res.cliente_telefono.replace(/\D/g, '');
          window.open(
            `https://wa.me/${tel}?text=${encodeURIComponent(
              `Hola ${res.cliente_nombre}, le saludamos de RestaurantCloud AI para confirmar su reserva de hoy a las ${res.hora_texto}.`
            )}`,
            '_blank'
          );
        }}
      />

      {/* 14. Modal de Decisión Asistida en Mesa (CU-MOZO-07 Vista 2 - 620px) */}
      <ModalResolucionIncidencia
        abierto={modalResolucionQuiebreAbierto}
        mesaNumero={mesaConQuiebre?.numero || detalleMesa?.numero || '04'}
        comandaNumero={detalleMesa?.numero_comanda || 149}
        productoNombre={mesaConQuiebre?.quiebre_producto_nombre || 'Lomo Saltado Criollo'}
        precioUnitario={38.0}
        onCerrar={() => setModalResolucionQuiebreAbierto(false)}
        onElegirSustitucion={handleElegirSustitucionQuiebre}
        onElegirAnulacion={handleElegirAnulacionQuiebre}
      />

      {/* 15. Modal de Sustitución Universal en Carta (CU-MOZO-07 Vista 3 - 760px) */}
      <ModalSustitucionCarta
        abierto={modalSustitucionCartaAbierto}
        mesaId={mesaConQuiebre?.id || detalleMesa?.mesa_id || 'mesa-04'}
        mesaNumero={mesaConQuiebre?.numero || detalleMesa?.numero || '04'}
        itemId={mesaConQuiebre?.quiebre_item_id || 'it-01'}
        onVolverAOpciones={() => {
          setModalSustitucionCartaAbierto(false);
          setModalResolucionQuiebreAbierto(true);
        }}
        onCerrar={() => setModalSustitucionCartaAbierto(false)}
        onConfirmarSustitucion={handleConfirmarSustitucionPlato}
        onIrAnulacion={() => {
          setModalSustitucionCartaAbierto(false);
          setModalAnulacionQuiebreAbierto(true);
        }}
      />

      {/* 16. Modal de Confirmación de Anulación por Quiebre (CU-MOZO-07 Vista 4 - 580px) */}
      <ModalAnulacionQuiebre
        abierto={modalAnulacionQuiebreAbierto}
        mesaNumero={mesaConQuiebre?.numero || detalleMesa?.numero || '04'}
        comandaNumero={detalleMesa?.numero_comanda || 149}
        productoNombre={mesaConQuiebre?.quiebre_producto_nombre || 'Lomo Saltado Criollo'}
        precioUnitario={38.0}
        subtotalActual={detalleMesa?.total_subtotal || 158.0}
        onVolver={() => {
          setModalAnulacionQuiebreAbierto(false);
          setModalResolucionQuiebreAbierto(true);
        }}
        onCerrar={() => setModalAnulacionQuiebreAbierto(false)}
        onConfirmarAnulacion={handleConfirmarAnulacionQuiebre}
      />
    </div>
  );
};
