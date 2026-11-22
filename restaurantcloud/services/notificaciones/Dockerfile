# syntax=docker/dockerfile:1

# ---- Etapa 1: dependencias y compilación de TypeScript ----
FROM node:22.23.3-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
# Compila y deja solo las dependencias de producción para la imagen final.
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

# ---- Etapa 2: imagen final, sin TypeScript ni herramientas de desarrollo ----
FROM node:22.23.3-alpine
ENV NODE_ENV=production \
    PORT=8003
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
# Usuario sin privilegios que ya trae la imagen oficial.
USER node
EXPOSE 8003
# Node recibe directamente las señales de parada (sin un shell en medio) y cierra ordenadamente.
CMD ["node", "dist/main.js"]
