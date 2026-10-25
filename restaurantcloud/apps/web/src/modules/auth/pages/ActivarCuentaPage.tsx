import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Building2,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { activacionService } from '../services/activacionService';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/router/routes.constants';
import { homeDeRol } from '@/router/accesoPorRol';
import type { ValidarTokenResponseDTO } from '@/types/auth';

export const ActivarCuentaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUsuario = useAuthStore((s) => s.setUsuario);

  const tokenParam = searchParams.get('token') || '';

  // Estados de carga y validación inicial
  const [validando, setValidando] = useState(true);
  const [datosInvitacion, setDatosInvitacion] = useState<ValidarTokenResponseDTO | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Estados del formulario
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Validar token al montar
  useEffect(() => {
    let cancelado = false;

    const validar = async () => {
      if (!tokenParam) {
        setErrorValidacion(
          'No se proporcionó ningún token de activación en el enlace. Solicita al propietario que te reenvíe la invitación.'
        );
        setValidando(false);
        return;
      }

      setValidando(true);
      setErrorValidacion(null);

      const res = await activacionService.validarToken(tokenParam);

      if (cancelado) return;

      if (res.exito && res.datos) {
        setDatosInvitacion(res.datos);
      } else {
        setErrorValidacion(
          res.errores?.[0]?.mensaje ||
            'El enlace de activación es inválido o ha expirado. Por favor solicita un nuevo reenvío.'
        );
      }
      setValidando(false);
    };

    validar();

    return () => {
      cancelado = true;
    };
  }, [tokenParam]);

  // Validadores de requisitos de contraseña
  const tieneLongitud = password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneNumeroOSimbolo = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsCoinciden = password.length > 0 && password === passwordConfirmation;
  const formularioValido = tieneLongitud && tieneMayuscula && tieneNumeroOSimbolo && passwordsCoinciden;

  // Manejo de envío
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioValido) {
      setErrorEnvio('Por favor verifica que la contraseña cumpla con todos los requisitos de seguridad.');
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    try {
      const res = await activacionService.completarActivacion({
        token: tokenParam,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (res.exito && res.datos) {
        setExito(true);

        // Guardar sesión autenticada en Zustand y localStorage
        const usuarioSesion = {
          id: res.datos.usuario.id,
          nombre: res.datos.usuario.nombre,
          correo: res.datos.usuario.correo,
          rol: res.datos.usuario.rol,
          empresa: {
            id: res.datos.usuario.empresa_id,
            nombre: datosInvitacion?.empresa.nombre || 'Restaurante',
          },
          local: res.datos.usuario.local_id
            ? {
                id: res.datos.usuario.local_id,
                nombre: 'Sede Asignada',
              }
            : undefined,
        };

        setUsuario(usuarioSesion, res.datos.token);

        // Redirigir según el rol del usuario activado tras 1.2 segundos
        setTimeout(() => {
          navigate(homeDeRol(res.datos.usuario.rol), { replace: true });
        }, 1200);
      } else {
        setErrorEnvio(
          res.errores?.[0]?.mensaje ||
            'No se pudo activar la cuenta. Verifica que el enlace no haya sido consumido.'
        );
      }
    } catch (err: any) {
      setErrorEnvio(err?.message || 'Error de conexión al activar la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121824] via-[#1a2333] to-[#0f141e] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-aurea-copper selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* Isotipo Áurea */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-aurea-copper to-aurea-champagne shadow-lg shadow-aurea-copper/20 mb-4 border border-aurea-champagne/30">
          <ShieldCheck className="w-8 h-8 text-aurea-navy" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
          RestaurantCloud <span className="text-aurea-copper">AI</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          {datosInvitacion?.usuario.rol === 'propietario'
            ? 'Activación de Cuenta de Propietario Titular'
            : 'Activación de Credenciales de Personal Administrativo'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-8 rounded-3xl shadow-2xl border border-aurea-copper/30 text-aurea-navy">
          {/* 1. Estado de Carga Inicial */}
          {validando && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-aurea-copper animate-spin mx-auto" />
              <p className="font-serif text-sm font-semibold text-aurea-navy">
                Verificando enlace seguro de activación...
              </p>
              <p className="text-[11px] text-aurea-navy/60">
                Validando firma criptográfica en los servidores de la plataforma
              </p>
            </div>
          )}

          {/* 2. Estado de Error / Token Expirado */}
          {!validando && errorValidacion && (
            <div className="py-6 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-aurea-navy">
                  Enlace Caducado o Inválido
                </h3>
                <p className="text-xs text-aurea-navy/70 leading-relaxed max-w-sm mx-auto">
                  {errorValidacion}
                </p>
              </div>

              <div className="pt-3 border-t border-aurea-copper/20 flex flex-col gap-2.5">
                <Button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="w-full bg-aurea-navy text-white hover:bg-aurea-navy/90 py-2.5 font-bold text-xs shadow-md"
                >
                  Ir al Inicio de Sesión
                </Button>
                <Link
                  to={ROUTES.HOME}
                  className="text-center text-xs text-aurea-copper font-medium hover:underline"
                >
                  Regresar al portal principal
                </Link>
              </div>
            </div>
          )}

          {/* 3. Estado de Éxito / Redirigiendo */}
          {!validando && exito && (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-aurea-navy">
                  ¡Cuenta Activada con Éxito!
                </h3>
                <p className="text-xs text-aurea-navy/70">
                  Tu contraseña personal ha sido configurada. Ingresando al panel...
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2 text-aurea-copper text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {datosInvitacion?.usuario.rol === 'propietario'
                    ? 'Ingresando a tu Consola de Propietario...'
                    : 'Redirigiendo a tu Dashboard...'}
                </span>
              </div>
            </div>
          )}

          {/* 4. Estado Formulario de Configuración de Clave */}
          {!validando && !errorValidacion && !exito && datosInvitacion && (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Tarjeta de Bienvenida y Empresa */}
              <div className="bg-aurea-ivory/70 border border-aurea-copper/25 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-aurea-navy font-bold">
                  <Building2 className="w-4 h-4 text-aurea-copper shrink-0" />
                  <span className="truncate">{datosInvitacion.empresa.nombre}</span>
                </div>
                <div className="space-y-1 pt-1 border-t border-aurea-copper/15">
                  <div className="flex items-center gap-2 text-aurea-navy/80">
                    <User className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                    <span className="font-semibold">{datosInvitacion.usuario.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-aurea-navy/60 font-mono text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                    <span>{datosInvitacion.usuario.correo}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="font-serif text-lg font-bold text-aurea-navy">
                  Crea tu Contraseña Personal
                </h2>
                <p className="text-aurea-navy/70 text-[11px] leading-relaxed">
                  Por seguridad, RestaurantCloud AI no almacena contraseñas provisionales. Define la clave con la que ingresarás al sistema.
                </p>
              </div>

              {/* Mensaje de error al enviar */}
              {errorEnvio && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{errorEnvio}</span>
                </div>
              )}

              {/* Campo: Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="block font-bold text-aurea-navy">
                  Nueva contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-aurea-navy/50 hover:text-aurea-navy transition-colors cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Campo: Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="block font-bold text-aurea-navy">
                  Confirmar contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarConfirmacion ? 'text' : 'password'}
                    required
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Repite tu contraseña exactamente"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-aurea-navy/50 hover:text-aurea-navy transition-colors cursor-pointer"
                  >
                    {mostrarConfirmacion ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Indicadores de Fortaleza de Contraseña */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                <p className="font-semibold text-aurea-navy mb-1 text-[10px] uppercase tracking-wider">
                  Requisitos de seguridad:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {tieneLongitud ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className={tieneLongitud ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                      Mínimo 8 caracteres
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tieneMayuscula ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className={tieneMayuscula ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                      Una letra mayúscula
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tieneNumeroOSimbolo ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className={tieneNumeroOSimbolo ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                      Número o símbolo
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {passwordsCoinciden ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className={passwordsCoinciden ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                      Contraseñas coinciden
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!formularioValido || enviando}
                  className="w-full bg-aurea-navy text-white hover:bg-aurea-navy/90 py-3 font-bold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 text-aurea-copper animate-spin" />
                      <span>Configurando credenciales y entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Activar Cuenta y Entrar al Sistema</span>
                      <ArrowRight className="w-4 h-4 text-aurea-copper" />
                    </>
                  )}
                </Button>
              </div>

              {/* Nota de Seguridad */}
              <p className="text-[10px] text-center text-aurea-navy/60 leading-relaxed">
                Tus credenciales son personales e intransferibles conforme a la política de seguridad corporativa de RestaurantCloud AI.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
