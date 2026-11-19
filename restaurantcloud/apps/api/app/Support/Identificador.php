<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Generación de UUID del núcleo. Hay dos usos con necesidades opuestas, y cada uno tiene su método:
 *
 * - ordenado(): clave de una fila. UUID versión 7 (RFC 9562): los primeros 48 bits son el instante en
 *   milisegundos, así que los identificadores nuevos se insertan al final del índice de la clave primaria
 *   en lugar de en cualquier punto (menos fragmentación, menos páginas sucias, mejor caché). Es el mismo
 *   criterio que la función fn_uuid_v8() de la base, que usan los INSERT sin id: ambos empiezan por la
 *   marca de tiempo y se ordenan juntos.
 *
 * - aleatorio(): un secreto que no debe poder adivinarse (token del QR público de un comprobante, token
 *   de refresco de sesión). UUID versión 4: 122 bits aleatorios y ninguna información sobre cuándo se creó.
 *   Un identificador ordenado no sirve aquí, porque revela el instante y solo tiene 74 bits aleatorios.
 *
 * No se usa Str::uuid() directamente en app/: una prueba de arquitectura lo impide, para que cada uso
 * declare cuál de los dos necesita.
 */
final class Identificador
{
    public static function ordenado(): string
    {
        return (string) Str::uuid7();
    }

    public static function aleatorio(): string
    {
        return (string) Str::uuid();
    }
}
