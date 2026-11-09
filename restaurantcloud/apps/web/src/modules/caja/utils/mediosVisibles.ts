/**
 * Códigos de medio de pago condicionables en las vistas de cierre de turno.
 * El efectivo no está aquí porque siempre se muestra (la gaveta siempre se cuadra).
 */
export type MedioCondicionable = 'tarjeta' | 'billetera_digital';

/**
 * Indica si la fila de un medio debe dibujarse. `medios_visibles` lo calcula el backend (medio activo
 * o con cobros en el turno). Si la lista no viene (reportes Z cerrados antes de esta regla) se muestran
 * todos, para no cambiar lo que ya se cerró. Solo oculta la fila: los totales no dependen de esto.
 */
export const esMedioVisible = (
  mediosVisibles: string[] | undefined,
  codigo: MedioCondicionable
): boolean => !mediosVisibles || mediosVisibles.includes(codigo);
