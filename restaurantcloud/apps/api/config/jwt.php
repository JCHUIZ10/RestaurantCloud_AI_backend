<?php

/*
 * JWT para las rutas de microservicios (doc-2u/servicios/README.md, sección 2).
 *
 * Las claves llegan en PEM por variables de entorno; se aceptan con "\n" literales
 * para que quepan en una sola línea del .env. Sin clave privada no se emiten JWT
 * y el login sigue funcionando con `jwt: null`. `php artisan jwt:claves` genera un par.
 */
return [
    'clave_privada' => env('JWT_PRIVATE_KEY'),
    'clave_publica' => env('JWT_PUBLIC_KEY'),
    'minutos' => (int) env('JWT_MINUTOS', 10),
    'emisor' => env('JWT_EMISOR', 'restaurantcloud-nucleo'),
    'audiencia' => env('JWT_AUDIENCIA', 'restaurantcloud-servicios'),
];
