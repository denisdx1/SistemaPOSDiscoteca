<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\CategoriaSeeder;
use Database\Seeders\MesaSeeder;
use Database\Seeders\ProductoSeeder;
use Database\Seeders\ProveedorSeeder;
use Database\Seeders\InventarioStockSeeder;
use Database\Seeders\MovimientoInventarioSeeder;
use Database\Seeders\PedidoSeeder;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Primero ejecutamos el seeder de roles y permisos
        $this->call(RoleAndPermissionSeeder::class);

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'administrador',
            'role_id' => 1, // ID del rol administrador
        ]);

        // Llamar a los nuevos seeders
        $this->call([
            CategoriaSeeder::class,
            ProductoSeeder::class,
            MesaSeeder::class,
            // Nuevos seeders para el sistema de gestión de inventario
            ProveedorSeeder::class,
            InventarioStockSeeder::class,
            MovimientoInventarioSeeder::class,
            PedidoSeeder::class,
        ]);
    }
}
