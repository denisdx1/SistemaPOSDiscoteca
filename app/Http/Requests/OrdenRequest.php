<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrdenRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'mesa_id' => 'nullable|exists:mesas,id',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'tipo_orden' => 'required|in:local,domicilio,recoger',
            'notas' => 'nullable|string|max:500'
        ];
    }
}