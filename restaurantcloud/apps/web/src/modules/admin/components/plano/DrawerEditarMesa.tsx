import React, { useState, useEffect } from 'react';
import { MesaAdminDTO, PisoAdminDTO, FormaMesa, ActualizarMesaRequest } from '@/types/admin';
import { Trash2, Check } from 'lucide-react';
import { Button, Drawer, EstadoBadge } from '@/components/ui';
import {
  AvisoFormulario,
  Campo,
  CampoSelect,
  CampoTexto,
  ContadorCapacidad,
  InterruptorUnion,
  SelectorForma,
} from './CamposPlano';

interface DrawerEditarMesaProps {
  mesa: MesaAdminDTO | null;
  pisos: PisoAdminDTO[];
  pisoNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (mesaId: string, payload: ActualizarMesaRequest) => Promise<void>;
  onDesactivar: (mesaId: string) => Promise<void>;
}

export const DrawerEditarMesa: React.FC<DrawerEditarMesaProps> = ({
  mesa,
  pisos,
  pisoNombre,
  isOpen,
  onClose,
  onGuardar,
  onDesactivar,
}) => {
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);
  const [forma, setForma] = useState<FormaMesa>('cuadrada');
  const [permiteUnion, setPermiteUnion] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmandoDesactivar, setConfirmandoDesactivar] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [pisoId, setPisoId] = useState('');
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    if (mesa) {
      setNumero(mesa.numero);
      setCapacidad(mesa.capacidad);
      setForma(mesa.forma);
      setPermiteUnion(mesa.permite_union);
      setPisoId(mesa.piso_id);
      setPosX(mesa.posicion_x);
      setPosY(mesa.posicion_y);
      setConfirmandoDesactivar(false);
      setErrorLocal(null);
    }
  }, [mesa]);

  if (!mesa) return null;
  const pisoDestino = pisos.find((p) => p.id === pisoId);
  const casillaOcupada = pisoDestino?.mesas.some((m) => m.id !== mesa.id && m.estado !== 'inactiva'
    && m.posicion_x === posX && m.posicion_y === posY);
  const posicionValida = pisoDestino && posX < pisoDestino.columnas && posY < pisoDestino.filas && !casillaOcupada;
  const puedeMover = !mesa.tiene_pedido_activo && !mesa.mesa_principal_id
    && !pisos.some((p) => p.mesas.some((m) => m.mesa_principal_id === mesa.id));

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !posicionValida) return;
    try {
      setErrorLocal(null);
      setIsSubmitting(true);
      await onGuardar(mesa.id, {
        numero,
        capacidad,
        forma,
        piso_id: pisoId,
        posicion_x: posX,
        posicion_y: posY,
        permite_union: permiteUnion,
      });
      onClose();
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesactivar = async () => {
    try {
      setErrorLocal(null);
      setIsDeleting(true);
      await onDesactivar(mesa.id);
    } catch (error) {
      setErrorLocal(error instanceof Error ? error.message : 'No se pudo desactivar la mesa.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Drawer
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!isSubmitting && !isDeleting}
      titulo={/^(mesa)/i.test(mesa.numero) ? mesa.numero : `Mesa ${mesa.numero}`}
      descripcion={
        <span className="flex items-center gap-2">
          {pisoNombre}
          {mesa.tiene_pedido_activo ? (
            <EstadoBadge tono="error">Ocupada</EstadoBadge>
          ) : (
            <EstadoBadge tono="ok">Libre</EstadoBadge>
          )}
        </span>
      }
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="editar-mesa-form"
            loading={isSubmitting}
            disabled={isDeleting || !numero.trim() || !posicionValida}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="editar-mesa-form" onSubmit={handleGuardar} className="space-y-6">
        {errorLocal && <AvisoFormulario tono="error">{errorLocal}</AvisoFormulario>}

        <Campo etiqueta="Número o código" ayuda="Así aparece en comandas y pre-cuentas.">
          {(id) => (
            <CampoTexto
              id={id}
              type="text"
              required
              maxLength={10}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="font-bold"
            />
          )}
        </Campo>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-aurea-navy">Capacidad</p>
          <ContadorCapacidad valor={capacidad} onCambiar={setCapacidad} />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-aurea-navy">Forma</p>
          <SelectorForma valor={forma} onCambiar={setForma} />
        </div>

        <InterruptorUnion activo={permiteUnion} onCambiar={setPermiteUnion} />

        <fieldset disabled={!puedeMover || isSubmitting} className="space-y-3 disabled:opacity-70">
          <legend className="text-sm font-semibold text-aurea-navy mb-1.5">Ubicación</legend>
          <Campo etiqueta="Ambiente">
            {(id) => (
              <CampoSelect
                id={id}
                value={pisoId}
                onChange={(e) => {
                  setPisoId(e.target.value);
                  setPosX(0);
                  setPosY(0);
                }}
              >
                {pisos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </CampoSelect>
            )}
          </Campo>
          {pisoDestino && (
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Columna">
                {(id) => (
                  <CampoSelect id={id} value={posX} onChange={(e) => setPosX(Number(e.target.value))}>
                    {Array.from({ length: pisoDestino.columnas }, (_, x) => <option key={x} value={x}>{x + 1}</option>)}
                  </CampoSelect>
                )}
              </Campo>
              <Campo etiqueta="Fila">
                {(id) => (
                  <CampoSelect id={id} value={posY} onChange={(e) => setPosY(Number(e.target.value))}>
                    {Array.from({ length: pisoDestino.filas }, (_, y) => <option key={y} value={y}>{y + 1}</option>)}
                  </CampoSelect>
                )}
              </Campo>
            </div>
          )}
          {!puedeMover && (
            <p className="text-xs text-estado-alerta-800">Cierra la comanda y separa el grupo antes de moverla.</p>
          )}
          {casillaOcupada && <AvisoFormulario tono="error">Esa casilla ya tiene una mesa.</AvisoFormulario>}
        </fieldset>

        <section className="p-4 rounded-xl border border-estado-error-200 bg-estado-error-50/60 space-y-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-estado-error-800">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Desactivar mesa
            </h3>
            <p className="text-sm text-aurea-navy/70 mt-1">Sale del plano; su historial de ventas se conserva.</p>
          </div>
          {!confirmandoDesactivar ? (
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={() => setConfirmandoDesactivar(true)}
              leftIcon={<Trash2 className="w-4 h-4" aria-hidden="true" />}
            >
              Desactivar
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-estado-error-800">¿Desactivar la mesa {mesa.numero}?</p>
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button variant="outline" disabled={isDeleting} onClick={() => setConfirmandoDesactivar(false)}>
                  No, mantener
                </Button>
                <Button variant="danger" loading={isDeleting} onClick={handleDesactivar}>
                  Sí, desactivar
                </Button>
              </div>
            </div>
          )}
        </section>
      </form>
    </Drawer>
  );
};
