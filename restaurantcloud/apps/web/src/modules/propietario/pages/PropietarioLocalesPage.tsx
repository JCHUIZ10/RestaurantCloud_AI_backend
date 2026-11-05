import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LocalItemDTO,
  CuotaPlanLocalesDTO,
} from '@/types/propietarioLocales';
import { propietarioLocalesService } from '../services/propietarioLocalesService';
import { LocalesHeader } from '../components/locales/LocalesHeader';
import { LocalesTabla } from '../components/locales/LocalesTabla';
import { LocalesFiltrosBar, TabEstadoLocal } from '../components/locales/LocalesFiltrosBar';
import { ModalCrearLocal } from '../components/locales/ModalCrearLocal';
import { ModalEditarLocal } from '../components/locales/ModalEditarLocal';
import { ModalDesactivarLocal } from '../components/locales/ModalDesactivarLocal';
import { useAuthStore } from '@/stores/authStore';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HOME_POR_ROL } from '@/router/accesoPorRol';

export const PropietarioLocalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, setUsuario } = useAuthStore();

  const [locales, setLocales] = useState<LocalItemDTO[]>([]);
  const [cuotaPlan, setCuotaPlan] = useState<CuotaPlanLocalesDTO | null>(null);
  const [cargando, setCargando] = useState(true);

  // Filtro de estado por pestaña (por defecto: activos)
  const [tabActivo, setTabActivo] = useState<TabEstadoLocal>('activos');

  // Conteos en tiempo real para las pestañas
  const conteos = useMemo(() => ({
    activos: locales.filter((l) => l.estado === 'activo').length,
    desactivados: locales.filter((l) => l.estado === 'inactivo').length,
    todos: locales.length,
  }), [locales]);

  // Lista de sedes filtrada según la pestaña activa
  const localesFiltrados = useMemo(() => {
    if (tabActivo === 'activos') return locales.filter((l) => l.estado === 'activo');
    if (tabActivo === 'desactivados') return locales.filter((l) => l.estado === 'inactivo');
    return locales;
  }, [locales, tabActivo]);

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [localAEditar, setLocalAEditar] = useState<LocalItemDTO | null>(null);
  const [localADesactivar, setLocalADesactivar] = useState<LocalItemDTO | null>(null);

  // Notificaciones Toast
  const [toast, setToast] = useState<{
    tipo: 'success' | 'error';
    mensaje: string;
  } | null>(null);

  const mostrarToast = useCallback((tipo: 'success' | 'error', mensaje: string) => {
    setToast({ tipo, mensaje });
  }, []);

  // Ocultar toast tras 4 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cargar directorio
  const cargarDirectorio = useCallback(async () => {
    setCargando(true);
    try {
      const res = await propietarioLocalesService.getDirectorioLocales();
      if (res.exito && res.datos) {
        setLocales(res.datos.locales);
        setCuotaPlan(res.datos.cuota_plan);
      } else {
        mostrarToast('error', 'No se pudo cargar el directorio de locales.');
      }
    } catch {
      mostrarToast('error', 'Error de red al consultar tus locales.');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    cargarDirectorio();
  }, [cargarDirectorio]);

  // Handler para la funcionalidad crítica de UX: Acceder a Sede Autogestionada
  const handleAccederSede = (local: LocalItemDTO) => {
    // 1. Actualizar contexto de sesión activa
    if (usuario) {
      setUsuario({
        ...usuario,
        local: {
          id: local.id,
          nombre: local.nombre,
        },
      });
    }

    // 2. Persistir local activo en almacenamiento local para terminales
    localStorage.setItem('active_local_id', local.id);
    localStorage.setItem('active_local_nombre', local.nombre);

    // 3. Notificar y redirigir
    mostrarToast(
      'success',
      `Cambiando de contexto operativo a sede "${local.nombre}" (Autogestionada)...`
    );

    setTimeout(() => {
      navigate(HOME_POR_ROL.admin_local);
    }, 450);
  };

  // Handler para reactivar local
  const handleReactivar = async (local: LocalItemDTO) => {
    try {
      const res = await propietarioLocalesService.cambiarEstadoLocal(local.id, {
        nuevo_estado: 'activo',
      });
      if (res.exito && res.datos) {
        mostrarToast('success', res.datos.mensaje);
        cargarDirectorio();
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'No se pudo reactivar el local.');
      }
    } catch {
      mostrarToast('error', 'Error al reactivar el local.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notificación */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.tipo === 'success' ? (
            <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-1 rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <span className="text-xs font-semibold text-aurea-navy max-w-sm">
            {toast.mensaje}
          </span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-aurea-navy/40 hover:text-aurea-navy rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Corporativo con Medidor de Cuota Plan Pro */}
      <LocalesHeader
        cuota={cuotaPlan}
        onAbrirCrear={() => setModalCrearAbierto(true)}
      />

      {/* Contenido Principal: Estados de Carga, Vacío y Directorio */}
      {cargando ? (
        <div className="bg-white rounded-3xl border border-aurea-copper/25 p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-aurea-gold" />
          <p className="text-sm font-semibold text-aurea-navy">
            Cargando directorio de sedes y cuotas del plan...
          </p>
        </div>
      ) : locales.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-aurea-copper/30 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-aurea-ivory/80 text-aurea-gold flex items-center justify-center mx-auto border border-aurea-copper/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-serif text-lg font-bold text-aurea-navy">
              No tienes sedes registradas aún
            </h3>
            <p className="text-xs text-aurea-navy/60">
              Registra tu primera sede física para configurar tus ambientes, pisos, mesas y
              habilitar la carta digital interactiva.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setModalCrearAbierto(true)}
            className="bg-aurea-gold hover:bg-aurea-gold/90 text-aurea-navy font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Primera Sede</span>
          </Button>
        </div>
      ) : (
        /* Directorio de Locales: Filtros de Estado y Tabla/Tarjetas */
        <div className="space-y-4">
          <LocalesFiltrosBar
            tabActivo={tabActivo}
            onTabChange={setTabActivo}
            conteos={conteos}
          />

          {localesFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl border border-aurea-copper/25 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-aurea-champagne/20 text-aurea-navy flex items-center justify-center mx-auto border border-aurea-copper/20">
                <Building2 className="w-6 h-6 text-aurea-copper" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-aurea-navy">
                  No hay sedes {tabActivo === 'activos' ? 'activas' : tabActivo === 'desactivados' ? 'desactivadas' : ''}
                </h4>
                <p className="text-xs text-aurea-navy/60 max-w-sm mx-auto">
                  {tabActivo === 'activos'
                    ? 'No cuentas con sedes operativas en este momento. Puedes reactivar alguna sede inactiva o registrar una nueva.'
                    : tabActivo === 'desactivados'
                    ? 'Todas tus sedes se encuentran operativas y activas en este momento.'
                    : 'No se encontraron registros de sedes.'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTabActivo('todos')}
                className="text-xs border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/20"
              >
                Ver todas las sedes ({locales.length})
              </Button>
            </div>
          ) : (
            <LocalesTabla
              locales={localesFiltrados}
              onAccederSede={handleAccederSede}
              onEditar={(local) => setLocalAEditar(local)}
              onDesactivar={(local) => setLocalADesactivar(local)}
              onReactivar={handleReactivar}
            />
          )}
        </div>
      )}

      {/* Modal 1: Crear Sede (2 pasos: datos + plantilla) */}
      <ModalCrearLocal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        cuotaPlan={cuotaPlan}
        onLocalCreado={cargarDirectorio}
        mostrarToast={mostrarToast}
      />

      {/* Modal 2: Editar Sede */}
      <ModalEditarLocal
        isOpen={!!localAEditar}
        local={localAEditar}
        onClose={() => setLocalAEditar(null)}
        onLocalActualizado={cargarDirectorio}
        mostrarToast={mostrarToast}
      />

      {/* Modal 3: Auditoría y Desactivación con Bloqueo Duro */}
      <ModalDesactivarLocal
        isOpen={!!localADesactivar}
        local={localADesactivar}
        onClose={() => setLocalADesactivar(null)}
        onLocalDesactivado={cargarDirectorio}
        mostrarToast={mostrarToast}
      />
    </div>
  );
};
