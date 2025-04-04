<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventarioStock extends Model
{
    use HasFactory;
    
    protected $table = 'inventario_stock';
    
    protected $fillable = [
        'producto_id',
        'cantidad',
        'stock_minimo',
        'stock_maximo',
        'ubicacion',
    ];
    
    /**
     * Obtener el producto al que pertenece este stock
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
