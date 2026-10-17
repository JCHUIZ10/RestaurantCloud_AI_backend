<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    protected $table = 'usuario';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'empresa_id',
        'local_id',
        'nombre',
        'correo',
        'password_hash',
        'telefono',
        'rol',
        'estado',
        'ultimo_login',
    ];

    protected $hidden = [
        'password_hash',
    ];

    /**
     * Reemplaza el campo password estándar por password_hash.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Campo identificador único para autenticación.
     */
    public function getAuthIdentifierName(): string
    {
        return 'id';
    }
}
