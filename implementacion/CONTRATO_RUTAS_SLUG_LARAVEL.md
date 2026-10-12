# Contrato Técnico: Rutas por Slug, Validación y Nginx (Frontend React ↔ Backend Laravel)

> **Documento de especificación de arquitectura de rutas.**  
> Aplica para: Frontend SPA (`restaurantcloud/apps/web`), API Laravel (`restaurantcloud/apps/api`), e Infraestructura Nginx (`restaurantcloud/infra/nginx`).

---

## 1. Mapeo de URLs: Frontend (SPA) vs Backend (Laravel API)

Para evitar colisiones entre las URLs públicas de los restaurantes y las rutas internas del software, se define la siguiente convención:

| Experiencia | URL en el Navegador (Frontend SPA) | Endpoint HTTP Backend (Laravel 13) | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **Carta Digital QR (Canónica)** | `https://app.restaurantcloud.pe/sede/:slug/carta` | `GET /api/v1/public/sedes/{slug}/carta` | `CU-CLIENTE-01` |
| **Carta Digital QR (Alias Corto)** | `https://app.restaurantcloud.pe/m/:slug` | (Redirige en frontend a `/sede/:slug/carta`) | `CU-CLIENTE-01` |
| **Búsqueda de Comprobante** | `https://app.restaurantcloud.pe/sede/:slug/comprobante/:numero` | `GET /api/v1/public/sedes/{slug}/comprobantes/{numero}` | `CU-CLIENTE-02` |
| **Verificación de Slug** | Formulario de creación/edición de local | `GET /api/v1/propietario/locales/verificar-slug?slug={slug}` | `CU-PROP-04` |
| **Alta de Local con Slug** | Formulario de sede | `POST /api/v1/propietario/locales` `{ nombre, slug, ... }` | `CU-PROP-04` |

---

## 2. Reglas de Validación en Laravel (PHP)

El slug se almacena en la tabla relacional `local`:
```sql
ALTER TABLE local ADD COLUMN slug VARCHAR(100) UNIQUE NOT NULL;
CREATE INDEX idx_local_slug ON local(slug) WHERE estado = 'activo';
```

### 2.1 FormRequest en Laravel (`CrearLocalRequest.php` / `ActualizarLocalRequest.php`)

```php
<?php

namespace App\Domains\Empresa\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuardarLocalRequest extends FormRequest
{
    /**
     * Lista negra de palabras reservadas del sistema para evitar que un restaurante
     * elija un slug que coincida con una ruta administrativa u operativa del SaaS.
     */
    public const RESERVED_SLUGS = [
        'admin',
        'saas',
        'propietario',
        'mozo',
        'cocina',
        'cajero',
        'login',
        'registro',
        'planes',
        'api',
        'help',
        'app',
        'sistema',
        'status',
        'terminos',
        'privacidad',
        'sede',
        'm',
        'r',
        'v1',
        'health',
    ];

    public function rules(): array
    {
        $localId = $this->route('local')?->id;

        return [
            'nombre' => ['required', 'string', 'max:150'],
            'slug' => [
                'required',
                'string',
                'min:3',
                'max:100',
                // Solo letras minúsculas, números y guiones sencillos
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('local', 'slug')->ignore($localId),
                Rule::notIn(self::RESERVED_SLUGS),
            ],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'El slug solo puede contener letras minúsculas, números y guiones intermedios.',
            'slug.unique' => 'Esta dirección web ya está ocupada por otra sede en la plataforma.',
            'slug.not_in' => 'Esta palabra está reservada para el sistema y no puede utilizarse como dirección.',
        ];
    }
}
```

---

## 3. Algoritmo de Generación de Slug en Frontend y Backend

Cuando el usuario digita el nombre del local (ej. *"El Carbón & Leña"*) y distrito (ej. *"Miraflores"*):
```text
1. Limpieza de tildes y diacríticos: "El Carbón & Leña" -> "el carbon  lena"
2. Sustitución de caracteres no alfanuméricos por guiones: "el-carbon-lena"
3. Concatenación con distrito: "el-carbon-lena-miraflores"
4. Longitud máxima: 100 caracteres.
```

Si existe colisión en base de datos (`LOCAL_SLUG_DUPLICADO`), el endpoint `verificar-slug` sugiere:
`"el-carbon-lena-miraflores-2"`.

---

## 4. Configuración de Nginx (Producción y Docker)

En Nginx, para permitir que React Router resuelva las rutas en el cliente sin arrojar `404 Not Found`, se debe configurar:

```nginx
server {
    listen 80;
    server_name app.restaurantcloud.pe;
    root /var/www/restaurantcloud/apps/web/dist;
    index index.html;

    # 1. API Laravel
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Streams de eventos en tiempo real (SSE para KDS y Salón)
    location /api/v1/sse/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
    }

    # 3. Frontend React SPA (soporta /sede/:slug/carta, /admin/*, /mozo/*, etc.)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
