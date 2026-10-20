<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'empresa';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'razon_social',
        'tipo_identidad_fiscal',
        'ruc',
        'correo_contacto',
        'telefono',
        'plan_id',
        'ultima_suscripcion_id',
        'estado',
        'origen_alta',
        'nota_alta',
        'stripe_customer_id',
        'fecha_registro',
    ];

    protected $casts = [
        'plan_id' => 'integer',
        'fecha_registro' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function usuarios()
    {
        return $this->hasMany(Usuario::class, 'empresa_id');
    }

    public function archivos()
    {
        return $this->hasMany(Archivo::class, 'empresa_id');
    }
}
