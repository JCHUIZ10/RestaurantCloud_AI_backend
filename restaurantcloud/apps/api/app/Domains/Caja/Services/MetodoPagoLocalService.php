<?php

namespace App\Domains\Caja\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MetodoPagoLocalService
{
    private const CODIGOS_OPERATIVOS = ['efectivo', 'tarjeta', 'billetera_digital'];

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
            $telefono = preg_replace('/\D/', '', $billetera['datos_adicionales']['telefono'] ?? '');
            if (! preg_match('/^9\d{8}$/', $telefono)) {
                throw new \LogicException('Billetera digital requiere un celular peruano valido de 9 digitos.');
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
