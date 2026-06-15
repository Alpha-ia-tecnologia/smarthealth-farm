# ===== Smart Health CAHOSP — Frontend · imagem de produção =====
# Multi-stage: build do bundle com Node, serve estático com nginx.
# A URL da API NÃO é passada no build — é injetada em runtime via config.js
# (ver docker/app-config.sh), então trocar a env não exige reconstruir a imagem.

# --- Estágio 1: build ---
FROM node:22-alpine AS build

WORKDIR /app

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

# Gera o config.js (URL da API) a partir da env VITE_API_URL a cada start do container.
# A imagem nginx executa tudo em /docker-entrypoint.d/*.sh antes de iniciar o servidor.
COPY docker/app-config.sh /docker-entrypoint.d/40-app-config.sh
RUN chmod +x /docker-entrypoint.d/40-app-config.sh

EXPOSE 80

# Healthcheck simples: nginx respondendo na raiz.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

# Mantém o entrypoint/CMD padrão da imagem nginx (que roda os scripts de /docker-entrypoint.d).
