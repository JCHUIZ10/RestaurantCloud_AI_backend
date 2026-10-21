import React, { useState, useEffect, useCallback } from 'react';
import { ConfiguracionKdsDTO } from '@/types/admin';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import { KdsConfigHeader } from '../components/kds_config/KdsConfigHeader';
import { KdsParametrosForm } from '../components/kds_config/KdsParametrosForm';
import { KdsSimuladorSemaforo } from '../components/kds_config/KdsSimuladorSemaforo';
import { DemoKdsConfigWidget } from '../components/kds_config/DemoKdsConfigWidget';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const AdminConfiguracionKdsPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [isGuardando, setIsGuardando] = useState(false);
  const sseConectado = !IS_REAL_API;

  // Estados de datos (Original persistido vs Borrador reactivo)
  const [configOriginal, setConfigOriginal] = useState<ConfiguracionKdsDTO | null>(null);
  const [configBorrador, setConfigBorrador] = useState<ConfiguracionKdsDTO | null>(null);

  // Toast flotante
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

  // Carga de configuración inicial desde el servicio
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await adminService.getConfiguracionKds();
      if (resp.exito && resp.datos) {
        setConfigOriginal(JSON.parse(JSON.stringify(resp.datos)));
        setConfigBorrador(JSON.parse(JSON.stringify(resp.datos)));
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'No se pudo cargar la configuración de KDS', 'error');
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

  // Detección de cambios (Dirty Check)
  const isDirty = Boolean(
    configOriginal &&
      configBorrador &&
      JSON.stringify(configOriginal) !== JSON.stringify(configBorrador)
  );

  // Validación de incoherencia (RN-KDS-01)
  const errorValidacion =
    configBorrador && configBorrador.tiempo_alerta_ambar_min <= configBorrador.tiempo_optimo_verde_min
      ? 'El umbral de alerta (ámbar) debe superar estrictamente al umbral óptimo (verde).'
      : null;

  /**
   * Reproductor de audio nativo con Web Audio API (Cero dependencias externas)
   */
  const handleTestAudio = useCallback(
    (tipo: 'chime' | 'alarma') => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          mostrarToast('Tu navegador no soporta Web Audio API para tests de sonido', 'info');
          return;
        }
        const ctx = new AudioCtx();

        if (tipo === 'chime') {
          // Tono armónico ascendente (D5 587Hz -> A5 880Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
          mostrarToast('🔔 Chime emitido: Tono armónico de nueva comanda probado', 'info');
        } else {
          // Alerta descendente tipo sirena (320Hz -> 200Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          osc.frequency.setValueAtTime(200, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.55);
          mostrarToast('🚨 Alarma emitida: Sirena de comanda en rojo crítico probada', 'info');
        }
      } catch {
        mostrarToast('Se requiere interactuar con la pantalla para reproducir audio', 'info');
      }
    },
    [mostrarToast]
  );

  // Guardar configuración
  const handleGuardar = async () => {
    if (!configBorrador) return;
    if (configBorrador.tiempo_alerta_ambar_min <= configBorrador.tiempo_optimo_verde_min) {
      mostrarToast('Corrige los umbrales: el tiempo ámbar debe ser mayor al verde', 'error');
      return;
    }

    setIsGuardando(true);
    try {
      const resp = await adminService.actualizarConfiguracionKds({
        tiempo_optimo_verde_min: configBorrador.tiempo_optimo_verde_min,
        tiempo_alerta_ambar_min: configBorrador.tiempo_alerta_ambar_min,
        tiempo_maximo_pase_min: configBorrador.tiempo_maximo_pase_min,
        alerta_sonora_nueva_comanda: configBorrador.alerta_sonora_nueva_comanda,
        alerta_sonora_comanda_roja: configBorrador.alerta_sonora_comanda_roja,
        intervalo_sonido_rojo_seg: configBorrador.intervalo_sonido_rojo_seg,
        vista_predeterminada: configBorrador.vista_predeterminada,
      });

      if (resp.exito && resp.datos) {
        setConfigOriginal(JSON.parse(JSON.stringify(resp.datos)));
        setConfigBorrador(JSON.parse(JSON.stringify(resp.datos)));
        mostrarToast(
          IS_REAL_API
            ? 'Configuracion KDS guardada. La sincronizacion en tiempo real se habilitara con SSE.'
            : 'Configuracion de KDS sincronizada con cocina y salon en menos de 30 ms.',
          'exito'
        );
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'Error al persistir parámetros', 'error');
      }
    } catch {
      mostrarToast('Error de conexión al guardar configuración', 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  // Restaurar valores recomendados estándar de la industria
  const handleRestaurarDefaults = async () => {
    setIsGuardando(true);
    try {
      const resp = await adminService.restaurarDefaultsConfiguracionKds();
      if (resp.exito && resp.datos) {
        setConfigOriginal(JSON.parse(JSON.stringify(resp.datos)));
        setConfigBorrador(JSON.parse(JSON.stringify(resp.datos)));
        mostrarToast('Valores estándar de la industria restablecidos (15m verde / 25m ámbar / 3m pase)', 'info');
      }
    } catch {
      mostrarToast('Error al restablecer valores por defecto', 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  // QA Preset injection
  const handleAplicarPreset = (preset: Partial<ConfiguracionKdsDTO>) => {
    if (!configBorrador) return;
    setConfigBorrador({
      ...configBorrador,
      ...preset,
    });
  };

  if (cargando || !configBorrador) {
    return (
      <div className="min-h-screen bg-aurea-ivory/40 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-aurea-copper border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-mono text-slate-600">Cargando parámetros de KDS de sede...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Toast Flotante */}
      {toastMensaje && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border transition-all animate-fadeIn ${
            toastMensaje.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : toastMensaje.tipo === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          {toastMensaje.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toastMensaje.tipo === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
          {toastMensaje.tipo === 'info' && <Info className="w-4 h-4 text-blue-600" />}
          <span>{toastMensaje.texto}</span>
        </div>
      )}

      {/* Cabecera */}
      <KdsConfigHeader isDirty={isDirty} sseConectado={sseConectado} />

      {/* Contenedor Principal: 2 Columnas (50% Formulario - 50% Simulador KDS) */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Columna Izquierda: Formulario de Parámetros */}
          <KdsParametrosForm
            config={configBorrador}
            onChange={(nueva) => setConfigBorrador(nueva)}
            onGuardar={handleGuardar}
            onRestaurarDefaults={handleRestaurarDefaults}
            onTestAudio={handleTestAudio}
            isDirty={isDirty}
            isGuardando={isGuardando}
            errorValidacion={errorValidacion}
          />

          {/* Columna Derecha: Simulador de Semáforo en Tiempo Real (Dark Theme KDS) */}
          <KdsSimuladorSemaforo
            config={configBorrador}
            onTestAudio={handleTestAudio}
          />
        </div>
      </main>

      {/* Widget QA Sandbox flotante */}
      {!IS_REAL_API && (
        <DemoKdsConfigWidget
          onAplicarPreset={handleAplicarPreset}
          onResetCanonica={handleRestaurarDefaults}
        />
      )}
    </div>
  );
};
