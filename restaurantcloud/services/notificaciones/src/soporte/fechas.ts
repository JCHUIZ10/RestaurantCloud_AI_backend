/**
 * Fechas en ISO 8601 con la zona horaria explícita (`2026-11-16T21:40:11-05:00`), como pide el
 * README de los servicios. `Date.toISOString()` siempre da UTC con `Z`; aquí se calcula el
 * desplazamiento real de la zona en ese instante con `Intl`, sin dependencias.
 */

const formateadores = new Map<string, Intl.DateTimeFormat>();

function formateador(zona: string): Intl.DateTimeFormat {
  let f = formateadores.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formateadores.set(zona, f);
  }
  return f;
}

export function instanteConZona(fecha: Date, zona: string): string {
  const partes: Record<string, string> = {};
  for (const parte of formateador(zona).formatToParts(fecha)) {
    partes[parte.type] = parte.value;
  }
  const { year, month, day, hour, minute, second } = partes as Record<
    'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    string
  >;

  // La hora local leída como si fuera UTC, menos el instante real, es el desplazamiento de la zona.
  const comoUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  const instanteSinMs = Math.floor(fecha.getTime() / 1000) * 1000;
  const minutos = Math.round((comoUtc - instanteSinMs) / 60_000);

  const signo = minutos < 0 ? '-' : '+';
  const absoluto = Math.abs(minutos);
  const hh = String(Math.floor(absoluto / 60)).padStart(2, '0');
  const mm = String(absoluto % 60).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${signo}${hh}:${mm}`;
}
