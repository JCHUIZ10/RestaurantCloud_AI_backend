import React from 'react';

/**
 * Envoltorio para widgets flotantes de demo/QA.
 * Solo los renderiza en desarrollo o cuando VITE_SHOW_DEMO_WIDGETS=true,
 * para que no aparezcan en builds de producción.
 */
const DEMO_WIDGETS_VISIBLES =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_WIDGETS === 'true';

export const SoloDemo: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  DEMO_WIDGETS_VISIBLES ? <>{children}</> : null;
