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
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->onDelete('cascade');
            $table->integer('cantidad');
            $table->enum('tipo_movimiento', ['entrada', 'salida', 'ajuste', 'venta', 'devolucion', 'venta_combo']);
            $table->decimal('precio_unitario', 10, 2)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            // Eliminamos temporalmente la restricción de clave foránea a pedidos
            $table->unsignedBigInteger('pedido_id')->nullable();
            $table->text('observacion')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};