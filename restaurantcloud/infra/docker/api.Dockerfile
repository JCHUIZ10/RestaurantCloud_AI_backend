# syntax=docker/dockerfile:1

FROM php:8.3-cli-alpine AS base

RUN apk add --no-cache curl libpq-dev postgresql-client bash libzip-dev icu-dev

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions pdo_pgsql pgsql intl zip bcmath opcache pcntl redis gd exif

ARG FRANKENPHP_VERSION=v1.13.5
RUN arch="$(uname -m)" && \
    case "$arch" in \
      x86_64) fp_arch="x86_64" ;; \
      aarch64|arm64) fp_arch="aarch64" ;; \
      *) echo "Arquitectura no soportada para FrankenPHP: $arch" >&2; exit 1 ;; \
    esac && \
    curl -fsSL "https://github.com/dunglas/frankenphp/releases/download/${FRANKENPHP_VERSION}/frankenphp-linux-${fp_arch}" -o /usr/local/bin/frankenphp && \
    chmod +x /usr/local/bin/frankenphp

COPY ./infra/docker/php.ini $PHP_INI_DIR/conf.d/99-performance.ini

WORKDIR /app

COPY ./infra/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# ---- Etapa de desarrollo: monta ./apps/api y conserva recarga en caliente ----
FROM base AS dev

RUN apk add --no-cache git
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer
ENV APP_RUNTIME=dev

# ---- Etapa de construcción: instala dependencias sin dev y genera autoload ----
FROM base AS builder

RUN apk add --no-cache git
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY apps/api/ ./
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache && \
    composer dump-autoload --optimize --no-dev --classmap-authoritative && \
    php artisan package:discover --ansi && \
    php artisan octane:install --server=frankenphp --no-interaction

# ---- Etapa final de despliegue: imagen autocontenida sin composer ni dev ----
FROM base AS prod

ARG APP_VERSION=dev
ARG GIT_COMMIT=unknown

LABEL org.opencontainers.image.title="restaurantcloud-api" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

WORKDIR /app
COPY --from=builder /app /app
RUN chmod -R 775 storage bootstrap/cache

ENV APP_RUNTIME=prod \
    DB_CONNECTION=pgsql \
    DB_PORT=5432 \
    OCTANE_SERVER=frankenphp \
    OCTANE_MAX_EXECUTION_TIME=0 \
    APP_LOCALE=es \
    APP_FALLBACK_LOCALE=es
