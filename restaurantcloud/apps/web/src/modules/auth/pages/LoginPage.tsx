import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';
import { SelectorCuentaModal } from '../components/SelectorCuentaModal';
import { BetaCredentialsWidget } from '../components/BetaCredentialsWidget';
import { loginWithCredentials, seleccionarCuenta } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import { homeDeRol, destinoSeguro } from '@/router/accesoPorRol';
import type { CuentaItemDTO, RolUsuario } from '@/types/auth';
import { SoloDemo } from '@/components/ui/SoloDemo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUsuario = useAuthStore((s) => s.setUsuario);

  // Estados del Formulario
  const [correo, setCorreo] = useState<string>('propietario@aurea.local');
  const [password, setPassword] = useState<string>('propietario2026');
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Estados para Resolución Multi-Cuenta
  const [requiereSeleccion, setRequiereSeleccion] = useState<boolean>(false);
  const [cuentasMultiTenant, setCuentasMultiTenant] = useState<CuentaItemDTO[]>([]);
  const [tempToken, setTempToken] = useState<string>('');
  const [expiraEnSegundos, setExpiraEnSegundos] = useState<number>(300);

  // Redirige a la ruta solicitada antes del login (?next=) o al inicio del rol.
  // Si el rol no puede ver la ruta solicitada, el guard lo devuelve a su inicio.
  const redirigirPorRol = (rol: RolUsuario) => {
    navigate(destinoSeguro(searchParams.get('next')) ?? homeDeRol(rol), { replace: true });
  };

  // Manejo del Login con Credenciales
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMensaje(null);

    try {
      const res = await loginWithCredentials({ correo, password });

      if (res.exito && res.datos) {
        if (res.datos.requiere_seleccion) {
          // Bifurcación: Desplegar selector de empresas
          setRequiereSeleccion(true);
          setCuentasMultiTenant(res.datos.cuentas || []);
          setTempToken(res.datos.temp_token || '');
          setExpiraEnSegundos(res.datos.expira_en_segundos || 300);
        } else if (res.datos.usuario && res.datos.token) {
          // Acceso directo: Guardar en Zustand y redirigir
          setUsuario(res.datos.usuario, res.datos.token);
          redirigirPorRol(res.datos.usuario.rol);
        }
      } else {
        setErrorMensaje(
          res.errores?.[0]?.mensaje || 'Credenciales inválidas. Revisa tu correo y contraseña.'
        );
      }
    } catch {
      setErrorMensaje('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Manejo de la Selección de Cuenta Multi-Tenant
  const handleSeleccionarCuenta = async (usuarioId: string) => {
    setCargando(true);
    setErrorMensaje(null);

    try {
      const res = await seleccionarCuenta({ usuario_id: usuarioId }, tempToken);

      if (res.exito && res.datos?.usuario && res.datos?.token) {
        setUsuario(res.datos.usuario, res.datos.token);
        redirigirPorRol(res.datos.usuario.rol);
      } else {
        setErrorMensaje(
          res.errores?.[0]?.mensaje || 'No se pudo autorizar el acceso a este restaurante.'
        );
      }
    } catch {
      setErrorMensaje('Error de red al seleccionar la cuenta.');
    } finally {
      setCargando(false);
    }
  };

  // Auto-completado disparado desde el widget flotante beta
  const handleAutoFill = (nuevoCorreo: string, nuevoPass: string) => {
    setCorreo(nuevoCorreo);
    setPassword(nuevoPass);
    setErrorMensaje(null);
    setRequiereSeleccion(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative selection:bg-aurea-champagne selection:text-aurea-navy">
      {/* Cabecera / Identidad de la Marca */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-aurea-navy flex items-center justify-center text-aurea-champagne mx-auto shadow-md border-2 border-aurea-copper/40">
          <Utensils className="w-6 h-6 text-aurea-copper" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-aurea-navy tracking-wide">
          ÁUREA
        </h1>
        <p className="text-xs sm:text-sm font-sans text-aurea-navy/70">
          «Una experiencia para disfrutar» • RestaurantCloud AI
        </p>
      </div>

      {/* Contenedor Principal (Cambia entre LoginForm y SelectorCuenta) */}
      <div className="w-full max-w-md sm:max-w-lg transition-all duration-300">
        {!requiereSeleccion ? (
          <LoginForm
            correo={correo}
            setCorreo={setCorreo}
            password={password}
            setPassword={setPassword}
            onSubmit={handleSubmit}
            cargando={cargando}
            errorMensaje={errorMensaje}
          />
        ) : (
          <SelectorCuentaModal
            cuentas={cuentasMultiTenant}
            expiraEnSegundos={expiraEnSegundos}
            onSeleccionarCuenta={handleSeleccionarCuenta}
            onVolverALogin={() => {
              setRequiereSeleccion(false);
              setErrorMensaje(null);
            }}
            cargando={cargando}
          />
        )}
      </div>

      {/* Pie de página sutil */}
      <footer className="mt-10 text-center text-xs text-aurea-navy/50 font-sans">
        <p>© 2026 RestaurantCloud AI. Plataforma Gastronómica Multi-Tenant Cero Papel.</p>
      </footer>

      {/* Widget Flotante de Credenciales Beta para Evaluadores */}
      <SoloDemo>
        <BetaCredentialsWidget onAutoFill={handleAutoFill} />
      </SoloDemo>
    </div>
  );
};
