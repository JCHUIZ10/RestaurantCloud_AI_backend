<?php

namespace Tests\Feature\Correos;

use App\Domains\Administradores\Services\AdministradorService;
use App\Domains\Tenant\Services\TenantProvisioningService;
use App\Mail\ActivacionCuentaMail;
use App\Support\CorreoTransaccional;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class ActivacionCuentaMailTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $adminCorreo = 'correo.admin.test@aurea.local';

    private string $altaRuc = '20603849206';

    private string $altaCorreo = 'correo.titular.test@puertomarino.pe';

    protected function setUp(): void
    {
        parent::setUp();
        $this->limpiar();
    }

    protected function tearDown(): void
    {
        $this->limpiar();
        parent::tearDown();
    }

    private function limpiar(): void
    {
        DB::table('usuario')->where('correo', $this->adminCorreo)->delete();

        $empresa = DB::table('empresa')->where('ruc', $this->altaRuc)->first();
        if ($empresa) {
            DB::table('pago')->where('empresa_id', $empresa->id)->delete();
            DB::table('local')->where('empresa_id', $empresa->id)->delete();
            DB::table('usuario')->where('empresa_id', $empresa->id)->delete();
            DB::table('suscripcion')->where('empresa_id', $empresa->id)->delete();
            DB::table('empresa')->where('id', $empresa->id)->delete();
        }

        DB::table('usuario')->where('correo', $this->altaCorreo)->delete();
    }

    public function test_invitar_y_reenviar_administrador_envian_correo_de_activacion(): void
    {
        Mail::fake();

        $service = app(AdministradorService::class);
        $creado = $service->invitar($this->empresaId, [
            'nombre' => 'Lucía Tester',
            'correo' => $this->adminCorreo,
            'telefono' => '987654321',
        ]);

        Mail::assertSent(ActivacionCuentaMail::class, function (ActivacionCuentaMail $mail) use ($creado) {
            return $mail->hasTo($this->adminCorreo)
                && $mail->urlActivacion === $creado['invitacion_url']
                && $mail->horasExpiracion === 24
                && $mail->rolEtiqueta === 'Administrador de sede'
                && str_contains($mail->asunto, 'ÁUREA');
        });

        $reenviado = $service->reenviarInvitacion($this->empresaId, $creado['id']);

        Mail::assertSent(ActivacionCuentaMail::class, function (ActivacionCuentaMail $mail) use ($reenviado) {
            return $mail->hasTo($this->adminCorreo)
                && $mail->urlActivacion === $reenviado['invitacion_url']
                && str_contains($mail->asunto, 'Nuevo enlace de activación');
        });
    }

    public function test_alta_manual_y_notificar_cobro_envian_correo_al_titular(): void
    {
        Mail::fake();

        $provisioning = app(TenantProvisioningService::class);
        $alta = $provisioning->provisionarAltaManual([
            'ruc' => $this->altaRuc,
            'razon_social' => 'Cevichería Puerto Marino S.A.C.',
            'direccion_sede' => 'Av. Primavera 450, Surco',
            'propietario_nombre' => 'Jorge Medina Castro',
            'propietario_email' => $this->altaCorreo,
            'propietario_telefono' => '991882334',
            'plan_id' => 2,
            'ciclo_facturacion' => 'anual',
            'monto_cobrado_pen' => 800.0,
            'origen_pago' => 'transferencia_bancaria',
            'numero_operacion' => 'OP-MAIL-TEST-001',
        ]);

        Mail::assertSent(ActivacionCuentaMail::class, function (ActivacionCuentaMail $mail) use ($alta) {
            return $mail->hasTo($this->altaCorreo)
                && $mail->urlActivacion === $alta['invitacion_url']
                && $mail->horasExpiracion === 72
                && $mail->nombreEmpresa === 'Cevichería Puerto Marino S.A.C.'
                && $mail->rolEtiqueta === 'Propietario';
        });

        $saasToken = 'saas_mail_test_'.Str::random(24);
        Redis::setex('auth:session:'.hash('sha256', $saasToken), 600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000999',
            'nombre' => 'Admin SaaS Test',
            'correo' => 'saas@aurea.local',
            'rol' => 'admin_saas',
            'empresa_id' => null,
            'local_id' => null,
            'estado' => 'activo',
        ]));

        $res = $this->postJson(
            "/api/v1/saas/tenants/{$alta['empresa_id']}/notificar-cobro",
            [],
            ['Authorization' => "Bearer {$saasToken}", 'Accept' => 'application/json']
        );

        $res->assertStatus(200);
        $urlRenovada = $res->json('datos.invitacion_url');

        Mail::assertSent(ActivacionCuentaMail::class, function (ActivacionCuentaMail $mail) use ($urlRenovada) {
            return $mail->hasTo($this->altaCorreo)
                && $mail->urlActivacion === $urlRenovada
                && str_contains($mail->asunto, 'Enlace de acceso renovado');
        });
    }

    public function test_plantillas_html_y_texto_se_renderizan_con_marca_aurea_y_fecha_limite(): void
    {
        $mailable = ActivacionCuentaMail::paraAltaEmpresa(
            nombreDestinatario: 'Jorge Medina',
            nombreEmpresa: 'Restaurante ÁUREA Demo',
            urlActivacion: 'http://localhost:5173/activar-cuenta?token=abc123',
            horasExpiracion: 72,
            expiraEn: '2026-11-28T19:15:00-05:00',
        );

        $mailable->assertSeeInHtml('ÁUREA');
        $mailable->assertSeeInHtml('28/11/2026 a las 19:15');
        $mailable->assertSeeInHtml('http://localhost:5173/activar-cuenta?token=abc123');
        $mailable->assertSeeInText('ÁUREA');
        $mailable->assertSeeInText('28/11/2026 a las 19:15');
    }

    public function test_despachador_seguro_no_lanza_excepcion_si_falla_smtp(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP simulado caído'));

        $mailable = ActivacionCuentaMail::paraInvitacionAdmin(
            nombreDestinatario: 'Test Resiliencia',
            urlActivacion: 'http://localhost:5173/activar-cuenta?token=xyz',
        );

        $enviado = CorreoTransaccional::enviarSeguro('fallo@aurea.local', $mailable, ['flujo' => 'test']);

        $this->assertFalse($enviado);
    }
}
