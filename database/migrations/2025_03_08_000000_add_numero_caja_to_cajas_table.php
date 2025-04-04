<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cajas', function (Blueprint $table) {
            $table->unsignedInteger('numero_caja')->after('id')->default(1);
            $table->index(['numero_caja', 'estado']); // Para optimizar búsquedas
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cajas', function (Blueprint $table) {
            $table->dropIndex(['numero_caja', 'estado']);
            $table->dropColumn('numero_caja');
        });
    }
};