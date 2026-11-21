<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    // ms-pronóstico (doc-2u/servicios/ms-pronostico.md). Las rutas /interno se firman con HMAC.
    'pronostico' => [
        'url' => env('PRONOSTICO_URL'),
        'secreto' => env('PRONOSTICO_SECRETO'),
        'timeout_segundos' => (int) env('PRONOSTICO_TIMEOUT_SEGUNDOS', 30),
        // Reserva mínima de la reposición en los días sin modelo (doc-2u/03-prediccion-en-locales-nuevos.md, N-2).
        'reserva_minima' => (float) env('PREDICCION_RESERVA_MINIMA', 0.35),
    ],

    'apiperu' => [
        'base_url' => env('APIDEV_BASE_URL', 'https://api.apiperu.dev'),
        'token' => env('APIDEV_TOKEN'),
        'mock' => (bool) env('APIDEV_MOCK', false),
    ],

];
