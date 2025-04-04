<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Resources\Json\JsonResource;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // No es necesario extender el BroadcastManager por ahora
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Eliminar la envoltura 'data' en las respuestas JSON
        JsonResource::withoutWrapping();
    }
}
