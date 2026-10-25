import { UtensilsCrossed, ChefHat, Banknote, type LucideIcon } from 'lucide-react';
import { RolEmpleadoOperativo } from '@/types/admin';

/**
 * Identidad de color de cada rol operativo: azul salón, ámbar cocina, verde caja.
 * Se repite en pestañas, etiquetas, avatares y selector para que el rol se reconozca de un vistazo.
 */
export interface EstiloRol {
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
  /** Etiqueta de la tabla */
  tag: string;
  /** Icono sobre fondo claro */
  iconoColor: string;
  /** Avatar con iniciales */
  avatar: string;
  /** Pestaña activa / inactiva y su contador */
  pestanaActiva: string;
  pestanaInactiva: string;
  conteoInactivo: string;
  /** Tarjeta del selector de rol */
  opcionActiva: string;
  radio: string;
}

export const ROLES_PERSONAL: Record<RolEmpleadoOperativo, EstiloRol> = {
  mozo: {
    etiqueta: 'Mozo',
    descripcion: 'Mesas, comandas y pedidos de salón',
    icono: UtensilsCrossed,
    tag: 'bg-blue-50 text-blue-800 border-blue-200',
    iconoColor: 'text-blue-600',
    avatar: 'bg-blue-100 text-blue-800 ring-blue-200',
    pestanaActiva: 'bg-blue-600 text-white border-blue-600',
    pestanaInactiva: 'bg-white text-blue-900/80 border-blue-200 hover:bg-blue-50',
    conteoInactivo: 'bg-blue-100 text-blue-800',
    opcionActiva: 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20',
    radio: 'border-blue-600 bg-blue-600',
  },
  cocina: {
    etiqueta: 'Cocina',
    descripcion: 'Pantalla de cocina, tiempos y despacho',
    icono: ChefHat,
    tag: 'bg-amber-50 text-amber-900 border-amber-200',
    iconoColor: 'text-amber-600',
    avatar: 'bg-amber-100 text-amber-900 ring-amber-200',
    pestanaActiva: 'bg-amber-600 text-white border-amber-600',
    pestanaInactiva: 'bg-white text-amber-950/80 border-amber-200 hover:bg-amber-50',
    conteoInactivo: 'bg-amber-100 text-amber-900',
    opcionActiva: 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20',
    radio: 'border-amber-600 bg-amber-600',
  },
  cajero: {
    etiqueta: 'Caja',
    descripcion: 'Cobros, comprobantes y arqueo',
    icono: Banknote,
    tag: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    iconoColor: 'text-emerald-600',
    avatar: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
    pestanaActiva: 'bg-emerald-600 text-white border-emerald-600',
    pestanaInactiva: 'bg-white text-emerald-950/80 border-emerald-200 hover:bg-emerald-50',
    conteoInactivo: 'bg-emerald-100 text-emerald-900',
    opcionActiva: 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20',
    radio: 'border-emerald-600 bg-emerald-600',
  },
};

export const ORDEN_ROLES: RolEmpleadoOperativo[] = ['mozo', 'cocina', 'cajero'];

export const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
