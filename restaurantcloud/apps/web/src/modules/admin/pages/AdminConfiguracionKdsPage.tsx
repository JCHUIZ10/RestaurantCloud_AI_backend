import React, { useState, useEffect, useCallback } from 'react';
import { ConfiguracionKdsDTO } from '@/types/admin';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import { KdsConfigHeader } from '../components/kds_config/KdsConfigHeader';
import { KdsParametrosForm } from '../components/kds_config/KdsParametrosForm';
import { KdsSimuladorSemaforo } from '../components/kds_config/KdsSimuladorSemaforo';
import { DemoKdsConfigWidget } from '../components/kds_config/DemoKdsConfigWidget';
import { EstadoError, ModalConfirmacion, Skeleton, SoloDemo, useToast } from '@/components/ui';

export const AdminConfiguracionKdsPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [isGuardando, setIsGuardando] = useState(false);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);

  // Estados de datos (Original persistido vs Borrador reactivo)
  const [configOriginal, setConfigOriginal] = useState<ConfiguracionKdsDTO | null>(null);
  const [configBorrador, setConfigBorrador] = useState<ConfiguracionKdsDTO | null>(null);

  const { mostrar } = useToast();
  const mostrarToast = useCallback(
    (texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => mostrar(texto, tipo === 'exito' ? 'ok' : tipo),
    [mostrar]
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
        mostrarToast(resp.errores?.[0]?.mensaje || 'No se pudo cargar la configuración de cocina', 'error');
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
      ? `El tiempo ámbar (${configBorrador.tiempo_alerta_ambar_min} min) debe ser mayor que el verde (${configBorrador.tiempo_optimo_verde_min} min).`
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
          mostrarToast('Este navegador no puede reproducir sonidos de prueba', 'info');
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
        }
      } catch {
        mostrarToast('Toca la pantalla una vez y vuelve a probar el sonido', 'info');
      }
    },
    [mostrarToast]
  );

  // Guardar configuración
  const handleGuardar = async () => {
    if (!configBorrador) return;
    if (configBorrador.tiempo_alerta_ambar_min <= configBorrador.tiempo_optimo_verde_min) {
      mostrarToast('Corrige los tiempos: el ámbar debe ser mayor que el verde', 'error');
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
        mostrarToast('Tiempos de cocina guardados', 'exito');
      } else {
        mostrarToast(resp.errores?.[0]?.mensaje || 'No se pudo guardar la configuración', 'error');
      }
    } catch {
      mostrarToast('Error de conexión al guardar la configuración', 'error');
    } finally {
      setIsGuardando(false);
    }
  };

  const handleDescartar = () => {
    if (configOriginal) setConfigBorrador(JSON.parse(JSON.stringify(configOriginal)));
  };

  // Restaurar valores recomendados estándar de la industria
  const handleRestaurarDefaults = async () => {
    setIsGuardando(true);
    try {
      const resp = await adminService.restaurarDefaultsConfiguracionKds();
      if (resp.exito && resp.datos) {
        setConfigOriginal(JSON.parse(JSON.stringify(resp.datos)));
        setConfigBorrador(JSON.parse(JSON.stringify(resp.datos)));
        mostrarToast('Valores recomendados restablecidos', 'info');
      }
    } catch {
      mostrarToast('Error al restablecer los valores recomendados', 'error');
    } finally {
      setIsGuardando(false);
      setConfirmarRestaurar(false);
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

  return (
    <div className="space-y-6">
      <KdsConfigHeader isDirty={isDirty} />

      {cargando ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-busy="true" aria-label="Cargando tiempos de cocina">
          <Skeleton className="h-[36rem] rounded-2xl" />
          <Skeleton className="h-[30rem] rounded-2xl" />
        </div>
      ) : !configBorrador ? (
        <EstadoError mensaje="No se pudo cargar la configuración de cocina." onReintentar={cargarDatos} />
      ) : (
        // Formulario a la izquierda y vista previa a la derecha; apilados en móvil y tablet
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <KdsParametrosForm
            config={configBorrador}
            onChange={setConfigBorrador}
            onGuardar={handleGuardar}
            onDescartar={handleDescartar}
            onRestaurarDefaults={() => setConfirmarRestaurar(true)}
            onTestAudio={handleTestAudio}
            isDirty={isDirty}
            isGuardando={isGuardando}
            errorValidacion={errorValidacion}
          />
          <div className="lg:sticky lg:top-6">
            <KdsSimuladorSemaforo config={configBorrador} />
          </div>
        </div>
      )}

      <ModalConfirmacion
        abierto={confirmarRestaurar}
        onCerrar={() => setConfirmarRestaurar(false)}
        onConfirmar={handleRestaurarDefaults}
        tono="alerta"
        titulo="¿Volver a los valores recomendados?"
        mensaje="Se guardan al instante: verde hasta 15 min, ámbar hasta 25 min y 3 min en el pase. Se pierden los cambios sin guardar."
        textoConfirmar="Restablecer"
        cargando={isGuardando}
      />

      {/* Widget QA Sandbox flotante */}
      <SoloDemo>
        {!IS_REAL_API && (
          <DemoKdsConfigWidget
            onAplicarPreset={handleAplicarPreset}
            onResetCanonica={handleRestaurarDefaults}
          />
        )}
      </SoloDemo>
    </div>
  );
};
