#!/bin/sh
# Regenera o config.js lido pelo front em runtime, a partir da env VITE_API_URL.
# Copiado para /docker-entrypoint.d/ — a imagem nginx executa este script antes de subir o servidor.
set -e

API_URL="${VITE_API_URL:-http://localhost:3002/api}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { VITE_API_URL: "${API_URL}" };
EOF

echo "[app-config] config.js gerado com VITE_API_URL=${API_URL}"
