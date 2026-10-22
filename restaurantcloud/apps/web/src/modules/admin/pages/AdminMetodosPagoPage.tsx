import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MetodoPagoLocalDTO,
  MetodosPagoKPIsDTO,
  CodigoMetodoPagoLocal,
  DatosAdicionalesMetodoPago,
} from '@/types/admin';
import {
  mockAdminService,
  CANONICAL_LOCAL_ID,
} from '@/modules/admin/services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import { MetodosPagoHeader } from '../components/metodos_pago/MetodosPagoHeader';
import { MetodosPagoKPIs } from '../components/metodos_pago/MetodosPagoKPIs';
import { MetodosPagoCatalogo } from '../components/metodos_pago/MetodosPagoCatalogo';
import { MetodosPagoSimulador } from '../components/metodos_pago/MetodosPagoSimulador';
import { ModalConfigurarBilletera } from '../components/metodos_pago/ModalConfigurarBilletera';
import { ModalConfigurarTransferencia } from '../components/metodos_pago/ModalConfigurarTransferencia';
import { ModalBloqueoMinimoUnPago } from '../components/metodos_pago/ModalBloqueoMinimoUnPago';
import { OnboardingMetodosPagoView } from '../components/metodos_pago/OnboardingMetodosPagoView';
import { DemoAdminMetodosPagoWidget } from '../components/metodos_pago/DemoAdminMetodosPagoWidget';
import { CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

export const AdminMetodosPagoPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [isGuardando, setIsGuardando] = useState(false);
  const sseConectado = !IS_REAL_API;

  // Estados del catálogo
  const [metodosOriginales, setMetodosOriginales] = useState<MetodoPagoLocalDTO[]>([]);
  const [metodosBorrador, setMetodosBorrador] = useState<MetodoPagoLocalDTO[]>([]);
  const [kpis, setKpis] = useState<MetodosPagoKPIsDTO>({
    formas_habilitadas: 0,
    total_formas: 4,
    metodos_con_comision: 0,
    ventas_tarjeta_mes: 0,
    recargos_percibidos_mes: 0,
  });
  const [sedeNombre, setSedeNombre] = useState('Sede Principal - Áurea Miraflores');
  const [esSedeNueva, setEsSedeNueva] = useState(false);

  // Modales
  const [modalBilleteraOpen, setModalBilleteraOpen] = useState(false);
  const [modalTransferenciaOpen, setModalTransferenciaOpen] = useState(false);
  const [modalBloqueoOpen, setModalBloqueoOpen] = useState(false);
  const [metodoBloqueadoNombre, setMetodoBloqueadoNombre] = useState('Efectivo');

  // Toasts
  const [toastMensaje, setToastMensaje] = useState<{
    tipo: 'exito' | 'error' | 'info';
    texto: string;
  } | null>(null);

  const mostrarToast = useCallback(
    (texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
      setToastMensaje({ tipo, texto });
      setTimeout(() => {
        setToastMensaje(null);
      }, 4500);
    },
    []
  );

  // Carga de catálogo y KPIs
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await adminService.getMetodosPago();
      if (resp.exito && resp.datos) {
        setMetodosOriginales(JSON.parse(JSON.stringify(resp.datos.metodos)));
        setMetodosBorrador(JSON.parse(JSON.stringify(resp.datos.metodos)));
        setKpis(resp.datos.kpis);
        setSedeNombre(resp.datos.sede_nombre);
        setEsSedeNueva(resp.datos.metodos.length === 0);
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'No se pudo cargar el catálogo de pagos', 'error');
      }
    } catch {
      mostrarToast('Error de comunicación con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Dirty check: verificar si el borrador difiere de lo persistido
  const isDirty = useMemo(() => {
    if (!metodosOriginales.length || !metodosBorrador.length) return false;
    return JSON.stringify(metodosOriginales) !== JSON.stringify(metodosBorrador);
  }, [metodosOriginales, metodosBorrador]);

  // Toggle activo con regla de seguridad Poka-Yoke y Activación Condicionada
  const handleToggleActivo = useCallback(
    (codigo: CodigoMetodoPagoLocal) => {
      setMetodosBorrador((prev) => {
        const metodoActual = prev.find((m) => m.codigo === codigo);
        if (!metodoActual) return prev;

        if (IS_REAL_API && codigo === 'efectivo') {
          mostrarToast('Efectivo es obligatorio y debe permanecer activo.', 'info');
          return prev;
        }

        const nuevoActivo = !metodoActual.activo;

        // 1. Si intenta desactivar, verificar que no sea el único activo (RN-PAGO-01: mínimo 1 activo)
        if (!nuevoActivo) {
          const activosRestantes = prev.filter((m) => m.codigo !== codigo && m.activo);
          if (activosRestantes.length === 0) {
            setMetodoBloqueadoNombre(metodoActual.nombre);
            setModalBloqueoOpen(true);
            return prev;
          }
        }

        // 2. Activación condicionada de Billetera Digital (Yape / Plin)
        // No se puede habilitar si no tiene configurado un número celular de 9 dígitos
        if (nuevoActivo && codigo === 'billetera_digital') {
          const tel = (
            metodoActual.datos_adicionales?.telefono ||
            metodoActual.datos_adicionales?.telefono_billetera ||
            ''
          ).replace(/\D/g, '');
          if (tel.length < 9) {
            mostrarToast(
              'Para habilitar Yape / Plin, primero debes configurar el número celular receptor de la sede.',
              'info'
            );
            setModalBilleteraOpen(true);
            return prev; // Impide encender el switch sin datos previos
          }
        }

        // 3. Activación condicionada de Transferencia Bancaria
        // No se puede habilitar si no tiene configurada una cuenta o CCI bancario
        if (nuevoActivo && codigo === 'transferencia') {
          const banco = metodoActual.datos_adicionales?.banco?.trim();
          const cuenta = metodoActual.datos_adicionales?.cuenta?.trim();
          const cci = metodoActual.datos_adicionales?.cci?.trim();
          if (!banco || (!cuenta && !cci)) {
            mostrarToast(
              'Para habilitar transferencias bancarias, primero debes registrar la cuenta o CCI de la empresa.',
              'info'
            );
            setModalTransferenciaOpen(true);
            return prev; // Impide encender el switch sin datos previos
          }
        }

        return prev.map((m) => (m.codigo === codigo ? { ...m, activo: nuevoActivo } : m));
      });
    },
    [mostrarToast]
  );

  // Cambiar porcentaje de recargo (0.00% a 50.00%)
  const handleCambiarComision = useCallback(
    (codigo: CodigoMetodoPagoLocal, comision: number) => {
      setMetodosBorrador((prev) =>
        prev.map((m) => {
          if (m.codigo !== codigo) return m;
          // Efectivo siempre 0.00%
          const finalComision =
            IS_REAL_API && codigo !== 'tarjeta'
              ? 0.0
              : codigo === 'efectivo'
              ? 0.0
              : Math.min(50.0, Math.max(0.0, comision));
          return { ...m, comision_porcentaje: finalComision };
        })
      );
    },
    []
  );

  // Guardar configuración de billetera digital (activa automáticamente el método si es válido)
  const handleGuardarBilletera = useCallback(
    (datos: DatosAdicionalesMetodoPago) => {
      setMetodosBorrador((prev) =>
        prev.map((m) => {
          if (m.codigo !== 'billetera_digital') return m;
          return {
            ...m,
            activo: true, // Al completar la configuración requerida, se habilita el método
            datos_adicionales: { ...m.datos_adicionales, ...datos },
          };
        })
      );
      mostrarToast('Billetera digital (Yape / Plin) configurada y habilitada con éxito.', 'exito');
    },
    [mostrarToast]
  );

  // Guardar configuración de transferencias (activa automáticamente el método si es válido)
  const handleGuardarTransferencia = useCallback(
    (datos: DatosAdicionalesMetodoPago) => {
      setMetodosBorrador((prev) =>
        prev.map((m) => {
          if (m.codigo !== 'transferencia') return m;
          return {
            ...m,
            activo: true, // Al completar los datos bancarios requeridos, se habilita el método
            datos_adicionales: { ...m.datos_adicionales, ...datos },
          };
        })
      );
      mostrarToast('Datos bancarios para transferencias configurados y habilitados con éxito.', 'exito');
    },
    [mostrarToast]
  );

  // Descartar cambios
  const handleDescartar = useCallback(() => {
    setMetodosBorrador(JSON.parse(JSON.stringify(metodosOriginales)));
    mostrarToast('Cambios no guardados descartados', 'info');
  }, [metodosOriginales, mostrarToast]);

  // Guardar cambios en el backend mock
  const handleGuardar = useCallback(async () => {
    setIsGuardando(true);
    try {
      const resp = await adminService.actualizarMetodosPago({
        metodos: metodosBorrador.map((m) => ({
          codigo: m.codigo,
          activo: m.activo,
          comision_porcentaje: m.comision_porcentaje,
          datos_adicionales: m.datos_adicionales,
        })),
      });

      if (resp.exito && resp.datos) {
        setMetodosOriginales(JSON.parse(JSON.stringify(resp.datos.metodos)));
        setMetodosBorrador(JSON.parse(JSON.stringify(resp.datos.metodos)));
        setKpis(resp.datos.kpis);
        mostrarToast(
          IS_REAL_API
            ? 'Configuración guardada. Se aplicará a los siguientes cobros de Caja.'
            : 'Configuración de métodos de pago y comisiones guardada con éxito. Actualizado en caja y salón.',
          'exito'
        );
      } else {
        const err = resp.errores?.[0];
        if (err?.codigo === 'ERR_MINIMO_UN_PAGO') {
          setModalBloqueoOpen(true);
        } else {
          mostrarToast(err?.mensaje || 'Error al guardar los métodos de pago', 'error');
        }
      }
    } catch {
      mostrarToast('Error inesperado al conectar con el servidor', 'error');
    } finally {
      setIsGuardando(false);
    }
  }, [metodosBorrador, mostrarToast]);

  // Onboarding: aprovisionamiento estándar seguro
  const handleAprovisionarEstandar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await mockAdminService.aprovisionarSedeNuevaMetodosPago();
      if (resp.exito && resp.datos) {
        setMetodosOriginales(JSON.parse(JSON.stringify(resp.datos.metodos)));
        setMetodosBorrador(JSON.parse(JSON.stringify(resp.datos.metodos)));
        setKpis(resp.datos.kpis);
        setEsSedeNueva(false);
        mostrarToast('Sede aprovisionada con Efectivo, Tarjeta POS y Yape al 0%', 'exito');
      } else {
        mostrarToast('No se pudo completar el aprovisionamiento de la sede', 'error');
      }
    } catch {
      mostrarToast('Error al aprovisionar la sede', 'error');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  // Onboarding: personalización manual segura (inicializa los 4 métodos canónicos)
  const handleIniciarManual = useCallback(() => {
    const plantillaInicial: MetodoPagoLocalDTO[] = [
      {
        id: '00000000-0000-4000-8000-000000000451',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'efectivo',
        nombre: 'Efectivo (Cash)',
        activo: true,
        comision_porcentaje: 0.0,
        datos_adicionales: {},
        icono: 'banknote',
        orden: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-8000-000000000452',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'tarjeta',
        nombre: 'Tarjeta Débito / Crédito (POS)',
        activo: false,
        comision_porcentaje: 0.0,
        datos_adicionales: { operador: 'Niubiz / Izipay' },
        icono: 'credit-card',
        orden: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-8000-000000000453',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'billetera_digital',
        nombre: 'Billetera Digital (Yape / Plin)',
        activo: false,
        comision_porcentaje: 0.0,
        datos_adicionales: {},
        icono: 'smartphone',
        orden: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-8000-000000000454',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'transferencia',
        nombre: 'Transferencia Bancaria',
        activo: false,
        comision_porcentaje: 0.0,
        datos_adicionales: {},
        icono: 'building-2',
        orden: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setMetodosOriginales(plantillaInicial);
    setMetodosBorrador(plantillaInicial);
    setKpis({
      formas_habilitadas: 1,
      total_formas: 4,
      metodos_con_comision: 0,
      ventas_tarjeta_mes: 0,
      recargos_percibidos_mes: 0,
    });
    setEsSedeNueva(false);
    mostrarToast('Plantilla manual lista con Efectivo habilitado al 0%', 'info');
  }, [mostrarToast]);

  // QA Presets
  const handleAplicarPresetQA = useCallback(
    (preset: 'canonico' | 'cero_recargo' | 'alta_comision' | 'solo_efectivo') => {
      if (preset === 'canonico') {
        mockAdminService.restablecerSemillasMetodosPago();
        cargarDatos();
        mostrarToast('Preset Canónico Áurea aplicado (Tarjeta 3.5%, Efectivo 0%, Yape 0%)', 'info');
      } else if (preset === 'cero_recargo') {
        setMetodosBorrador((prev) =>
          prev.map((m) => ({ ...m, activo: true, comision_porcentaje: 0.0 }))
        );
        mostrarToast('Preset: Todas las comisiones a 0.00% (Modo absorbido por restaurante)', 'info');
      } else if (preset === 'alta_comision') {
        setMetodosBorrador((prev) =>
          prev.map((m) =>
            m.codigo === 'tarjeta' ? { ...m, activo: true, comision_porcentaje: 5.0 } : m
          )
        );
        mostrarToast('Preset: Tarjeta al 5.00% de recargo', 'info');
      } else if (preset === 'solo_efectivo') {
        setMetodosBorrador((prev) =>
          prev.map((m) => ({ ...m, activo: m.codigo === 'efectivo' }))
        );
        mostrarToast('Preset: Solo Efectivo activo. Intenta desactivarlo para ver el 409.', 'info');
      }
    },
    [cargarDatos, mostrarToast]
  );

  const handleSimularOnboardingQA = useCallback(() => {
    mockAdminService.simularSedeNuevaMetodosPago();
    setMetodosOriginales([]);
    setMetodosBorrador([]);
    setEsSedeNueva(true);
    mostrarToast('Vista de Onboarding activada para simulación', 'info');
  }, [mostrarToast]);

  const handleRestablecerSemillasQA = useCallback(() => {
    mockAdminService.restablecerSemillasMetodosPago();
    cargarDatos();
    mostrarToast('Semillas canónicas restauradas', 'exito');
  }, [cargarDatos, mostrarToast]);

  // Datos para modal de billetera y transferencia
  const billeteraActual = metodosBorrador.find((m) => m.codigo === 'billetera_digital');
  const transferenciaActual = metodosBorrador.find((m) => m.codigo === 'transferencia');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Toast Notification */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-4 duration-200 border ${
            toastMensaje.tipo === 'exito'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMensaje.tipo === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-900 text-white border-slate-700 dark:bg-slate-100 dark:text-slate-900'
          }`}
        >
          {toastMensaje.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {toastMensaje.tipo === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toastMensaje.tipo === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
          <span>{toastMensaje.texto}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <MetodosPagoHeader sedeNombre={sedeNombre} isDirty={isDirty} sseConectado={sseConectado} />

        {cargando ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Cargando catálogo de métodos de pago...</span>
          </div>
        ) : esSedeNueva ? (
          /* Vista 4: Onboarding Inicial */
          <OnboardingMetodosPagoView
            onAprovisionarEstandar={handleAprovisionarEstandar}
            onIniciarManual={handleIniciarManual}
            isLoading={cargando}
          />
        ) : (
          <>
            {/* KPIs */}
            <MetodosPagoKPIs kpis={kpis} />

            {/* Vista 1: Split 50/50 Panel Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Columna Izquierda (50%): Catálogo de Métodos de Pago */}
              <MetodosPagoCatalogo
                metodos={metodosBorrador}
                onToggleActivo={handleToggleActivo}
                onCambiarComision={handleCambiarComision}
                onOpenModalBilletera={() => setModalBilleteraOpen(true)}
                onOpenModalTransferencia={() => setModalTransferenciaOpen(true)}
                onGuardar={handleGuardar}
                onDescartar={handleDescartar}
                isDirty={isDirty}
                isGuardando={isGuardando}
              />

              {/* Columna Derecha (50%): Simulador Espejo de Caja & Precuenta */}
              <MetodosPagoSimulador metodos={metodosBorrador} />
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      <ModalConfigurarBilletera
        isOpen={modalBilleteraOpen}
        onClose={() => setModalBilleteraOpen(false)}
        datosActuales={billeteraActual?.datos_adicionales}
        onGuardar={handleGuardarBilletera}
      />

      <ModalConfigurarTransferencia
        isOpen={modalTransferenciaOpen}
        onClose={() => setModalTransferenciaOpen(false)}
        datosActuales={transferenciaActual?.datos_adicionales}
        onGuardar={handleGuardarTransferencia}
      />

      <ModalBloqueoMinimoUnPago
        isOpen={modalBloqueoOpen}
        onClose={() => setModalBloqueoOpen(false)}
        metodoBloqueadoNombre={metodoBloqueadoNombre}
      />

      {/* QA Floating Widget */}
      {!IS_REAL_API && (
        <DemoAdminMetodosPagoWidget
          onAplicarPreset={handleAplicarPresetQA}
          onSimularOnboarding={handleSimularOnboardingQA}
          onRestablecerSemillas={handleRestablecerSemillasQA}
        />
      )}
    </div>
  );
};
