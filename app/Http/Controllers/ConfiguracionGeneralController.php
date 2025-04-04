<?php

namespace App\Http\Controllers;

use App\Models\Configuracion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfiguracionGeneralController extends Controller
{
    public function index()
    {
        // Obtener el tema actual
        $tema = Configuracion::where('clave', 'tema')->first();
        
        return Inertia::render('configuracion/general', [
            'tema_actual' => $tema ? $tema->valor : 'system'
        ]);
    }

    public function actualizar(Request $request)
    {
        $request->validate([
            'clave' => 'required|string',
            'valor' => 'required|string'
        ]);

        Configuracion::updateOrCreate(
            ['clave' => $request->clave],
            [
                'valor' => $request->valor,
                'tipo' => 'string',
                'grupo' => 'general',
                'descripcion' => 'Configuración general del sistema'
            ]
        );

        return response()->json(['success' => true]);
    }

    public function obtenerTema()
    {
        $tema = Configuracion::where('clave', 'tema')->first();
        return response()->json([
            'valor' => $tema ? $tema->valor : 'system'
        ]);
    }
} 