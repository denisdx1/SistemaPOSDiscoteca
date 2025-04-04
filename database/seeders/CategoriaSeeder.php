<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categorias = [
            [
                'nombre' => 'Bebidas Alcohólicas',
                'descripcion' => 'Cervezas, vinos, licores y cócteles',
                'color' => '#e53e3e', // Rojo
                'activo' => true,
            ],
            [
                'nombre' => 'Bebidas No Alcohólicas',
                'descripcion' => 'Refrescos, jugos, agua y café',
                'color' => '#38a169', // Verde
                'activo' => true,
            ],
            [
                'nombre' => 'Botanas',
                'descripcion' => 'Snacks, nachos, alitas y finger food',
                'color' => '#dd6b20', // Naranja
                'activo' => true,
            ],
            [
                'nombre' => 'Cócteles Especiales',
                'descripcion' => 'Cócteles de la casa y bebidas preparadas',
                'color' => '#805ad5', // Púrpura
                'activo' => true,
            ],
            [
                'nombre' => 'Platillos',
                'descripcion' => 'Comidas completas',
                'color' => '#3182ce', // Azul
                'activo' => true,
            ],
        ];

        foreach ($categorias as $categoria) {
            Categoria::create($categoria);
        }
    }
}
