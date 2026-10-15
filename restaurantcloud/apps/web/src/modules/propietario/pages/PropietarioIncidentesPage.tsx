import React, { useState, useEffect, useCallback } from 'react';
import { propietarioIncidentesService } from '../services/propietarioIncidentesService';
import {
  IncidenteBandejaItemDTO,
  PropietarioIncidentesKpisDTO,
  SedeResumenDTO,
  GravedadIncidente,
  CategoriaIncidente,
  EstadoIncidente,
  IncidenteDetalleDTO,
  PasarARevisionRequest,
  SseIncidenteCriticoEvent,
} from '@/types/propietario';
import { PropietarioIncidentesHeader } from '../components/incidentes/PropietarioIncidentesHeader';
import { PropietarioIncidentesFiltros } from '../components/incidentes/PropietarioIncidentesFiltros';
import { PropietarioIncidentesTabla } from '../components/incidentes/PropietarioIncidentesTabla';
import { PropietarioIncidentesVacioState } from '../components/incidentes/PropietarioIncidentesVacioState';
import { ModalDetalleIncidentePropietario } from '../components/incidentes/ModalDetalleIncidentePropietario';
import { BannerAlertaCriticaSSE } from '../components/incidentes/BannerAlertaCriticaSSE';
import { DemoPropietarioIncidentesWidget } from '../components/incidentes/DemoPropietarioIncidentesWidget';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const KPIS_INICIALES: PropietarioIncidentesKpisDTO = {
  no_revisados: 0,
  no_revisados_alta: 0,
  gravedad_alta_activos: 0,
  total_mes: 0,
  desglose_mes: {
    abiertos: 0,
    en_revision: 0,
    resueltos: 0,
  },
  resueltos_por_sede: {},
};

export const PropietarioIncidentesPage: React.FC = () => {
  // Sedes disponibles en la organización
  const [sedes] = useState<SedeResumenDTO[]>(() => propietarioIncidentesService.getSedes());

  // Estado de Datos y KPIs
  const [kpis, setKpis] = useState<PropietarioIncidentesKpisDTO>(KPIS_INICIALES);
  const [incidentes, setIncidentes] = useState<IncidenteBandejaItemDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const limite = 15;

  // Filtros
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string>('todas');
  const [gravedad, setGravedad] = useState<GravedadIncidente | 'todas'>('todas');
  const [categoria, setCategoria] = useState<CategoriaIncidente | 'todas'>('todas');
  const [estado, setEstado] = useState<EstadoIncidente | 'todos'>('todos');
  const [soloNoVistos, setSoloNoVistos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Modal de Detalle
  const [modalAbierto, setModalAbierto] = useState(false);
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState<IncidenteDetalleDTO | null>(null);
  const [guardandoDirectiva, setGuardandoDirectiva] = useState(false);

  // Alerta SSE en tiempo real
  const [alertaSse, setAlertaSse] = useState<SseIncidenteCriticoEvent | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Carga de incidentes con filtros
  const cargarIncidentes = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await propietarioIncidentesService.getBandejaIncidentes({
        local_id: sedeSeleccionada,
        gravedad,
        categoria,
        estado,
        no_vistos: soloNoVistos,
        busqueda,
        pagina: paginaActual,
        limite,
      });

      if (resp.exito && resp.datos) {
        setKpis(resp.datos.kpis);
        setIncidentes(resp.datos.incidentes);
        setTotalRegistros(resp.datos.paginacion.total);
        setTotalPaginas(resp.datos.paginacion.total_paginas);
      }
    } catch (err) {
      console.error('Error al cargar bandeja corporativa de incidentes:', err);
      mostrarToast('Error al sincronizar incidentes con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  }, [sedeSeleccionada, gravedad, categoria, estado, soloNoVistos, busqueda, paginaActual]);

  useEffect(() => {
    cargarIncidentes();
  }, [cargarIncidentes]);

  // Suscripción al canal de eventos en vivo SSE
  useEffect(() => {
    const desuscribir = propietarioIncidentesService.subscribirSSE((evento) => {
      setAlertaSse(evento);
      cargarIncidentes();
    });

    return () => {
      desuscribir();
    };
  }, [cargarIncidentes]);

  // Manejo de Inspección de Incidente (Acuse Automático de Lectura)
  const handleInspeccionar = async (id: string) => {
    try {
      const resp = await propietarioIncidentesService.getIncidenteDetalle(id);
      if (resp.exito && resp.datos) {
        setIncidenteSeleccionado(resp.datos);
        setModalAbierto(true);
        // Refrescar lista y KPIs sin bloquear para reflejar el visto_por_propietario
        cargarIncidentes();
      } else {
        mostrarToast('No se pudo obtener el detalle del incidente', 'error');
      }
    } catch (err) {
      console.error('Error al inspeccionar incidente:', err);
      mostrarToast('Error al conectar con el servidor', 'error');
    }
  };

  // Manejo de Emisión de Directiva Ejecutiva
  const handleGuardarDirectiva = async (
    id: string,
    req: PasarARevisionRequest
  ): Promise<boolean> => {
    setGuardandoDirectiva(true);
    try {
      const resp = await propietarioIncidentesService.pasarARevisionConDirectiva(id, req);
      if (resp.exito && resp.datos) {
        setIncidenteSeleccionado(resp.datos);
        mostrarToast(
          'Directiva ejecutiva registrada formalmente. El incidente pasó a revisión.',
          'exito'
        );
        cargarIncidentes();
        return true;
      } else {
        const errorMsg = resp.errores?.[0]?.mensaje || 'No se pudo registrar la directiva';
        mostrarToast(errorMsg, 'error');
        return false;
      }
    } catch (err) {
      console.error('Error al emitir directiva:', err);
      mostrarToast('Error de comunicación con el servidor', 'error');
      return false;
    } finally {
      setGuardandoDirectiva(false);
    }
  };

  // Limpiar Filtros
  const handleLimpiarFiltros = () => {
    setSedeSeleccionada('todas');
    setGravedad('todas');
    setCategoria('todas');
    setEstado('todos');
    setSoloNoVistos(false);
    setBusqueda('');
    setPaginaActual(1);
  };

  const hayFiltrosActivos =
    sedeSeleccionada !== 'todas' ||
    gravedad !== 'todas' ||
    categoria !== 'todas' ||
    estado !== 'todos' ||
    soloNoVistos ||
    busqueda.trim() !== '';

  return (
    <div className="min-h-full space-y-6 pb-12 animate-fade-in relative">
      {/* Toast de Notificación Flotante */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold animate-slide-in">
          {toast.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className={toast.tipo === 'exito' ? 'text-emerald-950' : 'text-rose-950'}>
            {toast.mensaje}
          </span>
        </div>
      )}

      {/* Banner de Alerta Crítica en Tiempo Real (SSE Hub) */}
      <BannerAlertaCriticaSSE
        alerta={alertaSse}
        onInspeccionar={(id) => {
          setAlertaSse(null);
          handleInspeccionar(id);
        }}
        onDescartar={() => setAlertaSse(null)}
      />

      {/* Cabecera y Tarjetas KPI */}
      <PropietarioIncidentesHeader
        kpis={kpis}
        soloNoVistos={soloNoVistos}
        onToggleSoloNoVistos={() => setSoloNoVistos((prev) => !prev)}
      />

      {/* Barra de Filtros */}
      <PropietarioIncidentesFiltros
        sedes={sedes}
        sedeSeleccionada={sedeSeleccionada}
        onSelectSede={(id) => {
          setSedeSeleccionada(id);
          setPaginaActual(1);
        }}
        gravedad={gravedad}
        onChangeGravedad={(g) => {
          setGravedad(g);
          setPaginaActual(1);
        }}
        categoria={categoria}
        onChangeCategoria={(c) => {
          setCategoria(c);
          setPaginaActual(1);
        }}
        estado={estado}
        onChangeEstado={(e) => {
          setEstado(e);
          setPaginaActual(1);
        }}
        soloNoVistos={soloNoVistos}
        onToggleSoloNoVistos={(val) => {
          setSoloNoVistos(val);
          setPaginaActual(1);
        }}
        totalNoVistos={kpis.no_revisados}
        busqueda={busqueda}
        onChangeBusqueda={(txt) => {
          setBusqueda(txt);
          setPaginaActual(1);
        }}
        onLimpiarFiltros={handleLimpiarFiltros}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      {/* Vista de Contenido: Tabla o Estado Vacío Positivo (Vista 3) */}
      {!cargando && incidentes.length === 0 ? (
        <PropietarioIncidentesVacioState
          soloNoVistos={soloNoVistos}
          sedes={sedes}
          resueltosPorSede={kpis.resueltos_por_sede}
          onVerTodos={() => {
            setSoloNoVistos(false);
            setPaginaActual(1);
          }}
          onLimpiarFiltros={handleLimpiarFiltros}
          hayFiltrosActivos={hayFiltrosActivos}
        />
      ) : (
        <PropietarioIncidentesTabla
          incidentes={incidentes}
          cargando={cargando}
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          limite={limite}
          onCambiarPagina={setPaginaActual}
          onInspeccionar={handleInspeccionar}
        />
      )}

      {/* Banco de Pruebas QA para Evaluación Concurrentemente en Vivo */}
      <DemoPropietarioIncidentesWidget
        onSimularSseMiraflores={() => {
          propietarioIncidentesService.simularLlegadaIncidenteCritico(
            '00000000-0000-4000-8000-000000000010'
          );
          mostrarToast('Incidente crítico emitido desde Sede Miraflores vía canal SSE', 'exito');
        }}
        onSimularSseSanIsidro={() => {
          propietarioIncidentesService.simularLlegadaIncidenteCritico(
            '00000000-0000-4000-8000-000000000020'
          );
          mostrarToast('Incidente crítico emitido desde Sede San Isidro vía canal SSE', 'exito');
        }}
        onRestablecer={() => {
          propietarioIncidentesService.restablecerSemillas();
          handleLimpiarFiltros();
          cargarIncidentes();
          mostrarToast('Semillas de incidentes restablecidas con éxito', 'exito');
        }}
      />

      {/* Modal de Detalle, Evidencia y Directiva Ejecutiva */}
      <ModalDetalleIncidentePropietario
        incidente={incidenteSeleccionado}
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardarDirectiva={handleGuardarDirectiva}
        guardandoDirectiva={guardandoDirectiva}
      />
    </div>
  );
};
export default PropietarioIncidentesPage;
