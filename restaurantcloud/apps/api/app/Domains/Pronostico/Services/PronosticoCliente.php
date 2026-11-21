<?php

namespace App\Domains\Pronostico\Services;

use App\Domains\Pronostico\Exceptions\PronosticoException;
use App\Support\FirmaInterna;
use App\Support\Identificador;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente firmado de ms-pronóstico (doc-2u/servicios/ms-pronostico.md, sección 3).
 *
 * Solo traduce la comunicación: firma las peticiones, y convierte cualquier fallo del servicio en una
 * `PronosticoException` con el código y el estado HTTP que el núcleo responde a su propio cliente.
 */
class PronosticoCliente
{
    /**
     * Genera un pronóstico (POST /interno/pronosticos). Devuelve el objeto `datos` de la respuesta.
     *
     * @param  array<string, mixed>  $solicitud
     * @return array<string, mixed>
     */
    public function generar(array $solicitud): array
    {
        $cuerpo = json_encode($solicitud, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $respuesta = $this->enviar(
            fn (string $url, string $secreto): Response => $this->peticion($cuerpo, $secreto)
                ->withBody($cuerpo, 'application/json')
                ->post("{$url}/interno/pronosticos"),
        );

        return $this->datos($respuesta);
    }

    /**
     * Recupera una ejecución guardada (GET /interno/pronosticos/{id}). `null` si no existe.
     *
     * @return array<string, mixed>|null
     */
    public function obtener(string $ejecucionId, string $empresaId, string $localId): ?array
    {
        // La firma cubre la cadena de consulta tal como viaja en la URL.
        $consulta = "empresa_id={$empresaId}&local_id={$localId}";

        $respuesta = $this->enviar(
            fn (string $url, string $secreto): Response => $this->peticion($consulta, $secreto)
                ->get("{$url}/interno/pronosticos/{$ejecucionId}?{$consulta}"),
        );

        if ($respuesta->status() === 404) {
            return null;
        }

        return $this->datos($respuesta);
    }

    /**
     * Métricas del modelo vigente de un local (GET /interno/modelos/vigente). `null` si el local no tiene
     * modelo o el servicio no responde: sirven para mostrar la precisión, no para decidir nada.
     *
     * @return array<string, mixed>|null
     */
    public function metricasDelModelo(string $empresaId, string $localId): ?array
    {
        $consulta = "empresa_id={$empresaId}&local_id={$localId}";

        try {
            $respuesta = $this->enviar(
                fn (string $url, string $secreto): Response => $this->peticion($consulta, $secreto)
                    ->get("{$url}/interno/modelos/vigente?{$consulta}"),
            );
        } catch (PronosticoException) {
            return null;
        }

        $metricas = $respuesta->successful() ? $respuesta->json('datos.modelo.metricas') : null;

        return is_array($metricas) ? $metricas : null;
    }

    /**
     * @param  \Closure(string, string): Response  $llamada
     */
    private function enviar(\Closure $llamada): Response
    {
        $url = rtrim((string) config('services.pronostico.url'), '/');
        $secreto = (string) config('services.pronostico.secreto');

        if ($url === '' || $secreto === '') {
            throw new PronosticoException(
                'ERR_PRONOSTICO_NO_DISPONIBLE',
                'El servicio de pronóstico no está configurado.',
                503,
            );
        }

        try {
            return $llamada($url, $secreto);
        } catch (ConnectionException $excepcion) {
            Log::warning('ms-pronóstico no responde: '.$excepcion->getMessage());

            throw new PronosticoException(
                'ERR_PRONOSTICO_NO_DISPONIBLE',
                'El servicio de pronóstico no está disponible. Intenta de nuevo en unos minutos.',
                503,
            );
        }
    }

    private function peticion(string $mensajeFirmado, string $secreto): PendingRequest
    {
        return Http::timeout((int) config('services.pronostico.timeout_segundos'))
            ->acceptJson()
            ->withHeaders([
                ...FirmaInterna::cabeceras($mensajeFirmado, $secreto),
                'X-Request-Id' => request()->header('X-Request-Id') ?: Identificador::aleatorio(),
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function datos(Response $respuesta): array
    {
        if ($respuesta->successful()) {
            $datos = $respuesta->json('datos');
            if (! is_array($datos) || ! isset($datos['ejecucion_id'], $datos['predicciones'])) {
                throw new PronosticoException(
                    'ERR_PRONOSTICO_RESPUESTA_INVALIDA',
                    'El servicio de pronóstico respondió con una forma inesperada.',
                    502,
                );
            }

            return $datos;
        }

        $error = $respuesta->json('errores.0') ?? [];
        $codigo = is_array($error) ? (string) ($error['codigo'] ?? '') : '';
        $detalles = is_array($error['detalles'] ?? null) ? $error['detalles'] : [];
        $ejecucion = isset($detalles['ejecucion_id']) ? ['ejecucion_id' => $detalles['ejecucion_id']] : [];

        Log::warning("ms-pronóstico respondió {$respuesta->status()} {$codigo}");

        throw match (true) {
            $codigo === 'ERR_ANALITICA_NO_DISPONIBLE' => new PronosticoException(
                'ERR_ANALITICA_NO_DISPONIBLE',
                'No se pudo leer el historial de ventas. Intenta de nuevo en unos minutos.',
                503,
                $ejecucion,
            ),
            $codigo === 'ERR_SERIE_INVALIDA' => new PronosticoException(
                'ERR_SERIE_INVALIDA',
                'El historial de ventas no tiene la forma esperada y no se puede pronosticar.',
                502,
                $ejecucion,
            ),
            // El núcleo armó mal la petición o la firma no coincide: es un defecto nuestro, no del usuario.
            in_array($respuesta->status(), [401, 422], true) => new PronosticoException(
                'ERR_PRONOSTICO_RECHAZADO',
                'El servicio de pronóstico rechazó la solicitud.',
                502,
                ['codigo_servicio' => $codigo],
            ),
            default => new PronosticoException(
                'ERR_PRONOSTICO_NO_DISPONIBLE',
                'El servicio de pronóstico no está disponible. Intenta de nuevo en unos minutos.',
                503,
                $ejecucion,
            ),
        };
    }
}
