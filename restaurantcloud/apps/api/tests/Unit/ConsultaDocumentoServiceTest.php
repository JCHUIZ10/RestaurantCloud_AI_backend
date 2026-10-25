<?php

namespace Tests\Unit;

use App\Domains\Caja\Services\ConsultaDocumentoService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ConsultaDocumentoServiceTest extends TestCase
{
    public function test_modo_mock_responde_determinista_sin_hacer_peticiones_http_externas(): void
    {
        Http::fake();

        // Servicio explícitamente en modo mock (cero consumo de saldo)
        $servicio = new ConsultaDocumentoService('https://api.apiperu.dev', 'dummy-token', true);

        $resultadoDni = $servicio->consultar('DNI', '72819201');
        $this->assertTrue($resultadoDni['exito']);
        $this->assertSame('DNI', $resultadoDni['tipo_documento']);
        $this->assertSame('72819201', $resultadoDni['numero_documento']);
        $this->assertSame('CARLOS MENDOZA QUISPE', $resultadoDni['nombre_identificativo']);
        $this->assertSame('api_peru', $resultadoDni['origen']);

        $resultadoRuc = $servicio->consultar('RUC', '20601234567');
        $this->assertTrue($resultadoRuc['exito']);
        $this->assertSame('RUC', $resultadoRuc['tipo_documento']);
        $this->assertSame('20601234567', $resultadoRuc['numero_documento']);
        $this->assertStringContainsString('INVERSIONES GASTRONÓMICAS', $resultadoRuc['nombre_identificativo']);

        // Garantizar que no se ejecutó ninguna llamada de red real
        Http::assertNothingSent();
    }

    public function test_modo_real_con_http_fake_procesa_dni_exitoso(): void
    {
        Http::fake([
            '*/dni' => Http::response([
                'success' => true,
                'data' => [
                    'numero' => '45678901',
                    'nombre_completo' => 'MARIA ELENA TORRES CASTILLO',
                    'nombres' => 'MARIA ELENA',
                    'apellido_paterno' => 'TORRES',
                    'apellido_materno' => 'CASTILLO',
                    'codigo_verificacion' => 4,
                ],
            ], 200),
        ]);

        $servicio = new ConsultaDocumentoService('https://api.apiperu.dev', 'valid-token', false);
        $resultado = $servicio->consultar('DNI', '45678901');

        $this->assertTrue($resultado['exito']);
        $this->assertSame('DNI', $resultado['tipo_documento']);
        $this->assertSame('45678901', $resultado['numero_documento']);
        $this->assertSame('MARIA ELENA TORRES CASTILLO', $resultado['nombre_identificativo']);
        $this->assertSame('api_peru', $resultado['origen']);
        $this->assertSame('TORRES', $resultado['detalle']['apellido_paterno']);
    }

    public function test_modo_real_con_http_fake_procesa_ruc_exitoso(): void
    {
        Http::fake([
            '*/ruc' => Http::response([
                'success' => true,
                'data' => [
                    'ruc' => '20603849201',
                    'nombre_o_razon_social' => 'RESTAURANT CLOUD PERU S.A.C.',
                    'direccion' => 'AV. JAVIER PRADO ESTE 4200, SANTIAGO DE SURCO, LIMA',
                    'ubigeo' => '150140',
                    'departamento' => 'LIMA',
                    'provincia' => 'LIMA',
                    'distrito' => 'SANTIAGO DE SURCO',
                    'estado' => 'ACTIVO',
                    'condicion' => 'HABIDO',
                ],
            ], 200),
        ]);

        $servicio = new ConsultaDocumentoService('https://api.apiperu.dev', 'valid-token', false);
        $resultado = $servicio->consultar('RUC', '20603849201');

        $this->assertTrue($resultado['exito']);
        $this->assertSame('RUC', $resultado['tipo_documento']);
        $this->assertSame('20603849201', $resultado['numero_documento']);
        $this->assertSame('RESTAURANT CLOUD PERU S.A.C.', $resultado['nombre_identificativo']);
        $this->assertStringContainsString('AV. JAVIER PRADO ESTE', $resultado['direccion']);
        $this->assertSame('ACTIVO', $resultado['detalle']['estado']);
        $this->assertSame('HABIDO', $resultado['detalle']['condicion']);
    }

    public function test_modo_real_con_documento_no_encontrado_retorna_error_limpio(): void
    {
        Http::fake([
            '*/dni' => Http::response([
                'success' => false,
                'message' => 'El DNI no cuenta con registros en RENIEC',
            ], 404),
        ]);

        $servicio = new ConsultaDocumentoService('https://api.apiperu.dev', 'valid-token', false);
        $resultado = $servicio->consultar('DNI', '00000000');

        $this->assertFalse($resultado['exito']);
        $this->assertSame('DNI_NO_ENCONTRADO', $resultado['codigo_error']);
        $this->assertStringContainsString('no cuenta con registros', $resultado['mensaje']);
    }
}
