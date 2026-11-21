<?php

namespace Tests\Feature;

use App\Domains\Suscripcion\Services\CobroSuscripcionService;
use App\Support\Identificador;
use App\Support\JwtRs256;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * JWT para microservicios (etapa 6.1): lo emiten todos los inicios de sesión, se renueva sin rotar
 * la sesión y se valida con la clave pública publicada. Contrato: doc-2u/servicios/README.md (sección 2)
 * y doc-2u/servicios/nucleo-laravel.md.
 */
class JwtServiciosTest extends TestCase
{
    private const PASSWORD = 'Jwt2026!seguro';

    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $clavePublica;

    protected function setUp(): void
    {
        parent::setUp();

        $clave = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => 2048]);
        openssl_pkey_export($clave, $privada);
        $this->clavePublica = openssl_pkey_get_details($clave)['key'];

        // Como llegan del .env: en una línea, con "\n" literales.
        config([
            'jwt.clave_privada' => str_replace("\n", '\n', $privada),
            'jwt.clave_publica' => str_replace("\n", '\n', $this->clavePublica),
            'jwt.minutos' => 10,
        ]);
    }

    public function test_el_login_entrega_un_jwt_firmado_con_los_claims_del_contrato(): void
    {
        $usuarioId = $this->crearUsuario('admin_local', $this->localId);

        $respuesta = $this->login($usuarioId)->assertOk();

        $jwt = $respuesta->json('datos.jwt');
        $claims = JwtRs256::verificar($jwt, $this->clavePublica);

        $this->assertNotNull($claims, 'La firma debe validar con la clave pública.');
        $this->assertSame('restaurantcloud-nucleo', $claims['iss']);
        $this->assertSame('restaurantcloud-servicios', $claims['aud']);
        $this->assertSame($usuarioId, $claims['sub']);
        $this->assertSame('admin_local', $claims['rol']);
        $this->assertSame($this->empresaId, $claims['empresa_id']);
        $this->assertSame($this->localId, $claims['local_id']);
        $this->assertSame(['prediccion', 'reportes_avanzados'], $claims['modulos']);
        $this->assertSame(600, $claims['exp'] - $claims['iat']);
        $this->assertSame($claims['iat'], $claims['nbf']);
        $this->assertTrue(Str::isUuid($claims['jti']));
        $this->assertSame($claims['exp'], strtotime($respuesta->json('datos.jwt_expira_en')));

        $cabecera = JwtRs256::cabecera($jwt);
        $this->assertSame('RS256', $cabecera['alg']);
        $this->assertSame($this->getJson('/api/v1/auth/clave-publica')->json('datos.kid'), $cabecera['kid']);
    }

    public function test_una_firma_alterada_o_de_otra_clave_no_valida(): void
    {
        $jwt = $this->login($this->crearUsuario('admin_local', $this->localId))->json('datos.jwt');

        [$cabecera, $claims, $firma] = explode('.', $jwt);
        $claimsAlterados = rtrim(strtr(base64_encode(str_replace('admin_local', 'propietario', base64_decode(strtr($claims, '-_', '+/')))), '+/', '-_'), '=');
        $this->assertNull(JwtRs256::verificar("{$cabecera}.{$claimsAlterados}.{$firma}", $this->clavePublica));

        $otra = openssl_pkey_get_details(openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => 2048]))['key'];
        $this->assertNull(JwtRs256::verificar($jwt, $otra));
    }

    public function test_el_propietario_recibe_un_jwt_sin_sede(): void
    {
        $claims = JwtRs256::verificar(
            $this->login($this->crearUsuario('propietario', null))->json('datos.jwt'),
            $this->clavePublica,
        );

        $this->assertSame('propietario', $claims['rol']);
        $this->assertNull($claims['local_id']);
        $this->assertSame($this->empresaId, $claims['empresa_id']);
    }

    public function test_los_modulos_siguen_el_plan_de_la_empresa(): void
    {
        DB::table('empresa')->where('id', $this->empresaId)->update(['plan_id' => 1]);

        $claims = JwtRs256::verificar(
            $this->login($this->crearUsuario('admin_local', $this->localId))->json('datos.jwt'),
            $this->clavePublica,
        );

        $this->assertSame([], $claims['modulos']);
    }

    public function test_el_refresh_tambien_entrega_un_jwt(): void
    {
        $refresh = $this->login($this->crearUsuario('admin_local', $this->localId))->json('datos.refresh_token');

        $respuesta = $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $refresh])->assertOk();

        $this->assertNotNull(JwtRs256::verificar($respuesta->json('datos.jwt'), $this->clavePublica));
    }

    public function test_token_servicios_renueva_el_jwt_sin_rotar_la_sesion(): void
    {
        $login = $this->login($this->crearUsuario('admin_local', $this->localId));
        $token = $login->json('datos.token');

        $respuesta = $this->postJson('/api/v1/auth/token-servicios', [], ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertJsonStructure(['datos' => ['jwt', 'jwt_expira_en']]);

        $claims = JwtRs256::verificar($respuesta->json('datos.jwt'), $this->clavePublica);
        $this->assertSame('admin_local', $claims['rol']);
        $this->assertNotSame(JwtRs256::verificar($login->json('datos.jwt'), $this->clavePublica)['jti'], $claims['jti']);

        // La sesión del núcleo sigue siendo la misma.
        $this->getJson('/api/v1/auth/me', ['Authorization' => "Bearer {$token}"])->assertOk();
    }

    public function test_token_servicios_exige_sesion(): void
    {
        $this->postJson('/api/v1/auth/token-servicios')
            ->assertStatus(401)
            ->assertJsonPath('errores.0.codigo', 'TOKEN_NO_PROPORCIONADO');
    }

    public function test_una_empresa_suspendida_no_recibe_jwt(): void
    {
        $usuarioId = $this->crearUsuario('propietario', null);
        $token = $this->login($usuarioId)->json('datos.token');

        DB::table('empresa')->where('id', $this->empresaId)->update(['estado' => 'suspendida']);
        CobroSuscripcionService::olvidarEstadoEmpresa($this->empresaId);

        try {
            // El propietario sigue entrando para regularizar, pero sin acceso a los microservicios.
            $this->login($usuarioId)->assertOk()->assertJsonPath('datos.jwt', null);

            $this->postJson('/api/v1/auth/token-servicios', [], ['Authorization' => "Bearer {$token}"])
                ->assertStatus(403)
                ->assertJsonPath('errores.0.codigo', 'EMPRESA_SUSPENDIDA');
        } finally {
            CobroSuscripcionService::olvidarEstadoEmpresa($this->empresaId);
        }
    }

    public function test_sin_claves_el_login_funciona_y_el_jwt_es_nulo(): void
    {
        config(['jwt.clave_privada' => null, 'jwt.clave_publica' => null]);

        $login = $this->login($this->crearUsuario('admin_local', $this->localId))
            ->assertOk()
            ->assertJsonPath('datos.jwt', null)
            ->assertJsonPath('datos.jwt_expira_en', null);

        $this->postJson('/api/v1/auth/token-servicios', [], ['Authorization' => 'Bearer '.$login->json('datos.token')])
            ->assertStatus(503)
            ->assertJsonPath('errores.0.codigo', 'ERR_JWT_NO_CONFIGURADO');
        $this->getJson('/api/v1/auth/clave-publica')
            ->assertStatus(503)
            ->assertJsonPath('errores.0.codigo', 'ERR_JWT_NO_CONFIGURADO');
    }

    public function test_la_clave_publica_se_publica_sin_autenticacion(): void
    {
        $datos = $this->getJson('/api/v1/auth/clave-publica')->assertOk()->json('datos');

        $this->assertSame('RS256', $datos['algoritmo']);
        $this->assertSame('restaurantcloud-nucleo', $datos['emisor']);
        $this->assertSame('restaurantcloud-servicios', $datos['audiencia']);
        $this->assertSame(trim($this->clavePublica), $datos['clave_publica']);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{16}$/', $datos['kid']);
    }

    public function test_el_comando_genera_un_par_de_claves_que_funciona(): void
    {
        Artisan::call('jwt:claves');
        $salida = Artisan::output();
        preg_match('/^JWT_PRIVATE_KEY="(.+)"$/m', $salida, $privada);
        preg_match('/^JWT_PUBLIC_KEY="(.+)"$/m', $salida, $publica);

        config(['jwt.clave_privada' => $privada[1], 'jwt.clave_publica' => $publica[1]]);

        $jwt = $this->login($this->crearUsuario('admin_local', $this->localId))->json('datos.jwt');
        $this->assertNotNull(JwtRs256::verificar($jwt, str_replace('\n', "\n", $publica[1])));
    }

    private function crearUsuario(string $rol, ?string $localId): string
    {
        $id = Identificador::ordenado();
        DB::table('usuario')->insert([
            'id' => $id,
            'empresa_id' => $this->empresaId,
            'local_id' => $localId,
            'nombre' => 'Usuario JWT',
            'correo' => 'jwt.'.Str::lower(Str::random(8)).'@test.pe',
            'password_hash' => password_hash(self::PASSWORD, PASSWORD_BCRYPT),
            'rol' => $rol,
            'estado' => 'activo',
        ]);

        return $id;
    }

    private function login(string $usuarioId): TestResponse
    {
        $correo = DB::table('usuario')->where('id', $usuarioId)->value('correo');
        Redis::del('auth:intentos:127.0.0.1:'.md5($correo));

        return $this->postJson('/api/v1/auth/login', ['correo' => $correo, 'password' => self::PASSWORD]);
    }
}
