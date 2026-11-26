<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>@yield('title', 'ÁUREA')</title>
    <style>
        @media only screen and (max-width: 620px) {
            .rc-container {
                width: 100% !important;
            }
            .rc-body-pad {
                padding: 28px 20px 22px 20px !important;
            }
            .rc-header-pad {
                padding: 22px 20px !important;
            }
            .rc-footer-pad {
                padding: 18px 20px !important;
            }
            .rc-btn {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F6F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0B2340; -webkit-font-smoothing: antialiased;">
    {{-- Texto oculto de vista previa en bandeja de entrada --}}
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
        @yield('preheader', 'Notificación de acceso de ÁUREA')
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5F6F8; width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" class="rc-container" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 14px; border: 1px solid #E7EAEF; overflow: hidden; border-collapse: separate; box-shadow: 0 4px 18px rgba(11, 35, 64, 0.06);">
                    {{-- Cabecera de marca --}}
                    <tr>
                        <td class="rc-header-pad" style="background-color: #0B2340; padding: 24px 36px; border-bottom: 4px solid #D5A06F;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td valign="middle" style="width: 56px; padding-right: 14px;">
                                        <div style="width: 42px; height: 42px; background-color: #FFF9F0; border: 1px solid #D5A06F; border-radius: 10px; text-align: center; padding: 5px; box-sizing: border-box;">
                                            <img src="{{ isset($message) ? $message->embed(resource_path('images/emails/logo-aurea.png')) : '' }}" alt="ÁUREA" width="30" height="30" style="display: block; width: 30px; height: 30px; margin: 0 auto; border: 0;">
                                        </div>
                                    </td>
                                    <td valign="middle">
                                        <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.8px; line-height: 1.2;">
                                            ÁUREA
                                        </div>
                                        <div style="font-size: 12px; color: #D5A06F; margin-top: 2px; font-weight: 500;">
                                            Plataforma SaaS de gestión gastronómica
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Contenido principal --}}
                    <tr>
                        <td class="rc-body-pad" style="padding: 36px 36px 28px 36px;">
                            @yield('content')
                        </td>
                    </tr>

                    {{-- Pie de correo --}}
                    <tr>
                        <td class="rc-footer-pad" style="background-color: #FAFBFD; border-top: 1px solid #E7EAEF; padding: 20px 36px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; line-height: 1.5; color: #4A5A72;">
                                ¿Necesitas ayuda? Escríbenos a
                                <a href="mailto:soporte@restaurantcloud.pe" style="color: #0B2340; font-weight: 600; text-decoration: underline;">soporte@restaurantcloud.pe</a>
                            </p>
                            <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.5; color: #6B7A91;">
                                Si no esperabas este correo, puedes ignorarlo de forma segura; tu cuenta no sufrirá cambios.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #9AA6B8;">
                                &copy; {{ date('Y') }} ÁUREA &middot; Todos los derechos reservados
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
