import React, { useState, useEffect, useCallback } from 'react';
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
import { mockAdminService } from '../services/mockAdminService';
import { AnulacionesHeader } from '../components/anulaciones/AnulacionesHeader';
import { AnulacionesFiltros } from '../components/anulaciones/AnulacionesFiltros';
import { AnulacionesTabla } from '../components/anulaciones/AnulacionesTabla';
import { ModalDetalleAnulacion } from '../components/anulaciones/ModalDetalleAnulacion';
import { ModalEscalarIncidente } from '../components/anulaciones/ModalEscalarIncidente';
import { AnulacionesVacioState } from '../components/anulaciones/AnulacionesVacioState';
import { ToastAlertaAnulacion } from '../components/anulaciones/ToastAlertaAnulacion';
import { DemoAdminAnulacionesWidget } from '../components/anulaciones/DemoAdminAnulacionesWidget';

export const AdminAnulacionesPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [fecha, setFecha] = useState('2026-10-09');
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

  // Modal de Detalle / Auditoría
  const [anulacionSeleccionada, setAnulacionSeleccionada] = useState<PedidoAnulacionItemDTO | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  // Modal de Escalamiento a Incidente (CU-ADMIN-11)
  const [anulacionParaEscalar, setAnulacionParaEscalar] = useState<PedidoAnulacionItemDTO | null>(null);
  const [modalEscalarAbierto, setModalEscalarAbierto] = useState(false);

  // Toast flotante reactivo SSE
  const [alertaSse, setAlertaSse] = useState<PedidoAnulacionItemDTO | null>(null);

  // Toast de feedback administrativo
  const [toastFeedback, setToastFeedback] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const mostrarToast = useCallback((texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
    setToastFeedback({ tipo, texto });
    setTimeout(() => {
      setToastFeedback(null);
    }, 4500);
  }, []);

  // Cargar datos desde el servicio
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await mockAdminService.getBandejaAnulaciones({
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
    } catch (err) {
      mostrarToast('Error de comunicación con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  }, [fecha, filtroRapido, mozoId, busqueda, mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Suscripción reactiva a SSE
  useEffect(() => {
    const desuscribir = mockAdminService.subscribirNotificacionesSse((notif) => {
      if (notif.anulacion_id) {
        mockAdminService.getAnulacionDetalle(notif.anulacion_id).then((res) => {
          if (res.exito && res.datos) {
            setAlertaSse(res.datos);
          }
        });
      }
      cargarDatos();
    });

    return () => desuscribir();
  }, [cargarDatos]);

  // Manejador para abrir modal de detalle
  const handleVerFicha = async (id: string) => {
    try {
      const resp = await mockAdminService.getAnulacionDetalle(id);
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
      const resp = await mockAdminService.marcarAnulacionRevisada(id, {
        notas_supervision: notas,
      });

      if (resp.exito) {
        mostrarToast('Anulación marcada como revisada por la administración.', 'exito');
        await cargarDatos();
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
      const resp = await mockAdminService.escalarAnulacionAIncidente(anulacionId, req);
      if (resp.exito) {
        mostrarToast(
          `Expediente ${resp.datos.incidente.codigo} generado exitosamente y vinculado con la anulación.`,
          'exito'
        );
        await cargarDatos();
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

      {/* Alerta flotante SSE reactiva */}
      <ToastAlertaAnulacion
        alerta={alertaSse}
        onVerFicha={handleVerFicha}
        onCerrar={() => setAlertaSse(null)}
      />

      {/* Encabezado con selector de fecha táctil y 4 Tarjetas KPI */}
      <AnulacionesHeader
        fecha={fecha}
        onCambiarFecha={setFecha}
        kpis={kpis}
      />

      {/* Filtros rápidos en píldora, selector de mozo y buscador reactivo */}
      <AnulacionesFiltros
        filtroRapido={filtroRapido}
        onChangeFiltroRapido={setFiltroRapido}
        mozoId={mozoId}
        onChangeMozoId={setMozoId}
        mozos={[
          { id: 'usr-mozo-01', nombre: 'Carlos Mendoza' },
          { id: 'usr-mozo-02', nombre: 'Ana Paredes' },
        ]}
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
          onVolverAHoy={() => setFecha('2026-10-09')}
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

      {/* QA Test Bench Widget */}
      <DemoAdminAnulacionesWidget onRecargar={cargarDatos} />
    </div>
  );
};
export default AdminAnulacionesPage;
