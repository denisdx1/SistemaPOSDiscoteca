<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComboProducto extends Model
{
    use HasFactory;

    protected $table = 'combo_productos';
    
    protected $fillable = [
        'combo_id',
        'producto_id',
        'cantidad',
    ];

    /**
     * Obtener el producto combo al que pertenece este componente
     */
    public function combo()
    {
        return $this->belongsTo(Producto::class, 'combo_id');
    }

    /**
     * Obtener el producto componente
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
} 