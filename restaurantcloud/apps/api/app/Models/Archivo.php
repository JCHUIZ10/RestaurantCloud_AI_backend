<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Archivo extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'archivo';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'empresa_id',
        'local_id',
        'bucket',
        'object_key',
        'nombre_original',
        'mime_type',
        'tamanio_bytes',
        'sha256',
        'visibilidad',
        'entidad_tipo',
        'entidad_id',
        'estado',
        'creado_por',
        'expira_at',
    ];

    protected $casts = [
        'tamanio_bytes' => 'integer',
        'expira_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function creador()
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }
}
