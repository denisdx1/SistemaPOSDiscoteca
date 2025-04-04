<?php

namespace Database\Seeders;

use App\Models\Producto;
use App\Models\InventarioStock;
use Illuminate\Database\Seeder;

class InventarioStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtenemos todos los productos activos
        $productos = Producto::where('activo', true)->get();
        
        foreach ($productos as $producto) {
            // Valores aleatorios para stock, mínimo y máximo
            $stockActual = rand(10, 100);
            $stockMinimo = rand(5, 20);
            $stockMaximo = $stockMinimo + rand(30, 80);
            
            // Crear entrada de stock para el producto
            InventarioStock::create([
                'producto_id' => $producto->id,
                'cantidad' => $stockActual,
                'stock_minimo' => $stockMinimo,
                'stock_maximo' => $stockMaximo,
                'ubicacion' => 'Almacén principal'
            ]);
        }
    }
}
