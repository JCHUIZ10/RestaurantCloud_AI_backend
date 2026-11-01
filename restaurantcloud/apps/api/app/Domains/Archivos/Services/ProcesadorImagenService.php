<?php

namespace App\Domains\Archivos\Services;

use GdImage;
use InvalidArgumentException;
use RuntimeException;

/**
 * Re-codifica las fotos del catálogo en el servidor: WebP con lado máximo acotado, sin metadatos
 * (EXIF/GPS) y con orientación corregida. No confía en lo que ya hizo el cliente: una foto subida
 * directamente a la API recibe el mismo tratamiento.
 */
class ProcesadorImagenService
{
    public const LADO_MAXIMO = 1200;

    public const LADO_MINIATURA = 400;

    /** Tope de píxeles a decodificar (≈64 MB en memoria); frena imágenes diseñadas para agotar RAM. */
    private const MAX_PIXELES = 16_000_000;

    private const TIPOS_ADMITIDOS = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP];

    public function disponible(): bool
    {
        return function_exists('imagecreatefromstring') && function_exists('imagewebp');
    }

    /**
     * @return array{principal: string, miniatura: string} Contenidos WebP listos para guardar.
     *
     * @throws InvalidArgumentException si el archivo no es una imagen admitida o es desproporcionada.
     * @throws RuntimeException si no se pudo codificar el resultado.
     */
    public function procesarFotoCatalogo(string $rutaArchivo): array
    {
        $contenido = file_get_contents($rutaArchivo);
        $info = $contenido === false ? false : @getimagesizefromstring($contenido);

        if ($info === false || ! in_array($info[2], self::TIPOS_ADMITIDOS, true)) {
            throw new InvalidArgumentException('La foto debe ser una imagen JPEG, PNG o WebP.');
        }

        if ($info[0] * $info[1] > self::MAX_PIXELES) {
            throw new InvalidArgumentException('La foto tiene demasiados píxeles. Reduce su tamaño e inténtalo de nuevo.');
        }

        $imagen = @imagecreatefromstring($contenido);
        if ($imagen === false) {
            throw new InvalidArgumentException('No pudimos leer la foto. Prueba con otra.');
        }

        if ($info[2] === IMAGETYPE_JPEG) {
            $imagen = $this->corregirOrientacion($imagen, $rutaArchivo);
        }

        return [
            'principal' => $this->codificarWebp($imagen, self::LADO_MAXIMO, 82),
            'miniatura' => $this->codificarWebp($imagen, self::LADO_MINIATURA, 78),
        ];
    }

    /** Aplica la orientación EXIF de las cámaras, ya que al re-codificar el metadato se descarta. */
    private function corregirOrientacion(GdImage $imagen, string $rutaArchivo): GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $imagen;
        }

        $exif = @exif_read_data($rutaArchivo);
        $orientacion = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;

        $corregida = match ($orientacion) {
            2 => $this->voltear($imagen, IMG_FLIP_HORIZONTAL),
            3 => imagerotate($imagen, 180, 0),
            4 => $this->voltear($imagen, IMG_FLIP_VERTICAL),
            6 => imagerotate($imagen, -90, 0),
            8 => imagerotate($imagen, 90, 0),
            default => $imagen,
        };

        return $corregida instanceof GdImage ? $corregida : $imagen;
    }

    private function voltear(GdImage $imagen, int $modo): GdImage
    {
        imageflip($imagen, $modo);

        return $imagen;
    }

    private function codificarWebp(GdImage $origen, int $maxLado, int $calidad): string
    {
        $ancho = imagesx($origen);
        $alto = imagesy($origen);
        $escala = min(1, $maxLado / max($ancho, $alto));
        $nuevoAncho = max(1, (int) round($ancho * $escala));
        $nuevoAlto = max(1, (int) round($alto * $escala));

        $lienzo = imagecreatetruecolor($nuevoAncho, $nuevoAlto);
        if ($lienzo === false) {
            throw new RuntimeException('No se pudo preparar la imagen.');
        }

        // Conserva la transparencia de los PNG.
        imagealphablending($lienzo, false);
        imagesavealpha($lienzo, true);
        imagefill($lienzo, 0, 0, imagecolorallocatealpha($lienzo, 0, 0, 0, 127));
        imagecopyresampled($lienzo, $origen, 0, 0, 0, 0, $nuevoAncho, $nuevoAlto, $ancho, $alto);

        ob_start();
        $codificada = imagewebp($lienzo, null, $calidad);
        $datos = (string) ob_get_clean();

        if (! $codificada || $datos === '') {
            throw new RuntimeException('No se pudo codificar la foto.');
        }

        return $datos;
    }
}
