/**
 * Reparto en memoria de los avisos nuevos a las conexiones SSE abiertas (ficha, sección 3).
 *
 * Cada conexión se registra con su contexto de bandeja; al guardarse avisos nuevos, cada uno se envía
 * solo a las conexiones para las que `esVisible` (la misma regla de la bandeja) lo permite. Es por
 * proceso: con más de una instancia haría falta un canal común (ficha, sección 7).
 */

import type { WithId } from 'mongodb';
import { esVisible, type ContextoBandeja } from '../datos/bandeja.js';
import type { DocAviso } from '../datos/avisos.js';

export type EnviarAviso = (aviso: WithId<DocAviso>) => void;

interface Conexion {
  ctx: ContextoBandeja;
  enviar: EnviarAviso;
}

export class Reparto {
  private readonly conexiones = new Set<Conexion>();

  /** Registra una conexión y devuelve la función que la da de baja. */
  registrar(ctx: ContextoBandeja, enviar: EnviarAviso): () => void {
    const conexion: Conexion = { ctx, enviar };
    this.conexiones.add(conexion);
    return () => {
      this.conexiones.delete(conexion);
    };
  }

  get abiertas(): number {
    return this.conexiones.size;
  }

  /** Envía cada aviso a las conexiones que lo pueden ver. Un fallo en una no afecta a las demás. */
  repartir(avisos: WithId<DocAviso>[], alFallar: (error: unknown) => void = () => {}): void {
    for (const aviso of avisos) {
      for (const conexion of [...this.conexiones]) {
        try {
          if (esVisible(aviso, conexion.ctx)) conexion.enviar(aviso);
        } catch (error) {
          alFallar(error);
        }
      }
    }
  }
}
