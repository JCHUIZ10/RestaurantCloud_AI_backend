import React, { useState, useEffect, useId } from 'react';
import { PisoAdminDTO } from '@/types/admin';
import { Settings, Trash2, Check } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { AvisoFormulario, Campo, CampoTexto } from './CamposPlano';

interface ModalEditarPisoProps {
  piso: PisoAdminDTO | null;
  totalPisosActivos: number;
  isOpen: boolean;
  onClose: () => void;
  onRenombrar: (pisoId: string, nuevoNombre: string) => Promise<void>;
  onDesactivar: (pisoId: string) => Promise<void>;
}

export const ModalEditarPiso: React.FC<ModalEditarPisoProps> = ({
  piso,
  totalPisosActivos,
  isOpen,
  onClose,
  onRenombrar,
  onDesactivar,
}) => {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const idForm = useId();

  useEffect(() => {
    if (piso) {
      setNombre(piso.nombre);
      setConfirmandoEliminar(false);
      setErrorLocal(null);
    }
  }, [piso, isOpen]);

  if (!piso) return null;

  const mesasActivas = piso.mesas.filter((m) => m.estado !== 'inactiva');
  const tieneMesasActivas = mesasActivas.length > 0;
  const esUnicoPiso = totalPisosActivos <= 1;
  const ocupado = isSubmitting || isDeleting;

  const handleRenombrarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorLocal('El nombre del ambiente no puede estar vacío.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorLocal(null);
      await onRenombrar(piso.id, nombre.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al renombrar ambiente.';
      setErrorLocal(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesactivarSubmit = async () => {
    if (esUnicoPiso || tieneMesasActivas) return;

    try {
      setIsDeleting(true);
      setErrorLocal(null);
      await onDesactivar(piso.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar ambiente.';
      setErrorLocal(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const motivoBloqueo = esUnicoPiso
    ? 'Es el único ambiente del local; debe quedar al menos uno.'
    : tieneMesasActivas
      ? `Tiene ${mesasActivas.length} mesa${mesasActivas.length === 1 ? '' : 's'} activa${mesasActivas.length === 1 ? '' : 's'}. Desactívalas o muévelas a otro ambiente antes de eliminarlo.`
      : null;

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!ocupado}
      icono={Settings}
      titulo={`Configurar «${piso.nombre}»`}
      descripcion={`${mesasActivas.length} mesas · ${piso.capacidad_total_personas} comensales`}
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            loading={isSubmitting}
            disabled={isDeleting || nombre.trim() === piso.nombre || !nombre.trim()}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            Guardar nombre
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {errorLocal && <AvisoFormulario tono="error">{errorLocal}</AvisoFormulario>}

        <form id={idForm} onSubmit={handleRenombrarSubmit}>
          <Campo etiqueta="Nombre del ambiente" ayuda="Debe ser distinto al de los demás ambientes del local.">
            {(id) => (
              <CampoTexto
                id={id}
                type="text"
                required
                value={nombre}
                maxLength={60}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Salón principal, Terraza"
              />
            )}
          </Campo>
        </form>

        <section className="p-4 rounded-xl border border-estado-error-200 bg-estado-error-50/60 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-estado-error-800">
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Eliminar ambiente
          </h3>

          {motivoBloqueo ? (
            <p className="text-sm text-estado-error-800">{motivoBloqueo}</p>
          ) : !confirmandoEliminar ? (
            <>
              <p className="text-sm text-aurea-navy/70">Dejará de mostrarse en el plano y en la toma de pedidos.</p>
              <Button
                variant="danger"
                className="w-full sm:w-auto"
                onClick={() => setConfirmandoEliminar(true)}
                leftIcon={<Trash2 className="w-4 h-4" aria-hidden="true" />}
              >
                Eliminar ambiente
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-estado-error-800">
                ¿Seguro que quieres eliminar «{piso.nombre}»?
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setConfirmandoEliminar(false)} disabled={isDeleting}>
                  No, mantener
                </Button>
                <Button variant="danger" loading={isDeleting} onClick={handleDesactivarSubmit}>
                  Sí, eliminar
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};
