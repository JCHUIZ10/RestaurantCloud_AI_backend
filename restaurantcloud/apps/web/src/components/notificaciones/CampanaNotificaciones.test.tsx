import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpcionesFlujo } from '@/services/api/flujoNotificaciones';
import type { AvisoDTO } from '@/types/notificaciones';
import { CampanaNotificaciones } from './CampanaNotificaciones';

// El directorio de sedes del propietario vive en el módulo de servicios del núcleo
const directorio = vi.hoisted(() => ({ getDirectorioLocales: vi.fn() }));
vi.mock('@/services/api/realApiServices', () => ({ realPropietarioLocalesService: directorio }));

let n = 0;
const aviso = (cambios: Partial<AvisoDTO> = {}): AvisoDTO => ({
  id: `a${++n}`,
  tipo: 'plato.listo',
  severidad: 'info',
  titulo: `Pedido listo: Mesa ${n}`,
  mensaje: 'Listo para llevar: 2 × Lomo saltado.',
  datos: { mesa_numero: String(n), items: [{ producto_nombre: 'Lomo saltado', cantidad: 2 }], fecha: '2026-11-22T13:42:00-05:00' },
  local_id: 'sede-1',
  leida: false,
  leida_en: null,
  creada_en: new Date().toISOString(),
  ...cambios,
});

const ok = <T,>(datos: T, meta?: Record<string, unknown>) => Promise.resolve({ exito: true, datos, meta });

/** Servidor falso: la bandeja vive en `bandeja` y el canal lo maneja la prueba con `canal`. */
function preparar(bandeja: AvisoDTO[]) {
  const estado = { bandeja: [...bandeja] };
  const servicio = {
    contador: vi.fn(() => {
      const sinLeer = estado.bandeja.filter((a) => !a.leida);
      return ok({ total: sinLeer.length, criticas: sinLeer.filter((a) => a.severidad === 'critica').length });
    }),
    listar: vi.fn(({ soloNoLeidas }: { soloNoLeidas: boolean; pagina?: number }) => {
      const lista = estado.bandeja.filter((a) => !soloNoLeidas || !a.leida);
      return ok(lista, { total: lista.length });
    }),
    marcarLeida: vi.fn((id: string) => {
      estado.bandeja = estado.bandeja.map((a) => (a.id === id ? { ...a, leida: true } : a));
      return ok({ id, leida: true });
    }),
    marcarTodasLeidas: vi.fn(() => {
      estado.bandeja = estado.bandeja.map((a) => ({ ...a, leida: true }));
      return ok({ afectadas: 0 });
    }),
  };
  const canal: { opciones: OpcionesFlujo | null; cerrar: ReturnType<typeof vi.fn> } = { opciones: null, cerrar: vi.fn() };
  const abrirFlujo = vi.fn((opciones: OpcionesFlujo) => {
    canal.opciones = opciones;
    return { cerrar: canal.cerrar };
  });
  const dependencias = { servicio, abrirFlujo } as never;
  return { estado, servicio, canal, dependencias };
}

const llega = async (canal: { opciones: OpcionesFlujo | null }, a: AvisoDTO) => {
  await act(async () => canal.opciones!.alAviso(a));
};

beforeEach(() => {
  n = 0;
  localStorage.clear();
  directorio.getDirectorioLocales.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('campana flotante de las terminales (mozo, cocina, caja)', () => {
  it('sin avisos sin leer no se muestra', async () => {
    const { dependencias, servicio } = preparar([]);
    render(<CampanaNotificaciones variante="flotante" dependencias={dependencias} />);
    await waitFor(() => expect(servicio.contador).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /notificaciones/i })).not.toBeInTheDocument();
  });

  it('con avisos sin leer se muestra con su contador, y el nombre accesible lo dice', async () => {
    const { dependencias } = preparar([aviso(), aviso(), aviso({ leida: true })]);
    render(<CampanaNotificaciones variante="flotante" dependencias={dependencias} />);
    const boton = await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' });
    expect(within(boton).getByTestId('insignia-avisos')).toHaveTextContent('2');
  });

  it('aparece cuando llega un aviso por el canal y se oculta al leerlos todos con el panel cerrado', async () => {
    const { dependencias, canal } = preparar([]);
    render(<CampanaNotificaciones variante="flotante" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    expect(screen.queryByRole('button', { name: /notificaciones/i })).not.toBeInTheDocument();

    await llega(canal, aviso());
    expect(await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /notificaciones/i }));
    await user.click(await screen.findByRole('button', { name: /marcar todas leídas|todas/i }));
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /notificaciones/i })).not.toBeInTheDocument());
  });

  it('con el panel abierto y todo leído, la campana sigue ahí (no desaparece bajo el dedo)', async () => {
    const { dependencias } = preparar([aviso()]);
    render(<CampanaNotificaciones variante="flotante" dependencias={dependencias} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await user.click(await screen.findByRole('button', { name: /marcar todas leídas|todas/i }));
    expect(screen.getByRole('button', { name: /^notificaciones/i })).toBeInTheDocument();
  });
});

describe('campana de administración y propietario', () => {
  it('«oscura» y «clara» están siempre a la vista, aunque no haya avisos', async () => {
    const { dependencias, servicio } = preparar([]);
    const { unmount } = render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await waitFor(() => expect(servicio.contador).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
    unmount();
    render(<CampanaNotificaciones variante="clara" dependencias={dependencias} />);
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
  });

  it('la insignia es roja con avisos críticos pendientes y cobre si no los hay', async () => {
    const { dependencias } = preparar([aviso({ severidad: 'critica' })]);
    const { unmount } = render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    expect(await screen.findByTestId('insignia-avisos')).toHaveClass('bg-estado-error-600');
    unmount();
    const otra = preparar([aviso({ severidad: 'alerta' })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={otra.dependencias} />);
    expect(await screen.findByTestId('insignia-avisos')).toHaveClass('bg-aurea-copper');
  });

  it('muestra «9+» cuando hay más de nueve', async () => {
    const { dependencias } = preparar(Array.from({ length: 12 }, () => aviso()));
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    expect(await screen.findByTestId('insignia-avisos')).toHaveTextContent('9+');
  });
});

describe('avisos flotantes', () => {
  it('un aviso crítico se anuncia de inmediato (role=alert) y se retira a los 6 s', async () => {
    const { dependencias, canal } = preparar([]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    vi.useFakeTimers();
    await llega(canal, aviso({ severidad: 'critica', titulo: 'Sustitución urgente: Mesa 4' }));

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Sustitución urgente: Mesa 4');
    expect(alerta).toHaveAttribute('aria-live', 'assertive');

    act(() => void vi.advanceTimersByTime(5900));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un aviso normal es discreto (role=status, cortés) y se retira a los 4 s', async () => {
    const { dependencias, canal } = preparar([]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    vi.useFakeTimers();
    await llega(canal, aviso({ titulo: 'Pedido listo: Mesa 2' }));

    const estado = screen.getByRole('status');
    expect(estado).toHaveTextContent('Pedido listo: Mesa 2');
    expect(estado).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(4100));
    expect(screen.queryByText('Pedido listo: Mesa 2')).not.toBeInTheDocument();
  });

  it('«Entendido» lo cierra al instante', async () => {
    const { dependencias, canal } = preparar([]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    await llega(canal, aviso({ severidad: 'critica' }));
    await userEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('el aviso flotante no toma el foco del teclado', async () => {
    const { dependencias, canal } = preparar([]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    const boton = screen.getByRole('button', { name: /notificaciones/i });
    boton.focus();
    await llega(canal, aviso({ severidad: 'critica' }));
    expect(boton).toHaveFocus();
  });
});

describe('panel', () => {
  it('abre con la campana, pide la bandeja y muestra los avisos sin leer', async () => {
    const { dependencias, servicio } = preparar([aviso({ titulo: 'Plato agotado: Ceviche' }), aviso({ leida: true, titulo: 'Ya leído' })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }));

    const panel = await screen.findByRole('dialog', { name: 'Notificaciones' });
    expect(await within(panel).findByText('Plato agotado: Ceviche')).toBeInTheDocument();
    expect(within(panel).queryByText('Ya leído')).not.toBeInTheDocument();
    expect(servicio.listar).toHaveBeenCalledWith({ pagina: 1, porPagina: 20, soloNoLeidas: true });
    expect(panel).toHaveAttribute('aria-modal', 'true');
  });

  it('«Todas» trae también los leídos', async () => {
    const { dependencias, servicio } = preparar([aviso({ titulo: 'Nuevo' }), aviso({ leida: true, titulo: 'Ya leído' })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }));
    await userEvent.click(await screen.findByRole('tab', { name: /todas/i }));
    expect(await screen.findByText('Ya leído')).toBeInTheDocument();
    expect(servicio.listar).toHaveBeenLastCalledWith({ pagina: 1, porPagina: 20, soloNoLeidas: false });
  });

  it('sin avisos pendientes muestra «¡Estás al día!»', async () => {
    const { dependencias } = preparar([aviso({ leida: true })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }));
    expect(await screen.findByText('¡Estás al día!')).toBeInTheDocument();
  });

  it('«Marcar leída» llama al servicio, baja el contador y saca el aviso de «No leídas»', async () => {
    const a = aviso({ titulo: 'Plato agotado: Ceviche' });
    const { dependencias, servicio } = preparar([a, aviso({ titulo: 'Otro' })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' }));
    const tarjeta = (await screen.findByText('Plato agotado: Ceviche')).closest('article')!;
    await userEvent.click(within(tarjeta).getByRole('button', { name: 'Marcar leída' }));

    expect(servicio.marcarLeida).toHaveBeenCalledWith(a.id);
    expect(screen.queryByText('Plato agotado: Ceviche')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notificaciones, 1 sin leer' })).toBeInTheDocument();
  });

  it('«Ver detalle» despliega los datos, marca el aviso como leído y lo deja a la vista', async () => {
    const a = aviso({ titulo: 'Pedido listo: Mesa 4' });
    const { dependencias, servicio } = preparar([a]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await userEvent.click(await screen.findByRole('button', { name: /ver detalle/i }));

    expect(screen.getByText('2 × Lomo saltado')).toBeInTheDocument();
    expect(screen.getByText('13:42')).toBeInTheDocument();
    expect(servicio.marcarLeida).toHaveBeenCalledWith(a.id);
    expect(screen.getByText('Pedido listo: Mesa 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ocultar detalle/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('«Marcar todas leídas» deja el contador en cero y muestra el estado al día', async () => {
    const { dependencias, servicio } = preparar([aviso(), aviso()]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' }));
    await userEvent.click(await screen.findByRole('button', { name: /marcar todas leídas/i }));

    expect(servicio.marcarTodasLeidas).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('¡Estás al día!')).toBeInTheDocument();
    expect(screen.queryByTestId('insignia-avisos')).not.toBeInTheDocument();
  });

  it('si el servidor no confirma que quedó leído, se vuelve a lo que dice el servidor', async () => {
    const a = aviso({ titulo: 'Plato agotado' });
    const { dependencias, servicio, estado } = preparar([a]);
    servicio.marcarLeida.mockImplementation(() => Promise.reject(new Error('sin red')));
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar leída' }));

    // El servidor sigue diciendo que está sin leer: reaparece en la lista y en el contador
    expect(estado.bandeja[0]?.leida).toBe(false);
    expect(await screen.findByText('Plato agotado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notificaciones, 1 sin leer' })).toBeInTheDocument();
  });

  it('«Cargar más» pide la página siguiente', async () => {
    const muchos = Array.from({ length: 25 }, (_, i) => aviso({ titulo: `Aviso ${i + 1}` }));
    const { dependencias, servicio } = preparar(muchos);
    servicio.listar.mockImplementation(({ pagina = 1 }: { soloNoLeidas: boolean; pagina?: number }) =>
      ok(muchos.slice((pagina - 1) * 20, pagina * 20), { total: muchos.length }),
    );
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cargar más (5)' }));
    expect(servicio.listar).toHaveBeenLastCalledWith({ pagina: 2, porPagina: 20, soloNoLeidas: true });
    expect(await screen.findByText('Aviso 25')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cargar más/i })).not.toBeInTheDocument();
  });

  it('si no carga la bandeja ofrece reintentar', async () => {
    const { dependencias, servicio } = preparar([aviso()]);
    servicio.listar.mockImplementationOnce(() => Promise.reject(new Error('sin red')));
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/Pedido listo/)).toBeInTheDocument();
  });

  it('un aviso que llega con el panel abierto aparece en la lista', async () => {
    const { dependencias, canal } = preparar([aviso({ leida: true })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }));
    await screen.findByText('¡Estás al día!');
    await llega(canal, aviso({ titulo: 'Plato agotado: Ceviche' }));
    expect(await screen.findByText('Plato agotado: Ceviche')).toBeInTheDocument();
    expect(screen.queryByText('¡Estás al día!')).not.toBeInTheDocument();
  });

  it('el pie dice si el canal está en vivo o caído', async () => {
    const { dependencias, canal } = preparar([]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }));
    await act(async () => canal.opciones!.alEstado('vivo'));
    expect(screen.getByText('En vivo')).toBeInTheDocument();
    await act(async () => canal.opciones!.alEstado('caido'));
    expect(screen.getByText(/Sin conexión en vivo · se revisa cada 30 s/)).toBeInTheDocument();
  });

  it('el propietario ve el nombre de la sede de cada aviso', async () => {
    localStorage.setItem('auth_usuario', JSON.stringify({ rol: 'propietario' }));
    const { useAuthStore } = await import('@/stores/authStore');
    useAuthStore.setState({ usuario: { rol: 'propietario' } as never });
    directorio.getDirectorioLocales.mockResolvedValue({ exito: true, datos: { locales: [{ id: 'sede-1', nombre: 'Miraflores' }] } });
    const { dependencias } = preparar([aviso({ local_id: 'sede-1' })]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    expect(await screen.findByText('Miraflores')).toBeInTheDocument();
    useAuthStore.setState({ usuario: null });
  });

  it('quien no es propietario no pide el directorio de sedes', async () => {
    const { dependencias } = preparar([aviso()]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await screen.findByRole('dialog');
    expect(directorio.getDirectorioLocales).not.toHaveBeenCalled();
  });
});

describe('teclado y foco', () => {
  it('Esc cierra el panel y el foco vuelve a la campana', async () => {
    const { dependencias } = preparar([aviso()]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notificaciones/i })).toHaveFocus();
  });

  it('Alt+N abre y cierra el panel, incluso con la campana flotante oculta', async () => {
    const { dependencias, servicio } = preparar([]);
    render(<CampanaNotificaciones variante="flotante" dependencias={dependencias} />);
    await waitFor(() => expect(servicio.contador).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /notificaciones/i })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyN', key: 'n', altKey: true });
    expect(await screen.findByRole('dialog', { name: 'Notificaciones' })).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'KeyN', key: 'ñ', altKey: true }); // con Alt, algunos teclados dan otro carácter
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('al abrir el panel el foco pasa a su título, y Tab no se escapa a la pantalla de atrás', async () => {
    const { dependencias } = preparar([aviso()]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    const panel = await screen.findByRole('dialog');
    expect(within(panel).getByRole('heading', { name: 'Notificaciones' })).toHaveFocus();

    const botones = within(panel).getAllByRole('button');
    botones[botones.length - 1]!.focus();
    await userEvent.tab();
    expect(panel.contains(document.activeElement)).toBe(true);
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('un clic fuera del panel lo cierra', async () => {
    const { dependencias } = preparar([aviso()]);
    const { container } = render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(await screen.findByRole('button', { name: /notificaciones/i }));
    await screen.findByRole('dialog');
    const velo = document.body.querySelector('.fixed.inset-0')!;
    await userEvent.click(velo);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

describe('canal en tiempo real', () => {
  it('se abre al montar y se cierra al desmontar (cerrar sesión o cambiar de pantalla)', async () => {
    const { dependencias, canal } = preparar([]);
    const { unmount } = render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    expect(canal.cerrar).not.toHaveBeenCalled();
    unmount();
    expect(canal.cerrar).toHaveBeenCalledTimes(1);
  });

  it('al reconectar se pone al día: vuelve a pedir el contador y, con el panel abierto, la bandeja', async () => {
    const { dependencias, canal, servicio, estado } = preparar([]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await userEvent.click(screen.getByRole('button', { name: /notificaciones/i }));
    await screen.findByText('¡Estás al día!');

    // Mientras el canal estuvo caído llegó un aviso que la campana no vio
    estado.bandeja.push(aviso({ titulo: 'Llegó con el canal caído' }));
    const contadores = servicio.contador.mock.calls.length;
    const listados = servicio.listar.mock.calls.length;
    await act(async () => canal.opciones!.alReconectar());

    expect(servicio.contador.mock.calls.length).toBeGreaterThan(contadores);
    expect(servicio.listar.mock.calls.length).toBeGreaterThan(listados);
    expect(await screen.findByText('Llegó con el canal caído')).toBeInTheDocument();
  });

  it('con el canal caído, el respaldo actualiza el contador', async () => {
    const { dependencias, canal, estado } = preparar([]);
    render(<CampanaNotificaciones variante="flotante" dependencias={dependencias} />);
    await waitFor(() => expect(canal.opciones).not.toBeNull());
    estado.bandeja.push(aviso());
    await act(async () => canal.opciones!.alRespaldo());
    expect(await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' })).toBeInTheDocument();
  });

  it('si el contador no responde, conserva el que ya mostraba', async () => {
    const { dependencias, servicio } = preparar([aviso()]);
    render(<CampanaNotificaciones variante="oscura" dependencias={dependencias} />);
    await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' });
    servicio.contador.mockImplementation(() => Promise.reject(new Error('sin red')));
    const { canal } = { canal: (dependencias as never as { abrirFlujo: { mock: { calls: [OpcionesFlujo][] } } }).abrirFlujo.mock.calls[0]![0] };
    await act(async () => canal.alRespaldo());
    expect(screen.getByRole('button', { name: 'Notificaciones, 1 sin leer' })).toBeInTheDocument();
  });
});
