import { describe, expect, it } from 'vitest';
import { ErrorConfiguracion, leerConfig } from '../src/config.js';

const minimo = {
  MONGODB_URI: 'mongodb://mongo:27017',
  MONGODB_DB: 'notificaciones_db',
  SECRETO_INTERNO: 'secreto',
};

describe('leerConfig', () => {
  it('aplica los valores por defecto de la ficha', () => {
    const config = leerConfig(minimo);
    expect(config.port).toBe(8003);
    expect(config.diasRetencion).toBe(30);
    expect(config.latidoSegundos).toBe(25);
    expect(config.firmaToleranciaSegundos).toBe(300);
    expect(config.jwtToleranciaSegundos).toBe(30);
    expect(config.jwtEmisor).toBe('restaurantcloud-nucleo');
    expect(config.jwtAudiencia).toBe('restaurantcloud-servicios');
    expect(config.jwtPublicKey).toBeNull();
    expect(config.zonaHoraria).toBe('America/Lima');
    // El usuario se autentica por defecto contra la base del servicio.
    expect(config.mongodbAuthSource).toBe('notificaciones_db');
  });

  it('lista todas las variables obligatorias que faltan en un solo error', () => {
    expect(() => leerConfig({})).toThrowError(ErrorConfiguracion);
    try {
      leerConfig({ PORT: '8003' });
    } catch (error) {
      const mensaje = (error as Error).message;
      expect(mensaje).toContain('Falta MONGODB_URI.');
      expect(mensaje).toContain('Falta MONGODB_DB.');
      expect(mensaje).toContain('Falta SECRETO_INTERNO.');
    }
  });

  it('trata una variable vacía o con espacios como ausente', () => {
    expect(() => leerConfig({ ...minimo, SECRETO_INTERNO: '   ' })).toThrowError(/SECRETO_INTERNO/);
  });

  it.each([
    ['PORT', 'ocho'],
    ['DIAS_RETENCION', '0'],
    ['DIAS_RETENCION', '-5'],
    ['LATIDO_SEGUNDOS', '2.5'],
  ])('rechaza %s=%s', (nombre, valor) => {
    expect(() => leerConfig({ ...minimo, [nombre]: valor })).toThrowError(new RegExp(nombre));
  });

  it('exige usuario y clave de MongoDB juntos', () => {
    expect(() => leerConfig({ ...minimo, MONGODB_USUARIO: 'app' })).toThrowError(/MONGODB_CLAVE van juntos/);
    const config = leerConfig({ ...minimo, MONGODB_USUARIO: 'app', MONGODB_CLAVE: 'clave' });
    expect(config.mongodbUsuario).toBe('app');
  });

  it('rechaza una zona horaria inexistente', () => {
    expect(() => leerConfig({ ...minimo, ZONA_HORARIA: 'America/Atlantida' })).toThrowError(/ZONA_HORARIA/);
  });
});
