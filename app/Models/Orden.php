<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Orden extends Model
{
    use HasFactory;

    /**
     * La tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'ordenes';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'numero_orden',
        'mesa_id',
        'user_id',
        'bartender_id',
        'estado',
        'subtotal',
        'impuestos',
        'descuento',
        'total',
        'metodo_pago',
        'notas',
        'pagado'
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'subtotal' => 'decimal:2',
        'impuestos' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total' => 'decimal:2',
        'pagado' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Estados posibles para una orden
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_EN_PROCESO = 'en_proceso';
    const ESTADO_LISTA = 'lista';
    const ESTADO_ENTREGADA = 'entregada';
    const ESTADO_CANCELADA = 'cancelada';

    /**
     * Obtiene la mesa asociada a esta orden.
     */
    public function mesa(): BelongsTo
    {
        return $this->belongsTo(Mesa::class);
    }

    /**
     * Obtiene el usuario que creó la orden.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Obtiene el usuario que creó la orden.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtiene el bartender asignado a esta orden.
     */
    public function bartender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bartender_id');
    }

    /**
     * Obtiene los productos de esta orden.
     */
    public function productos(): BelongsToMany
    {
        return $this->belongsToMany(Producto::class, 'orden_producto')
            ->withPivot(['cantidad', 'precio_unitario', 'subtotal', 'notas', 'es_complemento_gratuito', 'complemento_de'])
            ->withTimestamps();
    }

    /**
     * Obtiene el historial de cambios de esta orden.
     */
    public function historial(): HasMany
    {
        return $this->hasMany(HistorialOrden::class);
    }

    // Métodos de ayuda
    public function actualizarEstado(string $estado): void
    {
        $this->update(['estado' => $estado]);
    }

    public function marcarComoPagada(): void
    {
        $this->update(['pagado' => true]);
    }

    public function calcularTotales(): void
    {
        $subtotal = $this->productos()->sum('subtotal');
        $descuento = 0; // No aplicar descuento
        $impuestos = 0; // No aplicar impuestos
        $total = $subtotal; // Total igual al subtotal

        $this->update([
            'subtotal' => $subtotal,
            'impuestos' => $impuestos,
            'descuento' => $descuento,
            'total' => $total
        ]);
    }

    /**
     * Genera los datos de la boleta para esta orden.
     */
    public function generarBoleta(): array
    {
        return [
            'empresa' => [
                'nombre' => config('app.name', 'Discoteca POS'),
                'direccion' => config('app.direccion', ''),
                'telefono' => config('app.telefono', ''),
                'ruc' => config('app.ruc', '')
            ],
            'boleta' => [
                'numero' => $this->numero_orden,
                'fecha' => $this->updated_at->format('d/m/Y H:i:s'),
                'cajero' => $this->user->name,
                'mesa' => $this->mesa ? "Mesa #{$this->mesa->numero}" : 'Venta directa'
            ],
            'items' => $this->productos->map(function($producto) {
                return [
                    'cantidad' => $producto->pivot->cantidad,
                    'descripcion' => $producto->nombre,
                    'precio_unitario' => $producto->pivot->precio_unitario,
                    'subtotal' => $producto->pivot->subtotal
                ];
            }),
            'totales' => [
                'subtotal' => $this->subtotal,
                'descuento' => $this->descuento,
                'impuestos' => $this->impuestos,
                'total' => $this->total
            ],
            'pago' => [
                'metodo' => $this->metodo_pago,
                'notas' => $this->notas
            ]
        ];
    }
}
