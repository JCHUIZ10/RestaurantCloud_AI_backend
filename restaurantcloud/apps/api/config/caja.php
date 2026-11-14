<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tolerancia para considerar un turno "sin cerrar"
    |--------------------------------------------------------------------------
    |
    | Minutos que un turno puede seguir abierto después de terminar la jornada operativa de la sede
    | (según su horario de atención) antes de avisar a la administración que quedó sin cerrar.
    | Es solo un aviso visual: el sistema nunca cierra un turno por su cuenta.
    |
    */

    'tolerancia_turno_sin_cerrar_min' => (int) env('CAJA_TOLERANCIA_TURNO_SIN_CERRAR_MIN', 60),

];
