#!/usr/bin/env bash
# Despliegue de RoLuck Convertidor: build local + rsync de /dist al VPS.
#
# El destino es el alias `roluck-vps` definido en ~/.ssh/config (IP, puerto 22022 y
# usuario viven ahí, NO en el repo, que es público y revelaría el origen tras Cloudflare).
# Puedes sobreescribir:  REMOTE=usuario@host  REMOTE_PATH=/var/www/roluck  ./deploy/deploy.sh
set -euo pipefail

REMOTE="${REMOTE:-roluck-vps}"                              # ← alias en ~/.ssh/config (IP+puerto+user)
REMOTE_PATH="${REMOTE_PATH:-/var/www/roluck-convertidor}"  # ← raíz que sirve Nginx (webroot real)

cd "$(dirname "$0")/.."

echo "▸ Build de producción…"
npm run build

echo "▸ Sincronizando dist/ → ${REMOTE}:${REMOTE_PATH}"
# --delete elimina en el servidor lo que ya no está en dist (assets viejos con hash).
rsync -avz --delete \
  --exclude '.DS_Store' \
  dist/ "${REMOTE}:${REMOTE_PATH}/"

echo "✓ Listo. Si cambió la config de Nginx: sudo nginx -t && sudo systemctl reload nginx"
