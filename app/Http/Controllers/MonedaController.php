<?php

namespace App\Http\Controllers;

use App\Models\Configuracion;
use App\Models\Moneda;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MonedaController extends Controller
{
    /**
     * Mostrar la lista de monedas disponibles
     */
    public function index()
    {
        $monedas = Moneda::where('activo', true)->get();
        $monedaActual = Configuracion::obtener('moneda_predeterminada', 'PEN');
        
        return Inertia::render('configuracion/monedas', [
            'monedas' => $monedas ?? [],
            'monedaActual' => $monedaActual ?? 'PEN'
        ]);
    }

    /**
     * Obtener moneda predeterminada 
     */
    public function getMonedaActual()
    {
        $monedaActual = Configuracion::obtener('moneda_predeterminada', 'PEN');
        $moneda = Moneda::where('codigo', $monedaActual)->first();
        
        if (!$moneda) {
            // Si no hay moneda, crear una por defecto para evitar errores
            $moneda = new Moneda([
                'codigo' => 'PEN',
                'nombre' => 'Sol Peruano',
                'simbolo' => 'S/',
                'tasa_cambio' => 1.0,
                'es_predeterminada' => true,
                'activo' => true
            ]);
        }
        
        return response()->json($moneda);
    }
    
    /**
     * Cambiar la moneda predeterminada del sistema
     */
    public function cambiarMoneda(Request $request)
    {
        $request->validate([
            'codigo' => 'required|exists:monedas,codigo',
        ]);
        
        $codigoMoneda = $request->input('codigo');
        $moneda = Moneda::where('codigo', $codigoMoneda)->first();
        
        if (!$moneda || !$moneda->activo) {
            return response()->json([
                'message' => 'La moneda seleccionada no está disponible'
            ], 400);
        }
        
        // Actualizar la configuración
        Configuracion::establecer('moneda_predeterminada', $codigoMoneda);
        
        return response()->json([
            'message' => 'Moneda actualizada correctamente',
            'moneda' => $moneda
        ]);
    }
    
    /**
     * Actualizar una moneda existente (tasa de cambio, etc.)
     */
    public function update(Request $request, Moneda $moneda)
    {
        $request->validate([
            'tasa_cambio' => 'required|numeric|min:0',
            'activo' => 'boolean'
        ]);
        
        $moneda->update($request->only(['tasa_cambio', 'activo']));
        
        return response()->json([
            'message' => 'Moneda actualizada correctamente',
            'moneda' => $moneda
        ]);
    }
} 