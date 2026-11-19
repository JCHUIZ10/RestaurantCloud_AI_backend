<?php

namespace Tests\Unit;

use App\Support\Identificador;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Tests\TestCase;

/**
 * Los identificadores de fila son UUID v7 (ordenados por tiempo, como fn_uuid_v8() de la base) y los
 * secretos son UUID v4. Ver App\Support\Identificador.
 */
class IdentificadorTest extends TestCase
{
    public function test_un_identificador_ordenado_es_un_uuid_version_7(): void
    {
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            Identificador::ordenado(),
        );
    }

    public function test_los_identificadores_ordenados_crecen_con_el_tiempo(): void
    {
        $generados = [];
        for ($i = 0; $i < 5; $i++) {
            $generados[] = Identificador::ordenado();
            usleep(2000); // milisegundos distintos: el orden lo da la marca de tiempo
        }

        $ordenados = $generados;
        sort($ordenados);

        $this->assertSame($generados, $ordenados);
    }

    public function test_un_identificador_ordenado_empieza_por_el_instante_en_milisegundos(): void
    {
        $antes = (int) floor(microtime(true) * 1000);
        $id = Identificador::ordenado();
        $despues = (int) floor(microtime(true) * 1000);

        $milisegundos = hexdec(str_replace('-', '', substr($id, 0, 13)));

        $this->assertGreaterThanOrEqual($antes, $milisegundos);
        $this->assertLessThanOrEqual($despues, $milisegundos);
    }

    public function test_un_identificador_aleatorio_es_un_uuid_version_4(): void
    {
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            Identificador::aleatorio(),
        );
    }

    public function test_el_codigo_de_la_aplicacion_no_genera_uuid_sin_declarar_para_que(): void
    {
        $directorio = dirname(__DIR__, 2).'/app';
        $infractores = [];

        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directorio)) as $archivo) {
            $ruta = $archivo->getPathname();
            if (! str_ends_with($ruta, '.php') || str_ends_with($ruta, 'Support'.DIRECTORY_SEPARATOR.'Identificador.php')) {
                continue;
            }
            foreach (file($ruta) as $numero => $linea) {
                if (preg_match('/Str::(uuid|orderedUuid|uuid7)\(/', $linea)) {
                    $infractores[] = substr($ruta, strlen($directorio) + 1).':'.($numero + 1);
                }
            }
        }

        $this->assertSame(
            [],
            $infractores,
            'Use Identificador::ordenado() para la clave de una fila o Identificador::aleatorio() para un secreto.',
        );
    }
}
