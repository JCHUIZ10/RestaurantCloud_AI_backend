<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * Sesión de admin_local y datos base (mesa, pedido, producto) para los tests de anulaciones.
 */
trait CreaAnulaciones
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $mozoId = '00000000-0000-4000-8000-000000000103';

    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_admin_anul_'.Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->adminId,
            'nombre' => 'Admin Test Auditoria',
            'correo' => 'admin_anul@aurea.local',
            'rol' => 'admin_local',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenAdmin = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->tokenAdmin,
            'Accept' => 'application/json',
        ];
    }

    private function crearEntornoBase(): array
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso Auditoria '.Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $mesaId = (string) Str::uuid();
        DB::table('mesa')->insert([
            'id' => $mesaId,
            'local_id' => $this->localId,
            'piso_id' => $pisoId,
            'numero' => '99',
            'capacidad' => 4,
            'forma' => 'cuadrada',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => rand(1000, 9999),
            'estado' => 'anulado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $catId = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $catId,
            'local_id' => $this->localId,
            'nombre' => 'Pase Caliente '.Str::random(4),
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productoId = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $catId,
            'nombre' => 'Lomo Saltado Test '.Str::random(4),
            'precio' => 45.00,
            'costo_estandar' => 18.50,
            'requiere_preparacion' => true,
            'activo' => true,
            'disponibilidad' => 'disponible',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'piso_id' => $pisoId,
            'mesa_id' => $mesaId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
        ];
    }

    private function crearAnulacion(array $base, array $overrides = []): string
    {
        $id = (string) Str::uuid();
        $anuladoAt = $overrides['anulado_at'] ?? now();

        DB::table('pedido_anulacion')->insert(array_merge([
            'id' => $id,
            'local_id' => $this->localId,
            'pedido_id' => $base['pedido_id'],
            'pedido_item_id' => null,
            'tipo_anulacion' => 'item_individual',
            'mesa_id' => $base['mesa_id'],
            'mesa_numero' => 'Mesa 99',
            'producto_id' => $base['producto_id'],
            'producto_nombre' => 'Lomo Saltado Test',
            'cantidad' => 1,
            'precio_unitario' => 45.00,
            'monto_total' => 45.00,
            'mozo_id' => $this->mozoId,
            'anulado_por' => $this->mozoId,
            'motivo_categoria' => 'demora_cliente',
            'motivo_detalle' => 'Cliente desiste por exceso de demora en cocina.',
            'pedido_created_at' => now()->subMinutes(25),
            'anulado_at' => $anuladoAt,
            'minutos_espera' => 25,
            'estado_anterior' => 'en_preparacion',
            'es_merma' => false,
            'costo_merma' => 0.00,
            'revisado' => false,
            'created_at' => $anuladoAt,
        ], $overrides));

        return $id;
    }
}
