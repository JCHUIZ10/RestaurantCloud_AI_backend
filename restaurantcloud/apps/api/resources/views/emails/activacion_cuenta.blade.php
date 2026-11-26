@extends('emails.layouts.base')

@section('title', $asunto)
@section('preheader', $mensajeIntro)

@section('content')
    {{-- Etiquetas de contexto (rol y empresa) --}}
    @if($rolEtiqueta || $nombreEmpresa)
        <div style="margin-bottom: 18px;">
            @if($rolEtiqueta)
                <span style="display: inline-block; background-color: #FFF9F0; border: 1px solid #F4D7B0; color: #0B2340; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; margin-right: 6px; margin-bottom: 6px;">
                    Rol asignado: {{ $rolEtiqueta }}
                </span>
            @endif
            @if($nombreEmpresa)
                <span style="display: inline-block; background-color: #F5F6F8; border: 1px solid #E7EAEF; color: #334359; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px; margin-bottom: 6px;">
                    {{ $nombreEmpresa }}
                </span>
            @endif
        </div>
    @endif

    {{-- Saludo y titular --}}
    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #4A5A72;">
        Hola, {{ $nombreDestinatario }}
    </p>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; line-height: 1.25; font-weight: 800; color: #0B2340;">
        {{ $titulo }}
    </h1>

    {{-- Mensaje explicativo --}}
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.65; color: #334359;">
        {{ $mensajeIntro }}
    </p>

    {{-- Resumen visual en 3 pasos --}}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5F6F8; border-radius: 10px; border: 1px solid #E7EAEF; margin-bottom: 26px;">
        <tr>
            <td style="padding: 16px 18px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #4A5A72; margin-bottom: 10px;">
                    Cómo activar tu acceso en segundos
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                        <td valign="top" style="width: 26px; padding-bottom: 8px;">
                            <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #0B2340; color: #FFFFFF; font-size: 11px; font-weight: 700; border-radius: 50%;">1</span>
                        </td>
                        <td valign="top" style="font-size: 13px; line-height: 1.5; color: #22324A; padding-bottom: 8px;">
                            Haz clic en el botón <strong>{{ $textoBoton }}</strong>.
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" style="width: 26px; padding-bottom: 8px;">
                            <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #0B2340; color: #FFFFFF; font-size: 11px; font-weight: 700; border-radius: 50%;">2</span>
                        </td>
                        <td valign="top" style="font-size: 13px; line-height: 1.5; color: #22324A; padding-bottom: 8px;">
                            Define tu contraseña personal de acceso.
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" style="width: 26px;">
                            <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #D5A06F; color: #0B2340; font-size: 11px; font-weight: 800; border-radius: 50%;">3</span>
                        </td>
                        <td valign="top" style="font-size: 13px; line-height: 1.5; color: #22324A;">
                            Inicia sesión inmediatamente en tu panel de ÁUREA.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Botón CTA principal --}}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 26px;">
        <tr>
            <td align="center">
                <a href="{{ $urlActivacion }}" target="_blank" rel="noopener" class="rc-btn" style="display: inline-block; background-color: #0B2340; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 32px; border-radius: 8px; border-bottom: 3px solid #D5A06F; letter-spacing: 0.2px;">
                    {{ $textoBoton }} &rarr;
                </a>
            </td>
        </tr>
    </table>

    {{-- Aviso de vigencia --}}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFF9F0; border-left: 4px solid #D5A06F; border-radius: 0 8px 8px 0; margin-bottom: 22px;">
        <tr>
            <td style="padding: 12px 16px; font-size: 13px; line-height: 1.5; color: #22324A;">
                <strong style="color: #0B2340;">Vigencia del enlace:</strong> disponible hasta el <strong>{{ $fechaLimite }}</strong> (hora de Lima · {{ $horasExpiracion }} {{ $horasExpiracion === 1 ? 'hora' : 'horas' }}).
            </td>
        </tr>
    </table>

    {{-- Respaldo en texto plano --}}
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7A91;">
        ¿El botón no funciona? Copia y pega este enlace en tu navegador:
    </p>
    <div style="background-color: #F5F6F8; border: 1px solid #E7EAEF; border-radius: 6px; padding: 10px 12px; font-family: Consolas, 'Courier New', monospace; font-size: 11px; line-height: 1.5; word-break: break-all; color: #334359;">
        <a href="{{ $urlActivacion }}" target="_blank" rel="noopener" style="color: #0B2340; text-decoration: underline;">{{ $urlActivacion }}</a>
    </div>
@endsection
