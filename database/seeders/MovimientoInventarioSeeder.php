<?php

namespace Database\Seeders;

use App\Models\Producto;
use App\Models\User;
use App\Models\MovimientoInventario;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class MovimientoInventarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios para asignar a los movimientos
        $usuarios = User::all();
        if ($usuarios->isEmpty()) {
            // Si no hay usuarios, crear uno para los seeders
            $usuario = User::factory()->create([
                'name' => 'Admin Seeder',
                'email' => 'admin@example.com',
            ]);
            $usuarios = collect([$usuario]);
        }
        
        // Obtener productos para crear movimientos
        $productos = Producto::where('activo', true)->get();
        
        // Fechas para distribuir los movimientos
        $fechaInicio = Carbon::now()->subDays(30);
        $fechaFin = Carbon::now();
        
        foreach ($productos as $producto) {
            // Generar entre 3 y 10 movimientos por producto
            $numMovimientos = rand(3, 10);
            
            for ($i = 0; $i < $numMovimientos; $i++) {
                // Tipo de movimiento aleatorio
                $tiposMovimiento = ['entrada', 'salida', 'ajuste'];
                $tipoMovimiento = $tiposMovimiento[array_rand($tiposMovimiento)];
                
                // Cantidad aleatoria entre 1 y 20
                $cantidad = rand(1, 20);
                
                // Precio unitario basado en el costo del producto
                $precioUnitario = $producto->costo ?: $producto->precio * 0.7;
                
                // Fecha aleatoria en el rango
                $dias = $fechaInicio->diffInDays($fechaFin);
                $fechaMovimiento = $fechaInicio->copy()->addDays(rand(0, $dias));
                
                // Usuario aleatorio
                $usuario = $usuarios->random();
                
                // Crear el movimiento
                MovimientoInventario::create([
                    'producto_id' => $producto->id,
                    'cantidad' => $cantidad,
                    'tipo_movimiento' => $tipoMovimiento,
                    'precio_unitario' => $precioUnitario,
                    'user_id' => $usuario->id,
                    'observacion' => "Movimiento de {$tipoMovimiento} para pruebas",
                    'created_at' => $fechaMovimiento,
                    'updated_at' => $fechaMovimiento,
                ]);
            }
        }
    }
}
