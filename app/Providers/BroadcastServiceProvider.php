<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Log::info('BroadcastServiceProvider::boot iniciando configuración');
        
        // Configurar las rutas de broadcasting con middleware de autenticación
        Broadcast::routes(['middleware' => ['web', 'auth']]);
        
        Log::info('Rutas de broadcasting configuradas');

        // Registrar los canales de broadcasting
        require base_path('routes/channels.php');
        
        Log::info('Canales de broadcasting registrados');
    }
}