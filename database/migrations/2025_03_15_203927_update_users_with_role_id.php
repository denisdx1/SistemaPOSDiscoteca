<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar los usuarios existentes para asignarles el role_id correspondiente
        DB::table('users')->where('role', 'administrador')->update(['role_id' => 1]);
        DB::table('users')->where('role', 'cajero')->update(['role_id' => 2]);
        DB::table('users')->where('role', 'mesero')->update(['role_id' => 3]);
        DB::table('users')->where('role', 'bartender')->update(['role_id' => 4]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Establecer role_id a null en todos los usuarios
        DB::table('users')->update(['role_id' => null]);
    }
};
