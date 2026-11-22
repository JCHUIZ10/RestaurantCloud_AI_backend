<?php

namespace Tests\Concerns;

/**
 * Contrato de forma de los eventos que el núcleo envía a los microservicios.
 *
 * Cada caso es un archivo en doc-2u/servicios/contratos/ que describe la forma de los `datos` de un
 * evento real: sus campos y el tipo de cada uno (uuid, string, int, number, bool, date, datetime o null).
 * El núcleo comprueba que lo que emite coincide con el archivo, y ms-analítica comprueba, con sus
 * propios modelos, que acepta lo que el archivo describe. Así los dos lados se verifican contra el
 * mismo documento sin compartir código, y un cambio en un evento no pasa desapercibido hasta la
 * integración.
 *
 * Si el cambio de un evento es intencional, se regenera el archivo con
 * `docker exec -e ACTUALIZAR_CONTRATOS=1 restaurantcloudIA_api php artisan test <clase>` y se
 * comprueba que las pruebas de contrato de ms-analítica sigan pasando (o se las ajusta).
 */
trait VerificaContratoDeEventos
{
    /** Campos de texto cuyo valor es parte del contrato (valores fijos): se guardan tal cual. */
    private const CAMPOS_ENUMERADOS = ['tipo', 'medio_pago', 'tipo_anulacion', 'motivo_categoria', 'motivo_codigo', 'causa'];

    /**
     * Campos que son enteros por naturaleza. Cualquier otro número es "number": la base guarda 38.00 como
     * 38 y un monto puede llegar con o sin decimales, así que el valor no dice si el campo es entero.
     */
    private const CAMPOS_ENTEROS = ['cantidad', 'comensales', 'minutos_espera', 'turno_correlativo'];

    protected function assertContratoDeEvento(string $caso, array $datos): void
    {
        $ruta = $this->directorioDeContratos().'/'.$caso.'.json';
        $actual = $this->formaDe($datos);

        if (getenv('ACTUALIZAR_CONTRATOS') === '1') {
            file_put_contents($ruta, json_encode($actual, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
        }

        $this->assertFileExists($ruta, "Falta el contrato {$caso}. Genérelo con ACTUALIZAR_CONTRATOS=1.");
        $esperada = json_decode(file_get_contents($ruta), true);

        $diferencias = $this->diferenciasDeForma($esperada, $actual, '');

        $this->assertSame(
            [],
            $diferencias,
            "El evento {$caso} ya no coincide con su contrato en doc-2u/servicios/contratos. Si el cambio es intencional, "
            .'regenere el archivo con ACTUALIZAR_CONTRATOS=1 y verifique que ms-analitica siga aceptándolo.',
        );
    }

    private function directorioDeContratos(): string
    {
        $directorio = getenv('CONTRATOS_DIR') ?: '/contratos';
        $this->assertDirectoryExists($directorio, "No se encuentra {$directorio}: el contenedor api debe montar doc-2u/servicios/contratos.");

        return $directorio;
    }

    /**
     * Forma de un valor: un mapa conserva sus claves ordenadas, y cada hoja se reduce a su tipo.
     */
    private function formaDe(mixed $valor, ?string $clave = null): mixed
    {
        if (is_array($valor) && array_is_list($valor)) {
            $formas = [];
            foreach ($valor as $elemento) {
                $formas[json_encode($this->formaDe($elemento))] = $this->formaDe($elemento);
            }

            return array_values($formas);
        }

        if (is_array($valor)) {
            ksort($valor);
            $forma = [];
            foreach ($valor as $nombre => $campo) {
                $forma[$nombre] = $this->formaDe($campo, (string) $nombre);
            }

            return $forma;
        }

        return match (true) {
            $valor === null => 'null',
            is_bool($valor) => 'bool',
            is_int($valor) && in_array($clave, self::CAMPOS_ENTEROS, true) => 'int',
            is_int($valor), is_float($valor) => 'number',
            (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $valor) => 'uuid',
            (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) => 'date',
            (bool) preg_match('/^\d{4}-\d{2}-\d{2}T/', $valor) => 'datetime',
            in_array($clave, self::CAMPOS_ENUMERADOS, true) => $valor,
            default => 'string',
        };
    }

    /**
     * @return list<string> Diferencias entre la forma esperada y la real, vacía si coinciden
     */
    private function diferenciasDeForma(mixed $esperada, mixed $actual, string $ruta): array
    {
        $donde = $ruta === '' ? 'raíz' : $ruta;

        if (is_array($esperada) && array_is_list($esperada)) {
            if (! is_array($actual) || ! array_is_list($actual)) {
                return ["{$donde}: se esperaba una lista"];
            }
            if (count($actual) !== 1 || count($esperada) !== 1) {
                return ["{$donde}: los elementos de la lista no tienen todos la misma forma (".count($actual).' formas distintas)'];
            }

            return $this->diferenciasDeForma($esperada[0], $actual[0], "{$ruta}[]");
        }

        if (is_array($esperada)) {
            if (! is_array($actual) || array_is_list($actual)) {
                return ["{$donde}: se esperaba un objeto"];
            }

            $diferencias = [];
            foreach (array_diff(array_keys($esperada), array_keys($actual)) as $falta) {
                $diferencias[] = "{$ruta}.{$falta}: el contrato lo exige y el evento no lo trae";
            }
            foreach (array_diff(array_keys($actual), array_keys($esperada)) as $sobra) {
                $diferencias[] = "{$ruta}.{$sobra}: el evento lo trae y el contrato no lo declara";
            }
            foreach (array_intersect(array_keys($esperada), array_keys($actual)) as $campo) {
                array_push($diferencias, ...$this->diferenciasDeForma($esperada[$campo], $actual[$campo], "{$ruta}.{$campo}"));
            }

            return $diferencias;
        }

        if ($esperada === $actual) {
            return [];
        }

        return ["{$donde}: el contrato dice ".json_encode($esperada).' y el evento trae '.json_encode($actual)];
    }
}
