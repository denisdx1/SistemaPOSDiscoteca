<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventario_cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos');
            $table->integer('numero_caja');
            $table->integer('cantidad_inicial');
            $table->integer('cantidad_actual');
            $table->integer('cantidad_vendida')->default(0);
            $table->timestamp('fecha_inicio');
            $table->timestamp('fecha_cierre')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventario_cajas');
    }
};