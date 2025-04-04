<?php

namespace Database\Seeders;

use App\Models\Mesa;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MesaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mesas = [
            // Mesas de VIP
            [
                'numero' => 1,
                'capacidad' => 8,
                'estado' => 'disponible',
                'ubicacion' => 'VIP',
                'notas' => 'Área VIP con vista a la pista principal',
                'activa' => true,
            ],
            [
                'numero' => 2,
                'capacidad' => 6,
                'estado' => 'disponible',
                'ubicacion' => 'VIP',
                'notas' => 'Área VIP con vista a la pista principal',
                'activa' => true,
            ],
            [
                'numero' => 3,
                'capacidad' => 8,
                'estado' => 'disponible',
                'ubicacion' => 'VIP',
                'notas' => 'Área VIP con vista a la pista principal',
                'activa' => true,
            ],
            // Mesas del área general
            [
                'numero' => 4,
                'capacidad' => 4,
                'estado' => 'disponible',
                'ubicacion' => 'General',
                'notas' => 'Área general cerca de la barra',
                'activa' => true,
            ],
            [
                'numero' => 5,
                'capacidad' => 4,
                'estado' => 'disponible',
                'ubicacion' => 'General',
                'notas' => 'Área general cerca de la barra',
                'activa' => true,
            ],
            [
                'numero' => 6,
                'capacidad' => 4,
                'estado' => 'disponible',
                'ubicacion' => 'General',
                'notas' => 'Área general cerca de la barra',
                'activa' => true,
            ],
            [
                'numero' => 7,
                'capacidad' => 4,
                'estado' => 'disponible',
                'ubicacion' => 'General',
                'notas' => 'Área general cerca de la pista',
                'activa' => true,
            ],
            [
                'numero' => 8,
                'capacidad' => 4,
                'estado' => 'disponible',
                'ubicacion' => 'General',
                'notas' => 'Área general cerca de la pista',
                'activa' => true,
            ],
            // Mesas del área terraza
            [
                'numero' => 9,
                'capacidad' => 6,
                'estado' => 'disponible',
                'ubicacion' => 'Terraza',
                'notas' => 'Área exterior',
                'activa' => true,
            ],
            [
                'numero' => 10,
                'capacidad' => 6,
                'estado' => 'disponible',
                'ubicacion' => 'Terraza',
                'notas' => 'Área exterior',
                'activa' => true,
            ],
        ];

        foreach ($mesas as $mesa) {
            Mesa::create($mesa);
        }
    }
}
