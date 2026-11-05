<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CajaCorrelativoPorLocalTest extends TestCase
{
    private string $localA = '00000000-0000-4000-8000-000000000010';

    private string $localB;

    private string $cajaA;

    private string $cajaB;

    protected function setUp(): void
    {
        parent::setUp();

        $local = DB::table('local')->where('id', $this->localA)->first();
        $cajeroId = DB::table('usuario')->where('local_id', $this->localA)->value('id');

        $this->localB = (string) Str::uuid();
        DB::table('local')->insert([
            'id' => $this->localB,
            'empresa_id' => $local->empresa_id,
            'nombre' => 'Sede Correlativo B',
            'slug' => 'sede-correlativo-'.Str::lower(Str::random(6)),
            'direccion' => $local->direccion,
            'ubigeo_cod' => $local->ubigeo_cod,
            'telefono' => $local->telefono,
        ]);

        DB::table('comprobante_serie')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localB,
            'tipo_comprobante' => 'boleta',
            'serie' => 'B001',
            'correlativo_actual' => 0,
            'activo' => true,
        ]);

        $this->cajaA = $this->crearCaja($this->localA, $cajeroId);
        $this->cajaB = $this->crearCaja($this->localB, $cajeroId);
    }

    private function crearCaja(string $localId, string $cajeroId): string
    {
        $cajaId = (string) Str::uuid();
        DB::table('caja')->insert([
            'id' => $cajaId,
            'local_id' => $localId,
            'cajero_id' => $cajeroId,
            'monto_apertura' => 0,
            'estado' => 'abierta',
        ]);

        return $cajaId;
    }

    private function insertarBoleta(string $cajaId, int $correlativo, ?string $localId = null): void
    {
        DB::table('comprobante')->insert(array_filter([
            'id' => (string) Str::uuid(),
            'caja_id' => $cajaId,
            'local_id' => $localId,
            'tipo' => 'boleta',
            'serie' => 'B001',
            'correlativo' => $correlativo,
            'nombre_cliente' => 'CONSUMIDOR FINAL',
            'medio_pago' => 'efectivo',
            'subtotal_consumo' => 10,
            'total' => 10,
            'base_imponible' => 8.47,
            'igv' => 1.53,
            'token_qr' => (string) Str::uuid(),
        ], fn ($valor) => $valor !== null));
    }

    private function siguienteCorrelativo(string $localId): int
    {
        return (int) DB::selectOne(
            'SELECT fn_obtener_siguiente_correlativo(CAST(? AS uuid), ?, ?) AS correlativo',
            [$localId, 'boleta', 'B001'],
        )->correlativo;
    }

    public function test_la_numeracion_de_cada_sede_es_independiente(): void
    {
        $this->insertarBoleta($this->cajaA, 7);

        $this->assertSame(8, $this->siguienteCorrelativo($this->localA));
        $this->assertSame(1, $this->siguienteCorrelativo($this->localB));
    }

    public function test_dos_sedes_pueden_emitir_el_mismo_numero_de_serie(): void
    {
        $this->insertarBoleta($this->cajaA, 1);
        $this->insertarBoleta($this->cajaB, 1);

        $this->assertSame(
            2,
            DB::table('comprobante')->where('serie', 'B001')->where('correlativo', 1)
                ->whereIn('local_id', [$this->localA, $this->localB])->count()
        );
    }

    public function test_el_local_del_comprobante_se_toma_de_la_caja_si_no_se_envia(): void
    {
        $this->insertarBoleta($this->cajaB, 5);

        $this->assertSame(
            $this->localB,
            DB::table('comprobante')->where('caja_id', $this->cajaB)->value('local_id')
        );
    }
}
