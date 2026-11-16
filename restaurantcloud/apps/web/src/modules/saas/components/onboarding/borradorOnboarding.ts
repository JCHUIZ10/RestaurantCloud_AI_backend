/**
 * Borrador del wizard de alta manual B2B en sessionStorage.
 *
 * Protege contra la pérdida de datos por un refresh accidental, pero solo
 * recupera borradores con la forma actual del formulario y del mismo día:
 * un borrador antiguo podría traer fechas vencidas o campos que ya no existen.
 */
import { z } from 'zod';
import { hoyLocalStr } from '@/shared/utils';
import type { AltaManualTenantRequestDTO } from '@/types/saasTenants';

const CLAVE_BORRADOR = 'restaurantcloud_onboarding_draft_v2';
const CLAVES_OBSOLETAS = ['restaurantcloud_onboarding_draft_v1'];
const VERSION_BORRADOR = 2;

const FECHA_ISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const esquemaDatos = z.object({
  ruc: z.string(),
  razon_social: z.string(),
  direccion_sede: z.string().optional(),
  propietario_nombre: z.string(),
  propietario_email: z.string(),
  propietario_telefono: z.string(),
  plan_id: z.number().int().positive(),
  ciclo_facturacion: z.enum(['mensual', 'anual']),
  fecha_inicio: FECHA_ISO,
  fecha_fin_periodo: FECHA_ISO,
  monto_cobrado_pen: z.number().nonnegative(),
  origen_pago: z.enum(['stripe', 'transferencia_bancaria', 'deposito_bancario', 'yape_empresa', 'efectivo']),
  numero_operacion: z.string(),
  fecha_operacion: FECHA_ISO,
  nota_administrativa: z.string(),
}) satisfies z.ZodType<AltaManualTenantRequestDTO>;

const esquemaBorrador = z.object({
  version: z.literal(VERSION_BORRADOR),
  fecha: FECHA_ISO,
  datos: esquemaDatos,
});

/** Devuelve el borrador de hoy si es válido; en cualquier otro caso lo descarta y devuelve null. */
export function leerBorradorOnboarding(): AltaManualTenantRequestDTO | null {
  try {
    CLAVES_OBSOLETAS.forEach((clave) => sessionStorage.removeItem(clave));

    const guardado = sessionStorage.getItem(CLAVE_BORRADOR);
    if (!guardado) return null;

    const resultado = esquemaBorrador.safeParse(JSON.parse(guardado));
    if (resultado.success && resultado.data.fecha === hoyLocalStr()) {
      return resultado.data.datos;
    }

    sessionStorage.removeItem(CLAVE_BORRADOR);
    return null;
  } catch {
    // JSON corrupto o almacenamiento no disponible (modo privado, cuota, bloqueo)
    return null;
  }
}

export function guardarBorradorOnboarding(datos: AltaManualTenantRequestDTO): void {
  try {
    sessionStorage.setItem(
      CLAVE_BORRADOR,
      JSON.stringify({ version: VERSION_BORRADOR, fecha: hoyLocalStr(), datos })
    );
  } catch {
    // El borrador es una comodidad: si no se puede guardar, el wizard sigue funcionando
  }
}

export function borrarBorradorOnboarding(): void {
  try {
    sessionStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    // Sin acceso al almacenamiento no hay nada que borrar
  }
}
