<?php

namespace App\Domains\Caja\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ConsultaDocumentoService
{
    private string $baseUrl;
    private ?string $token;
    private bool $mock;

    public function __construct(
        ?string $baseUrl = null,
        ?string $token = null,
        ?bool $mock = null
    ) {
        $this->baseUrl = rtrim($baseUrl ?? (string) config('services.apiperu.base_url', 'https://api.apiperu.dev'), '/');
        $this->token = $token ?? config('services.apiperu.token');
        $this->mock = $mock ?? ((bool) config('services.apiperu.mock', false) || app()->environment('testing'));
    }

    /**
     * Consulta documento fiscal (DNI o RUC).
     * Devuelve estructura normalizada con resultado de consulta o mensaje de error.
     */
    public function consultar(string $tipo, string $documento): array
    {
        $tipo = strtoupper(trim($tipo));
        $documento = trim($documento);

        // Si está en modo mock o testing, nunca realizar llamadas HTTP a la API externa
        if ($this->mock || empty($this->token)) {
            return $this->obtenerRespuestaMock($tipo, $documento);
        }

        return $tipo === 'DNI'
            ? $this->consultarDni($documento)
            : $this->consultarRuc($documento);
    }

    /**
     * Consulta a endpoint POST /dni de apiperu.dev
     */
    private function consultarDni(string $dni): array
    {
        try {
            $url = $this->baseUrl . '/dni';
            $response = Http::withToken((string) $this->token)
                ->acceptJson()
                ->asJson()
                ->timeout(6)
                ->post($url, ['dni' => $dni]);

            if ($response->successful()) {
                $body = $response->json();
                if (! empty($body['success']) && ! empty($body['data'])) {
                    $data = $body['data'];
                    $nombreCompleto = trim($data['nombre_completo'] ?? '');
                    if (empty($nombreCompleto)) {
                        $nombres = trim($data['nombres'] ?? '');
                        $paterno = trim($data['apellido_paterno'] ?? '');
                        $materno = trim($data['apellido_materno'] ?? '');
                        $nombreCompleto = trim("{$paterno} {$materno} {$nombres}");
                    }

                    return [
                        'exito' => true,
                        'tipo_documento' => 'DNI',
                        'numero_documento' => $dni,
                        'nombre_identificativo' => strtoupper($nombreCompleto),
                        'direccion' => '',
                        'detalle' => [
                            'nombres' => $data['nombres'] ?? '',
                            'apellido_paterno' => $data['apellido_paterno'] ?? '',
                            'apellido_materno' => $data['apellido_materno'] ?? '',
                            'codigo_verificacion' => $data['codigo_verificacion'] ?? null,
                        ],
                        'origen' => 'api_peru',
                    ];
                }
            }

            $mensajeError = $response->json('message') ?? 'El DNI ingresado no fue encontrado en RENIEC.';
            return [
                'exito' => false,
                'codigo_error' => 'DNI_NO_ENCONTRADO',
                'mensaje' => $mensajeError,
            ];
        } catch (Throwable $e) {
            Log::warning('Error de conexión con APIDev DNI: ' . $e->getMessage(), ['dni' => $dni]);
            return [
                'exito' => false,
                'codigo_error' => 'SERVICIO_PADRON_NO_DISPONIBLE',
                'mensaje' => 'El servicio de consulta fiscal externa no responde temporalmente. Ingrese los datos manualmente.',
            ];
        }
    }

    /**
     * Consulta a endpoint POST /ruc de apiperu.dev
     */
    private function consultarRuc(string $ruc): array
    {
        try {
            $url = $this->baseUrl . '/ruc';
            $response = Http::withToken((string) $this->token)
                ->acceptJson()
                ->asJson()
                ->timeout(6)
                ->post($url, ['ruc' => $ruc]);

            if ($response->successful()) {
                $body = $response->json();
                if (! empty($body['success']) && ! empty($body['data'])) {
                    $data = $body['data'];
                    $razonSocial = trim($data['nombre_o_razon_social'] ?? $data['razon_social'] ?? '');
                    $direccion = trim($data['direccion'] ?? '');

                    return [
                        'exito' => true,
                        'tipo_documento' => 'RUC',
                        'numero_documento' => $ruc,
                        'nombre_identificativo' => strtoupper($razonSocial),
                        'direccion' => strtoupper($direccion),
                        'detalle' => [
                            'direccion' => $direccion,
                            'ubigeo' => $data['ubigeo'] ?? '',
                            'departamento' => $data['departamento'] ?? '',
                            'provincia' => $data['provincia'] ?? '',
                            'distrito' => $data['distrito'] ?? '',
                            'estado' => $data['estado'] ?? 'ACTIVO',
                            'condicion' => $data['condicion'] ?? 'HABIDO',
                        ],
                        'origen' => 'api_peru',
                    ];
                }
            }

            $mensajeError = $response->json('message') ?? 'El RUC ingresado no fue encontrado en los padrones de SUNAT.';
            return [
                'exito' => false,
                'codigo_error' => 'RUC_NO_ENCONTRADO',
                'mensaje' => $mensajeError,
            ];
        } catch (Throwable $e) {
            Log::warning('Error de conexión con APIDev RUC: ' . $e->getMessage(), ['ruc' => $ruc]);
            return [
                'exito' => false,
                'codigo_error' => 'SERVICIO_PADRON_NO_DISPONIBLE',
                'mensaje' => 'El servicio de consulta fiscal externa no responde temporalmente. Ingrese los datos manualmente.',
            ];
        }
    }

    /**
     * Catálogo determinista para pruebas automatizadas y ambientes sin conexión
     * Protege el saldo del usuario al no realizar ningún consumo de red.
     */
    private function obtenerRespuestaMock(string $tipo, string $documento): array
    {
        if ($tipo === 'DNI') {
            $nombresDni = [
                '72819201' => 'CARLOS MENDOZA QUISPE',
                '45678901' => 'MARÍA TORRES',
                '10293847' => 'JUAN PÉREZ GARCÍA',
                '48192039' => 'ANA MARÍA CHÁVEZ ROJAS',
            ];
            $nombre = $nombresDni[$documento] ?? ('CIUDADANO DNI ' . substr($documento, -4));

            return [
                'exito' => true,
                'tipo_documento' => 'DNI',
                'numero_documento' => $documento,
                'nombre_identificativo' => $nombre,
                'direccion' => '',
                'detalle' => [
                    'nombres' => $nombre,
                    'apellido_paterno' => '',
                    'apellido_materno' => '',
                ],
                'origen' => 'api_peru',
            ];
        }

        $razonesRuc = [
            '20601234567' => [
                'nombre' => 'INVERSIONES GASTRONÓMICAS S.A.C.',
                'direccion' => 'AV. LARCO 1045, MIRAFLORES, LIMA',
            ],
            '20100070970' => [
                'nombre' => 'SUPERMERCADOS PERUANOS S.A.',
                'direccion' => 'CALLE MORELLI 181, SAN BORJA, LIMA',
            ],
            '20603849201' => [
                'nombre' => 'RESTAURANT CLOUD PERÚ S.A.C.',
                'direccion' => 'AV. JAVIER PRADO ESTE 4200, SANTIAGO DE SURCO, LIMA',
            ],
        ];

        $datosRuc = $razonesRuc[$documento] ?? [
            'nombre' => 'EMPRESA CONSULTORA DEMO ' . substr($documento, -4) . ' S.A.C.',
            'direccion' => 'CALLE LOS NEGOCIOS ' . substr($documento, -3) . ', SAN ISIDRO, LIMA',
        ];

        return [
            'exito' => true,
            'tipo_documento' => 'RUC',
            'numero_documento' => $documento,
            'nombre_identificativo' => $datosRuc['nombre'],
            'direccion' => $datosRuc['direccion'],
            'detalle' => [
                'direccion' => $datosRuc['direccion'],
                'estado' => 'ACTIVO',
                'condicion' => 'HABIDO',
            ],
            'origen' => 'api_peru',
        ];
    }
}
