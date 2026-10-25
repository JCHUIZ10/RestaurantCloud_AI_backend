import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button, type TemaUI } from './Button';

interface ModalConfirmacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensaje: React.ReactNode;
  textoConfirmar: string;
  /** error para acciones destructivas */
  tono?: 'alerta' | 'error';
  cargando?: boolean;
  tema?: TemaUI;
}

/** Sustituye a window.confirm con un diálogo accesible y coherente con la marca. */
export const ModalConfirmacion: React.FC<ModalConfirmacionProps> = ({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  textoConfirmar,
  tono = 'error',
  cargando = false,
  tema = 'claro',
}) => (
  <Modal
    abierto={abierto}
    onCerrar={onCerrar}
    titulo={titulo}
    icono={tono === 'error' ? Trash2 : AlertTriangle}
    tono={tono}
    tamano="sm"
    cerrable={!cargando}
    tema={tema}
    pie={
      <>
        <Button variant={tema === 'oscuro' ? 'ghost' : 'outline'} tema={tema} onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Button>
        <Button
          variant={tono === 'error' ? 'danger' : 'primary'}
          tema={tema}
          onClick={onConfirmar}
          loading={cargando}
        >
          {textoConfirmar}
        </Button>
      </>
    }
  >
    <div className={tema === 'oscuro' ? 'text-sm text-tinta-200' : 'text-sm text-aurea-navy/80'}>{mensaje}</div>
  </Modal>
);
