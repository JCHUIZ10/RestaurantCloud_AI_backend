#!/usr/bin/env bash
# Ejecuta los cuadernos 00 a 07 en orden, con sus salidas guardadas en cada archivo.
# Se detiene en el primero que falle (un `assert` de sus verificaciones corta la ejecución).
#
# Uso:   ./ejecutar_cuadernos.sh            todos
#        ./ejecutar_cuadernos.sh 04 05      solo los indicados (por su número)
#
# Requisitos: `uv sync`, el CSV de Stuttgart en dataset/stuttgart/, Docker con ms-analítica
# encendido y un .env propio (ver .env.example) para el cuaderno 02 y la parte de ÁUREA del 05 al 07.
# El cuaderno 05 exige que configuracion/congelada.json esté commiteada (la deja el 04).
set -euo pipefail
cd "$(dirname "$0")"
export PYTHONIOENCODING=utf-8

if [ "$#" -gt 0 ]; then
  cuadernos=()
  for n in "$@"; do cuadernos+=(cuadernos/"$n"_*.ipynb); done
else
  cuadernos=(cuadernos/0*.ipynb)
fi

for cuaderno in "${cuadernos[@]}"; do
  inicio=$(date +%s)
  echo "==> $cuaderno"
  if ! salida=$(uv run jupyter nbconvert --to notebook --execute --inplace       --ExecutePreprocessor.timeout=-1 "$cuaderno" 2>&1); then
    echo "$salida" | tail -25
    echo "FALLÓ $cuaderno" >&2
    exit 1
  fi
  echo "    listo en $(( $(date +%s) - inicio )) s"
done
echo "Todos los cuadernos se ejecutaron sin errores."
