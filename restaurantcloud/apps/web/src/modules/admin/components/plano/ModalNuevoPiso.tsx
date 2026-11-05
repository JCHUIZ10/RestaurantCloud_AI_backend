import React, { useState, useId } from 'react';
import { CuotaMesasPlanDTO, CrearPisoRequest } from '@/types/admin';
import { Layers, Check } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { AvisoFormulario, Campo, CampoTexto } from './CamposPlano';

interface ModalNuevoPisoProps {
  cuota: CuotaMesasPlanDTO;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CrearPisoRequest) => Promise<void>;
}

export const ModalNuevoPiso: React.FC<ModalNuevoPisoProps> = ({
  cuota,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const idForm = useId();

  const excedePisos = cuota.pisos_activos_local >= cuota.max_pisos_plan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || excedePisos) return;

    try {
      setErrorLocal(null);
      setIsSubmitting(true);
      await onSubmit({
        nombre: nombre.trim(),
        columnas: 1,
        filas: 1,
      });
      setNombre('');
      onClose();
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudo guardar el ambiente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!isSubmitting}
      icono={Layers}
      titulo="Nuevo ambiente"
      descripcion={`Usas ${cuota.pisos_activos_local} de ${cuota.max_pisos_plan} ambientes que permite tu plan en esta sede.`}
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            loading={isSubmitting}
            disabled={excedePisos || !nombre.trim()}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            Crear ambiente
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} className="space-y-4">
        {errorLocal && <AvisoFormulario tono="error">{errorLocal}</AvisoFormulario>}
        {excedePisos && (
          <AvisoFormulario tono="error">
            Tu plan permite hasta {cuota.max_pisos_plan} ambientes por sede. Pide a gerencia ampliar el plan para crear otro.
          </AvisoFormulario>
        )}

        <Campo etiqueta="Nombre">
          {(id) => (
            <CampoTexto
              id={id}
              type="text"
              required
              autoFocus
              disabled={excedePisos}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Terraza, Segundo piso"
              maxLength={60}
            />
          )}
        </Campo>
      </form>
    </Modal>
  );
};
