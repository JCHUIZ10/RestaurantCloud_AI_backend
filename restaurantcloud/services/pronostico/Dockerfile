# syntax=docker/dockerfile:1

# El paquete rc_pronostico vive en model-ia/ y llega como contexto adicional (`model_ia`, ver el compose).
# uv.lock lo registra con la ruta relativa ../../../model-ia/rc_pronostico; para que valga aquí dentro,
# la aplicación y el paquete se colocan con la misma disposición de carpetas que en el repositorio.

# ---- Etapa 1: dependencias ----
FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.10.7 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
WORKDIR /repo/restaurantcloud/services/pronostico
COPY --from=model_ia rc_pronostico/pyproject.toml /repo/model-ia/rc_pronostico/pyproject.toml
COPY --from=model_ia rc_pronostico/src /repo/model-ia/rc_pronostico/src
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ---- Etapa 2: imagen final, sin uv ni herramientas de compilación ----
FROM python:3.12-slim
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin pronostico
WORKDIR /repo/restaurantcloud/services/pronostico
COPY --from=builder /repo/restaurantcloud/services/pronostico/.venv ./.venv
COPY alembic.ini ./
COPY migrations ./migrations
COPY app ./app
ENV PATH="/repo/restaurantcloud/services/pronostico/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8002
USER pronostico
EXPOSE 8002
# `exec` para que uvicorn reciba las señales de parada.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
