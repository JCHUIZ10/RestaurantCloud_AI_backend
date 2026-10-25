import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  IncidenteItemDTO,
  IncidentesKPIsDTO,
  IncidenteDetalleDTO,
  FiltrosIncidentesRequest,
  RegistrarIncidenteRequest,
  InvestigacionIncidenteRequest,
  ResolverIncidenteRequest,
  EmpleadoDetalleDTO,
} from '@/types/admin';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';
import { IncidentesHeader } from '../components/incidentes/IncidentesHeader';
import { IncidentesFiltros } from '../components/incidentes/IncidentesFiltros';
import { IncidentesTabla } from '../components/incidentes/IncidentesTabla';
import { ModalRegistrarIncidente } from '../components/incidentes/ModalRegistrarIncidente';
import { ModalDetalleResolucion } from '../components/incidentes/ModalDetalleResolucion';
import { IncidentesVacioState } from '../components/incidentes/IncidentesVacioState';
import { DemoAdminIncidentesWidget } from '../components/incidentes/DemoAdminIncidentesWidget';
import { SoloDemo } from '@/components/ui/SoloDemo';

export const AdminIncidentesPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [incidentes, setIncidentes] = useState<IncidenteItemDTO[]>([]);
  const [kpis, setKpis] = useState<IncidentesKPIsDTO>({
    abiertos: 0,
    en_revision: 0,
    gravedad_alta: 0,
    resueltos_mes: 0,
    con_nota_propietario: 0,
  });
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(10);

  // Lista de empleados de la sede para el selector
  const [empleados, setEmpleados] = useState<EmpleadoDetalleDTO[]>([]);

  // Filtros aplicados
  const [filtros, setFiltros] = useState<FiltrosIncidentesRequest>({
    estado: 'todos',
    gravedad: 'todas',
    categoria: 'todas',
    busqueda: '',
    pagina: 1,
    limite: 10,
  });

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [incidenteDetalle, setIncidenteDetalle] = useState<IncidenteDetalleDTO | null>(null);

  // Toast feedback
  const [toastMensaje, setToastMensaje] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const mostrarToast = useCallback((texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
    setToastMensaje({ tipo, texto });
    setTimeout(() => {
      setToastMensaje(null);
    }, 4500);
  }, []);

  // Carga de incidentes con filtros
  const cargarIncidentes = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await mockAdminService.getIncidentes({
        ...filtros,
        pagina,
        limite,
      });

      if (resp.exito) {
        setIncidentes(resp.datos.incidentes);
        setKpis(resp.datos.kpis);
        setTotal(resp.datos.total);
      } else {
        mostrarToast('Error al cargar historial de incidentes', 'error');
      }
    } catch (err) {
      mostrarToast('Error de comunicación con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina, limite, mostrarToast]);

  // Cargar lista de empleados de la sede
  const cargarEmpleados = useCallback(async () => {
    try {
      const resp = await mockAdminService.getPersonal();
      if (resp.exito) {
        setEmpleados(resp.datos.empleados.filter((e) => e.estado === 'activo'));
      }
    } catch (err) {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    cargarEmpleados();
  }, [cargarEmpleados]);

  useEffect(() => {
    cargarIncidentes();
  }, [cargarIncidentes]);

  // Manejo de filtros
  const handleCambiarFiltro = <K extends keyof FiltrosIncidentesRequest>(
    campo: K,
    valor: FiltrosIncidentesRequest[K]
  ) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
    setPagina(1);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      estado: 'todos',
      gravedad: 'todas',
      categoria: 'todas',
      busqueda: '',
      empleado_id: undefined,
      pagina: 1,
      limite: 10,
    });
    setPagina(1);
  };

  // Abrir detalle
  const handleVerDetalle = async (id: string) => {
    try {
      const resp = await mockAdminService.getIncidenteDetalle(id);
      if (resp.exito) {
        setIncidenteDetalle(resp.datos);
        setModalDetalleAbierto(true);
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'No se pudo abrir el expediente', 'error');
      }
    } catch (err) {
      mostrarToast('Error de conexión', 'error');
    }
  };

  // Guardar nuevo incidente
  const handleRegistrarIncidente = async (req: RegistrarIncidenteRequest): Promise<boolean> => {
    try {
      const resp = await mockAdminService.registrarIncidente(req);
      if (resp.exito) {
        mostrarToast(
          `Incidente ${resp.datos.codigo} registrado correctamente${
            req.gravedad === 'alta' ? ' (Notificado al Propietario)' : ''
          }`,
          'exito'
        );
        cargarIncidentes();
        return true;
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'Error al registrar incidente', 'error');
        return false;
      }
    } catch (err) {
      mostrarToast('Error al registrar incidente', 'error');
      return false;
    }
  };

  // Actualizar investigación / registrar avance
  const handleGuardarInvestigacion = async (
    id: string,
    req: InvestigacionIncidenteRequest
  ): Promise<boolean> => {
    try {
      const resp = await mockAdminService.actualizarInvestigacionIncidente(id, req);
      if (resp.exito) {
        mostrarToast(`Avance registrado en bitácora del expediente ${resp.datos.codigo}`, 'exito');
        setIncidenteDetalle(resp.datos);
        cargarIncidentes();
        return true;
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'Error al actualizar', 'error');
        return false;
      }
    } catch (err) {
      mostrarToast('Error de servidor al actualizar', 'error');
      return false;
    }
  };

  // Resolver definitivamente
  const handleResolverDefinitivo = async (
    id: string,
    req: ResolverIncidenteRequest
  ): Promise<boolean> => {
    try {
      const resp = await mockAdminService.resolverIncidente(id, req);
      if (resp.exito) {
        mostrarToast(
          `Incidente ${resp.datos.codigo} resuelto definitivamente y sellado en auditoría`,
          'exito'
        );
        cargarIncidentes();
        return true;
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'Error al resolver', 'error');
        return false;
      }
    } catch (err) {
      mostrarToast('Error de servidor al resolver', 'error');
      return false;
    }
  };

  const hayFiltrosActivos = Boolean(
    (filtros.estado && filtros.estado !== 'todos') ||
      (filtros.gravedad && filtros.gravedad !== 'todas') ||
      (filtros.categoria && filtros.categoria !== 'todas') ||
      filtros.empleado_id ||
      (filtros.busqueda && filtros.busqueda.trim() !== '')
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Flotante */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300 ${
            toastMensaje.tipo === 'exito'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-600'
              : toastMensaje.tipo === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-700'
              : 'bg-stone-900 text-stone-100 border-stone-700'
          }`}
        >
          {toastMensaje.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMensaje.tipo === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMensaje.tipo === 'info' && <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toastMensaje.texto}</span>
        </div>
      )}

      {/* Cabecera Principal y KPIs */}
      <IncidentesHeader
        kpis={kpis}
        onNuevoIncidente={() => setModalRegistroAbierto(true)}
      />

      {/* Barra de Filtros */}
      <IncidentesFiltros
        filtros={filtros}
        onCambiarFiltro={handleCambiarFiltro}
        onLimpiarFiltros={handleLimpiarFiltros}
        empleados={empleados}
      />

      {/* Contenido: Tabla o Estado Vacío */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-aurea-navy border-t-aurea-copper rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">
            Cargando historial de incidentes de Sede Miraflores...
          </span>
        </div>
      ) : incidentes.length === 0 ? (
        <IncidentesVacioState
          onNuevoIncidente={() => setModalRegistroAbierto(true)}
          esFiltrado={hayFiltrosActivos}
          onLimpiarFiltros={handleLimpiarFiltros}
        />
      ) : (
        <IncidentesTabla
          incidentes={incidentes}
          total={total}
          pagina={pagina}
          limite={limite}
          onCambiarPagina={setPagina}
          onVerDetalle={handleVerDetalle}
        />
      )}

      {/* Modal de Registro de Nuevo Incidente */}
      <ModalRegistrarIncidente
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onGuardar={handleRegistrarIncidente}
        empleados={empleados}
      />

      {/* Modal de Detalle y Resolución Inmutable */}
      <ModalDetalleResolucion
        isOpen={modalDetalleAbierto}
        onClose={() => {
          setModalDetalleAbierto(false);
          setIncidenteDetalle(null);
        }}
        incidente={incidenteDetalle}
        onGuardarInvestigacion={handleGuardarInvestigacion}
        onResolverDefinitivo={handleResolverDefinitivo}
      />

      {/* QA Test Bench Flotante */}
      <SoloDemo>
        <DemoAdminIncidentesWidget onRecargar={cargarIncidentes} />
      </SoloDemo>
    </div>
  );
};
