import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { realPropietarioLocalesService } from '@/services/api/realApiServices';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/shared/utils';
import { AvisosFlotantes } from './AvisosFlotantes';
import { PanelNotificaciones } from './PanelNotificaciones';
import { useNotificaciones, type DependenciasNotificaciones } from './useNotificaciones';

export type VarianteCampana = 'oscura' | 'clara' | 'flotante';

interface Props {
  /**
   * `oscura`: en la cabecera de la barra lateral. `clara`: en la barra superior de tableta y teléfono. `flotante`:
   * botón redondo de las terminales (mozo, cocina, caja), que solo se muestra si hay avisos sin leer.
   */
  variante: VarianteCampana;
  /** Solo para `flotante`: la cocina trabaja sobre un fondo oscuro. */
  fondoOscuro?: boolean;
  /** Para sustituir el servicio y el canal en las pruebas. */
  dependencias?: DependenciasNotificaciones;
}

const ESTILO_BOTON: Record<VarianteCampana, string> = {
  oscura: 'min-h-tactil min-w-tactil rounded-xl text-aurea-champagne hover:text-white hover:bg-white/10',
  clara: 'min-h-tactil min-w-tactil rounded-xl text-tinta-600 hover:text-tinta-900 hover:bg-tinta-100',
  flotante: 'w-[60px] h-[60px] rounded-full shadow-2xl',
};

const ANILLO_INSIGNIA: Record<VarianteCampana, string> = {
  oscura: 'ring-aurea-navy',
  clara: 'ring-white',
  flotante: 'ring-white',
};

/**
 * Campana de avisos del personal (CU-TRANS-01). Una sola instancia por pantalla: abre el canal en tiempo real,
 * lleva el contador y despliega el panel y los avisos flotantes. Alt+N abre y cierra el panel; Esc lo cierra.
 */
export const CampanaNotificaciones: React.FC<Props> = ({ variante, fondoOscuro = false, dependencias }) => {
  const { estado, abrir, alternar, cambiarPestana, cargarMas, recargar, marcarLeida, marcarTodasLeidas, cerrarFlotante } =
    useNotificaciones(dependencias);
  const { contador, abierto } = estado;
  const rol = useAuthStore((s) => s.usuario?.rol);
  const boton = useRef<HTMLButtonElement>(null);

  const visible = variante !== 'flotante' || contador.total > 0 || abierto;

  // Alt+N y Esc valen aunque la campana flotante esté oculta
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        alternar();
      } else if (e.key === 'Escape' && abierto) {
        abrir(false);
      }
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [abierto, alternar, abrir]);

  // Al cerrar el panel, el foco vuelve a la campana (si sigue a la vista)
  const estabaAbierto = useRef(false);
  useEffect(() => {
    if (estabaAbierto.current && !abierto) boton.current?.focus();
    estabaAbierto.current = abierto;
  }, [abierto]);

  // La insignia late dos veces cuando llega un aviso
  const [latir, setLatir] = useState(false);
  const totalAnterior = useRef(contador.total);
  useEffect(() => {
    if (contador.total > totalAnterior.current) {
      setLatir(true);
      const t = setTimeout(() => setLatir(false), 1300);
      totalAnterior.current = contador.total;
      return () => clearTimeout(t);
    }
    totalAnterior.current = contador.total;
  }, [contador.total]);

  // El propietario ve avisos de varias sedes: se pide el nombre de cada una al abrir el panel por primera vez
  const [nombresSede, setNombresSede] = useState<Record<string, string> | undefined>();
  useEffect(() => {
    if (!abierto || rol !== 'propietario' || nombresSede) return;
    let vigente = true;
    realPropietarioLocalesService
      .getDirectorioLocales()
      .then((r) => {
        if (vigente && r.exito) setNombresSede(Object.fromEntries(r.datos.locales.map((l) => [l.id, l.nombre])));
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [abierto, rol, nombresSede]);

  const hayCriticas = contador.criticas > 0;
  const etiqueta = contador.total > 0 ? `Notificaciones, ${contador.total} sin leer` : 'Notificaciones';

  return (
    <>
      {visible && (
        <button
          ref={boton}
          type="button"
          onClick={alternar}
          aria-label={etiqueta}
          aria-expanded={abierto}
          aria-haspopup="dialog"
          aria-keyshortcuts="Alt+N"
          className={cn(
            'relative grid place-items-center transition-colors shrink-0',
            ESTILO_BOTON[variante],
            variante === 'flotante' && (fondoOscuro ? 'bg-aurea-copper text-aurea-navy' : 'bg-aurea-navy text-aurea-champagne'),
            variante === 'flotante' && 'fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 motion-safe:animate-campana-aparece',
          )}
        >
          <Bell className={variante === 'flotante' ? 'w-6 h-6' : 'w-5 h-5'} aria-hidden="true" />
          {contador.total > 0 && (
            <span
              data-testid="insignia-avisos"
              className={cn(
                'absolute top-1 right-0.5 min-w-5 h-5 px-1 grid place-items-center rounded-full text-xs font-bold tabular-nums ring-2',
                ANILLO_INSIGNIA[variante],
                variante === 'flotante' && fondoOscuro && 'ring-tinta-950',
                hayCriticas ? 'bg-estado-error-600 text-white' : 'bg-aurea-copper text-aurea-navy',
                latir && 'animate-campana-latido',
              )}
            >
              {contador.total > 9 ? '9+' : contador.total}
            </span>
          )}
        </button>
      )}
      {createPortal(
        <>
          <AvisosFlotantes flotantes={estado.flotantes} onCerrar={cerrarFlotante} />
          {abierto && (
            <PanelNotificaciones
              estado={estado}
              nombresSede={nombresSede}
              onCerrar={() => abrir(false)}
              onPestana={cambiarPestana}
              onMarcarLeida={marcarLeida}
              onMarcarTodas={marcarTodasLeidas}
              onCargarMas={cargarMas}
              onReintentar={recargar}
            />
          )}
        </>,
        document.body,
      )}
    </>
  );
};
