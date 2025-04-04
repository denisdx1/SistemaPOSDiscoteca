<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    use HasFactory;

    /**
     * La tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'configuraciones';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'clave',
        'valor',
        'descripcion',
        'tipo',
        'grupo',
        'es_privado',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'es_privado' => 'boolean',
    ];

    /**
     * Obtiene un valor de configuración por su clave.
     *
     * @param string $clave
     * @param mixed $valorPorDefecto
     * @return mixed
     */
    public static function obtener($clave, $valorPorDefecto = null)
    {
        $config = self::where('clave', $clave)->first();
        
        if (!$config) {
            return $valorPorDefecto;
        }

        return self::convertirValorSegunTipo($config->valor, $config->tipo);
    }

    /**
     * Establece un valor de configuración.
     *
     * @param string $clave
     * @param mixed $valor
     * @param string|null $descripcion
     * @param string $tipo
     * @param string $grupo
     * @param boolean $esPrivado
     * @return void
     */
    public static function establecer($clave, $valor, $descripcion = null, $tipo = 'string', $grupo = 'general', $esPrivado = false)
    {
        $valorAlmacenar = is_array($valor) || is_object($valor) ? json_encode($valor) : (string)$valor;
        
        self::updateOrCreate(
            ['clave' => $clave],
            [
                'valor' => $valorAlmacenar,
                'descripcion' => $descripcion,
                'tipo' => $tipo,
                'grupo' => $grupo,
                'es_privado' => $esPrivado,
            ]
        );
    }

    /**
     * Convierte el valor al tipo especificado.
     *
     * @param string $valor
     * @param string $tipo
     * @return mixed
     */
    protected static function convertirValorSegunTipo($valor, $tipo)
    {
        switch ($tipo) {
            case 'integer':
                return (int)$valor;
            case 'boolean':
                return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($valor, true);
            case 'string':
            default:
                return $valor;
        }
    }
}
