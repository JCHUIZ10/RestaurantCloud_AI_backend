<?php

namespace App\Domains\Eventos\Enums;

/**
 * Por qué falló el último intento de entrega de un evento (columna outbox_entrega.motivo_fallo).
 *
 * La clase decide qué hacer: si el destino está apagado o mal configurado el evento no tiene
 * culpa y se espera; si el destino lo rechaza, no tiene sentido reintentarlo.
 */
enum MotivoFallo: string
{
    /** Sin conexión, timeout o 502/503/504: el destino está apagado o saturado. */
    case NoDisponible = 'no_disponible';

    /** 401/403: el secreto compartido no coincide. Se corrige en la configuración. */
    case NoAutorizado = 'no_autorizado';

    /** El destino ya no tiene URL o secreto en la configuración del núcleo. */
    case SinConfigurar = 'sin_configurar';

    /** El destino respondió con un error (500 u otro 4xx): cuenta contra el límite de intentos. */
    case ErrorReceptor = 'error_receptor';

    /** 422: el evento no cumple el contrato. Reintentarlo no lo arregla. */
    case Rechazado = 'rechazado';

    /**
     * Fallos que no son culpa del evento sino del destino: no gastan intentos y se esperan hasta el
     * horizonte. Como afectan a todas las entregas de ese destino, también pausan sus envíos.
     */
    public function esTransitorio(): bool
    {
        return match ($this) {
            self::NoDisponible, self::NoAutorizado, self::SinConfigurar => true,
            self::ErrorReceptor, self::Rechazado => false,
        };
    }

    public static function dePeticion(int $status): self
    {
        return match (true) {
            $status === 422 => self::Rechazado,
            in_array($status, [401, 403], true) => self::NoAutorizado,
            in_array($status, [502, 503, 504], true) => self::NoDisponible,
            default => self::ErrorReceptor,
        };
    }

    /**
     * @return list<string>
     */
    public static function transitorios(): array
    {
        return array_values(array_map(
            fn (self $motivo): string => $motivo->value,
            array_filter(self::cases(), fn (self $motivo): bool => $motivo->esTransitorio()),
        ));
    }
}
