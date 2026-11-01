/** Cambio pendiente sobre la foto del plato; se aplica al guardar. */
export interface SeleccionFotoPlato {
  /** Foto nueva ya comprimida, lista para subir */
  nueva: File | null;
  /** Quitar la foto que el plato ya tiene */
  quitar: boolean;
}

export const FOTO_SIN_CAMBIOS: SeleccionFotoPlato = { nueva: null, quitar: false };
