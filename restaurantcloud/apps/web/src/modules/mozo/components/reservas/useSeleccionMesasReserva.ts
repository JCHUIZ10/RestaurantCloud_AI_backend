import { useCallback, useEffect, useRef, useState } from 'react';
import { MesaDisponibleReservaDTO } from '@/types/mozo';
import { mozoService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';

interface Parametros {
  /** Solo consulta mientras esté activo (modal abierto). Al desactivarse se limpia todo. */
  activo: boolean;
  /** Fecha (YYYY-MM-DD) y hora (HH:mm) de la reserva; sin ellas no hay mapa que mostrar. */
  fecha: string | null;
  hora: string | null;
  numPersonas: number;
  /** Al cambiar la mesa de una reserva existente: ella no cuenta como ocupante. */
  excluirReservaId?: string;
  /** Mesas con las que arranca la selección (la mesa actual de la reserva), si siguen disponibles. */
  mesasIniciales?: string[];
  onError: (mensaje: string) => void;
}

/**
 * Reglas del mini-mapa de mesas de una reserva: disponibilidad según el servidor, selección,
 * agrupación y capacidad. Las comparten "Nueva reserva" y "Cambiar mesa" para no duplicarlas.
 */
export function useSeleccionMesasReserva({
  activo,
  fecha,
  hora,
  numPersonas,
  excluirReservaId,
  mesasIniciales,
  onError,
}: Parametros) {
  const [mesasMapa, setMesasMapa] = useState<MesaDisponibleReservaDTO[]>([]);
  const [bloqueoHorario, setBloqueoHorario] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [seleccionIds, setSeleccionIds] = useState<string[]>([]);
  // Motivo por el que no se pudo agregar la última mesa tocada
  const [avisoMesas, setAvisoMesas] = useState<string | null>(null);
  // Fuerza una nueva consulta de disponibilidad (p. ej. tras un conflicto detectado por el servidor)
  const [versionConsulta, setVersionConsulta] = useState(0);
  const recargar = useCallback(() => setVersionConsulta((v) => v + 1), []);

  // Descarta respuestas de consultas que ya no corresponden a la selección actual
  const peticionRef = useRef(0);
  // Las mesas iniciales y el callback no deben relanzar la consulta
  const inicialesRef = useRef(mesasIniciales);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    inicialesRef.current = mesasIniciales;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!activo || !fecha || !hora) {
      peticionRef.current++;
      setMesasMapa([]);
      setSeleccionIds([]);
      setBloqueoHorario(null);
      setAvisoMesas(null);
      setCargando(false);
      return;
    }
    const peticion = ++peticionRef.current;
    setCargando(true);
    mozoService
      .obtenerMesasDisponiblesReserva(fecha, hora, numPersonas, excluirReservaId)
      .then((res) => {
        if (peticion !== peticionRef.current || !res.exito || !res.datos) return;
        const mesas = res.datos.mesas;
        setMesasMapa(mesas);
        setBloqueoHorario(res.datos.bloqueo_horario ?? null);
        setAvisoMesas(null);
        setSeleccionIds((prev) => {
          const candidatas = prev.length > 0 ? prev : (inicialesRef.current ?? []);
          const vigentes = candidatas.filter((id) => mesas.some((m) => m.mesa_id === id && m.disponible));
          const capacidadVigentes = vigentes.reduce(
            (acc, id) => acc + (mesas.find((m) => m.mesa_id === id)?.capacidad ?? 0),
            0
          );
          if (vigentes.length > 0 && capacidadVigentes >= numPersonas) return vigentes;
          // Solo se propone una mesa que alcance por sí sola; si ninguna alcanza, el mozo agrupa mesas
          const unaQueAlcanza = mesas.find((m) => m.disponible && m.capacidad >= numPersonas);
          return unaQueAlcanza ? [unaQueAlcanza.mesa_id] : vigentes;
        });
      })
      .catch((error) => {
        if (peticion !== peticionRef.current) return;
        setMesasMapa([]);
        onErrorRef.current(mensajeDeErrorApi(error, 'No se pudo consultar la disponibilidad de mesas.'));
      })
      .finally(() => {
        if (peticion === peticionRef.current) setCargando(false);
      });
  }, [activo, fecha, hora, numPersonas, excluirReservaId, versionConsulta]);

  const alternarMesa = useCallback(
    (mesa: MesaDisponibleReservaDTO) => {
      if (!mesa.disponible) return;
      setAvisoMesas(null);

      // Tocar una mesa elegida la quita
      if (seleccionIds.includes(mesa.mesa_id)) {
        setSeleccionIds(seleccionIds.filter((id) => id !== mesa.mesa_id));
        return;
      }

      // Una mesa que alcanza por sí sola reemplaza la selección
      if (mesa.capacidad >= numPersonas) {
        setSeleccionIds([mesa.mesa_id]);
        return;
      }

      // Si no alcanza, se agrupa con las ya elegidas, siempre que todas permitan unión
      const actuales = mesasMapa.filter((m) => seleccionIds.includes(m.mesa_id));
      if (actuales.reduce((acc, m) => acc + m.capacidad, 0) >= numPersonas) {
        setAvisoMesas(`Las mesas elegidas ya cubren a ${numPersonas} personas. Quita una para elegir otra.`);
        return;
      }
      const fija = [...actuales, mesa].find((m) => !m.permite_union);
      if (fija) {
        setAvisoMesas(`La Mesa ${fija.numero} no permite unirse con otras mesas, así que no se puede agrupar.`);
        return;
      }
      setSeleccionIds([...seleccionIds, mesa.mesa_id]);
    },
    [seleccionIds, mesasMapa, numPersonas]
  );

  const mesasElegidas = mesasMapa.filter((m) => seleccionIds.includes(m.mesa_id));
  const capacidadTotal = mesasElegidas.reduce((acc, m) => acc + m.capacidad, 0);
  const etiquetaMesas =
    mesasElegidas.length > 1
      ? `Mesa [ ${mesasElegidas.map((m) => m.numero).join(' ; ')} ]`
      : mesasElegidas.length === 1
      ? `Mesa ${mesasElegidas[0].numero}`
      : 'Ninguna';

  // Regla de capacidad: las mesas elegidas deben alcanzar para el grupo y, si son varias, permitir unión
  const capacidadSuficiente = capacidadTotal >= numPersonas;
  const unionValida = mesasElegidas.length <= 1 || mesasElegidas.every((m) => m.permite_union);

  return {
    mesasMapa,
    bloqueoHorario,
    cargando,
    seleccionIds,
    avisoMesas,
    alternarMesa,
    recargar,
    mesasElegidas,
    capacidadTotal,
    etiquetaMesas,
    capacidadSuficiente,
    unionValida,
  };
}

export type SeleccionMesasReserva = ReturnType<typeof useSeleccionMesasReserva>;
