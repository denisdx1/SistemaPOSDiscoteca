<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BartenderController extends Controller
{
    /**
     * Obtener el conteo de órdenes pendientes por bartender
     */
    public function conteoOrdenes()
    {
        // Obtener todos los usuarios con rol 'bartender'
        $bartenders = User::whereHas('role', function($query) {
            $query->where('nombre', 'bartender');
        })->pluck('id');

        // Inicializar el conteo en cero para cada bartender
        $conteo = $bartenders->mapWithKeys(function($id) {
            return [$id => 0];
        })->toArray();

        // Contar órdenes pendientes o en proceso para cada bartender
        $ordenesAsignadas = Orden::whereIn('estado', ['pendiente', 'en_proceso'])
            ->whereIn('bartender_id', $bartenders)
            ->select('bartender_id', DB::raw('count(*) as total'))
            ->groupBy('bartender_id')
            ->get();

        // Actualizar el conteo con los resultados
        foreach ($ordenesAsignadas as $orden) {
            $conteo[$orden->bartender_id] = $orden->total;
        }

        return response()->json([
            'success' => true,
            'conteo' => $conteo
        ]);
    }
} 