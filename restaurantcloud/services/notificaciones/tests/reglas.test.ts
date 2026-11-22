/**
 * Reglas de evento a aviso (ficha, sección 4), sin base de datos. Se comprueba a quién va cada
 * aviso, con qué severidad y que el texto lleva los datos del evento.
 */

import { describe, expect, it } from 'vitest';
import { ESQUEMAS_V1, type TipoEvento } from '../src/dominio/eventos.js';
import { avisosDe, FALTANTE_CRITICO, recortar, soles, type AvisoNuevo } from '../src/dominio/reglas.js';
import { validarObjeto } from '../src/dominio/validacion.js';
import { MOZO } from './ayudas.js';
import * as e from './ejemplos.js';

const destinos = (avisos: AvisoNuevo[]) =>
  avisos.map((a) => (a.destinatario.tipo === 'rol' ? `rol:${a.destinatario.rol}` : `usuario:${a.destinatario.usuario_id}`));

describe('los ejemplos de las pruebas cumplen su esquema', () => {
  it.each(Object.entries(e.EJEMPLOS))('%s', (tipo, datos) => {
    expect(validarObjeto(datos, ESQUEMAS_V1[tipo as TipoEvento])).toEqual([]);
  });
});

describe('comprobante.anulado', () => {
  it('avisa al administrador con quién anuló y el monto', () => {
    const avisos = avisosDe('comprobante.anulado', e.COMPROBANTE_ANULADO);
    expect(destinos(avisos)).toEqual(['rol:admin_local']);
    expect(avisos[0]).toMatchObject({
      severidad: 'alerta',
      titulo: 'Comprobante anulado',
      mensaje: 'Carlos Ríos anuló un comprobante por S/ 75.00.',
    });
    expect(avisos[0]!.datos).toMatchObject({ comprobante_id: e.COMPROBANTE_ANULADO.comprobante_id, total: 75 });
  });

  it('sin nombre de quien anuló, no deja un hueco en el texto', () => {
    const [aviso] = avisosDe('comprobante.anulado', { ...e.COMPROBANTE_ANULADO, anulado_por_nombre: null });
    expect(aviso!.mensaje).toBe('Alguien del personal anuló un comprobante por S/ 75.00.');
  });
});

describe('pedido.anulado', () => {
  it('un plato sin preparar avisa solo al administrador', () => {
    const avisos = avisosDe('pedido.anulado', e.PEDIDO_ANULADO);
    expect(destinos(avisos)).toEqual(['rol:admin_local']);
    expect(avisos[0]).toMatchObject({
      severidad: 'alerta',
      titulo: 'Plato anulado antes del cobro',
      mensaje: 'Carlos Ríos anuló 1 × Lomo saltado (S/ 38.00) de la comanda de Lucía Paredes.',
    });
  });

  it('un plato ya preparado avisa además a cocina, como crítico', () => {
    const avisos = avisosDe('pedido.anulado', { ...e.PEDIDO_ANULADO, es_merma: true });
    expect(destinos(avisos)).toEqual(['rol:admin_local', 'rol:cocina']);
    expect(avisos[0]!.severidad).toBe('alerta');
    expect(avisos[1]).toMatchObject({
      severidad: 'critica',
      titulo: 'Plato anulado ya preparado',
      mensaje: 'Se anuló 1 × Lomo saltado que ya estaba preparado. Detener o descartar.',
    });
  });

  it('una comanda completa usa su propio título y no nombra un plato', () => {
    const [aviso] = avisosDe('pedido.anulado', {
      ...e.PEDIDO_ANULADO,
      tipo_anulacion: 'comanda_completa',
      pedido_item_id: null,
      monto_total: 120.5,
    });
    expect(aviso!.titulo).toBe('Comanda anulada');
    expect(aviso!.mensaje).toBe('Carlos Ríos anuló la comanda de Lucía Paredes (S/ 120.50).');
  });

  it('sin mozo, el texto no menciona la comanda de nadie', () => {
    const [aviso] = avisosDe('pedido.anulado', { ...e.PEDIDO_ANULADO, mozo_nombre: null });
    expect(aviso!.mensaje).toBe('Carlos Ríos anuló 1 × Lomo saltado (S/ 38.00).');
  });
});

describe('pedido.item_sustituido', () => {
  it('avisa a cocina, como crítico, con la mesa y los dos platos', () => {
    const avisos = avisosDe('pedido.item_sustituido', e.PEDIDO_ITEM_SUSTITUIDO);
    expect(destinos(avisos)).toEqual(['rol:cocina']);
    expect(avisos[0]).toMatchObject({
      severidad: 'critica',
      titulo: 'Sustitución urgente: Mesa 4',
      mensaje: 'Ceviche clásico fue sustituido por Tiradito de pescado (2 ×). Prioridad en cocina.',
    });
  });
});

describe('producto.agotado', () => {
  it('avisa al administrador y a los mozos con el mismo texto', () => {
    const avisos = avisosDe('producto.agotado', e.PRODUCTO_AGOTADO);
    expect(destinos(avisos)).toEqual(['rol:admin_local', 'rol:mozo']);
    for (const aviso of avisos) {
      expect(aviso).toMatchObject({
        severidad: 'alerta',
        titulo: 'Plato agotado: Ceviche clásico',
        mensaje: 'Rosa Quispe marcó el plato como agotado en cocina. No ofrecerlo.',
      });
    }
  });

  it('tras resolver las órdenes en fuego, agrega el motivo', () => {
    const [aviso] = avisosDe('producto.agotado', {
      ...e.PRODUCTO_AGOTADO,
      causa: 'resolucion_fuego',
      motivo: 'Falta de pescado fresco',
    });
    expect(aviso!.mensaje).toBe(
      'Rosa Quispe marcó el plato como agotado en cocina. No ofrecerlo. Motivo: Falta de pescado fresco.',
    );
  });
});

describe('plato.listo', () => {
  it('es un aviso personal para el mozo de la comanda', () => {
    const avisos = avisosDe('plato.listo', e.PLATO_LISTO);
    expect(destinos(avisos)).toEqual([`usuario:${MOZO}`]);
    expect(avisos[0]).toMatchObject({
      severidad: 'info',
      titulo: 'Pedido listo: Mesa 4',
      mensaje: 'Listo para llevar: 2 × Lomo saltado.',
    });
  });

  it('nombra hasta 5 platos y resume el resto', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      pedido_item_id: `5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8${i}`,
      producto_nombre: `Plato ${i + 1}`,
      cantidad: 1,
    }));
    const [aviso] = avisosDe('plato.listo', { ...e.PLATO_LISTO, items });
    expect(aviso!.mensaje).toBe(
      'Listo para llevar: 1 × Plato 1, 1 × Plato 2, 1 × Plato 3, 1 × Plato 4, 1 × Plato 5 y 3 más.',
    );
    // El detalle completo queda en datos, para el desplegable de la bandeja.
    expect(aviso!.datos['items']).toHaveLength(8);
  });
});

describe('caja.turno_previo_pendiente', () => {
  it('avisa al administrador con el turno en tres cifras', () => {
    const avisos = avisosDe('caja.turno_previo_pendiente', e.CAJA_TURNO_PREVIO_PENDIENTE);
    expect(destinos(avisos)).toEqual(['rol:admin_local']);
    expect(avisos[0]).toMatchObject({
      severidad: 'alerta',
      titulo: 'Turno #007 pendiente de cierre',
      mensaje:
        'Jorge Salas no puede abrir turno: el Turno #007 de Ana Torres sigue abierto. Resuélvelo desde Administración de caja.',
    });
  });

  it('sin administrador en la sede, avisa al propietario', () => {
    const avisos = avisosDe('caja.turno_previo_pendiente', { ...e.CAJA_TURNO_PREVIO_PENDIENTE, hay_admin_local: false });
    expect(destinos(avisos)).toEqual(['rol:propietario']);
  });
});

describe('caja.cerrada', () => {
  it('con faltante avisa al administrador y al propietario', () => {
    const avisos = avisosDe('caja.cerrada', e.CAJA_CERRADA);
    expect(destinos(avisos)).toEqual(['rol:admin_local', 'rol:propietario']);
    expect(avisos[0]).toMatchObject({
      severidad: 'alerta',
      titulo: 'Cierre de caja con diferencia',
      mensaje: 'Turno #007 de Ana Torres: esperado S/ 500.00, contado S/ 450.00 (faltante de S/ 50.00).',
    });
  });

  it('un sobrante se nombra como sobrante', () => {
    const [aviso] = avisosDe('caja.cerrada', { ...e.CAJA_CERRADA, efectivo_contado: 512.3, discrepancia: 12.3 });
    expect(aviso!.mensaje).toContain('(sobrante de S/ 12.30)');
    expect(aviso!.severidad).toBe('alerta');
  });

  it(`un faltante de más de S/ ${FALTANTE_CRITICO} es crítico; justo ${FALTANTE_CRITICO}, no`, () => {
    const conFaltante = (d: number) => avisosDe('caja.cerrada', { ...e.CAJA_CERRADA, discrepancia: d })[0]!.severidad;
    expect(conFaltante(-100.01)).toBe('critica');
    expect(conFaltante(-100)).toBe('alerta');
    // Un sobrante grande no es crítico: no falta dinero.
    expect(conFaltante(250)).toBe('alerta');
  });

  it('sin diferencia no avisa, aunque llegue con decimales binarios', () => {
    expect(avisosDe('caja.cerrada', { ...e.CAJA_CERRADA, discrepancia: 0 })).toEqual([]);
    expect(avisosDe('caja.cerrada', { ...e.CAJA_CERRADA, discrepancia: 0.1 + 0.2 - 0.3 })).toEqual([]);
  });

  it('un cierre forzado lo dice', () => {
    const [aviso] = avisosDe('caja.cerrada', {
      ...e.CAJA_CERRADA,
      cierre_forzado: true,
      cerrado_por_nombre: 'Marta Díaz',
    });
    expect(aviso!.mensaje).toMatch(/Cierre forzado por Marta Díaz\.$/);
  });
});

describe('textos', () => {
  it('ningún aviso nombra datos de comensales', () => {
    // Los eventos no los traen; esta prueba falla si una regla empieza a copiar campos de cliente.
    for (const [tipo, datos] of Object.entries(e.EJEMPLOS)) {
      for (const aviso of avisosDe(tipo as TipoEvento, { ...datos, cliente_nombre: 'Juan Pérez', es_merma: true })) {
        expect(JSON.stringify(aviso)).not.toContain('Juan Pérez');
      }
    }
  });

  it('recorta títulos y mensajes largos sin pasar del límite del validador', () => {
    const [aviso] = avisosDe('producto.agotado', { ...e.PRODUCTO_AGOTADO, producto_nombre: 'Ceviche '.repeat(40) });
    expect(aviso!.titulo.length).toBeLessThanOrEqual(120);
    expect(aviso!.titulo.endsWith('…')).toBe(true);
    expect(recortar('  a   b  ', 10)).toBe('a b');
  });

  it('escribe los soles con dos decimales y sin signo', () => {
    expect(soles(75)).toBe('S/ 75.00');
    expect(soles(-12.345)).toBe('S/ 12.35');
  });
});
