<?php

use App\Http\Controllers\API\OrdenController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Rutas protegidas que requieren autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    

}); 