import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { saasTenantsService, loginWithCredentials } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
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

export const SaasTenantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado de Autenticación y Rol
  const usuario = useAuthStore((s) => s.usuario);
  const autenticado = useAuthStore((s) => s.autenticado);
  const setUsuario = useAuthStore((s) => s.setUsuario);
  const [conectandoSuperAdmin, setConectandoSuperAdmin] = useState(false);

  const esAdminSaas = autenticado && usuario?.rol === 'admin_saas';

  // Estado de Filtros
  const [filtros, setFiltros] = useState<ParametrosFiltroTenants>({
    tab_estado: 'todos',
    plan_id: 'todos',
    buscar: '',
    pagina: 1,
    por_pagina: 15,
  });

  // Estado de Datos
  const [tenants, setTenants] = useState<TenantItemDTO[]>([]);
  const [metricas, setMetricas] = useState<MetricasSaaSResumenDTO | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [errorRed, setErrorRed] = useState<string | null>(null);

  // Modal Expediente 360° y Toasts
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState<string | null>(null);
  const [expedienteDetalle, setExpedienteDetalle] = useState<TenantDetailResponseDTO | null>(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);

  const [toastMensaje, setToastMensaje] = useState<{ texto: string; tipo: 'exito' | 'alerta' } | null>(
    null
  );

  const mostrarToast = (texto: string, tipo: 'exito' | 'alerta' = 'exito') => {
    setToastMensaje({ texto, tipo });
    setTimeout(() => setToastMensaje(null), 4500);
  };

  // Carga de Datos desde el Servicio
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorRed(null);
    try {
      const res = await saasTenantsService.listarTenants(filtros);
      if (res.exito) {
        setTenants(res.datos.tenants);
        setMetricas(res.datos.metricas);
      } else {
        const errorMsg = res.errores?.[0]?.mensaje || 'Error al obtener la lista de tenants.';
        setErrorRed(errorMsg);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errores?.[0]?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        'Fallo en la comunicación con el servicio SaaS Hub.';
      setErrorRed(errorMsg);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Conexión rápida como SuperAdmin SaaS
  const handleConectarSuperAdmin = async () => {
    setConectandoSuperAdmin(true);
    try {
      const res = await loginWithCredentials({
        correo: 'admin@restaurantcloud.pe',
        password: 'admin-saas2026',
      });
      if (res.exito && res.datos?.usuario && res.datos?.token) {
        setUsuario(res.datos.usuario, res.datos.token);
        mostrarToast('✓ Conectado exitosamente como SuperAdmin SaaS');
        await cargarDatos();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo iniciar sesión como SuperAdmin SaaS', 'alerta');
      }
    } catch {
      mostrarToast('Error al autenticar con el servidor de credenciales.', 'alerta');
    } finally {
      setConectandoSuperAdmin(false);
    }
  };

  // Manejador de apertura de Expediente 360° (Vista 2)
  const handleVerExpediente = async (empresaId: string) => {
    setEmpresaSeleccionadaId(empresaId);
    setCargandoExpediente(true);
    try {
      const res = await saasTenantsService.obtenerExpedienteTenant(empresaId);
      if (res.exito) {
        setExpedienteDetalle(res.datos);
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo cargar el expediente de la empresa.', 'alerta');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.errores?.[0]?.mensaje || 'Error al conectar con la base de datos de auditoría.';
      mostrarToast(msg, 'alerta');
    } finally {
      setCargandoExpediente(false);
    }
  };

  const handleCerrarExpediente = () => {
    setEmpresaSeleccionadaId(null);
    setExpedienteDetalle(null);
    if (searchParams.get('expediente')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('expediente');
      setSearchParams(newParams, { replace: true });
    }
  };

  // Apertura automática si viene el query param ?expediente=EMP-XXXXX o UUID
  useEffect(() => {
    const expedienteId = searchParams.get('expediente');
    if (expedienteId && expedienteId !== empresaSeleccionadaId) {
      handleVerExpediente(expedienteId);
    }
  }, [searchParams, empresaSeleccionadaId]);

  // Acciones operativas dentro del Expediente
  const handleReenviarNotificacion = async (empresaId: string) => {
    const res = await saasTenantsService.reenviarNotificacionCobro(empresaId);
    if (res.exito) {
      mostrarToast(`✓ ${res.datos.mensaje}`);
    } else {
      mostrarToast(res.errores?.[0]?.mensaje || 'Error al despachar el correo de recordatorio.', 'alerta');
    }
  };

  const handleSuspenderPreventivo = async (empresaId: string) => {
    if (
      window.confirm(
        '¿Confirmas la suspensión preventiva inmediata de este restaurante por riesgo de impago / fraude?'
      )
    ) {
      const res = await saasTenantsService.suspenderEmpresaPreventiva(
        empresaId,
        'Suspensión administrativa preventiva ejecutada por el Administrador SaaS.'
      );
      if (res.exito) {
        mostrarToast('✓ Empresa suspendida preventivamente. Sesiones revocadas.');
        handleCerrarExpediente();
        cargarDatos();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo suspender la empresa.', 'alerta');
      }
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

      {/* Banner de Verificación de Rol SaaS */}
      {!esAdminSaas && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">Acceso restringido a Administrador Global SaaS</p>
              <p className="text-amber-800/90 mt-0.5">
                Sesión actual: <span className="font-semibold">{usuario ? `${usuario.nombre} (${usuario.rol})` : 'Invitado sin sesión'}</span>. 
                Las políticas de seguridad en PostgreSQL y Redis exigen el rol <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">admin_saas</code> para consultar la telemetría consolidada.
              </p>
            </div>
          </div>
          <button
            onClick={handleConectarSuperAdmin}
            disabled={conectandoSuperAdmin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-aurea-navy text-white hover:bg-slate-800 transition-colors shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-aurea-champagne" />
            <span>{conectandoSuperAdmin ? 'Conectando...' : 'Conectar como SuperAdmin SaaS'}</span>
          </button>
        </div>
      )}

      {/* 4 KPIs Superiores de Plataforma */}
      <KpisSupervisionSaas metricas={metricas} cargando={cargando} />

      {/* Barra de Pestañas y Filtros */}
      <FiltrosTenantsBar
        filtros={filtros}
        onFiltrosChange={(cambios) => setFiltros((prev) => ({ ...prev, ...cambios }))}
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
          onVerTodas={() => setFiltros((prev) => ({ ...prev, tab_estado: 'todos', buscar: '' }))}
          onRecargar={cargarDatos}
        />
      ) : (
        <>
          {/* Vista Tabla Desktop >= 1024px */}
          <TenantsTablaDesktop tenants={tenants} onVerExpediente={handleVerExpediente} />

          {/* Vista Cards Móvil < 1024px */}
          <TenantCardMobile tenants={tenants} onVerExpediente={handleVerExpediente} />
        </>
      )}

      {/* Modal Expediente 360° (Vista 2) */}
      {empresaSeleccionadaId && (
        <ModalExpedienteTenant
          expediente={expedienteDetalle}
          onClose={handleCerrarExpediente}
          onReenviarNotificacion={handleReenviarNotificacion}
          onSuspenderPreventivo={handleSuspenderPreventivo}
          cargandoAccion={cargandoExpediente}
        />
      )}
    </div>
  );
};
