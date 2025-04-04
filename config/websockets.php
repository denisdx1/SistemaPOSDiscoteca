<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Dashboard Settings
    |--------------------------------------------------------------------------
    |
    | You can configure the dashboard settings from here.
    |
    */
    'dashboard' => [
        'port' => env('LARAVEL_WEBSOCKETS_PORT', 6001),
        'path' => 'laravel-websockets',
        'middleware' => [
            'web',
            \BeyondCode\LaravelWebSockets\Dashboard\Http\Middleware\Authorize::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default App Settings
    |--------------------------------------------------------------------------
    |
    | Here you can configure the default settings for your WebSocket apps.
    | These settings will be used when creating a new app in the dashboard.
    |
    */
    'apps' => [
        [
            'id' => env('PUSHER_APP_ID'),
            'name' => env('APP_NAME'),
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'enable_client_messages' => false,
            'enable_statistics' => true,
            'host' => '127.0.0.1',
            'port' => 6001,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Broadcasting Replication PubSub
    |--------------------------------------------------------------------------
    |
    | You can enable replication for broadcasting to scale WebSockets horizontally.
    |
    */
    'replication' => [
        'enabled' => false,
        'modes' => [
            // 'local' => \BeyondCode\LaravelWebSockets\Replication\Modes\LocalReplication::class,
            // 'redis' => \BeyondCode\LaravelWebSockets\Replication\Modes\RedisReplication::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Maximum Request Size
    |--------------------------------------------------------------------------
    |
    | The maximum request size in kilobytes that is allowed for a WebSocket request.
    |
    */
    'max_request_size_in_kb' => 250,

    /*
    |--------------------------------------------------------------------------
    | SSL Configuration
    |--------------------------------------------------------------------------
    |
    | By default, the WebSocket connections are not secured with SSL. This is
    | perfectly fine during development. In production, you should ensure that
    | your WebSocket connections are secured with SSL.
    |
    */
    'ssl' => [
        'local_cert' => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_CERT', null),
        'local_pk' => env('LARAVEL_WEBSOCKETS_SSL_LOCAL_PK', null),
        'passphrase' => env('LARAVEL_WEBSOCKETS_SSL_PASSPHRASE', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Statistics Interval
    |--------------------------------------------------------------------------
    |
    | How many seconds should statistics data persist in Redis.
    |
    */
    'statistics' => [
        'enabled' => true,
        'interval_in_seconds' => 60,
        'delete_statistics_older_than_days' => 60,
    ],
]; 