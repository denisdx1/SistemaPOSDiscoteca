<?php

use App\Http\Controllers\API\OrdenController;
use App\Http\Controllers\API\BartenderController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Rutas protegidas que requieren autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Rutas para bartenders
    Route::get('/bartenders/conteo-ordenes', [BartenderController::class, 'conteoOrdenes']);
}); 