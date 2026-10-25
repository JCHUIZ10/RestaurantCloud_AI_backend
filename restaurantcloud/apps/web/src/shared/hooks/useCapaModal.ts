import { useEffect, useRef } from 'react';

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento accesible de una capa modal (regla A2): cierre con Escape, foco atrapado
 * dentro del panel, foco devuelto al disparador al cerrar y scroll de la página bloqueado.
 */
export function useCapaModal<T extends HTMLElement>(
  abierto: boolean,
  onCerrar: () => void,
  cerrable: boolean
) {
  const panelRef = useRef<T>(null);
  // Referencias para no reinstalar los listeners en cada render del padre
  const onCerrarRef = useRef(onCerrar);
  const cerrableRef = useRef(cerrable);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
    cerrableRef.current = cerrable;
  });

  useEffect(() => {
    if (!abierto) return;
    const disparador = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Respeta un autoFocus interno; si no lo hay, enfoca el primer control del panel
    if (panel && !panel.contains(document.activeElement)) {
      const primero = panel.querySelector<HTMLElement>(ENFOCABLES);
      (primero ?? panel).focus();
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cerrableRef.current) {
        e.stopPropagation();
        onCerrarRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const enfocables = Array.from(panel.querySelectorAll<HTMLElement>(ENFOCABLES));
      if (enfocables.length === 0) {
        e.preventDefault();
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    panel?.addEventListener('keydown', alPulsar);
    return () => {
      panel?.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
      disparador?.focus?.();
    };
  }, [abierto]);

  return panelRef;
}
