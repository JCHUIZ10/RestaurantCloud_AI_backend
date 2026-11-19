# syntax=docker/dockerfile:1

# ---- Etapa 1: dependencias ----
FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.10.7 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# ---- Etapa 2: imagen final, sin uv ni herramientas de compilación ----
FROM python:3.12-slim
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin analitica
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY alembic.ini ./
COPY migrations ./migrations
COPY app ./app
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8001
USER analitica
EXPOSE 8001
# `exec` para que uvicorn reciba las señales de parada.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
