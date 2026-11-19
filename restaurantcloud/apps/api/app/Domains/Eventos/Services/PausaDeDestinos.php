<?php

namespace App\Domains\Eventos\Services;

use App\Domains\Eventos\Enums\MotivoFallo;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Pausa por destino (circuit breaker) para las entregas de eventos.
 *
 * Cuando un destino falla por una causa que le afecta a él (apagado, secreto distinto), las demás
 * entregas pendientes fallarían igual: cada una esperaría su timeout y saturaría la cola. En su lugar
 * el destino queda "degradado" y pausado; al vencer la pausa solo una entrega a la vez (la sonda)
 * puede intentar el envío. Cuando una llega, el destino se reanuda y las entregas retenidas se
 * adelantan, en orden cronológico.
 *
 * El estado vive en la caché (Redis en producción). Si se pierde, el sistema vuelve a su
 * comportamiento normal y se degrada de nuevo en el siguiente fallo.
 */
class PausaDeDestinos
{
    /** Cuánto dura la marca de degradado sin renovarse; cada fallo la renueva. */
    private const TTL_DEGRADADO_SEGUNDOS = 3 * 86400;

    /** Tiempo máximo que una sonda retiene a las demás (un job dura como mucho 30 s). */
    private const TTL_SONDA_SEGUNDOS = 30;

    public function degradado(string $destino): bool
    {
        return (bool) Cache::get($this->clave($destino, 'degradado'), false);
    }

    public function pausadoHasta(string $destino): ?CarbonInterface
    {
        $hasta = Cache::get($this->clave($destino, 'pausado_hasta'));

        // Con la zona de la aplicación: createFromTimestamp devuelve UTC y, al guardarse en la base, se desfasaría.
        return $hasta ? Carbon::createFromTimestamp((int) $hasta, config('app.timezone')) : null;
    }

    public function estaPausado(string $destino): bool
    {
        $hasta = $this->pausadoHasta($destino);

        return $hasta !== null && $hasta->isFuture();
    }

    /**
     * Marca el destino como degradado y lo pausa durante `$minutos`.
     */
    public function pausar(string $destino, int $minutos): void
    {
        $hasta = now()->addMinutes(max(1, $minutos));

        Cache::put($this->clave($destino, 'degradado'), true, self::TTL_DEGRADADO_SEGUNDOS);
        Cache::put($this->clave($destino, 'pausado_hasta'), $hasta->timestamp, self::TTL_DEGRADADO_SEGUNDOS);
        Cache::forget($this->clave($destino, 'sonda'));
    }

    /**
     * Si este envío puede salir ahora. Con el destino sano, siempre. Degradado: no durante la pausa, y
     * después de ella solo uno a la vez (la sonda).
     */
    public function puedeEnviar(string $destino): bool
    {
        if (! $this->degradado($destino)) {
            return true;
        }

        if ($this->estaPausado($destino)) {
            return false;
        }

        return Cache::add($this->clave($destino, 'sonda'), true, self::TTL_SONDA_SEGUNDOS);
    }

    /**
     * Cuándo volver a intentar una entrega que no pudo salir por la pausa o por otra sonda en curso.
     */
    public function reintentarEn(string $destino): CarbonInterface
    {
        $hasta = $this->pausadoHasta($destino);

        return $hasta !== null && $hasta->isFuture() ? $hasta : now()->addMinute();
    }

    /**
     * El destino respondió: se quita la pausa y se adelantan las entregas retenidas por sus fallos.
     * Devuelve true si estaba degradado.
     */
    public function reanudar(string $destino): bool
    {
        if (! $this->degradado($destino)) {
            return false;
        }

        foreach (['degradado', 'pausado_hasta', 'sonda'] as $clave) {
            Cache::forget($this->clave($destino, $clave));
        }

        $this->adelantarEntregasRetenidas($destino);

        return true;
    }

    /**
     * Las entregas que esperaban por culpa del destino (no por un evento defectuoso) pasan a vencidas,
     * ordenadas por la fecha de su evento: el despacho las envía de la más antigua a la más reciente.
     */
    private function adelantarEntregasRetenidas(string $destino): void
    {
        $transitorios = implode(',', array_map(fn (string $motivo): string => "'{$motivo}'", MotivoFallo::transitorios()));

        DB::update(<<<SQL
            UPDATE outbox_entrega oe
               SET proximo_intento_en = ev.created_at
              FROM outbox_event ev
             WHERE ev.id = oe.evento_id
               AND oe.destino = ?
               AND oe.estado = 'pendiente'
               AND oe.intentos > 0
               AND oe.motivo_fallo IN ({$transitorios})
        SQL, [$destino]);
    }

    /**
     * Destinos que hoy no deben recibir envíos del despacho periódico.
     *
     * @return list<string>
     */
    public function destinosPausados(): array
    {
        return array_values(array_filter(
            array_keys(config('eventos.destinos', [])),
            fn (string $destino): bool => $this->estaPausado($destino),
        ));
    }

    private function clave(string $destino, string $dato): string
    {
        return "eventos:destino:{$destino}:{$dato}";
    }
}
