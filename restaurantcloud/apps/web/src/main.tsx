import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ToastProvider } from './components/ui/Toast';
import './styles/globals.css';

// Sin <MotionConfig reducedMotion="user">: con framer-motion 11 y "movimiento reducido" activo en el
// sistema, cada animación de opacidad pintaba un frame con su valor inicial al terminar (parpadeo en
// login, home y modales). La preferencia se respeta desde globals.css para animaciones CSS.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
