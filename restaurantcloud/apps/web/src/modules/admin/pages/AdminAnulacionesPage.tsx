import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  PedidoAnulacionItemDTO,
  AnulacionesKPIsDTO,
  FiltroRapidoAnulaciones,
} from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { EstadoError, useToast } from '@/components/ui';
import { AnulacionesHeader } from '../components/anulaciones/AnulacionesHeader';
import { AnulacionesFiltros } from '../components/anulaciones/AnulacionesFiltros';
import { AnulacionesTabla } from '../components/anulaciones/AnulacionesTabla';
import { ModalDetalleAnulacion } from '../components/anulaciones/ModalDetalleAnulacion';
import { ModalExportarAnulaciones } from '../components/anulaciones/ModalExportarAnulaciones';
import { AnulacionesVacioState } from '../components/anulaciones/AnulacionesVacioState';

const DEBOUNCE_BUSQUEDA_MS = 350;
const CODIGO_YA_REVISADA = 'ERR_ANULACION_YA_REVISADA';

const getFechaLocalHoy = (): string => {
  const d = new Date();
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/** Extrae el código de error de la API tanto de una respuesta fallida como de una excepción de axios. */
const obtenerCodigoError = (fuente: any): string | undefined =>
  fuente?.errores?.[0]?.codigo ?? fuente?.response?.data?.errores?.[0]?.codigo;

export const AdminAnulacionesPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [fecha, setFecha] = useState(getFechaLocalHoy);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapidoAnulaciones>('todas');
  const [mozoId, setMozoId] = useState('todos');
  // `busqueda` es lo que se escribe; `busquedaAplicada` es lo que se envía al servidor (con debounce)
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');

  const [anulaciones, setAnulaciones] = useState<PedidoAnulacionItemDTO[]>([]);
  // null = sin datos confiables (todavía no cargó o la última carga falló)
  const [kpis, setKpis] = useState<AnulacionesKPIsDTO | null>(null);

  // Lista de personal con rol mozo traída directamente del backend
  const [mozosPersonal, setMozosPersonal] = useState<{ id: string; nombre: string }[]>([]);

  // Modal de Detalle / Auditoría
  const [anulacionSeleccionada, setAnulacionSeleccionada] = useState<PedidoAnulacionItemDTO | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  // Modal de exportación a Excel
  const [modalExportarAbierto, setModalExportarAbierto] = useState(false);

  // Anulaciones cuya revisión está en curso (evita el doble envío)
  const [idsRevisando, setIdsRevisando] = useState<Set<string>>(new Set());
  const idsRevisandoRef = useRef<Set<string>>(new Set());

  // Identifica la petición vigente para descartar respuestas tardías de peticiones anteriores
  const peticionRef = useRef(0);

  // Evita repetir el aviso de error cada 45 s mientras el servidor sigue sin responder
  const actualizacionFallandoRef = useRef(false);

  // Mozo elegido en el selector: se recuerda su nombre aunque deje de figurar en las anulaciones del día
  const [mozoElegido, setMozoElegido] = useState<{ id: string; nombre: string } | null>(null);

  // Toast global compartido (gestiona su propio temporizador y apilado)
  const { mostrar } = useToast();

  const mostrarToast = useCallback(
    (texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') =>
      mostrar(texto, tipo === 'exito' ? 'ok' : tipo),
    [mostrar]
  );

  // Debounce del buscador: solo se consulta al servidor cuando el usuario deja de escribir
  useEffect(() => {
    if (busqueda === busquedaAplicada) return;
    const timerId = setTimeout(() => setBusquedaAplicada(busqueda), DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(timerId);
  }, [busqueda, busquedaAplicada]);

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

  const avisarFalloActualizacion = useCallback((texto: string) => {
    if (actualizacionFallandoRef.current) return;
    actualizacionFallandoRef.current = true;
    mostrarToast(texto, 'error');
  }, [mostrarToast]);

  // Cargar datos desde el servicio backend
  const cargarDatos = useCallback(async (silencioso = false) => {
    const idPeticion = ++peticionRef.current;
    if (!silencioso) {
      setCargando(true);
      setErrorCarga(null);
    }

    try {
      const resp = await adminService.getBandejaAnulaciones({
        fecha,
        filtro_rapido: filtroRapido,
        mozo_id: mozoId,
        busqueda: busquedaAplicada,
      });

      // Llegó una petición más nueva: esta respuesta ya no representa los filtros actuales
      if (idPeticion !== peticionRef.current) return;

      if (resp.exito) {
        setAnulaciones(resp.datos.anulaciones);
        setKpis(resp.datos.kpis);
        setErrorCarga(null);
        if (actualizacionFallandoRef.current) {
          actualizacionFallandoRef.current = false;
          mostrarToast('Conexión restablecida: bandeja actualizada.', 'exito');
        }
      } else if (silencioso) {
        avisarFalloActualizacion('Error al actualizar la bandeja de anulaciones');
      } else {
        setAnulaciones([]);
        setKpis(null);
        setErrorCarga(resp.errores?.[0]?.mensaje || 'El servidor no pudo devolver la bandeja de anulaciones.');
      }
    } catch {
      if (idPeticion !== peticionRef.current) return;

      if (silencioso) {
        avisarFalloActualizacion('Error de comunicación con el servidor');
      } else {
        // Nunca se deben dejar visibles datos de otra fecha o filtro cuando la carga falla
        setAnulaciones([]);
        setKpis(null);
        setErrorCarga('No pudimos comunicarnos con el servidor. Verifica tu conexión e inténtalo de nuevo.');
      }
    } finally {
      if (idPeticion === peticionRef.current) {
        setCargando(false);
      }
    }
  }, [fecha, filtroRapido, mozoId, busquedaAplicada, mostrarToast, avisarFalloActualizacion]);

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

  const marcarRevisando = (id: string, revisando: boolean) => {
    const siguiente = new Set(idsRevisandoRef.current);
    if (revisando) {
      siguiente.add(id);
    } else {
      siguiente.delete(id);
    }
    idsRevisandoRef.current = siguiente;
    setIdsRevisando(siguiente);
  };

  // Otro usuario (u otra pestaña) ya revisó la anulación: se sincroniza la vista con el estado real
  const sincronizarAnulacionYaRevisada = async (id: string) => {
    mostrarToast('Esta anulación ya había sido revisada por otro usuario.', 'info');
    await cargarDatos(true);
    if (anulacionSeleccionada?.id === id) {
      try {
        const detalle = await adminService.getAnulacionDetalle(id);
        if (detalle.exito) {
          setAnulacionSeleccionada(detalle.datos);
        }
      } catch {
        // La bandeja ya se refrescó; el detalle se actualizará al reabrir la ficha
      }
    }
  };

  // Acción rápida: Marcar como Revisado
  const handleMarcarRevisado = async (id: string, notas?: string): Promise<boolean> => {
    // Ya hay una revisión en curso para esta anulación (doble clic)
    if (idsRevisandoRef.current.has(id)) return false;
    marcarRevisando(id, true);

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
      }

      if (obtenerCodigoError(resp) === CODIGO_YA_REVISADA) {
        await sincronizarAnulacionYaRevisada(id);
      } else {
        mostrarToast('No se pudo registrar la revisión.', 'error');
      }
      return false;
    } catch (err) {
      if (obtenerCodigoError(err) === CODIGO_YA_REVISADA) {
        await sincronizarAnulacionYaRevisada(id);
      } else {
        mostrarToast('Error al procesar la revisión.', 'error');
      }
      return false;
    } finally {
      marcarRevisando(id, false);
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
    // El mozo filtrado debe seguir en el selector aunque no tenga anulaciones en la fecha actual
    if (mozoId !== 'todos' && mozoElegido?.id === mozoId && !map.has(mozoId)) {
      map.set(mozoElegido.id, mozoElegido.nombre);
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [mozosPersonal, anulaciones, mozoId, mozoElegido]);

  const handleCambiarMozo = (id: string) => {
    setMozoId(id);
    const elegido = mozosDisponibles.find((m) => m.id === id);
    setMozoElegido(elegido ?? null);
  };

  const esFiltroActivo = filtroRapido !== 'todas' || mozoId !== 'todos' || busquedaAplicada.trim().length > 0;

  const totalAnulaciones = kpis?.total_anulaciones ?? 0;
  const conMerma = kpis?.con_merma_cantidad ?? 0;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Encabezado con selector de fecha, botón de actualización y Tarjetas KPI */}
      <AnulacionesHeader
        fecha={fecha}
        onCambiarFecha={setFecha}
        kpis={kpis}
        onRecargar={() => cargarDatos(false)}
        onExportar={() => setModalExportarAbierto(true)}
        cargando={cargando}
      />

      {/* Filtros rápidos en píldora, selector de mozo real y buscador */}
      <AnulacionesFiltros
        filtroRapido={filtroRapido}
        onChangeFiltroRapido={setFiltroRapido}
        mozoId={mozoId}
        onChangeMozoId={handleCambiarMozo}
        mozos={mozosDisponibles}
        busqueda={busqueda}
        onChangeBusqueda={setBusqueda}
        conteoFiltros={{
          todas: totalAnulaciones,
          pendientes: kpis?.pendientes_revision ?? 0,
          con_merma: conMerma,
          sin_merma: totalAnulaciones - conMerma,
          comandas_totales: kpis?.comandas_totales ?? 0,
        }}
      />

      {/* Contenido principal: Error, Estado Vacío o Tabla */}
      {errorCarga && !cargando ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <EstadoError
            titulo="No se pudo cargar la bandeja de anulaciones"
            mensaje={errorCarga}
            onReintentar={() => cargarDatos(false)}
          />
        </div>
      ) : anulaciones.length === 0 && !cargando ? (
        <AnulacionesVacioState
          fecha={fecha}
          esFiltroActivo={esFiltroActivo}
          onLimpiarFiltros={() => {
            setFiltroRapido('todas');
            setMozoId('todos');
            setMozoElegido(null);
            setBusqueda('');
            setBusquedaAplicada('');
          }}
          onVolverAHoy={() => setFecha(getFechaLocalHoy())}
        />
      ) : (
        <AnulacionesTabla
          anulaciones={anulaciones}
          cargando={cargando}
          idsRevisando={idsRevisando}
          onVerFicha={handleVerFicha}
          onMarcarRevisado={(id) => handleMarcarRevisado(id)}
        />
      )}

      {/* Exportación a Excel: parte de la fecha que se está viendo */}
      <ModalExportarAnulaciones
        abierto={modalExportarAbierto}
        fechaVista={fecha}
        onCerrar={() => setModalExportarAbierto(false)}
        onExportado={(nombreArchivo) => mostrarToast(`Excel descargado: ${nombreArchivo}`, 'exito')}
      />

      {/* Modal 680px: Ficha de Inspección y Auditoría */}
      <ModalDetalleAnulacion
        isOpen={modalDetalleAbierto}
        onClose={() => setModalDetalleAbierto(false)}
        anulacion={anulacionSeleccionada}
        onMarcarRevisado={handleMarcarRevisado}
      />
    </div>
  );
};

export default AdminAnulacionesPage;
