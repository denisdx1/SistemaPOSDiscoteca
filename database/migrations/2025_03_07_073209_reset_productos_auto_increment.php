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
        // Reset sequence to 1 for productos table (PostgreSQL syntax)
        DB::statement('ALTER SEQUENCE productos_id_seq RESTART WITH 1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to do anything in down() as we can't restore the previous sequence value
    }
};
