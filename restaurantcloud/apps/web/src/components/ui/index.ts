// Componentes base de la interfaz (§3 de la guía de refactorización UI).
// Son presentacionales: reciben props y callbacks, nunca llaman a servicios.
export { Button, type ButtonProps, type TemaUI } from './Button';
export { IconButton } from './IconButton';
export { Card } from './Card';
export { Modal } from './Modal';
export { ModalConfirmacion } from './ModalConfirmacion';
export { Drawer } from './Drawer';
export { EstadoBadge, type TonoEstado } from './EstadoBadge';
export { PageHeader } from './PageHeader';
export { TarjetaIndicador, type TonoIndicador } from './TarjetaIndicador';
export { Skeleton, EstadoVacio, EstadoError } from './EstadosVista';
export { Pestanas, type OpcionPestana } from './Pestanas';
export { CampoBusqueda } from './CampoBusqueda';
export { DataTable, ListaResponsive, type ColumnaTabla } from './ListaResponsive';
export { ToastProvider } from './Toast';
export { useToast, type TonoToast } from './useToast';
export { SoloDemo } from './SoloDemo';
export { BotonSalir } from './BotonSalir';
export { Paginacion } from './Paginacion';
