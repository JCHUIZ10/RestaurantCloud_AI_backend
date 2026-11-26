<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Correo transaccional para activación de cuentas e invitaciones de acceso en ÁUREA.
 */
class ActivacionCuentaMail extends Mailable
{
    use Queueable, SerializesModels;

    public readonly string $fechaLimite;

    public function __construct(
        public readonly string $nombreDestinatario,
        public readonly string $urlActivacion,
        public readonly string $asunto,
        public readonly string $titulo,
        public readonly string $mensajeIntro,
        public readonly string $textoBoton = 'Activar mi cuenta',
        public readonly int $horasExpiracion = 24,
        public readonly ?string $nombreEmpresa = null,
        public readonly ?string $rolEtiqueta = null,
        ?string $expiraEn = null,
    ) {
        $instanteLimite = $expiraEn
            ? Carbon::parse($expiraEn)->timezone('America/Lima')
            : now('America/Lima')->addHours($this->horasExpiracion);

        $this->fechaLimite = $instanteLimite->format('d/m/Y \a \l\a\s H:i');
    }

    /**
     * Construye el correo para invitación o reenvío a un administrador de sede.
     */
    public static function paraInvitacionAdmin(
        string $nombreDestinatario,
        string $urlActivacion,
        bool $esReenvio = false,
        ?string $nombreEmpresa = null,
        int $horasExpiracion = 24,
        ?string $expiraEn = null,
    ): self {
        $asunto = $esReenvio
            ? 'Nuevo enlace de activación — ÁUREA'
            : 'Te invitaron a administrar una sede — ÁUREA';

        $titulo = $esReenvio
            ? 'Tu nuevo enlace de acceso está listo'
            : 'Te damos la bienvenida al equipo';

        $mensajeIntro = $esReenvio
            ? 'Se ha generado un nuevo enlace para activar tu cuenta de administrador. El enlace anterior dejó de tener validez. Crea tu contraseña para ingresar a ÁUREA.'
            : 'Has sido invitado como administrador de sede en ÁUREA. Solo falta un paso: define tu contraseña para activar tu cuenta y comenzar a operar.';

        return new self(
            nombreDestinatario: $nombreDestinatario,
            urlActivacion: $urlActivacion,
            asunto: $asunto,
            titulo: $titulo,
            mensajeIntro: $mensajeIntro,
            textoBoton: 'Crear contraseña y activar cuenta',
            horasExpiracion: $horasExpiracion,
            nombreEmpresa: $nombreEmpresa,
            rolEtiqueta: 'Administrador de sede',
            expiraEn: $expiraEn,
        );
    }

    /**
     * Construye el correo inicial para el propietario en un alta manual B2B.
     */
    public static function paraAltaEmpresa(
        string $nombreDestinatario,
        string $nombreEmpresa,
        string $urlActivacion,
        int $horasExpiracion = 72,
        ?string $expiraEn = null,
    ): self {
        return new self(
            nombreDestinatario: $nombreDestinatario,
            urlActivacion: $urlActivacion,
            asunto: "Activa tu cuenta de {$nombreEmpresa} — ÁUREA",
            titulo: 'Tu restaurante ya está registrado',
            mensajeIntro: "Hemos configurado el espacio de {$nombreEmpresa} en ÁUREA. Activa tu cuenta de propietario definiendo tu contraseña para acceder al panel de gestión.",
            textoBoton: 'Activar cuenta de propietario',
            horasExpiracion: $horasExpiracion,
            nombreEmpresa: $nombreEmpresa,
            rolEtiqueta: 'Propietario',
            expiraEn: $expiraEn,
        );
    }

    /**
     * Construye el correo de recordatorio y renovación de enlace para el titular.
     */
    public static function paraRecordatorioTitular(
        string $nombreDestinatario,
        string $nombreEmpresa,
        string $urlActivacion,
        int $horasExpiracion = 72,
        ?string $expiraEn = null,
    ): self {
        return new self(
            nombreDestinatario: $nombreDestinatario,
            urlActivacion: $urlActivacion,
            asunto: "Enlace de acceso renovado para {$nombreEmpresa} — ÁUREA",
            titulo: 'Renovamos tu enlace de activación',
            mensajeIntro: "Hemos generado un nuevo enlace seguro para que completes la activación o gestión de {$nombreEmpresa} en ÁUREA. Úsalo dentro del plazo indicado para ingresar a tu cuenta.",
            textoBoton: 'Ingresar y activar cuenta',
            horasExpiracion: $horasExpiracion,
            nombreEmpresa: $nombreEmpresa,
            rolEtiqueta: 'Propietario',
            expiraEn: $expiraEn,
        );
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->asunto,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.activacion_cuenta',
            text: 'emails.activacion_cuenta_texto',
        );
    }
}
