<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Para PostgreSQL, necesitamos usar una consulta SQL directa para modificar el tipo enum
        DB::statement("ALTER TABLE historial_cajas DROP CONSTRAINT IF EXISTS historial_cajas_metodo_pago_check");
        DB::statement("ALTER TABLE historial_cajas ADD CONSTRAINT historial_cajas_metodo_pago_check CHECK (metodo_pago::text = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text, 'otro'::text, 'yape'::text]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir cambio si es necesario
        DB::statement("ALTER TABLE historial_cajas DROP CONSTRAINT IF EXISTS historial_cajas_metodo_pago_check");
        DB::statement("ALTER TABLE historial_cajas ADD CONSTRAINT historial_cajas_metodo_pago_check CHECK (metodo_pago::text = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text, 'otro'::text]))");
    }
};
