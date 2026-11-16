import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { saasTenantsService } from '@/services/serviceAdapter';
import { Paginacion } from '@/components/ui/Paginacion';
import { ModalConfirmacion } from '@/components/ui/ModalConfirmacion';
import { KpisSupervisionSaas } from '@/modules/saas/components/tenants/KpisSupervisionSaas';
import { FiltrosTenantsBar } from '@/modules/saas/components/tenants/FiltrosTenantsBar';
import { TenantsTablaDesktop } from '@/modules/saas/components/tenants/TenantsTablaDesktop';
import { TenantCardMobile } from '@/modules/saas/components/tenants/TenantCardMobile';
import { ModalExpedienteTenant } from '@/modules/saas/components/tenants/ModalExpedienteTenant';
import { EstadoVacioTenants } from '@/modules/saas/components/tenants/EstadoVacioTenants';
import type {
  TenantItemDTO,
  TenantDetailResponseDTO,
  MetricasSaaSResumenDTO,
  ParametrosFiltroTenants,
} from '@/types/saasTenants';

/** Límite de la validación del backend (SaasTenantController@suspender: motivo max:100) */
const MOTIVO_SUSPENSION_MAX = 100;

export const SaasTenantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // El acceso por rol (admin_saas) lo garantizan RequireRole en el router y role:admin_saas en la API.

  // Estado de Filtros
  const [filtros, setFiltros] = useState<ParametrosFiltroTenants>({
    tab_estado: 'todos',
    plan_id: 'todos',
    buscar: '',
    pagina: 1,
    por_pagina: 15,
  });

  // Texto del buscador: se aplica a filtros.buscar tras 300 ms sin escribir
  const [textoBusqueda, setTextoBusqueda] = useState('');

  // Estado de Datos
  const [tenants, setTenants] = useState<TenantItemDTO[]>([]);
  const [metricas, setMetricas] = useState<MetricasSaaSResumenDTO | undefined>(undefined);
  const [totalFilas, setTotalFilas] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [errorRed, setErrorRed] = useState<string | null>(null);

  // Solo la respuesta de la petición más reciente actualiza la vista
  const peticionIdRef = useRef(0);

  // Modal Expediente 360° y Toasts
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState<string | null>(null);
  const [expedienteDetalle, setExpedienteDetalle] = useState<TenantDetailResponseDTO | null>(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  // Id del expediente pedido más recientemente: evita respuestas cruzadas y reaperturas por la URL
  const expedienteSolicitadoRef = useRef<string | null>(null);

  // Acciones del expediente (reenviar cobro / suspender) y confirmación de suspensión
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);
  const [empresaASuspender, setEmpresaASuspender] = useState<string | null>(null);
  const [motivoSuspension, setMotivoSuspension] = useState('');

  const [toastMensaje, setToastMensaje] = useState<{ texto: string; tipo: 'exito' | 'alerta' } | null>(
    null
  );

  // Un toast nuevo cancela el temporizador del anterior para que no lo cierre antes de tiempo
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback((texto: string, tipo: 'exito' | 'alerta' = 'exito') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMensaje({ texto, tipo });
    toastTimerRef.current = setTimeout(() => {
      setToastMensaje(null);
      toastTimerRef.current = null;
    }, 4500);
  }, []);

  // Al salir de la página no debe quedar ningún temporizador pendiente
  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  // Carga de Datos desde el Servicio
  const cargarDatos = useCallback(async () => {
    const peticionId = ++peticionIdRef.current;
    const esVigente = () => peticionId === peticionIdRef.current;

    const mostrarError = (mensaje: string) => {
      // No dejar datos de una carga anterior junto al aviso de error
      setTenants([]);
      setMetricas(undefined);
      setTotalFilas(0);
      setTotalPaginas(1);
      setErrorRed(mensaje);
    };

    setCargando(true);
    setErrorRed(null);
    try {
      const res = await saasTenantsService.listarTenants(filtros);
      if (!esVigente()) return;
      if (res.exito) {
        setTenants(res.datos.tenants);
        setMetricas(res.datos.metricas);
        setTotalFilas(res.datos.total_filas ?? res.datos.tenants.length);
        setTotalPaginas(Math.max(1, res.datos.total_paginas ?? 1));
      } else {
        mostrarError(res.errores?.[0]?.mensaje || 'Error al obtener la lista de tenants.');
      }
    } catch (err: any) {
      if (!esVigente()) return;
      mostrarError(
        err?.response?.data?.errores?.[0]?.mensaje ||
          err?.response?.data?.message ||
          err?.message ||
          'Fallo en la comunicación con el servicio SaaS Hub.'
      );
    } finally {
      if (esVigente()) setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Aplica la búsqueda tras 300 ms sin escribir y vuelve a la primera página
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setFiltros((prev) =>
        prev.buscar === textoBusqueda ? prev : { ...prev, buscar: textoBusqueda, pagina: 1 }
      );
    }, 300);
    return () => clearTimeout(temporizador);
  }, [textoBusqueda]);

  // Cualquier cambio de filtro que no sea de página vuelve a la página 1
  const handleFiltrosChange = useCallback((cambios: Partial<ParametrosFiltroTenants>) => {
    setFiltros((prev) => ({ ...prev, ...cambios, pagina: cambios.pagina ?? 1 }));
  }, []);

  const handleCerrarExpediente = useCallback(() => {
    expedienteSolicitadoRef.current = null;
    setEmpresaSeleccionadaId(null);
    setExpedienteDetalle(null);
    setCargandoExpediente(false);
    setSearchParams(
      (prev) => {
        if (!prev.has('expediente')) return prev;
        const siguientes = new URLSearchParams(prev);
        siguientes.delete('expediente');
        return siguientes;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // Manejador de apertura de Expediente 360° (Vista 2)
  const handleVerExpediente = useCallback(
    async (empresaId: string) => {
      expedienteSolicitadoRef.current = empresaId;
      const esVigente = () => expedienteSolicitadoRef.current === empresaId;

      setEmpresaSeleccionadaId(empresaId);
      setExpedienteDetalle(null);
      setCargandoExpediente(true);
      try {
        const res = await saasTenantsService.obtenerExpedienteTenant(empresaId);
        if (!esVigente()) return;
        if (res.exito) {
          setExpedienteDetalle(res.datos);
        } else {
          mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo cargar el expediente de la empresa.', 'alerta');
          handleCerrarExpediente();
        }
      } catch (err: any) {
        if (!esVigente()) return;
        mostrarToast(
          err?.response?.data?.errores?.[0]?.mensaje || 'Error al conectar con la base de datos de auditoría.',
          'alerta'
        );
        handleCerrarExpediente();
      } finally {
        if (esVigente()) setCargandoExpediente(false);
      }
    },
    [mostrarToast, handleCerrarExpediente]
  );

  // Apertura automática si viene el query param ?expediente=EMP-XXXXX o UUID
  const expedienteEnUrl = searchParams.get('expediente');
  useEffect(() => {
    if (expedienteEnUrl && expedienteEnUrl !== expedienteSolicitadoRef.current) {
      handleVerExpediente(expedienteEnUrl);
    }
  }, [expedienteEnUrl, handleVerExpediente]);

  // Acciones operativas dentro del Expediente
  const handleReenviarNotificacion = async (empresaId: string) => {
    if (ejecutandoAccion) return;
    setEjecutandoAccion(true);
    try {
      const res = await saasTenantsService.reenviarNotificacionCobro(empresaId);
      if (res.exito) {
        mostrarToast(`✓ ${res.datos.mensaje}`);
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'Error al despachar el correo de recordatorio.', 'alerta');
      }
    } catch (err: any) {
      mostrarToast(
        err?.response?.data?.errores?.[0]?.mensaje || 'Error al despachar el correo de recordatorio.',
        'alerta'
      );
    } finally {
      setEjecutandoAccion(false);
    }
  };

  // Abre la confirmación; la suspensión real ocurre en handleConfirmarSuspension
  const handleSolicitarSuspension = (empresaId: string) => {
    setMotivoSuspension('');
    setEmpresaASuspender(empresaId);
  };

  const handleCancelarSuspension = () => {
    if (ejecutandoAccion) return;
    setEmpresaASuspender(null);
    setMotivoSuspension('');
  };

  const motivoSuspensionLimpio = motivoSuspension.trim();

  const handleConfirmarSuspension = async () => {
    if (!empresaASuspender || !motivoSuspensionLimpio || ejecutandoAccion) return;
    setEjecutandoAccion(true);
    try {
      const res = await saasTenantsService.suspenderEmpresaPreventiva(empresaASuspender, motivoSuspensionLimpio);
      if (res.exito) {
        setEmpresaASuspender(null);
        setMotivoSuspension('');
        mostrarToast('✓ Empresa suspendida preventivamente. Sesiones revocadas.');
        handleCerrarExpediente();
        cargarDatos();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo suspender la empresa.', 'alerta');
      }
    } catch (err: any) {
      mostrarToast(err?.response?.data?.errores?.[0]?.mensaje || 'No se pudo suspender la empresa.', 'alerta');
    } finally {
      setEjecutandoAccion(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification Flotante */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-24 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMensaje.tipo === 'exito'
              ? 'bg-emerald-900 text-white border-emerald-500/40'
              : 'bg-amber-900 text-white border-amber-500/40'
          }`}
        >
          {toastMensaje.tipo === 'exito' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMensaje.texto}</span>
        </div>
      )}

      {/* Cabecera Principal de la Consola SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-aurea-copper/20">
        <div>
          <div className="flex items-center gap-2 text-xs text-aurea-navy/60 font-medium">
            <span>Consola Global SaaS</span>
            <span>›</span>
            <span>Tenancy & Suscripciones</span>
            <span>›</span>
            <span className="text-aurea-navy font-bold">Supervisión de Empresas</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy mt-1 tracking-tight">
            Supervisión de Empresas y Suscripciones SaaS
          </h1>
          <p className="text-xs sm:text-sm text-aurea-navy/70 mt-1 max-w-3xl">
            Monitoreo en tiempo real del ciclo de vida de clientes gastronómicos, períodos de gracia
            por reintento de cobro en Stripe y altas manuales corporativas B2B con pago verificado.
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-champagne/30 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-aurea-copper ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 4 KPIs Superiores de Plataforma */}
      <KpisSupervisionSaas metricas={metricas} cargando={cargando} />

      {/* Barra de Pestañas y Filtros */}
      <FiltrosTenantsBar
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
        valorBusqueda={textoBusqueda}
        onBusquedaChange={setTextoBusqueda}
        onAbrirModalAlta={() => navigate(ROUTES.SAAS_TENANT_NUEVO)}
        metricas={metricas}
      />

      {/* Estado de Error de Red */}
      {errorRed && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorRed}</span>
          </div>
          <button
            onClick={cargarDatos}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido Principal: Grilla / Cards / Estado Vacío */}
      {!cargando && !errorRed && tenants.length === 0 ? (
        <EstadoVacioTenants
          tabActiva={filtros.tab_estado}
          onVerTodas={() => {
            setTextoBusqueda('');
            handleFiltrosChange({ tab_estado: 'todos', buscar: '' });
          }}
          onRecargar={cargarDatos}
        />
      ) : (
        <>
          {/* Vista Tabla Desktop >= 1024px */}
          <TenantsTablaDesktop tenants={tenants} onVerExpediente={handleVerExpediente} />

          {/* Vista Cards Móvil < 1024px */}
          <TenantCardMobile tenants={tenants} onVerExpediente={handleVerExpediente} />

          {/* Paginación (el backend devuelve total_filas / total_paginas) */}
          {!errorRed && totalFilas > 0 && (
            <Paginacion
              pagina={filtros.pagina ?? 1}
              totalPaginas={totalPaginas}
              totalRegistros={totalFilas}
              limite={filtros.por_pagina ?? 15}
              onCambiarPagina={(pagina) => handleFiltrosChange({ pagina })}
              onCambiarLimite={(por_pagina) => handleFiltrosChange({ por_pagina })}
              unidad="empresas"
              opcionesLimite={[15, 30, 50]}
            />
          )}
        </>
      )}

      {/* Modal Expediente 360° (Vista 2) */}
      {empresaSeleccionadaId && (
        <ModalExpedienteTenant
          expediente={expedienteDetalle}
          cargando={cargandoExpediente}
          // Con la confirmación abierta, Escape solo debe cerrar la confirmación
          onClose={empresaASuspender || ejecutandoAccion ? () => undefined : handleCerrarExpediente}
          onReenviarNotificacion={handleReenviarNotificacion}
          onSuspenderPreventivo={handleSolicitarSuspension}
          cargandoAccion={ejecutandoAccion}
        />
      )}

      {/* Confirmación de suspensión preventiva con motivo obligatorio */}
      <ModalConfirmacion
        abierto={empresaASuspender !== null}
        onCerrar={handleCancelarSuspension}
        onConfirmar={handleConfirmarSuspension}
        titulo="Suspensión preventiva"
        textoConfirmar="Suspender empresa"
        tono="alerta"
        cargando={ejecutandoAccion}
        deshabilitarConfirmar={!motivoSuspensionLimpio}
        mensaje={
          <div className="space-y-3">
            <p>
              Se suspenderá de inmediato el acceso de este restaurante y se revocarán sus sesiones activas.
              Indica el motivo; quedará registrado en la auditoría.
            </p>
            <div>
              <label htmlFor="motivo-suspension" className="block text-xs font-semibold text-aurea-navy mb-1">
                Motivo de la suspensión <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="motivo-suspension"
                value={motivoSuspension}
                onChange={(e) => setMotivoSuspension(e.target.value)}
                maxLength={MOTIVO_SUSPENSION_MAX}
                rows={3}
                disabled={ejecutandoAccion}
                placeholder="Ej.: Riesgo de fraude detectado en el último cobro"
                className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 resize-none disabled:opacity-60"
              />
              <p className="mt-1 text-[11px] text-aurea-navy/50 text-right font-mono">
                {motivoSuspension.length}/{MOTIVO_SUSPENSION_MAX}
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
};
