<?php

namespace App\Domains\Caja\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MetodoPagoLocalService
{
    private const CODIGOS_OPERATIVOS = ['efectivo', 'tarjeta', 'billetera_digital'];

    /** Formato del N° de operación de Yape/Plin ya normalizado (mayúsculas, sin espacios). */
    public const REGEX_NUMERO_OPERACION = '/^[A-Z0-9-]{4,30}$/';

    public function catalogo(string $localId): array
    {
        $this->asegurarCatalogoBase($localId);

        $metodos = DB::table('metodo_pago_local')
            ->where('local_id', $localId)
            ->whereIn('codigo', self::CODIGOS_OPERATIVOS)
            ->orderBy('orden')
            ->get()
            ->map(fn ($metodo): array => $this->mapear($metodo))
            ->all();

        $local = DB::table('local')->where('id', $localId)->value('nombre');
        $inicioMes = now()->startOfMonth();
        $ventasTarjeta = DB::table('comprobante as co')
            ->join('caja as ca', 'ca.id', '=', 'co.caja_id')
            ->where('ca.local_id', $localId)
            ->where('co.medio_pago', 'tarjeta')
            ->where('co.estado', 'emitido')
            ->where('co.created_at', '>=', $inicioMes)
            ->selectRaw('COALESCE(SUM(total), 0) as total, COALESCE(SUM(monto_recargo), 0) as recargos')
            ->first();

        return [
            'kpis' => [
                'formas_habilitadas' => collect($metodos)->where('activo', true)->count(),
                'total_formas' => count($metodos),
                'metodos_con_comision' => collect($metodos)
                    ->where('activo', true)
                    ->where('comision_porcentaje', '>', 0)
                    ->count(),
                'ventas_tarjeta_mes' => (float) $ventasTarjeta->total,
                'recargos_percibidos_mes' => (float) $ventasTarjeta->recargos,
            ],
            'metodos' => $metodos,
            'sede_nombre' => $local,
        ];
    }

    /**
     * Datos de cobro de la billetera digital (Yape/Plin) de la sede.
     *
     * El QR oficial y el celular salen solo de la configuración de la sede (vacíos si no los configuró);
     * titular y RUC, de la configuración o, si faltan, de la empresa propietaria de la sede.
     *
     * @param  array<string, mixed>  $datosAdicionales
     * @return array{qr_payload: string, telefono: string, titular: string, ruc: string, monto_exacto: float}
     */
    public function detalleBilletera(string $localId, array $datosAdicionales, float $montoExacto): array
    {
        $empresa = DB::table('local as l')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->where('l.id', $localId)
            ->select('e.razon_social', 'e.ruc')
            ->first();

        return [
            'qr_payload' => (string) ($datosAdicionales['qr_payload'] ?? ''),
            'telefono' => (string) ($datosAdicionales['telefono'] ?? ''),
            'titular' => (string) ($datosAdicionales['titular'] ?? $empresa->razon_social ?? ''),
            'ruc' => (string) ($datosAdicionales['ruc'] ?? $empresa->ruc ?? ''),
            'monto_exacto' => round($montoExacto, 2),
        ];
    }

    /**
     * Quita espacios, pasa a mayúsculas y devuelve null si no queda nada.
     */
    public function normalizarNumeroOperacion(?string $numero): ?string
    {
        $limpio = strtoupper((string) preg_replace('/\s+/', '', (string) $numero));

        return $limpio === '' ? null : $limpio;
    }

    /**
     * Un N° de operación (ya normalizado) debe cumplir el formato esperado.
     */
    public function numeroOperacionValido(?string $numero): bool
    {
        return $numero !== null && preg_match(self::REGEX_NUMERO_OPERACION, $numero) === 1;
    }

    /**
     * Un mismo N° de operación no puede respaldar dos comprobantes emitidos de la sede.
     *
     * @throws \DomainException si el número ya está registrado en un comprobante emitido.
     */
    public function asegurarNumeroOperacionLibre(string $localId, string $numero): void
    {
        $existente = DB::table('comprobante')
            ->where('local_id', $localId)
            ->where('numero_operacion', $numero)
            ->where('estado', 'emitido')
            ->select('serie', 'correlativo')
            ->first();

        if ($existente !== null) {
            throw new \DomainException(sprintf(
                'Este N° de operación ya se registró en el comprobante %s-%s.',
                $existente->serie,
                str_pad((string) $existente->correlativo, 8, '0', STR_PAD_LEFT)
            ));
        }
    }

    public function actualizar(string $localId, array $items): array
    {
        $this->asegurarCatalogoBase($localId);

        $porCodigo = collect($items)->keyBy('codigo');
        $codigosEsperados = self::CODIGOS_OPERATIVOS;
        sort($codigosEsperados);

        if ($porCodigo->count() !== count(self::CODIGOS_OPERATIVOS)
            || $porCodigo->keys()->sort()->values()->all() !== $codigosEsperados
        ) {
            throw new \InvalidArgumentException('Debes configurar efectivo, tarjeta y billetera digital.');
        }

        $efectivo = $porCodigo->get('efectivo');
        if (! $efectivo['activo'] || (float) $efectivo['comision_porcentaje'] !== 0.0) {
            throw new \DomainException('Efectivo debe permanecer activo y no admite comision.');
        }

        $tarjeta = $porCodigo->get('tarjeta');
        $billetera = $porCodigo->get('billetera_digital');
        if ((float) $billetera['comision_porcentaje'] !== 0.0) {
            throw new \DomainException('Billetera digital no admite recargos.');
        }

        if ($billetera['activo']) {
            $datosBilletera = $billetera['datos_adicionales'] ?? [];

            if (! $this->payloadEmvcoValido((string) ($datosBilletera['qr_payload'] ?? ''))) {
                throw new \LogicException('Billetera digital requiere el QR oficial de Yape/Plin valido.');
            }

            $telefono = preg_replace('/\D/', '', (string) ($datosBilletera['telefono'] ?? ''));
            if ($telefono !== '' && ! preg_match('/^9\d{8}$/', $telefono)) {
                throw new \LogicException('El celular de la billetera digital debe tener 9 digitos y empezar con 9.');
            }
        }

        DB::transaction(function () use ($localId, $efectivo, $tarjeta, $billetera): void {
            foreach ([$efectivo, $tarjeta, $billetera] as $item) {
                DB::table('metodo_pago_local')
                    ->where('local_id', $localId)
                    ->where('codigo', $item['codigo'])
                    ->update([
                        'activo' => $item['activo'],
                        'comision_porcentaje' => $item['codigo'] === 'tarjeta'
                            ? $item['comision_porcentaje']
                            : 0,
                        'datos_adicionales' => json_encode($item['datos_adicionales'] ?? []),
                        'updated_at' => now(),
                    ]);
            }
        });

        return $this->catalogo($localId);
    }

    /**
     * Un payload EMVCo MPM íntegro: inicia con `000201`, termina con el tag 63 y su CRC16-CCITT coincide.
     */
    private function payloadEmvcoValido(string $payload): bool
    {
        $largo = strlen($payload);
        if ($largo < 12 || $largo > 512 || ! str_starts_with($payload, '000201')) {
            return false;
        }

        $cuerpo = substr($payload, 0, $largo - 4);
        if (! str_ends_with($cuerpo, '6304')) {
            return false;
        }

        $crc = 0xFFFF;
        foreach (str_split($cuerpo) as $caracter) {
            $crc ^= ord($caracter) << 8;
            for ($bit = 0; $bit < 8; $bit++) {
                $crc = ($crc & 0x8000) !== 0 ? (($crc << 1) ^ 0x1021) & 0xFFFF : ($crc << 1) & 0xFFFF;
            }
        }

        return sprintf('%04X', $crc) === strtoupper(substr($payload, -4));
    }

    private function asegurarCatalogoBase(string $localId): void
    {
        $base = [
            ['codigo' => 'efectivo', 'nombre' => 'Efectivo', 'activo' => true, 'icono' => 'banknote', 'orden' => 1],
            ['codigo' => 'tarjeta', 'nombre' => 'Tarjeta POS', 'activo' => true, 'icono' => 'credit-card', 'orden' => 2],
            ['codigo' => 'billetera_digital', 'nombre' => 'Yape / Plin', 'activo' => false, 'icono' => 'smartphone', 'orden' => 3],
        ];

        foreach ($base as $metodo) {
            DB::table('metodo_pago_local')->insertOrIgnore([
                'id' => (string) Str::uuid(),
                'local_id' => $localId,
                ...$metodo,
                'comision_porcentaje' => 0,
                'datos_adicionales' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function mapear(object $metodo): array
    {
        return [
            'id' => $metodo->id,
            'local_id' => $metodo->local_id,
            'codigo' => $metodo->codigo,
            'nombre' => $metodo->nombre,
            'activo' => (bool) $metodo->activo,
            'comision_porcentaje' => (float) $metodo->comision_porcentaje,
            'datos_adicionales' => is_string($metodo->datos_adicionales)
                ? json_decode($metodo->datos_adicionales, true)
                : (array) $metodo->datos_adicionales,
            'icono' => $metodo->icono,
            'orden' => (int) $metodo->orden,
            'created_at' => $metodo->created_at,
            'updated_at' => $metodo->updated_at,
        ];
    }
}
