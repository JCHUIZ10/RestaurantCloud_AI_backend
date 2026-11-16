<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Un usuario de Áurea no puede ver ni modificar recursos de otra empresa, ni siquiera
 * conociendo sus identificadores. Verifica el aislamiento que aplica la propia API.
 */
class AislamientoEntreEmpresasTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    /** @var array<string, string> */
    private array $ajeno = [];

    /** @var array<string, string> */
    private array $tokens = [];

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('horario_excepcion')->where('local_id', $this->localId)->delete();

        $usuarios = [
            'admin_local' => '00000000-0000-4000-8000-000000000102',
            'mozo' => '00000000-0000-4000-8000-000000000103',
            'cajero' => '00000000-0000-4000-8000-000000000105',
        ];

        foreach ($usuarios as $rol => $usuarioId) {
            $token = "test_token_aislamiento_{$rol}_".Str::random(24);
            Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
                'id' => $usuarioId,
                'nombre' => "Usuario {$rol}",
                'correo' => "{$rol}@aurea.local",
                'rol' => $rol,
                'empresa_id' => $this->empresaId,
                'local_id' => $this->localId,
                'estado' => 'activo',
            ]));
            $this->tokens[$rol] = $token;
        }

        $this->crearEmpresaAjena();
    }

    private function crearEmpresaAjena(): void
    {
        $id = fn () => (string) Str::uuid();
        $ahora = now();

        $this->ajeno = array_map($id, array_flip([
            'empresa', 'local', 'piso', 'mesa', 'categoria', 'producto', 'insumo', 'proveedor', 'reserva',
        ]));

        DB::table('empresa')->insert([
            'id' => $this->ajeno['empresa'],
            'ruc' => '20'.random_int(100000000, 999999999),
            'razon_social' => 'Empresa Ajena S.A.C.',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo_contacto' => 'ajena@empresa.pe',
            'telefono' => '+51 999999999',
            'plan_id' => 1,
            'estado' => 'activa',
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ]);

        DB::table('local')->insert([
            'id' => $this->ajeno['local'],
            'empresa_id' => $this->ajeno['empresa'],
            'nombre' => 'Sede Ajena',
            'slug' => 'sede-ajena-'.Str::random(8),
            'direccion' => 'Calle Ajena 123',
            'ubigeo_cod' => '150101',
            'telefono' => '+51 987654321',
            'estado' => 'activo',
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ]);

        $local = $this->ajeno['local'];

        DB::table('piso')->insert([
            'id' => $this->ajeno['piso'], 'local_id' => $local, 'nombre' => 'Piso Ajeno',
            'columnas' => 5, 'filas' => 3, 'estado' => 'activo', 'created_at' => $ahora, 'updated_at' => $ahora,
        ]);

        DB::table('mesa')->insert([
            'id' => $this->ajeno['mesa'], 'local_id' => $local, 'piso_id' => $this->ajeno['piso'], 'numero' => 'AJ1',
            'capacidad' => 4, 'forma' => 'cuadrada', 'posicion_x' => 1, 'posicion_y' => 1, 'permite_union' => true,
            'estado' => 'activa', 'created_at' => $ahora, 'updated_at' => $ahora,
        ]);

        DB::table('categoria_producto')->insert([
            'id' => $this->ajeno['categoria'], 'local_id' => $local, 'nombre' => 'Categoría Ajena',
            'created_at' => $ahora, 'updated_at' => $ahora,
        ]);

        DB::table('producto')->insert([
            'id' => $this->ajeno['producto'], 'local_id' => $local, 'categoria_id' => $this->ajeno['categoria'],
            'nombre' => 'Plato Ajeno', 'precio' => 25.00, 'created_at' => $ahora, 'updated_at' => $ahora,
        ]);

        DB::table('insumo')->insert([
            'id' => $this->ajeno['insumo'], 'local_id' => $local, 'nombre' => 'Insumo Ajeno', 'unidad_medida' => 'kg',
            'created_at' => $ahora, 'updated_at' => $ahora,
        ]);

        DB::table('proveedor')->insert([
            'id' => $this->ajeno['proveedor'], 'local_id' => $local, 'nombre' => 'Proveedor Ajeno',
            'created_at' => $ahora, 'updated_at' => $ahora,
        ]);

        DB::table('reserva')->insert([
            'id' => $this->ajeno['reserva'], 'local_id' => $local, 'cliente_nombre' => 'Cliente Ajeno',
            'cliente_telefono' => '+51 987 654 321', 'fecha_hora' => now()->addDays(3)->setTime(13, 0),
            'num_personas' => 2, 'estado' => 'confirmada', 'created_at' => $ahora, 'updated_at' => $ahora,
        ]);
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: string, 3: string, 4: array<string, mixed>}>
     */
    public static function accesosPorId(): array
    {
        return [
            'ver producto' => ['admin_local', 'GET', '/admin/productos/{producto}', 'producto', []],
            'editar producto' => ['admin_local', 'PATCH', '/admin/productos/{producto}', 'producto', ['categoria_id' => '{categoria}', 'nombre' => 'Hackeado', 'precio' => 1, 'requiere_preparacion' => true]],
            'eliminar producto' => ['admin_local', 'DELETE', '/admin/productos/{producto}', 'producto', []],
            'ver receta' => ['admin_local', 'GET', '/admin/productos/{producto}/receta', 'producto', []],
            'ver insumo' => ['admin_local', 'GET', '/admin/insumos/{insumo}', 'insumo', []],
            'ajustar insumo' => ['admin_local', 'POST', '/admin/insumos/{insumo}/ajuste', 'insumo', ['stock_fisico' => 5, 'motivo' => 'ingreso_manual']],
            'ver proveedor' => ['admin_local', 'GET', '/admin/proveedores/{proveedor}', 'proveedor', []],
            'editar proveedor' => ['admin_local', 'PUT', '/admin/proveedores/{proveedor}', 'proveedor', ['nombre' => 'Hackeado', 'telefono' => '987654321']],
            'eliminar proveedor' => ['admin_local', 'DELETE', '/admin/proveedores/{proveedor}', 'proveedor', []],
            'renombrar piso' => ['admin_local', 'PATCH', '/admin/pisos/{piso}/nombre', 'piso', ['nombre' => 'Hackeado']],
            'editar mesa' => ['admin_local', 'PUT', '/admin/mesas/{mesa}', 'mesa', ['numero' => 'HK', 'capacidad' => 2, 'forma' => 'cuadrada', 'permite_union' => true, 'posicion_x' => 1, 'posicion_y' => 1]],
            'desactivar mesa' => ['admin_local', 'PATCH', '/admin/mesas/{mesa}/desactivar', 'mesa', []],
            'eliminar categoría' => ['admin_local', 'DELETE', '/admin/categorias/{categoria}', 'categoria', []],
            'abrir mesa' => ['mozo', 'POST', '/mozo/mesas/{mesa}/abrir', 'mesa', ['comensales' => 2]],
            'ver detalle de mesa' => ['mozo', 'GET', '/mozo/mesas/{mesa}/detalle', 'mesa', []],
            'liberar mesa' => ['mozo', 'POST', '/mozo/mesas/{mesa}/liberar', 'mesa', []],
            'sentar reserva' => ['mozo', 'POST', '/mozo/reservas/{reserva}/sentar', 'reserva', ['mesa_id' => '{mesa}']],
            'cancelar reserva' => ['mozo', 'POST', '/mozo/reservas/{reserva}/cancelar', 'reserva', ['motivo' => 'prueba']],
            'registrar no-show' => ['mozo', 'POST', '/mozo/reservas/{reserva}/no-show', 'reserva', []],
            'ver cuenta en caja' => ['cajero', 'GET', '/caja/mesas/{mesa}/cuenta', 'mesa', []],
        ];
    }

    /**
     * @param  array<string, mixed>  $cuerpo
     */
    #[DataProvider('accesosPorId')]
    public function test_un_usuario_no_accede_por_id_a_recursos_de_otra_empresa(
        string $rol,
        string $metodo,
        string $ruta,
        string $recurso,
        array $cuerpo,
    ): void {
        $reemplazos = [];
        foreach ($this->ajeno as $nombre => $id) {
            $reemplazos['{'.$nombre.'}'] = $id;
        }

        $cuerpo = array_map(fn ($valor) => is_string($valor) ? strtr($valor, $reemplazos) : $valor, $cuerpo);
        $antes = $this->fotoDelRecurso($recurso);

        $respuesta = $this->json($metodo, '/api/v1'.strtr($ruta, $reemplazos), $cuerpo, [
            'Authorization' => 'Bearer '.$this->tokens[$rol],
            'Accept' => 'application/json',
        ]);

        // El ajuste de inventario traduce "insumo no encontrado" de la función SQL en un 422.
        $noEncontrado = $respuesta->getStatusCode() === 422
            && str_contains((string) $respuesta->getContent(), 'NO_ENCONTRADO');

        $this->assertTrue(
            in_array($respuesta->getStatusCode(), [403, 404], true) || $noEncontrado,
            "{$metodo} {$ruta} respondió {$respuesta->getStatusCode()}: no debería permitirse sobre otra empresa."
        );
        $this->assertStringNotContainsString('Ajen', (string) $respuesta->getContent(), 'La respuesta filtra datos de otra empresa.');

        // Un error lanzado por PostgreSQL aborta la transacción de la prueba y ya no se puede releer;
        // la función SQL falla antes de escribir, así que solo se compara en los demás casos.
        if (! $noEncontrado) {
            $this->assertEquals($antes, $this->fotoDelRecurso($recurso), 'El recurso de otra empresa fue modificado.');
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fotoDelRecurso(string $recurso): ?array
    {
        $tabla = [
            'producto' => 'producto', 'insumo' => 'insumo', 'proveedor' => 'proveedor', 'piso' => 'piso',
            'mesa' => 'mesa', 'categoria' => 'categoria_producto', 'reserva' => 'reserva',
        ][$recurso];

        $fila = DB::table($tabla)->where('id', $this->ajeno[$recurso])->first();

        return $fila ? (array) $fila : null;
    }

    public function test_los_listados_no_incluyen_registros_de_otra_empresa(): void
    {
        $cabeceras = fn (string $rol) => ['Authorization' => 'Bearer '.$this->tokens[$rol], 'Accept' => 'application/json'];

        foreach (['/admin/productos', '/admin/insumos', '/admin/proveedores', '/admin/pisos', '/admin/categorias'] as $ruta) {
            $respuesta = $this->getJson('/api/v1'.$ruta, $cabeceras('admin_local'))->assertOk();
            $this->assertStringNotContainsString('Ajen', (string) $respuesta->getContent(), "{$ruta} incluye datos de otra empresa.");
        }

        $reservas = $this->getJson('/api/v1/mozo/reservas', $cabeceras('mozo'))->assertOk();
        $this->assertStringNotContainsString('Cliente Ajeno', (string) $reservas->getContent());

        $plano = $this->getJson('/api/v1/mozo/plano', $cabeceras('mozo'))->assertOk();
        $this->assertStringNotContainsString('AJ1', (string) $plano->getContent());
    }
}
