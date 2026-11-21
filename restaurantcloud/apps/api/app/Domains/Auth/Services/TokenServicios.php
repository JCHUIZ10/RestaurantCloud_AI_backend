<?php

namespace App\Domains\Auth\Services;

use App\Domains\Suscripcion\Services\CobroSuscripcionService;
use App\Support\Identificador;
use App\Support\JwtRs256;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Emite el JWT (RS256) con el que el navegador llama a los microservicios.
 *
 * El núcleo sigue autenticando sus propias rutas con la sesión de Redis; este token solo
 * lo validan Kong y los microservicios con la clave pública. Formato y validación:
 * doc-2u/servicios/README.md, sección 2.
 */
class TokenServicios
{
    /** Módulos del plan que habilitan rutas de microservicios, por columna de `plan`. */
    private const MODULOS = [
        'prediccion' => 'incluye_prediccion_ia',
        'reportes_avanzados' => 'incluye_reportes_avanzados',
    ];

    public function configurado(): bool
    {
        return $this->clavePrivada() !== null && $this->clavePublica() !== null;
    }

    /**
     * Un JWT para la sesión que se está emitiendo, o null si no corresponde: servidor sin
     * claves o empresa suspendida. Nunca impide iniciar sesión.
     *
     * @return array{jwt: string, jwt_expira_en: string}|null
     */
    public function emitirSiCorresponde(object $usuario): ?array
    {
        if (! $this->configurado() || $this->empresaSuspendida($usuario)) {
            return null;
        }

        return $this->emitir($usuario);
    }

    public function empresaSuspendida(object $usuario): bool
    {
        return $usuario->empresa_id
            && CobroSuscripcionService::estadoEmpresa((string) $usuario->empresa_id) === 'suspendida';
    }

    /**
     * @return array{jwt: string, jwt_expira_en: string}
     *
     * @throws RuntimeException Si el servidor no tiene claves o la privada no es válida.
     */
    public function emitir(object $usuario): array
    {
        $clavePrivada = $this->clavePrivada();
        if ($clavePrivada === null || ! $this->configurado()) {
            throw new RuntimeException('JWT_PRIVATE_KEY y JWT_PUBLIC_KEY no están configuradas.');
        }

        $ahora = Carbon::now();
        $expira = $ahora->copy()->addMinutes(max(1, (int) config('jwt.minutos')));

        $claims = [
            'iss' => (string) config('jwt.emisor'),
            'aud' => (string) config('jwt.audiencia'),
            'sub' => (string) $usuario->id,
            'rol' => (string) $usuario->rol,
            'empresa_id' => $usuario->empresa_id ? (string) $usuario->empresa_id : null,
            'local_id' => $usuario->local_id ? (string) $usuario->local_id : null,
            'modulos' => $this->modulos($usuario->empresa_id ? (string) $usuario->empresa_id : null),
            'iat' => $ahora->getTimestamp(),
            'nbf' => $ahora->getTimestamp(),
            'exp' => $expira->getTimestamp(),
            'jti' => Identificador::aleatorio(),
        ];

        return [
            'jwt' => JwtRs256::codificar($claims, $clavePrivada, $this->kid()),
            'jwt_expira_en' => $expira->toIso8601String(),
        ];
    }

    public function clavePublica(): ?string
    {
        return $this->pem(config('jwt.clave_publica'));
    }

    /** Primeros 16 caracteres hexadecimales del SHA-256 de la clave pública (DER). */
    public function kid(): ?string
    {
        $pem = $this->clavePublica();
        if ($pem === null) {
            return null;
        }

        $der = base64_decode(preg_replace('/-----[^-]+-----|\s+/', '', $pem) ?? '', true);

        return $der === false ? null : substr(hash('sha256', $der), 0, 16);
    }

    /**
     * @return list<string>
     */
    private function modulos(?string $empresaId): array
    {
        if ($empresaId === null) {
            return [];
        }

        $plan = DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)
            ->first(array_map(fn (string $columna) => "p.{$columna}", array_values(self::MODULOS)));

        if ($plan === null) {
            return [];
        }

        return array_keys(array_filter(self::MODULOS, fn (string $columna) => (bool) $plan->{$columna}));
    }

    private function clavePrivada(): ?string
    {
        return $this->pem(config('jwt.clave_privada'));
    }

    private function pem(mixed $valor): ?string
    {
        if (! is_string($valor) || trim($valor) === '') {
            return null;
        }

        return trim(str_replace('\n', "\n", $valor));
    }
}
