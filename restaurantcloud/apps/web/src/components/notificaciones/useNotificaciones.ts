import { useCallback, useEffect, useReducer, useRef } from 'react';
import { abrirFlujoNotificaciones } from '@/services/api/flujoNotificaciones';
import { realNotificacionesService, type NotificacionesService } from '@/services/api/realNotificacionesService';
import type { AvisoDTO, ContadorAvisosDTO, EstadoCanal } from '@/types/notificaciones';

export type Pestana = 'no-leidas' | 'todas';

export interface ListaAvisos {
  avisos: AvisoDTO[];
  /** `null` mientras no se ha cargado la primera página */
  total: number | null;
  pagina: number;
  cargando: boolean;
  error: boolean;
}

/** Aviso flotante en pantalla: crítico 6 s y discreto 4 s (maqueta aprobada de CU-TRANS-01). */
export interface Flotante {
  aviso: AvisoDTO;
  ms: number;
}

export interface EstadoNotificaciones {
  contador: ContadorAvisosDTO;
  canal: EstadoCanal;
  abierto: boolean;
  pestana: Pestana;
  listas: Record<Pestana, ListaAvisos>;
  flotantes: Flotante[];
}

export const POR_PAGINA = 20;
const MAX_FLOTANTES = 3;
export const MS_FLOTANTE_CRITICO = 6000;
export const MS_FLOTANTE_DISCRETO = 4000;

const listaVacia = (): ListaAvisos => ({ avisos: [], total: null, pagina: 0, cargando: false, error: false });

export const estadoInicial = (): EstadoNotificaciones => ({
  contador: { total: 0, criticas: 0 },
  canal: 'conectando',
  abierto: false,
  pestana: 'no-leidas',
  listas: { 'no-leidas': listaVacia(), todas: listaVacia() },
  flotantes: [],
});

export type Accion =
  | { tipo: 'contador'; contador: ContadorAvisosDTO }
  | { tipo: 'canal'; canal: EstadoCanal }
  | { tipo: 'aviso'; aviso: AvisoDTO }
  | { tipo: 'abrir'; abierto: boolean }
  | { tipo: 'pestana'; pestana: Pestana }
  | { tipo: 'cargando'; pestana: Pestana }
  | { tipo: 'cargada'; pestana: Pestana; avisos: AvisoDTO[]; total: number; pagina: number }
  | { tipo: 'error-lista'; pestana: Pestana }
  | { tipo: 'leida'; id: string; quitar: boolean }
  | { tipo: 'todas-leidas' }
  | { tipo: 'cerrar-flotante'; id: string };

const conocido = (estado: EstadoNotificaciones, id: string) =>
  estado.listas['no-leidas'].avisos.some((a) => a.id === id) || estado.listas.todas.avisos.some((a) => a.id === id);

/** Quita los repetidos conservando el primero: un aviso puede llegar por el canal y por la página cargada. */
const sinRepetidos = (avisos: AvisoDTO[]) => {
  const vistos = new Set<string>();
  return avisos.filter((a) => (vistos.has(a.id) ? false : (vistos.add(a.id), true)));
};

export function reducir(estado: EstadoNotificaciones, accion: Accion): EstadoNotificaciones {
  switch (accion.tipo) {
    case 'contador':
      return { ...estado, contador: accion.contador };
    case 'canal':
      return { ...estado, canal: accion.canal };
    case 'abrir':
      return { ...estado, abierto: accion.abierto };
    case 'pestana':
      return { ...estado, pestana: accion.pestana };
    case 'cargando':
      return { ...estado, listas: { ...estado.listas, [accion.pestana]: { ...estado.listas[accion.pestana], cargando: true, error: false } } };
    case 'error-lista':
      return { ...estado, listas: { ...estado.listas, [accion.pestana]: { ...estado.listas[accion.pestana], cargando: false, error: true } } };
    case 'cargada': {
      const anterior = estado.listas[accion.pestana];
      // La primera página reemplaza la lista (puesta al día); las siguientes se agregan al final
      const avisos = accion.pagina === 1 ? accion.avisos : sinRepetidos([...anterior.avisos, ...accion.avisos]);
      return {
        ...estado,
        listas: { ...estado.listas, [accion.pestana]: { avisos, total: accion.total, pagina: accion.pagina, cargando: false, error: false } },
      };
    }
    case 'aviso': {
      const { aviso } = accion;
      if (conocido(estado, aviso.id)) return estado;
      const contador = {
        total: estado.contador.total + 1,
        criticas: estado.contador.criticas + (aviso.severidad === 'critica' ? 1 : 0),
      };
      // Solo se toca una lista que ya se cargó: una vacía sin cargar se pedirá completa al abrir el panel
      const agregar = (lista: ListaAvisos): ListaAvisos =>
        lista.total === null ? lista : { ...lista, avisos: [aviso, ...lista.avisos], total: lista.total + 1 };
      // Con el panel abierto el aviso aparece en la lista; el flotante solo hace falta si no se está mirando
      // la bandeja o si es crítico (los críticos siempre se anuncian)
      const flotante = !estado.abierto || aviso.severidad === 'critica';
      const flotantes = flotante
        ? [{ aviso, ms: aviso.severidad === 'critica' ? MS_FLOTANTE_CRITICO : MS_FLOTANTE_DISCRETO }, ...estado.flotantes].slice(0, MAX_FLOTANTES)
        : estado.flotantes;
      return {
        ...estado,
        contador,
        flotantes,
        listas: { 'no-leidas': agregar(estado.listas['no-leidas']), todas: agregar(estado.listas.todas) },
      };
    }
    case 'leida': {
      const objetivo = [...estado.listas['no-leidas'].avisos, ...estado.listas.todas.avisos].find((a) => a.id === accion.id);
      if (!objetivo || objetivo.leida) return estado;
      const noLeidas = estado.listas['no-leidas'];
      const marcar = (a: AvisoDTO) => (a.id === accion.id ? { ...a, leida: true } : a);
      return {
        ...estado,
        contador: {
          total: Math.max(0, estado.contador.total - 1),
          criticas: Math.max(0, estado.contador.criticas - (objetivo.severidad === 'critica' ? 1 : 0)),
        },
        listas: {
          // «Marcar leída» saca el aviso de «No leídas». Abrir su detalle lo marca pero lo deja a la vista, para no
          // cerrarlo bajo los ojos de quien lo está leyendo; sale al volver a abrir el panel.
          'no-leidas': accion.quitar
            ? { ...noLeidas, avisos: noLeidas.avisos.filter((a) => a.id !== accion.id), total: noLeidas.total === null ? null : Math.max(0, noLeidas.total - 1) }
            : { ...noLeidas, avisos: noLeidas.avisos.map(marcar) },
          todas: { ...estado.listas.todas, avisos: estado.listas.todas.avisos.map(marcar) },
        },
      };
    }
    case 'todas-leidas':
      return {
        ...estado,
        contador: { total: 0, criticas: 0 },
        listas: {
          'no-leidas': { ...estado.listas['no-leidas'], avisos: [], total: estado.listas['no-leidas'].total === null ? null : 0 },
          todas: { ...estado.listas.todas, avisos: estado.listas.todas.avisos.map((a) => (a.leida ? a : { ...a, leida: true })) },
        },
      };
    case 'cerrar-flotante':
      return { ...estado, flotantes: estado.flotantes.filter((f) => f.aviso.id !== accion.id) };
  }
}

export interface DependenciasNotificaciones {
  servicio: NotificacionesService;
  abrirFlujo: typeof abrirFlujoNotificaciones;
}

const porDefecto: DependenciasNotificaciones = { servicio: realNotificacionesService, abrirFlujo: abrirFlujoNotificaciones };

/**
 * Estado de la campana: contador, bandeja, canal en tiempo real y avisos flotantes. Se monta una sola vez por
 * pantalla; al desmontarse (cerrar sesión, cambiar de layout) cierra el canal.
 */
export function useNotificaciones(deps: DependenciasNotificaciones = porDefecto) {
  const [estado, despachar] = useReducer(reducir, undefined, estadoInicial);
  const { servicio, abrirFlujo } = deps;

  // Las funciones del canal viven más que un render: leen el estado vigente por referencia
  const ultimo = useRef(estado);
  ultimo.current = estado;

  const refrescarContador = useCallback(async () => {
    try {
      const r = await servicio.contador();
      if (r.exito) despachar({ tipo: 'contador', contador: r.datos });
    } catch {
      // Sin respuesta: se conserva el contador que ya se mostraba
    }
  }, [servicio]);

  const cargarPagina = useCallback(
    async (pestana: Pestana, pagina: number) => {
      despachar({ tipo: 'cargando', pestana });
      try {
        const r = await servicio.listar({ pagina, porPagina: POR_PAGINA, soloNoLeidas: pestana === 'no-leidas' });
        if (!r.exito) throw new Error('listar');
        despachar({ tipo: 'cargada', pestana, avisos: r.datos, total: r.meta?.total ?? r.datos.length, pagina });
      } catch {
        despachar({ tipo: 'error-lista', pestana });
      }
    },
    [servicio],
  );

  useEffect(() => {
    void refrescarContador();
    const flujo = abrirFlujo({
      alAviso: (aviso) => despachar({ tipo: 'aviso', aviso }),
      alEstado: (canal) => despachar({ tipo: 'canal', canal }),
      // Lo que llegó mientras el canal estuvo cerrado se recupera con el contador y la bandeja
      alReconectar: () => {
        void refrescarContador();
        if (ultimo.current.abierto) void cargarPagina(ultimo.current.pestana, 1);
      },
      alRespaldo: () => void refrescarContador(),
    });
    return () => flujo.cerrar();
  }, [abrirFlujo, refrescarContador, cargarPagina]);

  // Al abrir el panel o cambiar de pestaña se pide la primera página: siempre fresca
  useEffect(() => {
    if (estado.abierto) void cargarPagina(estado.pestana, 1);
  }, [estado.abierto, estado.pestana, cargarPagina]);

  const abrir = useCallback((abierto: boolean) => despachar({ tipo: 'abrir', abierto }), []);
  const alternar = useCallback(() => despachar({ tipo: 'abrir', abierto: !ultimo.current.abierto }), []);
  const cambiarPestana = useCallback((pestana: Pestana) => despachar({ tipo: 'pestana', pestana }), []);
  const cerrarFlotante = useCallback((id: string) => despachar({ tipo: 'cerrar-flotante', id }), []);

  const cargarMas = useCallback(() => {
    const { pestana, listas } = ultimo.current;
    return cargarPagina(pestana, listas[pestana].pagina + 1);
  }, [cargarPagina]);

  const recargar = useCallback(() => cargarPagina(ultimo.current.pestana, 1), [cargarPagina]);

  const marcarLeida = useCallback(
    async (id: string, quitarDeNoLeidas = true) => {
      despachar({ tipo: 'leida', id, quitar: quitarDeNoLeidas });
      try {
        const r = await servicio.marcarLeida(id);
        if (!r.exito) throw new Error('marcar');
      } catch {
        // No quedó guardado: se vuelve a lo que dice el servidor
        void refrescarContador();
        void cargarPagina(ultimo.current.pestana, 1);
      }
    },
    [servicio, refrescarContador, cargarPagina],
  );

  const marcarTodasLeidas = useCallback(async () => {
    despachar({ tipo: 'todas-leidas' });
    try {
      const r = await servicio.marcarTodasLeidas();
      if (!r.exito) throw new Error('marcar');
    } catch {
      void refrescarContador();
      void cargarPagina(ultimo.current.pestana, 1);
    }
  }, [servicio, refrescarContador, cargarPagina]);

  return { estado, abrir, alternar, cambiarPestana, cargarMas, recargar, marcarLeida, marcarTodasLeidas, cerrarFlotante };
}
