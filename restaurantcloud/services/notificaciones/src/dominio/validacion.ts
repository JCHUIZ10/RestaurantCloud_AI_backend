/**
 * Validación de los datos de los eventos con el mismo vocabulario que los contratos de
 * `doc-2u/servicios/contratos/` (uuid, string, int, number, bool, date, datetime), sin dependencias.
 *
 * Reglas:
 * - Un campo `nulo` puede valer `null` o faltar; uno que no lo es debe estar y tener valor.
 * - Los campos que el esquema no menciona se ignoran: agregar un campo opcional a un evento no lo
 *   rompe (doc-2u/servicios/README.md, sección 4).
 * - Se devuelven **todos** los errores a la vez, con la ruta de cada campo, para que el 422 diga qué
 *   arreglar.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Fecha y hora ISO 8601 con zona obligatoria (Z o ±hh:mm); sin zona sería ambigua.
const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;

export type TipoCampo =
  | 'uuid'
  | 'texto'
  | 'entero'
  | 'numero'
  | 'booleano'
  | 'instante'
  | 'dia'
  | { valores: readonly string[] }
  | { lista: Esquema; minimo?: number };

export interface Campo {
  tipo: TipoCampo;
  nulo?: boolean;
}

export type Esquema = Record<string, Campo>;

export interface ErrorCampo {
  campo: string;
  motivo: string;
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function fechaReal(texto: string): boolean {
  return !Number.isNaN(new Date(texto).getTime());
}

function validarValor(valor: unknown, tipo: TipoCampo, ruta: string, errores: ErrorCampo[]): void {
  const error = (motivo: string) => errores.push({ campo: ruta, motivo });

  if (typeof tipo === 'object') {
    if ('valores' in tipo) {
      if (typeof valor !== 'string' || !tipo.valores.includes(valor)) {
        error(`debe ser uno de: ${tipo.valores.join(', ')}`);
      }
      return;
    }
    if (!Array.isArray(valor)) {
      error('debe ser una lista');
      return;
    }
    if (valor.length < (tipo.minimo ?? 0)) {
      error(`debe tener al menos ${tipo.minimo} elemento(s)`);
    }
    valor.forEach((elemento, i) => {
      if (!esObjeto(elemento)) {
        errores.push({ campo: `${ruta}[${i}]`, motivo: 'debe ser un objeto' });
        return;
      }
      validarObjeto(elemento, tipo.lista, `${ruta}[${i}]`, errores);
    });
    return;
  }

  switch (tipo) {
    case 'uuid':
      if (typeof valor !== 'string' || !UUID.test(valor)) error('debe ser un uuid');
      return;
    case 'texto':
      if (typeof valor !== 'string' || valor.trim() === '') error('debe ser un texto no vacío');
      return;
    case 'entero':
      if (typeof valor !== 'number' || !Number.isInteger(valor)) error('debe ser un entero');
      return;
    case 'numero':
      if (typeof valor !== 'number' || !Number.isFinite(valor)) error('debe ser un número');
      return;
    case 'booleano':
      if (typeof valor !== 'boolean') error('debe ser verdadero o falso');
      return;
    case 'instante':
      if (typeof valor !== 'string' || !INSTANTE.test(valor) || !fechaReal(valor)) {
        error('debe ser una fecha y hora ISO 8601 con zona horaria');
      }
      return;
    case 'dia':
      if (typeof valor !== 'string' || !DIA.test(valor) || !fechaReal(`${valor}T00:00:00Z`)) {
        error('debe ser un día AAAA-MM-DD');
      }
      return;
  }
}

export function validarObjeto(
  objeto: Record<string, unknown>,
  esquema: Esquema,
  prefijo = '',
  errores: ErrorCampo[] = [],
): ErrorCampo[] {
  for (const [nombre, campo] of Object.entries(esquema)) {
    const ruta = prefijo ? `${prefijo}.${nombre}` : nombre;
    const valor = objeto[nombre];
    if (valor === undefined || valor === null) {
      if (!campo.nulo) {
        errores.push({ campo: ruta, motivo: valor === undefined ? 'es obligatorio' : 'no puede ser nulo' });
      }
      continue;
    }
    validarValor(valor, campo.tipo, ruta, errores);
  }
  return errores;
}
