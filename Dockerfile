# ===== Smart Health CAHOSP — Frontend · imagem de produção =====
# Multi-stage: build do bundle com Node, serve estático com nginx.

# --- Estágio 1: build ---
FROM node:22-alpine AS build

WORKDIR /app

# VITE_API_URL é resolvida em tempo de BUILD (import.meta.env vira string fixa no bundle).
# No EasyPanel, defina como Build Arg (ex.: https://api.seu-dominio.com/api).
ARG VITE_API_URL=http://localhost:3002/api
ENV VITE_API_URL=$VITE_API_URL

# Instala dependências a partir do lockfile (inclui devDeps: tsc + vite são necessários no build).
COPY package*.json ./
RUN npm ci

# Copia o restante e gera o build de produção (tsc -b && vite build → /app/dist).
COPY . .
RUN npm run build

# --- Estágio 2: runtime ---
FROM nginx:1.27-alpine AS runtime

# Config do nginx com fallback de SPA (React Router) e cache de assets.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bundle estático gerado no estágio de build.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck simples: nginx respondendo na raiz.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
