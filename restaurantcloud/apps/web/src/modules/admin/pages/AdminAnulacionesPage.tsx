import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  PedidoAnulacionItemDTO,
  AnulacionesKPIsDTO,
  FiltroRapidoAnulaciones,
  EscalarIncidenteAnulacionRequest,
} from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { AnulacionesHeader } from '../components/anulaciones/AnulacionesHeader';
import { AnulacionesFiltros } from '../components/anulaciones/AnulacionesFiltros';
import { AnulacionesTabla } from '../components/anulaciones/AnulacionesTabla';
import { ModalDetalleAnulacion } from '../components/anulaciones/ModalDetalleAnulacion';
import { ModalEscalarIncidente } from '../components/anulaciones/ModalEscalarIncidente';
import { AnulacionesVacioState } from '../components/anulaciones/AnulacionesVacioState';

const getFechaLocalHoy = (): string => {
  const d = new Date();
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const AdminAnulacionesPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [fecha, setFecha] = useState(getFechaLocalHoy);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapidoAnulaciones>('todas');
  const [mozoId, setMozoId] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const [anulaciones, setAnulaciones] = useState<PedidoAnulacionItemDTO[]>([]);
  const [kpis, setKpis] = useState<AnulacionesKPIsDTO>({
    total_anulaciones: 0,
    monto_total: 0,
    con_merma_cantidad: 0,
    costo_merma_total: 0,
    mesas_afectadas: 0,
    pendientes_revision: 0,
  });

  // Lista de personal con rol mozo traída directamente del backend
  const [mozosPersonal, setMozosPersonal] = useState<{ id: string; nombre: string }[]>([]);

  // Modal de Detalle / Auditoría
  const [anulacionSeleccionada, setAnulacionSeleccionada] = useState<PedidoAnulacionItemDTO | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  // Modal de Escalamiento a Incidente (CU-ADMIN-11)
  const [anulacionParaEscalar, setAnulacionParaEscalar] = useState<PedidoAnulacionItemDTO | null>(null);
  const [modalEscalarAbierto, setModalEscalarAbierto] = useState(false);

  // Toast de feedback administrativo
  const [toastFeedback, setToastFeedback] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const mostrarToast = useCallback((texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
    setToastFeedback({ tipo, texto });
    setTimeout(() => {
      setToastFeedback(null);
    }, 4500);
  }, []);

  // Cargar lista de mozos reales de la sede
  useEffect(() => {
    let activo = true;
    adminService.getPersonal({ rol: 'mozo', limite: 50 })
      .then((resp: any) => {
        if (activo && resp.exito && resp.datos?.empleados) {
          setMozosPersonal(
            resp.datos.empleados.map((emp: any) => ({
              id: emp.id,
              nombre: emp.nombre || emp.usuario_nombre || 'Mozo',
            }))
          );
        }
      })
      .catch((err: any) => {
        console.error('Error al cargar lista de mozos:', err);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Cargar datos desde el servicio backend
  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setCargando(true);
    }
    try {
      const resp = await adminService.getBandejaAnulaciones({
        fecha,
        filtro_rapido: filtroRapido,
        mozo_id: mozoId,
        busqueda,
      });

      if (resp.exito) {
        setAnulaciones(resp.datos.anulaciones);
        setKpis(resp.datos.kpis);
      } else {
        mostrarToast('Error al cargar bandeja de anulaciones', 'error');
      }
    } catch {
      mostrarToast('Error de comunicación con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  }, [fecha, filtroRapido, mozoId, busqueda, mostrarToast]);

  useEffect(() => {
    cargarDatos(false);
  }, [cargarDatos]);

  // Polling automático ligero cada 45s (solo si la pestaña está activa)
  useEffect(() => {
    const INTERVALO_POLLING_MS = 45000;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarDatos(true);
      }
    }, INTERVALO_POLLING_MS);

    return () => clearInterval(intervalId);
  }, [cargarDatos]);

  // Manejador para abrir modal de detalle
  const handleVerFicha = async (id: string) => {
    try {
      const resp = await adminService.getAnulacionDetalle(id);
      if (resp.exito) {
        setAnulacionSeleccionada(resp.datos);
        setModalDetalleAbierto(true);
      } else {
        mostrarToast('No se encontró la anulación solicitada', 'error');
      }
    } catch {
      mostrarToast('Error al obtener detalle de la anulación', 'error');
    }
  };

  // Acción rápida: Marcar como Revisado
  const handleMarcarRevisado = async (id: string, notas?: string): Promise<boolean> => {
    try {
      const resp = await adminService.marcarAnulacionRevisada(id, {
        notas_supervision: notas,
      });

      if (resp.exito) {
        mostrarToast('Anulación marcada como revisada por la administración.', 'exito');
        await cargarDatos(true);
        if (anulacionSeleccionada && anulacionSeleccionada.id === id) {
          setAnulacionSeleccionada(resp.datos);
        }
        return true;
      } else {
        mostrarToast('No se pudo registrar la revisión.', 'error');
        return false;
      }
    } catch {
      mostrarToast('Error al procesar la revisión.', 'error');
      return false;
    }
  };

  // Abrir modal de escalamiento a incidente
  const handleAbrirEscalar = (anulacion: PedidoAnulacionItemDTO) => {
    setModalDetalleAbierto(false);
    setAnulacionParaEscalar(anulacion);
    setModalEscalarAbierto(true);
  };

  // Confirmar escalamiento
  const handleConfirmarEscalar = async (
    anulacionId: string,
    req: EscalarIncidenteAnulacionRequest
  ): Promise<boolean> => {
    try {
      const resp = await adminService.escalarAnulacionAIncidente(anulacionId, req);
      if (resp.exito) {
        mostrarToast(
          `Expediente ${resp.datos.incidente.codigo} generado exitosamente y vinculado con la anulación.`,
          'exito'
        );
        await cargarDatos(true);
        return true;
      } else {
        mostrarToast('No se pudo generar el expediente de incidente.', 'error');
        return false;
      }
    } catch {
      mostrarToast('Error al escalar la anulación.', 'error');
      return false;
    }
  };

  // Mozos disponibles: Unión de personal registrado con rol mozo + mozos que figuran en anulaciones
  const mozosDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    mozosPersonal.forEach((m) => {
      if (m.id && m.nombre) {
        map.set(m.id, m.nombre);
      }
    });
    anulaciones.forEach((a) => {
      if (a.mozo_id && a.mozo_nombre) {
        map.set(a.mozo_id, a.mozo_nombre);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [mozosPersonal, anulaciones]);

  const esFiltroActivo = filtroRapido !== 'todas' || mozoId !== 'todos' || busqueda.trim().length > 0;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast de Feedback */}
      {toastFeedback && (
        <aside
          aria-label="Notificación del sistema"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold transition-all border animate-in slide-in-from-top-4 ${
            toastFeedback.tipo === 'exito'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : toastFeedback.tipo === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
              : 'bg-slate-800 text-white border-slate-700 shadow-slate-900/30'
          }`}
        >
          {toastFeedback.tipo === 'exito' && <CheckCircle2 className="w-5 h-5" />}
          {toastFeedback.tipo === 'error' && <AlertCircle className="w-5 h-5" />}
          {toastFeedback.tipo === 'info' && <AlertTriangle className="w-5 h-5" />}
          <span>{toastFeedback.texto}</span>
        </aside>
      )}

      {/* Encabezado con selector de fecha, botón de actualización y Tarjetas KPI */}
      <AnulacionesHeader
        fecha={fecha}
        onCambiarFecha={setFecha}
        kpis={kpis}
        onRecargar={() => cargarDatos(false)}
        cargando={cargando}
      />

      {/* Filtros rápidos en píldora, selector de mozo real y buscador */}
      <AnulacionesFiltros
        filtroRapido={filtroRapido}
        onChangeFiltroRapido={setFiltroRapido}
        mozoId={mozoId}
        onChangeMozoId={setMozoId}
        mozos={mozosDisponibles}
        busqueda={busqueda}
        onChangeBusqueda={setBusqueda}
        conteoFiltros={{
          todas: kpis.total_anulaciones,
          pendientes: kpis.pendientes_revision,
          con_merma: kpis.con_merma_cantidad,
          sin_merma: kpis.total_anulaciones - kpis.con_merma_cantidad,
          comandas_totales: anulaciones.filter((a) => a.tipo_anulacion === 'comanda_completa').length,
        }}
      />

      {/* Contenido principal: Tabla o Estado Vacío */}
      {anulaciones.length === 0 && !cargando ? (
        <AnulacionesVacioState
          fecha={fecha}
          esFiltroActivo={esFiltroActivo}
          onLimpiarFiltros={() => {
            setFiltroRapido('todas');
            setMozoId('todos');
            setBusqueda('');
          }}
          onVolverAHoy={() => setFecha(getFechaLocalHoy())}
        />
      ) : (
        <AnulacionesTabla
          anulaciones={anulaciones}
          cargando={cargando}
          onVerFicha={handleVerFicha}
          onMarcarRevisado={(id) => handleMarcarRevisado(id)}
        />
      )}

      {/* Modal 680px: Ficha de Inspección y Auditoría */}
      <ModalDetalleAnulacion
        isOpen={modalDetalleAbierto}
        onClose={() => setModalDetalleAbierto(false)}
        anulacion={anulacionSeleccionada}
        onMarcarRevisado={handleMarcarRevisado}
        onEscalarIncidente={handleAbrirEscalar}
      />

      {/* Modal 540px: Escalamiento Asistido a Incidente (CU-ADMIN-11) */}
      <ModalEscalarIncidente
        isOpen={modalEscalarAbierto}
        onClose={() => setModalEscalarAbierto(false)}
        anulacion={anulacionParaEscalar}
        onEscalar={handleConfirmarEscalar}
      />
    </div>
  );
};

export default AdminAnulacionesPage;
