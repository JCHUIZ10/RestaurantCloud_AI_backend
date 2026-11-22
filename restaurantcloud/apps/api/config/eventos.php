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
        'pedido.item_sustituido' => ['ms-notificaciones'],
        'producto.agotado' => ['ms-notificaciones'],
        'plato.listo' => ['ms-notificaciones'],
        'caja.turno_previo_pendiente' => ['ms-notificaciones'],
        'caja.cerrada' => ['ms-notificaciones'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Entrega
    |--------------------------------------------------------------------------
    |
    | Cada fallo reprograma la entrega con espera creciente (1, 2, 4… minutos,
    | hasta `espera_maxima_min`). Según el motivo del fallo:
    |   - El destino no responde, rechaza el secreto o no está configurado: no es
    |     culpa del evento, no gasta intentos y se sigue esperando. Pasa a fallido
    |     solo si lleva `horizonte_dias` fallando sin interrupción.
    |   - El destino responde con un error: pasa a fallido tras `max_intentos`.
    |   - El destino responde 422: pasa a fallido al instante.
    | `reserva_segundos` aparta una entrega ya encolada para que el despacho
    | periódico no la vuelva a encolar mientras el worker la procesa.
    |
    */

    'max_intentos' => (int) env('EVENTOS_MAX_INTENTOS', 8),

    'horizonte_dias' => (int) env('EVENTOS_HORIZONTE_DIAS', 7),

    'timeout_segundos' => (int) env('EVENTOS_TIMEOUT_SEGUNDOS', 5),

    'espera_maxima_min' => 60,

    'reserva_segundos' => 120,

];
