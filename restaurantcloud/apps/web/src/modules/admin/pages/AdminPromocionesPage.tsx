import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import {
  PromocionAdminDTO,
  PromocionKPIsDTO,
  FiltroEstadoPromocion,
  FiltroTipoPromocion,
  CrearPromocionRequest,
  PromocionRendimientoDTO,
} from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import { PromocionesHeader } from '../components/promociones/PromocionesHeader';
import { PromocionesFiltros } from '../components/promociones/PromocionesFiltros';
import { PromocionesTabla } from '../components/promociones/PromocionesTabla';
import { ModalConfigurarPromocion } from '../components/promociones/ModalConfigurarPromocion';
import { ModalRendimientoPromocion } from '../components/promociones/ModalRendimientoPromocion';
import { PromocionesOnboardingVacio } from '../components/promociones/PromocionesOnboardingVacio';

export const AdminPromocionesPage: React.FC = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const localNombre = usuario?.local?.nombre ?? 'Sede Principal';
  const [cargando, setCargando] = useState(true);
  const [promociones, setPromociones] = useState<PromocionAdminDTO[]>([]);
  const [todasPromociones, setTodasPromociones] = useState<PromocionAdminDTO[]>([]);
  const [kpis, setKpis] = useState<PromocionKPIsDTO>({
    vigentes_hoy: 0,
    campanas_programadas: 0,
    descuentos_mes: 0,
    cuentas_beneficiadas: 0,
  });

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPromocion>('todas');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoPromocion>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [promoParaEditar, setPromoParaEditar] = useState<PromocionAdminDTO | null>(null);

  const [modalRendimientoAbierto, setModalRendimientoAbierto] = useState(false);
  const [rendimientoActual, setRendimientoActual] = useState<PromocionRendimientoDTO | null>(null);

  // Modal confirmación de eliminación
  const [modalEliminar, setModalEliminar] = useState<{
    abierto: boolean;
    promo: PromocionAdminDTO | null;
  }>({ abierto: false, promo: null });

  // Toast feedback
  const [toastFeedback, setToastFeedback] = useState<{
    tipo: 'exito' | 'error' | 'info';
    texto: string;
  } | null>(null);

  const mostrarToast = useCallback((texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
    setToastFeedback({ tipo, texto });
    setTimeout(() => {
      setToastFeedback(null);
    }, 4500);
  }, []);

  // Cargar datos
  const cargarDatos = useCallback(async (busqActual: string = busqueda) => {
    setCargando(true);
    try {
      // 1. Obtener todas sin filtros para conteos de píldoras y KPIs
      const respTotal = await adminService.getBandejaPromociones({});
      if (respTotal.exito) {
        setTodasPromociones(respTotal.datos.promociones);
        setKpis(respTotal.datos.kpis);
      }

      // 2. Si hay búsqueda activa, consumir nuevo endpoint optimizado GET /api/v1/admin/promociones/buscar
      if (busqActual.trim()) {
        const respBusqueda = await adminService.buscarPromociones(
          busqActual.trim(),
          filtroEstado,
          filtroTipo
        );
        if (respBusqueda.exito) {
          setPromociones(respBusqueda.datos.resultados);
        } else {
          mostrarToast('Error al ejecutar la búsqueda de promociones', 'error');
        }
      } else {
        // Obtener lista con filtros activos
        const respFiltrada = await adminService.getBandejaPromociones({
          estado: filtroEstado,
          tipo_descuento: filtroTipo,
        });

        if (respFiltrada.exito) {
          setPromociones(respFiltrada.datos.promociones);
        } else {
          mostrarToast('Error al cargar la bandeja de promociones', 'error');
        }
      }
    } catch {
      mostrarToast('Error de comunicación con el servicio de promociones', 'error');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroTipo, busqueda, mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleBuscar = (termino: string) => {
    setBusqueda(termino);
    cargarDatos(termino);
  };

  const handleLimpiarBusqueda = () => {
    setBusqueda('');
    cargarDatos('');
  };

  // Cálculo de conteos para píldoras
  const conteos = {
    todas: todasPromociones.length,
    vigentes: todasPromociones.filter((p) => p.estado_visual === 'vigente').length,
    programadas: todasPromociones.filter((p) => p.estado_visual === 'programada').length,
    pausadas: todasPromociones.filter((p) => p.estado_visual === 'pausada').length,
    vencidas: todasPromociones.filter((p) => p.estado_visual === 'vencida').length,
    agotadas: todasPromociones.filter((p) => p.estado_visual === 'agotada' || p.estado_visual === 'agotada_hoy').length,
  };

  // Handlers
  const handleNuevaPromocion = () => {
    setPromoParaEditar(null);
    setModalConfigAbierto(true);
  };

  const handleEditar = (promo: PromocionAdminDTO) => {
    setPromoParaEditar(promo);
    setModalConfigAbierto(true);
  };

  const handleGuardarPromocion = async (req: CrearPromocionRequest): Promise<boolean> => {
    try {
      if (promoParaEditar) {
        const resp = await adminService.actualizarPromocion(promoParaEditar.id, req);
        if (resp.exito) {
          mostrarToast(`Promoción "${req.nombre}" actualizada con éxito`);
          setModalConfigAbierto(false);
          setPromoParaEditar(null);
          await cargarDatos();
          return true;
        } else {
          const msg = resp.errores?.[0]?.mensaje || 'No se pudo actualizar la promoción';
          mostrarToast(msg, 'error');
          return false;
        }
      } else {
        const resp = await adminService.crearPromocion(req);
        if (resp.exito) {
          mostrarToast(`Promoción "${req.nombre}" creada y disponible en caja`);
          setModalConfigAbierto(false);
          await cargarDatos();
          return true;
        } else {
          const msg = resp.errores?.[0]?.mensaje || 'No se pudo crear la promoción';
          mostrarToast(msg, 'error');
          return false;
        }
      }
    } catch {
      mostrarToast('Ocurrió un error inesperado al procesar la solicitud', 'error');
      return false;
    }
  };

  const handleVerRendimiento = async (id: string) => {
    try {
      const resp = await adminService.getRendimientoPromocion(id);
      if (resp.exito) {
        setRendimientoActual(resp.datos);
        setModalRendimientoAbierto(true);
      } else {
        mostrarToast('No se pudo cargar el reporte de rendimiento', 'error');
      }
    } catch {
      mostrarToast('Error al consultar métricas comerciales', 'error');
    }
  };

  const handleToggleEstado = async (id: string, nuevoEstado: boolean) => {
    try {
      const resp = await adminService.toggleEstadoPromocion(id, nuevoEstado);
      if (resp.exito) {
        const mensaje = nuevoEstado
          ? `Promoción activada en caja (${resp.datos.codigo})`
          : `Promoción pausada temporalmente (${resp.datos.codigo})`;
        mostrarToast(mensaje, 'info');
        await cargarDatos();

        // Si el modal de rendimiento estaba abierto, actualizarlo
        if (rendimientoActual && rendimientoActual.promocion.id === id) {
          const respRend = await adminService.getRendimientoPromocion(id);
          if (respRend.exito) {
            setRendimientoActual(respRend.datos);
          }
        }
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo cambiar el estado de la promoción';
        mostrarToast(errorMsg, 'error');
      }
    } catch {
      mostrarToast('Error de comunicación al actualizar estado', 'error');
    }
  };

  const handleSolicitarEliminar = (id: string) => {
    const promo = todasPromociones.find((p) => p.id === id);
    if (!promo) return;

    if (promo.usos_actuales > 0) {
      mostrarToast(
        `No es posible eliminar "${promo.nombre}" porque tiene ${promo.usos_actuales} comprobantes SUNAT emitidos. Utiliza la opción Pausar.`,
        'error'
      );
      return;
    }

    setModalEliminar({ abierto: true, promo });
  };

  const handleConfirmarEliminar = async () => {
    if (!modalEliminar.promo) return;
    try {
      const resp = await adminService.eliminarPromocion(modalEliminar.promo.id);
      if (resp.exito) {
        mostrarToast(`Promoción "${modalEliminar.promo.nombre}" eliminada del local`);
        setModalEliminar({ abierto: false, promo: null });
        await cargarDatos();
      } else {
        const msg = resp.errores?.[0]?.mensaje || 'No se pudo eliminar la promoción';
        mostrarToast(msg, 'error');
      }
    } catch {
      mostrarToast('Error de servidor al intentar eliminar la promoción', 'error');
    }
  };

  const handleCargarPlantillaInauguracion = async () => {
    try {
      const hoy = new Date();
      const fin = new Date();
      fin.setDate(fin.getDate() + 30);

      const resp = await adminService.crearPromocion({
        nombre: '🎉 Descuento Inaugural - Gran Apertura',
        descripcion:
          'Promoción de apertura del local: 15% de descuento en el total de la cuenta durante los primeros 30 días de atención.',
        tipo_descuento: 'porcentaje',
        valor: 15,
        tope_maximo_descuento: 40,
        monto_minimo_consumo: 50,
        fecha_inicio: hoy.toISOString().split('T')[0],
        fecha_fin: fin.toISOString().split('T')[0],
        dias_semana: [1, 2, 3, 4, 5, 6, 7],
        activa: true,
        tipo_limite_usos: 'global',
        limite_usos: 200,
      });

      if (resp.exito) {
        mostrarToast('¡Plantilla de Apertura creada exitosamente! 15% OFF activado en caja.');
        await cargarDatos();
      } else {
        const msg = resp.errores?.[0]?.mensaje || 'No se pudo cargar la plantilla';
        mostrarToast(msg, 'error');
      }
    } catch {
      mostrarToast('Error al inicializar la plantilla de inauguración', 'error');
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltroEstado('todas');
    setFiltroTipo('todos');
    setBusqueda('');
  };

  const esFiltroActivo =
    filtroEstado !== 'todas' || filtroTipo !== 'todos' || busqueda.trim().length > 0;
  const sinPromocionesEnSede = todasPromociones.length === 0 && !cargando;
  const sinResultadosConFiltro = promociones.length === 0 && !cargando && esFiltroActivo;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback Flotante */}
      {toastFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold max-w-md ${
              toastFeedback.tipo === 'exito'
                ? 'bg-emerald-900/95 text-emerald-100 border-emerald-500/50'
                : toastFeedback.tipo === 'error'
                ? 'bg-rose-900/95 text-rose-100 border-rose-500/50'
                : 'bg-slate-900/95 text-slate-100 border-slate-700/50'
            }`}
          >
            {toastFeedback.tipo === 'exito' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {toastFeedback.tipo === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            {toastFeedback.tipo === 'info' && (
              <Info className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toastFeedback.texto}</span>
            <button
              type="button"
              onClick={() => setToastFeedback(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cabecera y KPIs (Vista 1) */}
      <PromocionesHeader kpis={kpis} localNombre={localNombre} onNuevaPromocion={handleNuevaPromocion} />

      {/* Si la sede no tiene ninguna promoción registrada, mostramos Onboarding de Bienvenida (Vista 4) */}
      {sinPromocionesEnSede ? (
        <PromocionesOnboardingVacio
          esFiltroActivo={false}
          onCargarPlantillaInauguracion={handleCargarPlantillaInauguracion}
          onCrearDesdeCero={handleNuevaPromocion}
        />
      ) : (
        <>
          {/* Barra de Filtros y Búsqueda Optimizada */}
          <PromocionesFiltros
            filtroEstado={filtroEstado}
            onChangeFiltroEstado={setFiltroEstado}
            filtroTipo={filtroTipo}
            onChangeFiltroTipo={setFiltroTipo}
            busqueda={busqueda}
            onBuscar={handleBuscar}
            onLimpiar={handleLimpiarBusqueda}
            conteos={conteos}
          />

          {/* Estado de resultados vacíos por filtro o Tabla de Promociones */}
          {sinResultadosConFiltro ? (
            <PromocionesOnboardingVacio
              esFiltroActivo={true}
              onLimpiarFiltros={handleLimpiarFiltros}
              onCargarPlantillaInauguracion={handleCargarPlantillaInauguracion}
              onCrearDesdeCero={handleNuevaPromocion}
            />
          ) : (
            <PromocionesTabla
              promociones={promociones}
              cargando={cargando}
              onVerRendimiento={handleVerRendimiento}
              onEditar={handleEditar}
              onEliminar={handleSolicitarEliminar}
              onToggleEstado={handleToggleEstado}
            />
          )}
        </>
      )}

      {/* Modal 740px: Crear / Editar con Simulador en Vivo para Caja (Vista 2) */}
      <ModalConfigurarPromocion
        isOpen={modalConfigAbierto}
        onClose={() => {
          setModalConfigAbierto(false);
          setPromoParaEditar(null);
        }}
        promocionParaEditar={promoParaEditar}
        onGuardar={handleGuardarPromocion}
      />

      {/* Modal 740px: Métricas de Rendimiento y Auditoría de Comprobantes SUNAT (Vista 3) */}
      <ModalRendimientoPromocion
        isOpen={modalRendimientoAbierto}
        onClose={() => {
          setModalRendimientoAbierto(false);
          setRendimientoActual(null);
        }}
        rendimiento={rendimientoActual}
        onEditar={() => {
          if (rendimientoActual) {
            setModalRendimientoAbierto(false);
            handleEditar(rendimientoActual.promocion);
          }
        }}
        onToggleEstado={handleToggleEstado}
      />

      {/* Diálogo de Confirmación para Eliminar Promoción sin Historial */}
      {modalEliminar.abierto && modalEliminar.promo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar Promoción?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción eliminará la configuración de la sede.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>
                <strong>Campaña:</strong> {modalEliminar.promo.nombre}
              </div>
              <div>
                <strong>Código:</strong> {modalEliminar.promo.codigo}
              </div>
              <div className="text-slate-500 text-[11px]">
                Usos registrados: 0 comprobantes (permite borrado físico seguro).
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminar({ abierto: false, promo: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
