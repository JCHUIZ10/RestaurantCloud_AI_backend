<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Microservicios que reciben eventos
    |--------------------------------------------------------------------------
    |
    | Dirección base y secreto HMAC de cada destino. Los eventos se envían a
    | `{url}/interno/eventos`. Un destino sin URL o sin secreto se omite al
    | publicar, para que el núcleo funcione sin microservicios.
    |
    */

    'destinos' => [
        'ms-analitica' => [
            'url' => env('ANALITICA_URL'),
            'secreto' => env('ANALITICA_SECRETO'),
        ],
        'ms-notificaciones' => [
            'url' => env('NOTIFICACIONES_URL'),
            'secreto' => env('NOTIFICACIONES_SECRETO'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Destinos de cada tipo de evento
    |--------------------------------------------------------------------------
    |
    | Catálogo en doc-2u/servicios/eventos.md. Un tipo que no aparece aquí se
    | registra en el outbox, pero no se envía a ningún servicio.
    |
    */

    'suscripciones' => [
        'venta.registrada' => ['ms-analitica'],
        'comprobante.anulado' => ['ms-analitica', 'ms-notificaciones'],
        'pedido.anulado' => ['ms-analitica', 'ms-notificaciones'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Entrega
    |--------------------------------------------------------------------------
    |
    | Cada fallo reprograma la entrega con espera creciente (1, 2, 4… minutos,
    | hasta `espera_maxima_min`). Al llegar a `max_intentos` pasa a fallido.
    | `reserva_segundos` aparta una entrega ya encolada para que el despacho
    | periódico no la vuelva a encolar mientras el worker la procesa.
    |
    */

    'max_intentos' => (int) env('EVENTOS_MAX_INTENTOS', 8),

    'timeout_segundos' => (int) env('EVENTOS_TIMEOUT_SEGUNDOS', 5),

    'espera_maxima_min' => 60,

    'reserva_segundos' => 120,

];
