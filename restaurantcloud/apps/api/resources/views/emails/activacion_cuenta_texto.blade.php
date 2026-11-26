ÁUREA — Plataforma SaaS de gestión gastronómica

Hola, {{ $nombreDestinatario }}

{{ $titulo }}
@if($nombreEmpresa)Empresa: {{ $nombreEmpresa }}
@endif
@if($rolEtiqueta)Rol asignado: {{ $rolEtiqueta }}
@endif

{{ $mensajeIntro }}

Activa tu cuenta ingresando al siguiente enlace (disponible hasta el {{ $fechaLimite }}, hora de Lima · {{ $horasExpiracion }} {{ $horasExpiracion === 1 ? 'hora' : 'horas' }}):
{{ $urlActivacion }}

Si no esperabas este correo, puedes ignorarlo de forma segura.
Soporte: soporte@restaurantcloud.pe
