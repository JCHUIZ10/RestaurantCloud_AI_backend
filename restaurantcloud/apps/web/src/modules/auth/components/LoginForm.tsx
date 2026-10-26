import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface LoginFormProps {
  correo: string;
  setCorreo: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  cargando: boolean;
  errorMensaje: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  correo,
  setCorreo,
  password,
  setPassword,
  onSubmit,
  cargando,
  errorMensaje,
}) => {
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-aurea-copper/30 shadow-[0_12px_36px_rgba(11,35,64,0.06)] space-y-6"
    >
      {/* Títulos del Formulario */}
      <div className="space-y-1.5 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold leading-tight">
          Iniciar Sesión
        </h2>
        <p className="font-sans text-xs sm:text-sm text-aurea-navy/70">
          Ingresa tus credenciales de colaborador o propietario
        </p>
      </div>

      {/* Alerta de Error HTTP 401 / 429 */}
      {errorMensaje && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-sans"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="leading-relaxed">
            <span className="font-bold">Error de Acceso: </span>
            {errorMensaje}
          </div>
        </motion.div>
      )}

      {/* Formulario */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Campo Correo Electrónico */}
        <div className="space-y-1.5">
          <label
            htmlFor="correo"
            className="block text-xs font-semibold text-aurea-navy uppercase tracking-wider"
          >
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-aurea-copper">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="correo"
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@restaurante.pe"
              disabled={cargando}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FFF9F0]/70 border border-aurea-navy/15 text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:bg-white focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 transition-all font-sans"
            />
          </div>
        </div>

        {/* Campo Contraseña */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-aurea-navy uppercase tracking-wider"
            >
              Contraseña
            </label>
            <Link
              to={ROUTES.RECUPERAR_PASSWORD}
              className="text-xs text-aurea-copper hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-aurea-copper">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={mostrarPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={cargando}
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#FFF9F0]/70 border border-aurea-navy/15 text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:bg-white focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute inset-y-0 right-3 flex items-center text-aurea-navy/50 hover:text-aurea-navy"
            >
              {mostrarPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Botón Principal de Envío */}
        <motion.button
          whileHover={{ scale: cargando ? 1 : 1.01 }}
          whileTap={{ scale: cargando ? 1 : 0.98 }}
          type="submit"
          disabled={cargando}
          className="w-full py-3.5 px-6 rounded-full bg-aurea-navy hover:bg-[#12345e] text-white font-sans text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-aurea-navy/15 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {cargando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-aurea-copper" />
              <span>Verificando credenciales...</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión en el Panel</span>
              <ArrowRight className="w-4 h-4 text-aurea-copper" />
            </>
          )}
        </motion.button>
      </form>

      {/* Enlace de Registro de Empresa */}
      <div className="pt-4 border-t border-aurea-copper/15 text-center text-xs text-aurea-navy/70 space-y-2">
        <p>
          ¿Tu restaurante aún no utiliza Áurea?{' '}
          <Link
            to={ROUTES.REGISTRO}
            className="font-bold text-aurea-copper hover:underline"
          >
            Crear restaurante aquí
          </Link>
        </p>
        <p className="text-[11px] text-aurea-navy/50">
          Usa el botón flotante inferior para autocompletar credenciales demo
        </p>
      </div>
    </motion.div>
  );
};
