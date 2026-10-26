FROM node:22-alpine AS build

WORKDIR /web

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

COPY apps/web/ ./

# Las variables VITE_* se fijan en tiempo de build.
ARG VITE_USE_REAL_API=true
ARG VITE_STRIPE_PUBLIC_KEY=
ARG VITE_SHOW_DEMO_WIDGETS=false
ENV VITE_API_URL= \
    VITE_USE_REAL_API=${VITE_USE_REAL_API} \
    VITE_STRIPE_PUBLIC_KEY=${VITE_STRIPE_PUBLIC_KEY} \
    VITE_SHOW_DEMO_WIDGETS=${VITE_SHOW_DEMO_WIDGETS}

RUN npm run build

FROM caddy:2.8-alpine

COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /web/dist /srv
